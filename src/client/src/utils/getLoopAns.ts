import { fetchEventSource } from '@microsoft/fetch-event-source';

const API_BASE_URL = 'http://localhost:3000';

export async function getLoopAns(
  positionType: string, 
  candidateName: string,
  onContent?: (content: string) => void,
  onComplete?: (fullContent: string) => void,
  onError?: (error: unknown) => void
) {
  try {
    let fullContent = '';

    // 使用 fetchEventSource 处理 SSE
    await fetchEventSource(`${API_BASE_URL}/api/paper/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: `面试 ${candidateName}`,
        positionType 
      }),

      onmessage(event) {
        if (event.event === 'FatalError') {
          throw new Error(event.data);
        }
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.isLastMessage === true) {
            onComplete?.(fullContent);
            return;
          }

          if (data.content) {
            fullContent += data.content;
            // 实时回调每个内容片段
            onContent?.(data.content);
            console.log('接收到内容片段:', data.content);
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
        console.log('面试已建立:', response.status);
        return Promise.resolve();
      },

      onerror(error) {
        console.error('面试连接错误:', error);
        onError?.(error);
        throw error;
      },

      onclose() {
        console.log('面试连接已关闭');
        onComplete?.(fullContent);
      }
    });

    return fullContent;

  } catch (err) {
    console.error('获取面试失败:', err);
    onError?.(err);
    throw err;
  }
}