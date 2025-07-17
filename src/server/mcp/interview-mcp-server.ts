import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import PDFVectorDB from '../utils/pdfVectordb.js';
import { config } from '../config/index.js';
import { z } from "zod";
import * as readline from 'readline'; // 添加这行导入

interface CandidateProfile {
    techStack: string[];
    projectExperience: string[];
    experienceLevel: 'junior' | 'mid' | 'senior';
    strengths: string[];
    potentialAreas: string[];
}

class InterviewMCPServer {
    private server: Server;
    private pdfVectorDB: PDFVectorDB;
    private isInitialized: boolean = false;

    constructor() {
        this.server = new Server(
            {
                name: "interview-mcp-server",
                version: "2.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
        
        this.pdfVectorDB = new PDFVectorDB(config.vectorDB);
        this.setupTools();
    }

    // 修复检查已有数据的方法
    private async checkExistingData(): Promise<boolean> {
        try {
            console.log('🔍 检查已有数据...');
            
            // 1. 确保Milvus已初始化
            await this.pdfVectorDB.initMilvus();
            
            // 2. 列出所有集合
            const collections = await this.pdfVectorDB.milvusClient.listCollections();
            console.log('📋 现有集合:', collections.data?.map((col: any) => col.name));
            
            // 3. 检查目标集合是否存在
            const targetCollection = collections.data?.find(
                (col: any) => col.name === this.pdfVectorDB.config.collectionName
            );
            
            if (!targetCollection) {
                console.log('📝 目标集合不存在');
                return false;
            }
            
            console.log('✅ 目标集合存在:', targetCollection.name);
            
            // 4. 尝试获取统计信息
            try {
                const stats = await this.pdfVectorDB.getCollectionStats();
                console.log(' 集合统计信息:', stats);
                
                if (stats && stats.row_count > 0) {
                    console.log(`✅ 发现 ${stats.row_count} 条已有数据`);
                    return true;
                } else {
                    console.log('📝 集合存在但无数据');
                    return false;
                }
            } catch (statsError) {
                console.log('⚠️ 无法获取统计信息，尝试加载集合...');
                
                // 5. 尝试加载集合
                try {
                    await this.pdfVectorDB.loadCollection();
                    console.log('✅ 集合加载成功，假设有数据');
                    return true;
                } catch (loadError) {
                    console.log('❌ 集合加载失败，需要重新构建');
                    return false;
                }
            }
            
        } catch (error) {
            console.log('❌ 检查已有数据失败:', error);
            return false;
        }
    }

    // 优化初始化流程
    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            console.log('🔄 正在初始化向量数据库...');
            
            // 检查是否已有数据
            const hasExistingData = await this.checkExistingData();
            
            if (hasExistingData) {
                console.log('✅ 发现已有数据，跳过构建过程');
                this.isInitialized = true;
                return;
            }
            
            // 如果没有数据，询问用户是否构建
            console.log('❓ 未发现已有数据，是否开始构建？(y/n)');
            
            // 暂时跳过构建，避免重复
            console.log('⚠️ 跳过自动构建，请手动调用构建命令');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ 向量数据库初始化失败:', error);
            console.log('⚠️ 系统将以降级模式运行');
            this.isInitialized = true; // 允许基本功能
        }
    }

    // 异步构建向量数据库
    private async buildVectorDBAsync(): Promise<void> {
        try {
            console.log('🔄 异步构建开始...');
            await this.pdfVectorDB.buildVectorDB();
            console.log('✅ 异步构建完成');
        } catch (error) {
            console.error('❌ 异步构建失败:', error);
        }
    }

    private setupTools() {
        this.server.setRequestHandler(
            z.object({ method: z.literal("tools/list") }),
            async () => {
                return {
                    tools: [
                        {
                            name: "search_interview_knowledge",
                            description: "搜索面试题库和面经",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    query: { 
                                        type: "string", 
                                        description: "搜索关键词，如：React生命周期、算法题、系统设计" 
                                    },
                                    company: {
                                        type: "string",
                                        description: "指定公司",
                                        enum: ["华为", "腾讯", "阿里", "美团", "百度", "字节", "京东", "拼多多"]
                                    },
                                    position: {
                                        type: "string", 
                                        description: "职位类型",
                                        enum: ["前端", "后端", "算法", "测试", "产品", "运营"]
                                    },
                                    difficulty: {
                                        type: "string",
                                        description: "面试难度",
                                        enum: ["初级", "中级", "高级"]
                                    },
                                    question_type: {
                                        type: "string",
                                        description: "问题类型",
                                        enum: ["技术基础", "项目经验", "算法题", "系统设计", "HR问题"]
                                    },
                                    topK: { 
                                        type: "number", 
                                        description: "返回结果数量，默认3",
                                        default: 3,
                                        minimum: 1,
                                        maximum: 10
                                    }
                                },
                                required: ["query"]
                            }
                        },
                        {
                            name: "get_interview_by_company",
                            description: "获取特定公司的面试题",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    company: {
                                        type: "string",
                                        description: "公司名称",
                                        enum: ["华为", "腾讯", "阿里", "美团", "百度", "字节", "京东", "拼多多"]
                                    },
                                    position: {
                                        type: "string",
                                        description: "职位类型(可选)",
                                        enum: ["前端", "后端", "算法", "测试", "产品", "运营"]
                                    },
                                    topK: { type: "number", default: 5 }
                                },
                                required: ["company"]
                            }
                        },
                        {
                            name: "get_candidate_profile",
                            description: "分析候选人技术栈和经验水平",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    candidateResponse: { 
                                        type: "string", 
                                        description: "候选人回答内容" 
                                    },
                                    target_position: {
                                        type: "string",
                                        description: "目标职位",
                                        enum: ["前端", "后端", "算法", "测试", "产品", "运营"]
                                    }
                                },
                                required: ["candidateResponse"]
                            }
                        },
                        {
                            name: "generate_interview_questions",
                            description: "根据职位和难度生成面试题",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    position: {
                                        type: "string",
                                        description: "职位类型",
                                        enum: ["前端", "后端", "算法", "测试", "产品", "运营"]
                                    },
                                    difficulty: {
                                        type: "string",
                                        description: "难度级别",
                                        enum: ["初级", "中级", "高级"]
                                    },
                                    tech_stack: {
                                        type: "string",
                                        description: "技术栈关键词，如：React, Vue, Java"
                                    },
                                    count: { type: "number", default: 3, maximum: 10 }
                                },
                                required: ["position"]
                            }
                        }
                    ]
                };
            }
        );

        this.server.setRequestHandler(
            z.object({ 
                method: z.literal("tools/call"),
                params: z.object({
                    name: z.string(),
                    arguments: z.any()
                })
            }),
            async (request) => {
                const { name, arguments: args } = request.params;

                try {
                    await this.ensureInitialized();

                    switch (name) {
                        case "search_interview_knowledge":
                            return await this.searchInterviewKnowledge(args.query, args.topK || 3);
                        
                        case "get_candidate_profile":
                            return await this.analyzeCandidateProfile(args.candidateResponse);
                        
                        case "test_search":
                            return await this.testSearch(args.query || "React");
                        
                        default:
                            throw new Error(`Unknown tool: ${name}`);
                    }
                } catch (error) {
                    console.error(`Tool execution error for ${name}:`, error);
                    
                    return {
                        content: [{
                            type: "text",
                            text: `❌ 工具执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }]
                    };
                }
            }
        );
    }

    private async searchInterviewKnowledge(query: string, topK: number = 3) {
        console.log(`🔍 搜索: "${query}", 返回数量: ${topK}`);
        
        try {
            if (!this.isInitialized) {
                return {
                    content: [{
                        type: "text",
                        text: `⚠️ 向量数据库未初始化，无法执行搜索。\n\n建议：\n• 检查Milvus服务状态\n• 确认PDF文件存在\n• 等待系统初始化完成`
                    }]
                };
            }

            const results = await this.pdfVectorDB.searchSimilarDocuments(query, topK);
            
            if (!results?.results || results.results.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: `🔍 未找到关于"${query}"的相关面试资料。\n\n建议：\n• 尝试不同的关键词\n• 检查数据库是否有相关内容`
                    }]
                };
            }

            // 格式化搜索结果
            const formattedResults = results.results.map((resultArray: any, index: number) => {
                const data = Array.isArray(resultArray) ? resultArray[0] : resultArray;
                
                return `
📄 **结果 ${index + 1}**
📖 **内容**: ${(data?.text || '').substring(0, 200)}${(data?.text || '').length > 200 ? '...' : ''}
📍 **来源**: ${data?.source || 'Unknown'} ${data?.page ? `(第${data.page}页)` : ''}
---`;
            }).join('\n');

            return {
                content: [{
                    type: "text",
                    text: `🎯 **搜索结果** (关键词: "${query}")\n\n📊 找到 ${results.results.length} 条相关记录\n\n${formattedResults}`
                }]
            };
            
        } catch (error) {
            console.error('搜索异常:', error);
            
            return {
                content: [{
                    type: "text",
                    text: `❌ 搜索失败: ${error instanceof Error ? error.message : 'Unknown error'}\n\n可能原因：\n• 向量索引未创建\n• 数据库连接问题\n• API调用限制`
                }]
            };
        }
    }

    private async analyzeCandidateProfile(candidateResponse: string) {
        console.log(`👤 分析候选人回答: ${candidateResponse.length} 字符`);
        
        try {
            const profile = this.extractCandidateProfile(candidateResponse);
            
            // 简化的技术栈搜索
            let relatedContent = '';
            if (this.isInitialized && profile.techStack.length > 0) {
                try {
                    const techQuery = profile.techStack.slice(0, 2).join(' ');
                    const searchResult = await this.pdfVectorDB.searchSimilarDocuments(techQuery, 2);
                    
                    if (searchResult?.results?.length > 0) {
                        const data = Array.isArray(searchResult.results[0]) ? searchResult.results[0][0] : searchResult.results[0];
                        relatedContent = `\n📚 **相关知识点**: ${(data?.text || '').substring(0, 100)}...`;
                    }
                } catch (error) {
                    console.warn('技术栈搜索失败:', error);
                }
            }

            return {
                content: [{
                    type: "text",
                    text: `
👤 **候选人技术档案分析**

🛠️ **技术栈**: ${profile.techStack.join(', ') || '未明确提及'}
📊 **经验水平**: ${profile.experienceLevel}
💪 **技术优势**: ${profile.strengths.join(', ') || '需进一步了解'}

📝 **项目经验**:
${profile.projectExperience.map(exp => `• ${exp}`).join('\n') || '• 需要详细了解项目背景'}

🤔 **面试建议**:
• ${profile.experienceLevel === 'senior' ? '重点考察架构设计能力' : profile.experienceLevel === 'mid' ? '考察问题解决能力' : '重点考察基础知识'}
• 深入了解项目中的技术难点${relatedContent}
`
                }]
            };
            
        } catch (error) {
            console.error('候选人分析异常:', error);
            
            return {
                content: [{
                    type: "text",
                    text: `❌ 候选人分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
            };
        }
    }

    private async testSearch(query: string) {
        console.log(`🧪 测试搜索: "${query}"`);
        
        try {
            const startTime = Date.now();
            const rawResults = await this.pdfVectorDB.searchSimilarDocuments(query, 2);
            const duration = Date.now() - startTime;
            
            return {
                content: [{
                    type: "text",
                    text: `
🧪 **搜索测试结果**

• 搜索词: "${query}"
• 耗时: ${duration}ms
• 初始化状态: ${this.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}
• 结果数量: ${rawResults?.results?.length || 0}

**原始结果**:
\`\`\`json
${JSON.stringify(rawResults, null, 2)}
\`\`\`
`
                }]
            };
            
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `🧪 **搜索测试失败**\n\n错误: ${error?.message}\n类型: ${error?.constructor?.name}`
                }]
            };
        }
    }

    // 简化的辅助方法
    private extractCandidateProfile(response: string): CandidateProfile {
        const techStack = this.extractTechStack(response);
        const projectExperience = this.extractProjectExperience(response);
        const experienceLevel = this.assessExperienceLevel(response);
        const strengths = this.extractStrengths(response);
        const potentialAreas = this.extractPotentialAreas(response);

        return { techStack, projectExperience, experienceLevel, strengths, potentialAreas };
    }

    private extractTechStack(response: string): string[] {
        const techPatterns = [
            /React|Vue|Angular|JavaScript|TypeScript|HTML|CSS/gi,
            /Node\.js|Python|Java|Spring|Express/gi,
            /MySQL|MongoDB|Redis/gi,
            /Docker|Git|Webpack/gi
        ];

        const techStack = new Set<string>();
        techPatterns.forEach(pattern => {
            const matches = response.match(pattern);
            if (matches) {
                matches.forEach(match => techStack.add(match));
            }
        });

        return Array.from(techStack);
    }

    private extractProjectExperience(response: string): string[] {
        const projectPatterns = [
            /(?:项目|系统|平台)[:：]\s*([^，。\n]{10,50})/g,
            /(?:开发|构建|设计)\s*([^，。\n]{10,50})/g
        ];
        
        const projects: string[] = [];
        projectPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(response)) !== null) {
                projects.push(match[1].trim());
            }
        });
        
        return [...new Set(projects)];
    }

    private assessExperienceLevel(response: string): 'junior' | 'mid' | 'senior' {
        const seniorKeywords = ['架构', '设计模式', '性能优化', '团队管理'];
        const midKeywords = ['项目经验', '解决方案', '优化'];
        
        const seniorCount = seniorKeywords.filter(keyword => response.includes(keyword)).length;
        const midCount = midKeywords.filter(keyword => response.includes(keyword)).length;
        
        if (seniorCount >= 2) return 'senior';
        if (midCount >= 2) return 'mid';
        return 'junior';
    }

    private extractStrengths(response: string): string[] {
        const strengthPatterns = [
            /擅长\s*([^，。\n]+)/g,
            /熟悉\s*([^，。\n]+)/g,
            /精通\s*([^，。\n]+)/g
        ];
        
        const strengths: string[] = [];
        strengthPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(response)) !== null) {
                strengths.push(match[1].trim());
            }
        });
        
        return strengths;
    }

    private extractPotentialAreas(response: string): string[] {
        const areaPatterns = [
            /希望\s*([^，。\n]+)/g,
            /想要\s*([^，。\n]+)/g
        ];
        
        const areas: string[] = [];
        areaPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(response)) !== null) {
                areas.push(match[1].trim());
            }
        });
        
        return areas;
    }

    async start() {
        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            
            console.log('✅ Interview MCP Server v2.0 started successfully');
            console.log('🔧 Debug Info:');
            console.log('- Process ID:', process.pid);
            console.log('- Node version:', process.version);
            console.log('- DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY ? '✅ 已设置' : '❌ 未设置');
            
            // 延迟初始化测试
            setTimeout(async () => {
                try {
                    await this.ensureInitialized();
                    console.log('✅ 数据库连接测试成功');
                } catch (error) {
                    console.error('❌ 数据库连接测试失败:', error);
                }
            }, 2000);

            // 启动交互式测试
            this.startInteractiveTest();
            
        } catch (error) {
            console.error('❌ Failed to start MCP server:', error);
            throw error;
        }
    }

    // 修复交互式测试功能
    private async startInteractiveTest() {
        // 修改这里，使用import导入的readline
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n🎯 MCP交互测试模式');
        console.log('输入搜索关键词 (输入 "exit" 退出):');

        const askQuestion = () => {
            rl.question('搜索> ', async (query: string) => {
                if (query.toLowerCase() === 'exit') {
                    rl.close();
                    return;
                }

                try {
                    await this.ensureInitialized();
                    console.log(`🔍 搜索关键词: "${query}"`);
                    
                    const result = await this.searchInterviewKnowledge(query, 3);
                    console.log('\n📋 搜索结果:');
                    console.log(result.content[0].text);
                    console.log('\n' + '='.repeat(50));
                } catch (error) {
                    console.error('❌ 搜索失败:', error);
                }

                askQuestion();
            });
        };

        // 等待系统初始化完成后开始交互
        setTimeout(() => {
            console.log('\n💡 系统就绪，开始交互测试...');
            askQuestion();
        }, 3000);
    }
}

// 启动服务器
const server = new InterviewMCPServer();
server.start().catch(console.error); 