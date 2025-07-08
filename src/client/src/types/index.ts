export interface StreamResponse {
    content?: string;
    error?: string;
    isLastMessage?: boolean;
}

export interface RetrievalResult {
    index: number;
    content: string;
    source: string;
    page: number;
    relevanceScore: number;
}

export interface ChatRequest {
    message: string;
}

export interface SearchResult {
    text?: string;
    entity?: {
        text?: string;
        source?: string;
        page?: number;
    };
    source?: string;
    page?: number;
    score?: number;
    distance?: number;
}

// Tavily 搜索相关类型
export interface TavilySearchRequest {
    query: string;
    maxResults?: number;
    includeAnswer?: boolean;
    includeRawContent?: boolean;
    searchDepth?: 'basic' | 'deep';
    includeDomains?: string[];
    excludeDomains?: string[];
}

export interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
    publishedDate?: string;
}

export interface TavilyResponse {
    query: string;
    answer?: string;
    results: TavilySearchResult[];
    responseTime: number;
}

export interface EnhancedChatRequest extends ChatRequest {
    includeWebSearch?: boolean;
    searchQuery?: string;
    maxSearchResults?: number;
}

// 相关文档类型
export interface RelevantDocument {
    index: number;
    content: string;
    source: string;
    page: number;
    relevanceScore: number;
}

// 检索上下文类型
export interface RetrievalContext {
    documents: RelevantDocument[];
    context: string;
} 

// ==================== 核心数据结构 ====================
export type PositionType = "前端" | "后端" | "算法" | "产品" | "运营" | "测试" | "数据" | "DevOps";
export type EvaluationDimension = "技术深度" | "业务理解" | "系统设计" | "问题解决" | "沟通协作";

export interface InterviewPrompt {
  position: {
    type: PositionType;
    level: "Junior" | "Mid" | "Senior" | "Lead";
    jdKeywords: string[];
  };
  candidate: {
    resumeKeywords: string[];
    projectHighlights: string[];
    skillGaps: string[]; // 根据JD自动识别的技能差距
  };
  interviewPhases: InterviewPhase[];
  evaluationMatrix: EvaluationMetric[];
}

export interface InterviewPhase {
  phase: number;
  name: string;
  objectives: string[];
  questions: QuestionSet[];
}

export interface QuestionSet {
  type: "Technical" | "Behavioral" | "CaseStudy" | "SystemDesign";
  coreQuestion: string;
  dynamicTriggers: {
    onKeyword: string[]; // 简历关键词触发追问
    onConceptGap: string; // 概念盲点触发追问
    onSolutionDepth: number; // 方案深度不足时触发
  };
  evaluationDimensions: EvaluationDimension[];
}

export interface EvaluationMetric {
  dimension: EvaluationDimension;
  indicators: string[];
  ratingScale: [number, string][]; // [分值, 描述]
  gapRemediation: string[]; // 改进建议
}