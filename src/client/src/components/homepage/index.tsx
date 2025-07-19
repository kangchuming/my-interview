import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ChevronDown,
  CheckCircle,
  Users,
  Building,
  Home,
  FileText,
  FolderOpen,
  Zap,
  BarChart3,
  HelpCircle,
} from "lucide-react"

export default function Homepage() {
  const navigate = useNavigate()
  const [selectedPosition, setSelectedPosition] = useState("后端工程师")

  const positions = ["后端工程师", "前端工程师", "产品经理", "数据分析师", "UI/UX设计师", "测试工程师"]

  const handleStartInterview = () => {
    navigate('/interview')
  }

  const handleJobDescription = () => {
    navigate('/job')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🎯</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Interview</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <Home className="w-4 h-4 mr-2" />
                主页
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900" onClick={() => handleJobDescription()}>
                <FileText className="w-4 h-4 mr-2" />
                新建简历
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <FolderOpen className="w-4 h-4 mr-2" />
                简历管理
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <Zap className="w-4 h-4 mr-2" />
                简历优化
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <BarChart3 className="w-4 h-4 mr-2" />
                数据复盘
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <HelpCircle className="w-4 h-4 mr-2" />
                帮助中心
              </Button>
            </nav>

            {/* Search and User */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input placeholder="搜索面试技巧" className="w-40 pr-10" />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1">新用</Badge>
              </div>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url('/placeholder.svg?height=800&width=1200')`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left mb-12 lg:mb-0">
              {/* Top Buttons */}
              <div className="flex justify-center lg:justify-start items-center space-x-4 mb-8">
                <Button className="!bg-blue-600 hover:!bg-blue-700 text-white px-6 py-2 rounded-full">智能面试</Button>
                <div className="relative">
                  <Button variant="outline" className="px-6 py-2 rounded-full bg-transparent">
                    简历分析
                  </Button>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">新</span>
                  </div>
                </div>
              </div>

              {/* Success Badge */}
              <div className="flex justify-center lg:justify-start mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                  已服务50,000+求职者提升面试技能
                </Badge>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                智能<span className="text-blue-600">AI面试</span>训练平台
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-600 mb-8 max-w-2xl">
                基于AI技术的个性化面试训练，提供实时反馈和专业指导，助您在面试中脱颖而出
              </p>

              {/* Position Selector */}
              <div className="flex justify-center lg:justify-start items-center space-x-4 mb-8">
                <span className="text-gray-700">当前岗位:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                      <span>{selectedPosition}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {positions.map((position) => (
                      <DropdownMenuItem key={position} onClick={() => setSelectedPosition(position)}>
                        {position}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col items-center lg:items-start">
                <Button className="!bg-blue-600 hover:!bg-blue-700 text-white px-12 py-4 text-lg rounded-lg mb-2" onClick={() => handleJobDescription()}>
                  开始面试
                </Button>
              </div>
            </div>

            {/* Right Image - Phone Mockup */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-80 h-96 bg-white rounded-3xl shadow-2xl p-6 transform rotate-3">
                  <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 text-sm">AI面试模拟界面</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="relative bg-white/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-3xl font-bold text-blue-600">50,000+</span>
                </div>
                <p className="text-gray-600">成功面试案例</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-3xl font-bold text-blue-600">500,000+</span>
                </div>
                <p className="text-gray-600">模拟面试次数</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Building className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-3xl font-bold text-blue-600">5,000+</span>
                </div>
                <p className="text-gray-600">合作企业数量</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
