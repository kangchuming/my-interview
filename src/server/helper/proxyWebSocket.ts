import { WebSocket } from 'ws';
import { getToken } from './getToken';
import { buildFullUrl } from './buildFullUrl';

/**
 * 代理前端和 openspeech WebSocket 的通信
 */
export async function proxyOpenSpeech(clientWs: WebSocket, appid: string, accessKey: string) {
  try {
    // 获取 token 和 fullUrl
    const token = await getToken(appid, accessKey);
    const fullUrl = buildFullUrl('wss://openspeech.bytedance.com/api/v3/sauc/bigmodel', {
      api_resource_id: 'volc.bigasr.sauc.duration',
      api_app_key: appid,
      api_access_key: `Jwt; ${token}`,
    });

    console.log('连接 openspeech:', fullUrl);

    // 连接 openspeech WebSocket
    const openspeechWs = new WebSocket(fullUrl);
    let isConnected = false;

    openspeechWs.on('open', () => {
      console.log('OpenSpeech WebSocket 连接成功');
      isConnected = true;
      
      // 发送初始化配置
      const initConfig = {
        user: {
          uid: 'byted sdk demo',
        },
        audio: {
          format: 'pcm',
          rate: 16000,
          bits: 16,
          channel: 1,
        },
        request: {
          model_name: 'bigmodel',
          show_utterances: true,
        },
      };
      
      openspeechWs.send(JSON.stringify(initConfig));
    });

    // 前端消息转发到 openspeech
    clientWs.on('message', (msg) => {
      if (openspeechWs.readyState === WebSocket.OPEN && isConnected) {
        // 如果是音频数据（二进制），直接转发
        // 如果是文本消息，也直接转发
        openspeechWs.send(msg);
      }
    });

    // openspeech 消息转发到前端
    openspeechWs.on('message', (msg) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(msg);
      }
    });

    // 错误和关闭处理
    clientWs.on('close', () => {
      console.log('Client WebSocket 关闭');
      if (openspeechWs.readyState === WebSocket.OPEN) {
        openspeechWs.close();
      }
    });
    
    openspeechWs.on('close', () => {
      console.log('OpenSpeech WebSocket 关闭');
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    clientWs.on('error', (err) => {
      console.error('Client WebSocket error:', err);
      openspeechWs.close();
    });
    
    openspeechWs.on('error', (err) => {
      console.error('OpenSpeech WebSocket error:', err);
      clientWs.close();
    });

  } catch (error) {
    console.error('Failed to setup WebSocket proxy:', error);
    clientWs.close();
  }
} 