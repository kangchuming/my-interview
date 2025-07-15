import * as pdfjs from 'pdfjs-dist';

// 设置worker路径
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const extractPDFText = async (file: File): Promise<string> => {
  try {
    // 读取文件为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载PDF文档
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // 遍历所有页面
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 提取页面文本
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF解析失败:', error);
    throw new Error('PDF文件解析失败，请检查文件格式');
  }
};