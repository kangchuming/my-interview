import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { Document } from "@langchain/core/documents";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import EnhancedPDFProcessor from './pdfProcessor';

interface PDFVectorDBConfig {
    collectionName: string;
    dimension: number;
    pdfDirectory: string;
    milvusAddress?: string;
    chunkSize?: number;
    chunkOverlap?: number;
}

// 配置环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 创建MilvusClient 
const milvusClient = new MilvusClient({
    address: 'localhost:19530',
    username: 'username',
    password: 'Aa12345!!'
});

class PDFVectorDB {
    private config: PDFVectorDBConfig;
    private embeddings: AlibabaTongyiEmbeddings;
    private milvusClient: any;
    private textSplitter: RecursiveCharacterTextSplitter;
    private pdfProcessor: EnhancedPDFProcessor;

    constructor(config: PDFVectorDBConfig) {
        this.config = {
            milvusAddress: 'localhost:19530', // 移除冒号后的空格
            chunkSize: 300,
            chunkOverlap: 50,
            ...config
        };

        // 初始化通义嵌入模型
        this.embeddings = new AlibabaTongyiEmbeddings({
            apiKey: process.env.DASHSCOPE_API_KEY,
            modelName: 'text-embedding-v2',
        });

        // 初始化文本分割器
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.chunkSize!,
            chunkOverlap: this.config.chunkOverlap!,
        });

        // 初始化增强PDF处理器
        this.pdfProcessor = new EnhancedPDFProcessor();
    }

    // 初始化milvus客户端
    async initMilvus() {
        this.milvusClient = milvusClient; // 直接使用全局实例
        console.log('Milvus客户端初始化成功');
        console.log(111, this.milvusClient);
    }

    // 创建集合
    async createCollection() {
        try {
            // 检查集合是否已经存在
            const collections = await this.milvusClient.listCollections();
            console.log(0, collections);
            const res = await this.milvusClient.describeCollection({
                collection_name: "quick_setup"
            });
            console.log(111, res);
            
            const existingCollection = collections.data?.find(
                (col: any) => col.name === this.config.collectionName
            );

            if (existingCollection) {
                console.log(`集合 ${this.config.collectionName} 已存在`);
                return;
            }

            // 创建新集合
            const createResult = await this.milvusClient.createCollection({
                collection_name: this.config.collectionName,
                fields: [
                    {
                        name: 'id',
                        description: '文档片段ID',
                        data_type: 'Int64',
                        is_primary_key: true,
                        autoID: true,
                    },
                    {
                        name: 'vector',
                        description: '文本向量',
                        data_type: 'FloatVector',
                        dim: this.config.dimension,
                    },
                    {
                        name: 'text',
                        description: '面试题目或知识点内容',
                        data_type: 'VarChar',
                        max_length: 8192,
                    },
                    {
                        name: 'source',
                        description: 'PDF文件路径',
                        data_type: 'VarChar',
                        max_length: 1000,
                    },
                    {
                        name: 'page',
                        description: '页码',
                        data_type: 'Int64'
                    },
                    // === AI面试场景专用字段 ===
                    {
                        name: 'company',
                        description: '面试公司(华为/腾讯/阿里/美团/百度/字节/京东等)',
                        data_type: 'VarChar',
                        max_length: 50,
                    },
                    {
                        name: 'position',
                        description: '职位类型(前端/后端/算法/测试/产品/运营)',
                        data_type: 'VarChar',
                        max_length: 50,
                    },
                    {
                        name: 'difficulty',
                        description: '面试难度级别(初级/中级/高级)',
                        data_type: 'VarChar',
                        max_length: 20,
                    },
                    {
                        name: 'question_type',
                        description: '问题类型(技术基础/项目经验/算法题/系统设计/HR问题)',
                        data_type: 'VarChar',
                        max_length: 50,
                    },
                    {
                        name: 'tech_stack',
                        description: '相关技术栈(React/Vue/Java/Python等)',
                        data_type: 'VarChar',
                        max_length: 200,
                    },
                    {
                        name: 'interview_round',
                        description: '面试轮次(一面/二面/三面/终面/HR面)',
                        data_type: 'VarChar',
                        max_length: 30,
                    },
                    {
                        name: 'keywords',
                        description: '关键词标签(用于快速检索)',
                        data_type: 'VarChar',
                        max_length: 500,
                    },
                ]
            });

            console.log('集合创建成功: ', createResult);
        } catch (error) {
            console.error('创建集合失败：', error);
            throw error;
        }
    }

    // 创建索引
    async createIndex() {
        try {
            const createIndexResult = await this.milvusClient.createIndex({
                collection_name: this.config.collectionName,
                field_name: 'vector',
                index_name: 'myindex',
                index_type: "HNSW",
                metric_type: "IP",
                params: { efConstruction: 200, M: 24 }
            });

            console.log('索引创建成功：', createIndexResult);
        } catch (error: any) {
            console.error('创建索引失败: ', error);
            // 如果索引已存在，继续执行
            if (!error.message?.includes('index already exist')) {
                throw error;
            } else {
                console.log('索引已存在，继续执行...');
            }
        }
    }

    // 加载PDF文档
    async loadPDFDocuments(): Promise<Document[]> {
        console.log('🚀 开始加载PDF文档...');
        
        try {
            const documents = await this.pdfProcessor.batchProcessPDFs(this.config.pdfDirectory);
            
            if (documents.length === 0) {
                console.warn('⚠️  没有成功加载任何PDF文档');
            } else {
                console.log(`✅ PDF文档加载完成，总计 ${documents.length} 页`);
            }
            
            return documents;
        } catch (error) {
            console.error('❌ PDF文档加载失败:', error);
            throw new Error(`PDF文档加载失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // 分割文档
    async splitDocuments(documents: Document[]): Promise<Document[]> {
        console.log('开始分割文档...');
        const splitDocs = await this.textSplitter.splitDocuments(documents);
        console.log(`文档分割完成，共生成 ${splitDocs.length} 个文档片段`);
        return splitDocs;
    }

    // 生成嵌入向量
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        console.log(`🚀 生成 ${texts.length} 个向量...`);

        const batchSize = 25; // 增加批次大小
        const delay = 500;    // 减少延迟到0.5秒
        const embeddings: number[][] = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const progress = ((i / texts.length) * 100).toFixed(1);
            
            console.log(`📊 向量生成进度: ${progress}% (${i + batch.length}/${texts.length})`);

            try {
                const batchEmbeddings = await this.embeddings.embedDocuments(batch);
                const normalized = batchEmbeddings.map(embedding => 
                    Array.isArray(embedding) 
                        ? embedding.map(val => Number(val))
                        : Array.from(embedding as any).map(val => Number(val))
                );
                
                embeddings.push(...normalized);
                
                // 减少等待时间
                if (i + batchSize < texts.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (error: any) {
                if (error.message?.includes('AllocationQuota')) {
                    console.log(`⏸️ 配额限制，等待 3 秒...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    // 重试当前批次
                    i -= batchSize;
                    continue;
                }
                throw error;
            }
        }

        console.log(`✅ 向量生成完成: ${embeddings.length} 个`);
        return embeddings;
    }

    // 插入数据到Milvus
    async insertData(documents: Document[], embeddings: number[][]) {
        console.log('开始插入数据到Milvus...');
        
        // 添加详细的调试信息
        console.log(`文档数量: ${documents.length}`);
        console.log(`向量数量: ${embeddings.length}`);
        
        // 检查数据一致性
        if (documents.length !== embeddings.length) {
            console.error(`❌ 数据不匹配！文档数量: ${documents.length}, 向量数量: ${embeddings.length}`);
            throw new Error(`数据不匹配：文档数量(${documents.length})与向量数量(${embeddings.length})不一致`);
        }

        // 验证向量维度
        if (embeddings.length > 0) {
            const sampleVectorDim = embeddings[0].length;
            console.log(`样本向量维度: ${sampleVectorDim}`);
            console.log(`配置维度: ${this.config.dimension}`);
            
            if (sampleVectorDim !== this.config.dimension) {
                console.error(`❌ 向量维度不匹配！样本维度: ${sampleVectorDim}, 配置维度: ${this.config.dimension}`);
                throw new Error(`向量维度不匹配：实际(${sampleVectorDim}) vs 配置(${this.config.dimension})`);
            }
        }

        const data = documents.map((doc, index) => {
            // 检查当前向量是否存在
            if (!embeddings[index]) {
                console.error(`❌ 索引 ${index} 的向量不存在`);
                throw new Error(`向量缺失：索引 ${index}`);
            }
            
            // 确保向量是纯数组格式
            const vector = Array.isArray(embeddings[index])
                ? embeddings[index]
                : Array.from(embeddings[index]);
            
            // 验证向量内容
            if (vector.length !== this.config.dimension) {
                console.error(`❌ 索引 ${index} 向量维度错误: ${vector.length} vs ${this.config.dimension}`);
                throw new Error(`向量维度错误：索引 ${index}`);
            }
            
            // 检查向量值是否为有效数字
            const hasInvalidValues = vector.some(val => !Number.isFinite(val));
            if (hasInvalidValues) {
                console.error(`❌ 索引 ${index} 向量包含无效值`);
                throw new Error(`向量包含无效值：索引 ${index}`);
            }
            
            return {
                vector: vector,
                text: doc.pageContent,
                source: doc.metadata.source || '',
                page: doc.metadata.page || 0
            };
        });

        console.log(`准备插入的数据记录数: ${data.length}`);
        console.log(`第一条记录向量维度: ${data[0]?.vector?.length}`);

        const batchSize = 100; // 批量插入
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            console.log(`准备插入批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);
            console.log(`批次大小: ${batch.length}`);
            console.log(`批次向量维度: ${batch[0]?.vector?.length}`);

            try {
                const insertResult = await this.milvusClient.insert({
                    collection_name: this.config.collectionName,
                    data: batch
                });
                
                if (insertResult.status?.error_code === 'Success' || insertResult.succ_index?.length > 0) {
                    console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1} 插入成功`);
                } else {
                    console.log(`批次 ${Math.floor(i / batchSize) + 1} 插入结果:`, insertResult);
                }
            } catch (error) {
                console.error(`批次 ${Math.floor(i / batchSize) + 1} 插入失败:`, error);
                console.error(`批次数据详情: 记录数=${batch.length}, 向量维度=${batch[0]?.vector?.length}`);
                throw error;
            }
        }
        console.log('数据插入完成'); 
    }

    // 加载集合到内存
    async loadCollection() {
        try {
            const loadResult = await this.milvusClient.loadCollectionSync({
                collection_name: this.config.collectionName
            });
            console.log('集合加载成功:', loadResult);
        } catch (error: any) {
            console.error('加载集合失败:', error);
            // 集合加载是必须的，如果失败就抛出错误
            throw error;
        }
    }

    // 搜索相似相似
    async searchSimilarDocuments(query: string, topK: number = 3) {
        try {
            // 生成查询向量
            const queryEmbedding = await this.embeddings.embedQuery(query);

            // 确保查询向量是标准的number[]格式
            const normalizedQueryEmbedding = Array.isArray(queryEmbedding)
                ? queryEmbedding.map(val => Number(val))
                : Array.from(queryEmbedding as number[]).map(val => Number(val));

            console.log('查询向量维度:', normalizedQueryEmbedding.length);
            console.log('查询向量类型:', typeof normalizedQueryEmbedding[0]);

            // 搜索 - 移除可能导致冲突的params
            const searchResult = await this.milvusClient.search({
                collection_name: this.config.collectionName,
                data: [normalizedQueryEmbedding],
                output_fields: ['text', 'source', 'page'],
                limit: topK,
                metric_type: "IP",  // 改为IP度量类型，与索引创建时一致
                params: {
                    ef: 64
                }
            });

            console.log('搜索结果原始数据:', JSON.stringify(searchResult, null, 2));
            return searchResult;
        } catch (error) {
            console.error('搜索失败：', error);
            throw error;
        }
    }

    // 添加快速检查方法
    async getCollectionStats() {
        try {
            const stats = await this.milvusClient.getCollectionStatistics({
                collection_name: this.config.collectionName
            });
            console.log('📊 集合统计:', stats);
            return stats;
        } catch (error) {
            console.log('⚠️ 无法获取集合统计');
            return null;
        }
    }

    // 优化构建流程 - 分批次处理
    async buildVectorDB() {
        try {
            console.log('🚀 开始构建PDF向量数据库...');

            // 1-3. 快速初始化
            await this.initMilvus();
            await this.createCollection();
            await this.createIndex();

            // 4. 检查是否已有数据
            const existingData = await this.getCollectionStats();
            if (existingData?.row_count > 0) {
                console.log(`✅ 发现已有 ${existingData.row_count} 条数据，跳过构建`);
                await this.loadCollection();
                return;
            }

            // 5. 分批处理文档
            await this.buildInBatches();

        } catch (error) {
            console.error('❌ 构建向量数据库失败:', error);
            throw error;
        }
    }

    // 分批次构建
    private async buildInBatches() {
        console.log('📚 开始分批处理文档...');
        
        const documents = await this.loadPDFDocuments();
        if (documents.length === 0) {
            throw new Error('没有找到PDF文档');
        }

        const splitDocuments = await this.splitDocuments(documents);
        
        // 分批处理，每批200个文档片段
        const batchSize = 200;
        const totalBatches = Math.ceil(splitDocuments.length / batchSize);
        
        console.log(`📊 总计 ${splitDocuments.length} 个片段，分 ${totalBatches} 批处理`);

        for (let i = 0; i < splitDocuments.length; i += batchSize) {
            const batch = splitDocuments.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            
            console.log(`\n🔄 处理批次 ${batchNumber}/${totalBatches} (${batch.length} 个片段)`);
            
            try {
                // 生成向量并插入
                const texts = batch.map(doc => doc.pageContent);
                const embeddings = await this.generateEmbeddings(texts);
                await this.insertData(batch, embeddings);
                
                console.log(`✅ 批次 ${batchNumber} 完成`);
                
                // 每批次后短暂休息
                if (batchNumber < totalBatches) {
                    console.log('⏸️ 批次间休息 2 秒...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.error(`❌ 批次 ${batchNumber} 失败:`, error);
                console.log(`💡 可以从批次 ${batchNumber} 继续: resumeBuildVectorDB(${i})`);
                throw error;
            }
        }

        // 最后加载集合
        await this.loadCollection();
        console.log('✅ 分批构建完成！');
    }
}

export default PDFVectorDB; 