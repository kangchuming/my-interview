import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// TypeScript 中处理 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 环境变量检查
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
    console.error('Missing required environment variables');
    process.exit(1);
}

export const config = {
    // 向量数据库配置
    vectorDB: {
        collectionName: 'research_papers',
        dimension: 1536,
        pdfDirectory: "./pdfFiles", // PDF存放目录
        chunkSize: 350, // 文本块大小
        chunkOverlap: 100 //块间重叠
    },

    // OpenAI 配置
    openai: {
        apiKey: process.env.OPENAI_API_KEY!,
        baseURL: process.env.OPENAI_BASE_URL!,
        model: 'doubao-seed-1-6-250615',
        temperature: 0.3,
        maxTokens: 5000
    },

    // 服务器配置
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        timeout: 30000
    },

    // CORS 配置
    cors: {
        allowedOrigins: [
            'https://paper-generation-client.vercel.app',
            'http://localhost:5173',  // 添加这个
            'http://127.0.0.1:5173',  // 添加这个
            'http://127.0.0.1:5173',  // 添加这个
            'http://10.219.192.172:5173',
            'http://192.168.1.100:5173',
            'http://localhost:3008',
            'http://127.0.0.1:3008',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ]
    }
}; 