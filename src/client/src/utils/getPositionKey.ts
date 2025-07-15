export const getPositionKey = (jobTitle: string) => {
    const title = jobTitle.toLowerCase();
    
    // 前端相关
    if (title.includes('前端') || title.includes('frontend') || 
        title.includes('react') || title.includes('vue') || 
        title.includes('angular') || title.includes('web开发') ||
        title.includes('ui开发') || title.includes('h5开发')) {
      return '前端';
    }
    
    // 后端相关
    if (title.includes('后端') || title.includes('backend') || 
        title.includes('java') || title.includes('python') || 
        title.includes('node') || title.includes('go') || 
        title.includes('php') || title.includes('c++') ||
        title.includes('服务端') || title.includes('server')) {
      return '后端';
    }
    
    // 算法相关
    if (title.includes('算法') || title.includes('机器学习') || 
        title.includes('深度学习') || title.includes('ai') || 
        title.includes('人工智能') || title.includes('nlp') ||
        title.includes('推荐系统') || title.includes('cv') ||
        title.includes('计算机视觉')) {
      return '算法';
    }
    
    // 产品相关
    if (title.includes('产品') || title.includes('product') || 
        title.includes('pm') || title.includes('产品经理') ||
        title.includes('用户体验') || title.includes('ux')) {
      return '产品';
    }
    
    // 测试相关
    if (title.includes('测试') || title.includes('test') || 
        title.includes('qa') || title.includes('质量') ||
        title.includes('自动化测试') || title.includes('性能测试')) {
      return '测试';
    }
    
    // 运营相关
    if (title.includes('运营') || title.includes('operation') || 
        title.includes('市场') || title.includes('营销') ||
        title.includes('增长') || title.includes('用户运营') ||
        title.includes('内容运营') || title.includes('数据运营')) {
      return '运营';
    }
    
    // 数据相关
    if (title.includes('数据') || title.includes('data') || 
        title.includes('分析师') || title.includes('bi') ||
        title.includes('大数据') || title.includes('数仓') ||
        title.includes('etl') || title.includes('hadoop') ||
        title.includes('spark')) {
      return '数据';
    }
    
    // DevOps相关
    if (title.includes('devops') || title.includes('运维') || 
        title.includes('sre') || title.includes('docker') ||
        title.includes('kubernetes') || title.includes('k8s') ||
        title.includes('云原生') || title.includes('基础设施') ||
        title.includes('部署') || title.includes('cicd')) {
      return 'DevOps';
    }
    
    // 默认返回前端
    return '前端';
  }