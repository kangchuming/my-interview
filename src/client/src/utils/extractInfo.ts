import { fetchEventSource } from '@microsoft/fetch-event-source';

const API_BASE_URL = 'http://localhost:3000';

export async function extractInfo(
    jobTitle: string,
    jobDescription: string,
    resume: string,
    companyName?: string,
    companyDescription?: string,
    onContent?: (content: string) => void,
    onComplete?: (fullContent: string) => void,
    onError?: (error: unknown) => void
) {
    try {
        let fullContent = '';
        let isCompleted = false; // 添加标志防止重复调用

        // 使用 fetchEventSource 处理 SSE
        await fetchEventSource(`${API_BASE_URL}/api/extracting/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobTitle,
                jobDescription,
                resume,
                companyName,
                companyDescription,
            }),

            onmessage(event) {
                if (event.event === 'FatalError') {
                    throw new Error(event.data);
                }

                try {
                    const data = JSON.parse(event.data);

                    if (data.isLastMessage === true) {
                        if (!isCompleted) {
                            isCompleted = true;
                            onComplete?.(fullContent);
                        }
                        return;
                    }

                    if (data.content) {
                        fullContent += data.content;
                        // 实时回调每个内容片段
                        onContent?.(data.content);
                    }

                    if (data.error) {
                        console.error('流式响应错误:', data.error);
                        onError?.(data.error);
                    }

                } catch (error) {
                    console.error('Error parsing message:', error);
                    onError?.(error);
                }
            },

            onopen(response) {
                console.log('候选人信息提取连接已建立:', response.status);
                return Promise.resolve();
            },

            onerror(error) {
                console.error('候选人信息提取连接错误:', error);
                onError?.(error);
                throw error;
            },

            onclose() {
                console.log('候选人信息提取连接已关闭');
                // 只有在还没有完成时才调用 onComplete
                if (!isCompleted) {
                    isCompleted = true;
                    onComplete?.(fullContent);
                }
            }
        });

        return fullContent;

    } catch (err) {
        console.error('候选人信息提取失败:', err);
        onError?.(err);
        throw err;
    }
}