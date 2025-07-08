import { Request, Response } from 'express';
import { vectorDBService } from '../services/vectorDB.js';
import { StreamResponse } from '../types/index.js';
import { InterviewPromptGenerator } from '../utils/prompts.js';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { PositionType, InterviewPrompt, QuestionSet, EvaluationDimension } from '../types/index.js';


export class HelloController {
    async streamPaper(req: Request, res: Response): Promise<void> {
        
        const { message, positionType } = req.body;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        try {
            await this.generateInterviewWithRetrieval(message, positionType, res);
        } catch (error) {
            console.error('处理请求时出错：', error);
            res.status(500).json({ error: '内部服务器错误' });
        }
    }

    private async generateInterviewWithRetrieval(message: string, positionType: PositionType, res: Response): Promise<void> {
        let isEnded = false;

        try {            
            // 1. 开场白prompt
            const systemPrompt = InterviewPromptGenerator.generateOpeningPrompt(positionType);

            // 2. 使用 LangChain ChatOpenAI 生成开场白
            const chatModel = new ChatOpenAI({
                modelName: 'doubao-seed-1-6-250615',
                temperature: 0.7,
                maxTokens: 800,
                streaming: true,
                openAIApiKey: process.env.OPENAI_API_KEY,
                configuration: {
                    baseURL: process.env.OPENAI_BASE_URL,
                }
            });

            // 3. 使用StateGraph的流式处理
            const stream = await chatModel.stream(`${systemPrompt}`);

            // 4. 流式返回结果 - 监听特定事件
            for await (const chunk of stream) {
                if (isEnded) break;

                const content = chunk.content;
                if(content && typeof content === "string") {
                    try {
                        if(!res.writableEnded) {
                            const response: StreamResponse = {
                                content: content,
                                isLastMessage: false
                            };
                            res.write(`data: ${JSON.stringify(response)}\n\n`);
                        } else {
                            isEnded = true;
                            break;
                        }
                    } catch(error) {
                        console.error('写入数据时出错:', error);
                        isEnded = true;
                        break;
                    }
                }
            }
        }
        catch(err) {
            console.error('生成开场白时出错: ', err);
            if (!res.writableEnded) {
                const errorResponse: StreamResponse = { error: '生成开场白时出错，请重试' };
                res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
            }
        } finally {
            if (!res.writableEnded) {
                res.end();
            }
        }
    }
}

export const helloController = new HelloController(); 