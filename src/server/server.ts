import express, { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { proxyOpenSpeech } from './helper/proxyWebSocket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/asr/ws' });
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'Express + TypeScript + Vite Server' });
});

// WebSocket 连接处理
wss.on('connection', (clientWs) => {
  console.log('Client connected to WebSocket');
  
  // 这里你需要设置你的 appid 和 accessKey
  const appid = process.env.APPID || '6132990956';
  const accessKey = process.env.ACCESS_KEY || 'W9SXb2UZH5L-2VEZ9w7YgBk7pwoA_ngN';
  
  proxyOpenSpeech(clientWs, appid, accessKey);
});

app.post('/api/sts/token', async(req: Request, res: Response) => {
  const { appid, accessKey } = req.body;

  try {
      const response = await fetch('https://openspeech.bytedance.com/api/v1/sts/token', {
          method: 'POST',
          headers: {
              Authorization: `Bearer; ${accessKey}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              appid,
              duration: 300,
          })
      })
      const data = await response.json();
      res.json(data);
  } catch(err) {
      res.status(500).json({error: 'Failed to fetch token'});
  }
})

// 启动服务器
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;