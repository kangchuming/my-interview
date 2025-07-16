import { Request, Response } from 'express';
import { StreamResponse } from '../types/index.js';
import { InterviewPromptGenerator } from '../utils/prompts.js';


export class ExtractingController {
    async streamPaper(req: Request, res: Response): Promise<void> {
        
        const { jobTitle, jobDescription, companyName, companyDescription, resume } = req.body;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        try {
            await this.generateInterviewWithRetrieval(jobTitle, jobDescription, companyName, companyDescription, resume, res);
        } catch (error) {
            console.error('处理请求时出错：', error);
            res.status(500).json({ error: '内部服务器错误' });
        }
    }

    private async generateInterviewWithRetrieval(jobTitle: string, jobDescription: string, companyName: string, companyDescription: string, resume: string, res: Response) {
        let isEnded = false;

        try {            
            // 1. 信息提取prompt
            const systemPrompt = InterviewPromptGenerator.generateExtractionPrompt(jobTitle, jobDescription, companyName, companyDescription, resume);

            // 2. 构建请求体
            const requestBody = {
                model: 'doubao-seed-1-6-flash-250615',
                messages: [
                    {
                        role: 'user',
                        content: systemPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 300,
                stream: true,
                thinking: {
                    type: "disabled"
                }
            };

            // 3. 发送流式请求
            const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('无法获取响应流');
            }

            const decoder = new TextDecoder();

            // 4. 处理流式响应
            while (!isEnded && !res.writableEnded) {
                const { done, value } = await reader.read();
                
                if (done) {
                    isEnded = true;
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        
                        if (data === '[DONE]') {
                            isEnded = true;
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;

                            if (content) {
                                const response: StreamResponse = {
                                    content: content,
                                    isLastMessage: false
                                };
                                res.write(`data: ${JSON.stringify(response)}\n\n`);
                            }
                        } catch (parseError) {
                            // 忽略解析错误，继续处理下一行
                            console.log('解析数据时出错:', parseError);
                        }
                    }
                }
            }

            // 发送结束信号
            if (!res.writableEnded) {
                const finalResponse: StreamResponse = {
                    content: '',
                    isLastMessage: true
                };
                res.write(`data: ${JSON.stringify(finalResponse)}\n\n`);
            }

        } catch(err) {
            console.error('生成信息提取时出错:', err);
            if (!res.writableEnded) {
                const errorResponse: StreamResponse = { error: '提取面试者信息时出错，请重试' };
                res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
            }
        } finally {
            if (!res.writableEnded) {
                res.end();
            }
        }
    }
}

export const extractController = new ExtractingController(); 