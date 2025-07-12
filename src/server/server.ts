import express, { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import routes from './routes/index';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { proxyOpenSpeech } from './helper/proxyWebSocket';
import { startServer, initializeVercel } from './utils/serverUtils.js';
import { InterviewPromptGenerator } from './utils/prompts.js';

dotenv.config();

// 环境变量检查
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const app = express();
// 中间件
app.use(corsMiddleware);
app.use(bodyParser.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/asr/ws' });
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api', routes);


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

app.post('/api/sts/token', async (req: Request, res: Response) => {
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token' });
  }
})

// 生成面试Prompt的API
app.post('/api/interview/prompt', async (req: Request, res: Response) => {
  try {
    const { 
      positionType, 
      candidateName, 
      projectKeywords = [], 
      skillGaps = [],
      stage = 'technical' 
    } = req.body;

    let prompt = '';
    
    switch (stage) {
      case 'technical':
        prompt = InterviewPromptGenerator.generateTechnicalProbePrompt(positionType, projectKeywords, skillGaps, retrievalContext);
        break;
      case 'project':
        prompt = InterviewPromptGenerator.generateProjectExperiencePrompt(projectKeywords);
        break;
      case 'design':
        prompt = InterviewPromptGenerator.generateSystemDesignPrompt(positionType, 'Mid');
        break;
      case 'summary':
        prompt = InterviewPromptGenerator.generateSummaryPrompt(['技术深度', '问题解决', '系统设计', '沟通协作']);
        break;
      default:
        prompt = InterviewPromptGenerator.generateOpeningPrompt(positionType, candidateName);
    }

    res.json({ 
      success: true, 
      prompt,
      stage,
      positionType 
    });
  } catch (error) {
    console.error('生成面试Prompt失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '生成面试Prompt失败' 
    });
  }
});

// 快速开场白API
app.post('/api/interview/quick-opening', async (req: Request, res: Response) => {
  try {
    const { positionType, candidateName } = req.body;
    
    const opening = InterviewPromptGenerator.generateSimpleOpening(positionType, candidateName);
    
    res.json({ 
      success: true, 
      opening,
      positionType 
    });
  } catch (error) {
    console.error('生成快速开场白失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '生成快速开场白失败' 
    });
  }
});

// 服务器启动逻辑
if (!process.env.VERCEL) {
  startServer(config.server.port, app);
  // 启动服务器
  // server.listen(PORT, () => {
  //   console.log(`Server running on port ${PORT}`);
  // });
} else {
  // Vercel环境初始化
  initializeVercel();
}

export default app;