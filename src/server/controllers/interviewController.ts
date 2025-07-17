import { Request, Response } from 'express';
import { vectorDBService } from '../services/vectorDB.js';
import { StreamResponse } from '../types/index.js';
import { InterviewPromptGenerator } from '../utils/prompts.js';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { PositionType, InterviewPrompt, QuestionSet, EvaluationDimension } from '../types/index.js';



export class InterviewController {
    private mcpClient: Client | null = null;

    private async initializeMCP() {
        if (!this.mcpClient) {
            const transport = new StdioClientTransport({
                command: "npx",
                args: ["tsx", "mcp/interview-mcp-server.ts"],
            });

            this.mcpClient = new Client({
                name: 'interview-client',
                version: '1.0.0',
            });

            await this.mcpClient.connect(transport);
            
            // 加载MCP工具
            const tools = await loadMcpTools("interview", this.mcpClient, {
                throwOnLoadError: false,
                prefixToolNameWithServerName: false,
                additionalToolNamePrefix: "mcp",
                useStandardContentBlocks: true,
            });

            console.log('MCP工具加载完成:', tools.map(t => t.name));
        }
    }

    async streamPaper(req: Request, res: Response): Promise<void> {
        
        const { positionType, projectKeywords, skillGaps, message, conversationHistory } = req.body;
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        try {
            await this.generateInterviewWithRetrieval(message, res, positionType, projectKeywords, skillGaps, conversationHistory);
        } catch (error) {
            console.error('处理请求时出错：', error);
            res.status(500).json({ error: '内部服务器错误' });
        }
    }

    private async generateInterviewWithRetrieval(message: string, res: Response, positionType: PositionType, projectKeywords: string[], skillGaps: string[], conversationHistory: Array<{type: string, content: string}>): Promise<void> {
        let isEnded = false;
        let retrievalContext = '';

        try {
            // 1. 初始化MCP
            await this.initializeMCP();

            // 2. 使用MCP工具搜索面试知识
            if (this.mcpClient) {
                const searchResult = await this.mcpClient.callTool({
                    name: "search_interview_knowledge",
                    arguments: {
                        query: message,
                        position: positionType
                    }
                });
                
                const content = searchResult.content as Array<{text: string}>;
                if (content?.[0]?.text) {
                    retrievalContext += `\nMCP搜索结果：${content[0].text}`;
                }
            }

            // 3. 分析候选人档案
            if (this.mcpClient && conversationHistory.length > 0) {
                const lastCandidateResponse = conversationHistory[conversationHistory.length - 1];
                if (lastCandidateResponse.type === 'candidate') {
                    const profileResult = await this.mcpClient.callTool({
                        name: "get_candidate_profile",
                        arguments: {
                            candidateResponse: lastCandidateResponse.content
                        }
                    });
                    
                    const content = profileResult.content as Array<{text: string}>;
                    if (content?.[0]?.text) {
                        retrievalContext += `\n候选人档案：${content[0].text}`;
                    }
                }
            }

            // 4. 构建增强的prompt
            const INTERVIEWER_PROMPT = InterviewPromptGenerator.generateInterviewerPrompt(positionType);
            const enhancedPrompt = InterviewPromptGenerator.generateTechnicalProbePrompt(
                positionType, projectKeywords, skillGaps, retrievalContext, conversationHistory
            );

            // 5. 使用LangChain生成问题
            const chatModel = new ChatOpenAI({
                modelName: process.env.DOUBAO_MODEL_NAME,
                temperature: 0.5,
                maxTokens: 500,
                streaming: true,
                openAIApiKey: process.env.OPENAI_API_KEY,
                configuration: {
                    baseURL: process.env.OPENAI_BASE_URL,
                },
            });

            // 6. 流式返回结果
            const stream = await chatModel.stream([
                new SystemMessage(INTERVIEWER_PROMPT),
                new HumanMessage(enhancedPrompt)
            ]);

            for await (const chunk of stream) {
                if (isEnded) break;

                const content = chunk.content;
                if (content && typeof content === 'string') {
                    try {
                        if (!res.writableEnded) {
                            const response: StreamResponse = {
                                content: content,
                                isLastMessage: false
                            };
                            res.write(`data: ${JSON.stringify(response)}\n\n`);
                        } else {
                            isEnded = true;
                            break;
                        }
                    } catch (error) {
                        console.error('写入数据时出错:', error);
                        isEnded = true;
                        break;
                    }
                }
            }

        } catch (error) {
            console.error('生成问题时出错: ', error);
            if (!res.writableEnded) {
                const errorResponse: StreamResponse = { error: '生成问题时出错，请重试' };
                res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
            }
        } finally {
            if (!res.writableEnded) {
                res.end();
            }
        }
    }
}

export const interviewController = new InterviewController(); 