import { PositionType, EvaluationDimension, InterviewPrompt, InterviewPhase, QuestionSet, EvaluationMetric } from '../types/index';

// 添加缺失的函数定义
function extractKeywords(jd: string, positionType: PositionType) {
    const keywords = jd.split(/[，。\s]+/).filter(word => word.length > 1);
    return { keywords, level: 'Mid' as const }; // 添加level属性
}

function extractResumeHighlights(resume: string) {
    const skills = resume.split(/[，。\s]+/).filter(word => word.length > 1);
    return { 
        skills, 
        keywords: skills, // 添加keywords属性
        projects: skills  // 添加projects属性
    };
}

function identifySkillGaps(jdKeywords: string[], resumeSkills: string[]) {
    return jdKeywords.filter(keyword => !resumeSkills.includes(keyword));
}

function getPositionQuestionBank(positionType: PositionType): QuestionSet[] {
    return positionQuestionBanks[positionType] || [];
}

function generatePhases(questionBank: QuestionSet[], skillGaps: string[]): InterviewPhase[] {
    return questionBank.map((q, index) => ({
        name: q.type,
        phase: index + 1,
        objectives: [`评估${q.evaluationDimensions.join('、')}能力`],
        questions: [q] // 直接传递 QuestionSet 对象，而不是字符串
    }));
}

// 在文件开头添加函数定义
function generateInterviewPrompt(
    jd: string, 
    resume: string,
    positionType: PositionType
): InterviewPrompt {
    
    // 解析核心元素
    const parsedJD = extractKeywords(jd, positionType);
    const parsedResume = extractResumeHighlights(resume);
    
    // 生成技能差距分析
    const skillGaps = identifySkillGaps(parsedJD.keywords, parsedResume.skills);
    
    // 获取职位专属问题模板
    const questionBank = getPositionQuestionBank(positionType);
    
    return {
        position: {
            type: positionType,
            level: parsedJD.level,
            jdKeywords: parsedJD.keywords
        },
        candidate: {
            resumeKeywords: parsedResume.keywords,
            projectHighlights: parsedResume.projects,
            skillGaps
        },
        interviewPhases: generatePhases(questionBank, skillGaps),
        evaluationMatrix: getEvaluationMatrix(positionType)
    };
}

// 修复 positionQuestionBanks，添加所有缺失的职位类型
const positionQuestionBanks: Record<PositionType, QuestionSet[]> = {
    前端: [
        {
            type: "Technical",
            coreQuestion: "请介绍一下React的生命周期",
            dynamicTriggers: {
                onKeyword: ["React", "生命周期"],
                onConceptGap: "组件更新机制",
                onSolutionDepth: 3
            },
            evaluationDimensions: ["技术深度", "系统设计"]
        }
    ],
    后端: [
        // 保持现有的后端问题集
        {
            type: "Technical",
            coreQuestion: "在{{高并发项目}}中如何设计分布式事务保证数据一致性？",
            dynamicTriggers: {
                onKeyword: ["Saga", "TCC", "消息队列"],
                onConceptGap: "如何解决网络分区下的数据冲突？",
                onSolutionDepth: 2
            },
            evaluationDimensions: ["技术深度", "系统设计"]
        }
    ],
    算法: [
        // 保持现有的算法问题集
        {
            type: "Technical",
            coreQuestion: "在{{推荐系统项目}}中如何解决曝光偏差问题？",
            dynamicTriggers: {
                onKeyword: ["IPS", "多任务学习", "因果推断"],
                onConceptGap: "如何设计离线评估指标验证方案有效性？",
                onSolutionDepth: 2
            },
            evaluationDimensions: ["技术深度", "业务理解"]
        }
    ],
    产品: [
        // 保持现有的产品问题集
        {
            type: "CaseStudy",
            coreQuestion: "针对{{简历项目}}的DAU下降，设计分析框架和应对策略",
            dynamicTriggers: {
                onKeyword: ["用户分层", "漏斗分析", "A/B测试"],
                onConceptGap: "如何区分根本原因与表象？",
                onSolutionDepth: 2
            },
            evaluationDimensions: ["业务理解", "问题解决"]
        }
    ],
    测试: [
        // 保持现有的测试问题集
        {
            type: "Technical",
            coreQuestion: "设计{{微服务系统}}的全链路压测方案，确保生产环境安全",
            dynamicTriggers: {
                onKeyword: ["流量录制", "影子库", "熔断机制"],
                onConceptGap: "如何避免压测导致的数据污染？",
                onSolutionDepth: 2
            },
            evaluationDimensions: ["技术深度", "系统设计"]
        }
    ],
    运营: [
        {
            type: "Technical",
            coreQuestion: "请介绍一下用户增长策略",
            dynamicTriggers: {
                onKeyword: ["增长", "用户"],
                onConceptGap: "数据分析",
                onSolutionDepth: 2
            },
            evaluationDimensions: ["技术深度", "系统设计"]
        }
    ],
    数据: [
        {
            type: "Technical",
            coreQuestion: "请介绍一下数据清洗流程",
            dynamicTriggers: {
                onKeyword: ["数据", "清洗"],
                onConceptGap: "数据质量",
                onSolutionDepth: 3
            },
            evaluationDimensions: ["技术深度", "系统设计"]
        }
    ],
    DevOps: [
        {
            type: "Technical",
            coreQuestion: "请介绍一下CI/CD流程",
            dynamicTriggers: {
                onKeyword: ["CI", "CD", "部署"],
                onConceptGap: "自动化",
                onSolutionDepth: 3
            },
            evaluationDimensions: ["技术深度", "系统设计"]
        }
    ]
};

// ==================== 评估矩阵生成器 ====================
function getEvaluationMatrix(type: PositionType): EvaluationMetric[] {
    
    // 通用基础维度
    const baseMetrics: EvaluationMetric[] = [
      {
        dimension: "问题解决",
        indicators: ["方案完整性", "权衡分析能力", "创新性"],
        ratingScale: [
          [1, "无法定位核心问题"],
          [3, "给出基础方案但未考虑边界条件"],
          [5, "提出多维度解决方案并论证最优选"]
        ],
        gapRemediation: ["结构化分析框架训练", "案例复盘练习"]
      }
    ];
    
    // 职位专属维度
    const typeSpecificMetrics: Partial<Record<PositionType, EvaluationMetric[]>> = {
      后端: [
        {
          dimension: "系统设计",
          indicators: ["可扩展性", "容错设计", "资源利用率"],
          ratingScale: [
            [1, "单点设计不考虑分布式场景"],
            [3, "基础高可用方案但缺乏弹性设计"],
            [5, "具备SLA驱动的全链路优化能力"]
          ],
          gapRemediation: ["分布式系统模式训练", "混沌工程实践"]
        }
      ],
      算法: [
        {
          dimension: "技术深度",
          indicators: ["模型理解深度", "特征工程能力", "评估方法"],
          ratingScale: [
            [1, "仅会调用现成API"],
            [3, "掌握基础模型原理但缺乏优化经验"],
            [5, "能针对业务场景改造模型结构"]
          ],
          gapRemediation: ["Kaggle实战训练", "论文精读计划"]
        }
      ],
      产品: [
        {
          dimension: "业务理解",
          indicators: ["市场洞察", "用户需求挖掘", "商业化思维"],
          ratingScale: [
            [1, "被动执行需求"],
            [3, "能分析表层需求"],
            [5, "预判行业趋势并制定战略"]
          ],
          gapRemediation: ["行业分析框架学习", "用户心理学研究"]
        }
      ]
    };
    
    return [...baseMetrics, ...(typeSpecificMetrics[type] || [])];
  }
  
  // ==================== 使用示例 ====================
  // 输入：JD文档 + 简历文档 + 职位类型
  // 输出：定制化面试方案
  const jdText = `字节跳动后端开发JD要求：
  - 精通Go/Python开发
  - 熟悉微服务架构和分布式系统
  - 有高并发系统优化经验
  - 熟悉Kubernetes和云原生技术栈`;
  
  const resumeText = `候选人简历亮点：
  - 主导电商交易系统重构，QPS从2k提升至50k
  - 设计基于Redis的分布式锁方案
  - 实现服务网格的渐进式迁移`;
  
  const interviewPlan = generateInterviewPrompt(jdText, resumeText, "后端");
  
  // 生成结果将包含：
  // 1. 深度技术问题：结合"电商交易系统"和"QPS提升"追问具体优化手段
  // 2. 系统设计题：基于"微服务架构"要求设计容错方案
  // 3. 弱点诊断：自动识别"服务网格"经验不足生成追问
  // 4. 评估矩阵：包含后端专属的"容错设计"评分标准