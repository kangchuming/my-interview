import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import useJobStore from "@/store/jobStore"
import { jobPositions } from '@/utils/jobPositions';

export default function Component() {
    const navigate = useNavigate(); // 进行路由跳转
    const [selectedPosition, setSelectedPosition] = useState("你的岗位")
    const { jobTitle, jobDescription, companyName, companyDescription, updateJobTitle, updateJobDescription, updateCompanyName, updateCompanyDescription } = useJobStore();

    // 返回首页
    const handleHomepage = () => {
        navigate('/')
    }

    // 进入简历页面
    const handleEnterResume = () => {
        navigate('/resume');
    }

    // 点击左方岗位，填充右方岗位名称和描述
    const handleJobInsert = (item: {name: string, description: string}) => {
        setSelectedPosition(item.name);
        updateJobTitle(item.name);
        updateJobDescription(item.description);
    }
    return (
        <div className="w-screen min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex gap-8">
                    {/* Left Side - Job Positions */}
                    <div className="w-64 mt-50">
                        <Button
                            className="w-full mb-4 !bg-green-500 hover:!bg-green-600 text-white"
                            onClick={() => setSelectedPosition("你的岗位")}
                        >
                            {selectedPosition}
                        </Button>
                        <div className="space-y-2">
                            {jobPositions.map((item, index)  => (
                                <Button
                                    key={index}
                                    variant="ghost"
                                    className="w-full justify-start text-gray-700 hover:bg-gray-100"
                                    onClick={() => handleJobInsert(item)}
                                >
                                    {item.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 space-y-6">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-end mb-12">
                            <div className="flex items-center space-x-8">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-green-600 font-medium">填写简历信息</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                <div className="flex items-center">
                                    <div className="w-8 h-8 text-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                        2
                                    </div>
                                    <span className="ml-2 text-gray-500 font-medium">选择简历</span>
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
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">准备面试什么岗位呢?</h1>
                            <p className=" text-gray-600">了解您的求职意向，提高面试回答针对性</p>
                        </div>
                        {/* Job Title Input */}
                        <div>
                            <Input
                                placeholder="请输入岗位名称"
                                value={jobTitle}
                                onChange={(e) => updateJobTitle(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Job Description */}
                        <div className="relative">
                            <Textarea
                                placeholder="请输入岗位描述，AI会根据您的岗位要求，工作职责，生成面试问题，观察解决问题流程，AI生成面试问答。"
                                value={jobDescription}
                                onChange={(e) => updateJobDescription(e.target.value)}
                                className="w-full h-32 resize-none"
                                maxLength={2000}
                            />
                            <div className="absolute bottom-2 right-2 text-sm text-gray-400">{(jobDescription || '').length} / 2000</div>
                        </div>

                        {/* Company Name Input */}
                        <div>
                            <Input
                                placeholder="可选请输入公司名称"
                                value={companyName}
                                onChange={(e) => updateCompanyName(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Company Description */}
                        <div className="relative">
                            <Textarea
                                placeholder="可选请输入公司简介，当面试官询问及公司业务相关时，AI会根据描述，生成恰当的回答。"
                                value={companyDescription}
                                onChange={(e) => updateCompanyDescription(e.target.value)}
                                className="w-full h-32 resize-none"
                                maxLength={2000}
                            />
                            <div className="absolute bottom-2 right-2 text-sm text-gray-400">{(companyDescription || '').length} / 2000</div>
                        </div>

                        {/* Bottom Buttons */}
                        <div className="flex justify-center gap-4 mt-12">
                            <Button variant="outline" className="px-8 bg-transparent" onClick={() => handleHomepage()}>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                返回首页
                            </Button>
                            <Button className="px-8 !bg-green-500 hover:!bg-green-600" onClick={() => handleEnterResume()}>
                                <Check className="w-4 h-4 mr-2" />
                                下一步
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
