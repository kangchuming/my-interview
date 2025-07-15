import type React from "react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Check, Upload } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { extractPDFText } from '@/utils/pdf';
import useJobStore from '@/store/jobStore';

export default function Resume() {
  const navigate = useNavigate(); // 进行路由跳转
  const [resumeText, setResumeText] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateResume } = useJobStore();

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

  const handleFileUpload = async (file: File) => {
    // Handle file upload logic here
    try {
      const res = await extractPDFText(file)
      updateResume(res);
      // 成功提示
      toast.success("解析成功！");
    } catch (err) {
      // 错误提示
      toast.error("解析失败")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    fileInputRef.current?.click()
    handleFileChange(e);
  }


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 返回简历信息页
  const handleRebackJob = () => {
    navigate('/job');
  }

  // 进入Loading页
  const handleEnterEntrance = () => {
    navigate('/entrance');
  }


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
                2
              </div>
              <span className="ml-2 text-green-600 font-medium">选择简历</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-gray-500">准备完成</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">想用哪份简历?</h1>
          <p className="text-gray-600">了解您的求职意向，提高面试AI回答针对性</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center mb-6 transition-colors ${isDragOver ? "border-green-400 bg-green-50" : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">拖拽简历到此处上传</p>
              <button onClick={handleFileSelect} className="text-green-600 hover:text-green-700 underline">
                或点击选择文件上传
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
          </div>

          {/* Text Input Area */}
          <div className="relative mb-6">
            <Textarea
              placeholder="你还可以直接粘贴简历内容到本文档，特别是复制新解析失败的时候。"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full h-64 resize-none"
              maxLength={3000}
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-400">{resumeText.length} / 3000</div>
          </div>

          {/* Resume Type Tags */}
          <div className="flex gap-3 mb-8">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
            >
              自营生简历
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
            >
              智能导入简历
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
            >
              高效专业简历
            </Button>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <Button variant="outline" className="px-8 bg-transparent" onClick={() => handleRebackJob()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            上一步
          </Button>
          <Button className="px-8 !bg-green-500 hover:!bg-green-600" onClick={() => handleEnterEntrance()}>
            <Check className="w-4 h-4 mr-2" />
            下一步
          </Button>
        </div>
      </div>
    </div>
  )
}
