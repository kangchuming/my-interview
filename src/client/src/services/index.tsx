import { useRef, useState } from 'react';

const ASRStory = () => {
  const [header, setHeader] = useState('');
  const [content, setContent] = useState('');
  const [fullResponse, setFullResponse] = useState({});
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordStopping = useRef(false);

  const startASR = async () => {
    console.log('=== 开始语音识别 (使用 Web Audio API 版本) ===');
    recordStopping.current = false;
    setHeader('正在连接...');
    setContent('');

    try {
      // 连接你自己的 WebSocket 服务器，而不是 openspeech
      const ws = new WebSocket('ws://localhost:3001/api/asr/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setHeader('正在录音');
        startRecording();
      };

      ws.onmessage = (event) => {
        console.log('收到服务器消息，类型:', typeof event.data);
        
        // 如果是文本消息，尝试解析 JSON
        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            if (data.result && data.result.text) {
              setContent(data.result.text);
            }
            setFullResponse(data);
          } catch (err) {
            console.error('解析 JSON 消息失败:', err);
            console.log('原始消息:', event.data);
          }
        } else {
          // 二进制数据，可能是音频回传或其他数据
          console.log('收到二进制数据，大小:', event.data.size || event.data.byteLength);
        }
      };

      ws.onclose = () => {
        setHeader('录音结束');
      };

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        setHeader('连接错误');
      };

    } catch (error) {
      console.error('启动录音失败:', error);
      setHeader('连接失败');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // 使用 Web Audio API 获取原始 PCM 数据
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputBuffer = e.inputBuffer.getChannelData(0);
          
          // 转换为 16-bit PCM
          const pcmData = new Int16Array(inputBuffer.length);
          for (let i = 0; i < inputBuffer.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
          }
          
          console.log('发送 PCM 音频数据，样本数:', pcmData.length);
          wsRef.current.send(pcmData.buffer);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('使用 Web Audio API，采样率:', audioContext.sampleRate);
      
    } catch (error) {
      console.error('获取麦克风权限失败:', error);
      setHeader('麦克风权限获取失败');
    }
  };

  const stopASR = () => {
    if (recordStopping.current) {
      return;
    }
    recordStopping.current = true;

    // 停止 Web Audio API
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // 关闭 WebSocket 连接
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setHeader('录音结束');
  };

  return (
    <div>
      <button id='start' onClick={startASR}>
        开始说话
      </button>
      <button id='stop' onClick={stopASR}>
        结束说话
      </button>
      <div id='text-header'>{header}</div>
      <div id='text-content'>{content}</div>
      <pre>{JSON.stringify(fullResponse, null, 2)}</pre>
    </div>
  );
};

export default ASRStory;