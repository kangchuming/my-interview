import { Router, Request, Response } from 'express';
import { interviewController } from '../controllers/interviewController';
import { helloController } from '../controllers/helloController';
import { extractController } from '../controllers/extractingInfo'
const router = Router();

// 根路由
router.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'API is running' });
});

// // 聊天流式响应路由
// router.post('/genoutline', (req: Request, res: Response) => {
//     chatController.streamChat(req, res);
// });

// 信息提取生成路由
router.post('/extracting/info', (req: Request, res: Response) => {
    extractController.streamPaper(req, res);
});

// 提问生成路由
router.post('/question/stream', (req: Request, res: Response) => {
    interviewController.streamPaper(req, res);
});



// 开场白生成路由
router.post('/smallchat/stream', (req: Request, res: Response) => {
    helloController.streamPaper(req, res)
})

export default router; 