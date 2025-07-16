import type React from "react"
import { ChevronRight, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { extractInfo } from "@/utils/extractInfo";
import useJobStore from "@/store/jobStore";

export default function Entrance() {
  const navigate = useNavigate(); // 进行路由跳转
  const [resumeText, setResumeText] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [countdown, setCountdown] = useState(20)
  const { jobTitle, jobDescription, companyName, companyDescription, resume, updateExtractInfo } = useJobStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = (file: File) => {
    // Handle file upload logic here
    console.log("File uploaded:", file.name)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 返回首页
  const handleHomepage = () => {
    navigate('/');
  }

  // 进入模拟面试
  const handleEnterInterview = () => {
    navigate('/Interview')
  }


  const getExtratingInfo = async () =>{
    try {
      // 修正参数顺序：jobTitle, jobDescription, resume, companyName?, companyDescription?
      const res = await extractInfo(
        jobTitle, 
        jobDescription, 
        resume, 
        companyName, 
        companyDescription,
      );
      
      const parseInfo = JSON.parse(res);
      updateExtractInfo(parseInfo);
      
    } catch (err) {
      console.error('提取信息错误:', err);
    }
  }

  useEffect(() => {
    // 只有当所有必需的参数都存在时才调用
    if (jobTitle && jobDescription && resume) {
      getExtratingInfo();
    }
  }, []); // 保持空依赖数组，只在组件首次加载时执行一次

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div className="w-screen min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-green-600 font-medium">填写简历信息</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-green-600 font-medium">选择简历</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-green-600 font-medium">准备完成</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center">
          {/* Interview Preview */}
          <div className="w-full max-w-3xl mb-8">
            <div className="bg-green-600 rounded-lg p-8 flex justify-center">
              <div className="relative">
                {/* Mock Interview Interface Preview */}
                <div className="bg-white rounded-lg shadow-lg p-6 w-96 h-64 relative overflow-hidden">
                  {/* Simulated chat interface */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                        <p className="text-sm text-gray-800">请简单介绍一下你自己</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="bg-green-500 text-white rounded-lg p-3 max-w-xs">
                        <p className="text-sm">我是一名有3年经验的前端工程师...</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-300 rounded-full flex-shrink-0"></div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                        <p className="text-sm text-gray-800">你最大的优势是什么？</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Text */}
          <div className="text-center mb-8 max-w-2xl">
            <p className="text-lg text-gray-800 leading-relaxed">
              模拟面试助你了解行业热点问题,正式面试更进一步。付费解锁AI提词功能
              <br />
              让你在关键时刻脱颖而出,赢得心仪offer
            </p>
          </div>

          {/* Loading Indicator */}
          <div className="flex justify-center mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>

          {/* Loading Text */}
          <div className="text-center mb-12">
            <p className="text-gray-600">正在生成个性化模拟面试题目中，请稍后... {countdown}s</p>
          </div>
        </div>

        {/* Bottom Link */}
        <div className="flex justify-center gap-4 mt-12">
          <Button variant="ghost" className="text-gray-500 hover:text-gray-700 bg-transparent" onClick={() => handleHomepage()}>
            返回首页
          </Button>
          <Button variant="ghost" className="text-gray-500 hover:text-gray-700 !bg-green-500 hover:!bg-green-600" onClick={() => handleEnterInterview()}>
            进入面试
          </Button>
        </div>
      </div>
    </div>
  )
}

