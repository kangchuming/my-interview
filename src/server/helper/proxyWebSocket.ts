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
      // 不发送初始化配置，让 LabASR SDK 自己处理
    });

    let configSent = false;
    
    // 前端消息转发到 openspeech
    clientWs.on('message', (msg) => {
      if (openspeechWs.readyState === WebSocket.OPEN && isConnected) {
        // 添加日志查看客户端发送的消息
        console.log('收到客户端消息类型:', typeof msg);
        
        if (Buffer.isBuffer(msg)) {
          console.log('客户端消息长度:', msg.length);
          
          // 检查是否是配置信息（通常是JSON字符串，长度较小）
          if (msg.length < 1000) {
            try {
              const text = msg.toString('utf8');
              const parsed = JSON.parse(text);
              console.log('客户端配置信息:', text);
              configSent = true;
              openspeechWs.send(msg);
              return;
            } catch (e) {
              // 不是JSON，当作音频数据处理
            }
          }
          
          // 如果是音频数据但还没发送配置，先发送配置
          if (!configSent && msg.length > 1000) {
            console.log('检测到音频数据但未发送配置，先发送配置信息');
            
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
            configSent = true;
            console.log('配置信息已发送');
          }
          
          console.log('转发音频数据，长度:', msg.length);
          openspeechWs.send(msg);
        } else {
          console.log('客户端消息内容:', String(msg));
          openspeechWs.send(msg);
        }
      }
    });

    // openspeech 消息转发到前端
    openspeechWs.on('message', (msg) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        // 添加详细日志以便调试
        console.log('收到 OpenSpeech 消息类型:', typeof msg);
        
        // 如果是二进制数据，尝试转换为文本查看内容
        if (Buffer.isBuffer(msg)) {
          console.log('消息长度:', msg.length);
          const text = msg.toString('utf8');
          console.log('消息内容 (前100字符):', text.substring(0, 100));
        } else {
          console.log('消息内容 (前100字符):', String(msg).substring(0, 100));
        }
        
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
    
    openspeechWs.on('close', (code, reason) => {
      console.log('OpenSpeech WebSocket 关闭');
      console.log('关闭代码:', code);
      console.log('关闭原因:', reason?.toString());
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
      console.error('错误详情:', err.message);
      clientWs.close();
    });

  } catch (error) {
    console.error('Failed to setup WebSocket proxy:', error);
    clientWs.close();
  }
} 