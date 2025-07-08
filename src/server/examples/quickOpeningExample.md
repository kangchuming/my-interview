# 快速开场白使用示例

## 问题分析

原来的面试开场白生成很慢，主要原因：
1. **向量数据库检索**: 每次都要检索相关文档
2. **AI模型生成**: 使用 ChatOpenAI 生成内容
3. **复杂工作流**: LangGraph 的完整流程

## 解决方案

提供两种模式：
- **快速模式**: 预设开场白，无需AI生成，响应时间 < 100ms
- **AI模式**: 个性化生成，响应时间 2-5s

## 使用方法

### 1. 快速开场白 API

```bash
curl -X POST http://localhost:3001/api/interview/quick-opening \
  -H "Content-Type: application/json" \
  -d '{
    "positionType": "后端",
    "candidateName": "张工程师"
  }'
```

**响应示例：**
```json
{
  "success": true,
  "opening": "您好！我是今天的后端技术面试官，很高兴见到您。我在后端开发领域有8年经验，主要关注分布式系统、微服务架构等技术。\n\n今天的面试大概会持续45分钟，我们会从您的项目经验开始聊起，然后深入一些技术细节。整个过程比较轻松，您可以放松一些。\n\n首先，能简单介绍一下您自己吗？重点说说您最近的工作经历和主要负责的项目。",
  "positionType": "后端"
}
```

### 2. 流式快速开场白

```bash
curl -X POST http://localhost:3001/api/hello/stream \
  -H "Content-Type: application/json" \
  -d '{
    "positionType": "后端",
    "quickMode": true
  }'
```

**特点：**
- 模拟打字效果，但速度很快
- 无需AI生成，响应时间极短
- 适合需要快速开始面试的场景

### 3. 不同职位的开场白

#### 前端开发
```
您好！我是今天的前端技术面试官，很高兴见到您。我在前端开发领域有8年经验，主要负责React、Vue等技术栈的面试。

今天的面试大概会持续45分钟，我们会从您的项目经验开始聊起，然后深入一些技术细节。整个过程比较轻松，您可以放松一些。

首先，能简单介绍一下您自己吗？重点说说您最近的工作经历和主要负责的项目。
```

#### 算法工程师
```
您好！我是今天的算法工程师面试官，很高兴见到您。我在机器学习和推荐系统领域有丰富经验。

今天的面试大概会持续45分钟，我们会从您的项目经验开始聊起，然后深入一些技术细节。整个过程比较轻松，您可以放松一些。

首先，能简单介绍一下您自己吗？重点说说您最近的工作经历和主要负责的项目。
```

## 性能对比

| 模式 | 响应时间 | 个性化程度 | 适用场景 |
|------|----------|------------|----------|
| 快速模式 | < 100ms | 低 | 快速开始面试 |
| AI模式 | 2-5s | 高 | 深度定制面试 |

## 前端集成示例

```javascript
// 快速开场白
const getQuickOpening = async (positionType) => {
  const response = await fetch('/api/interview/quick-opening', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionType })
  });
  
  const data = await response.json();
  return data.opening;
};

// 使用示例
const opening = await getQuickOpening('后端');
console.log(opening); // 立即返回开场白
```

## 建议使用场景

**使用快速模式：**
- 演示和测试环境
- 用户希望立即开始面试
- 网络条件不佳的情况
- 标准化面试流程

**使用AI模式：**
- 正式面试场景
- 需要个性化定制
- 有充足时间准备
- 高质量面试要求

这样的设计既保证了用户体验，又提供了灵活性！ 