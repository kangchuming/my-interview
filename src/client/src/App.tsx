import { useState, useRef, useEffect } from "react"
import { LabASR } from 'byted-ailab-speech-sdk';
import { Settings, MessageSquare, User, Bot, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export default function OfferGooseChat() {
  const [message, setMessage] = useState("");
  const [recordStatus, setRecordStatus] = useState(false);
  const [content, setContent] = useState(""); // 设置语音识别的内容
  const [header, setHeader] = useState(''); // 设置ws连接的提示语
  const recordStopping = useRef(false); // 记录记录停止标志
  const [fullResponse, setFullResponse] = useState({});
  const [asrClient] = useState(
    LabASR({
      onMessage: async (text, fullData) => {
        setContent(text);
        setFullResponse(fullData);
      },
      onStart() {
        setHeader('正在录音');
        setContent('');
      },
      onClose() {
        setHeader('录音结束');
      },
      onError() {
        setHeader('连接异常');
        console.error('ASR连接异常');
      }
    })
  );


  const conversations = [
    { id: 1, title: "面试官", time: "00:00:33", active: true },
    { id: 2, title: "AI", time: "00:00:12" },
    { id: 3, title: "你", time: "00:00:15" },
    { id: 4, title: "面试官", time: "00:00:12" },
  ]

  const messages = [
    {
      id: 1,
      type: "system",
      content: "你应该关注项目经历与JD的匹配度，突出React、性能优化和团队协作经验。",
      icon: "💡",
    },
    {
      id: 2,
      type: "interviewer",
      content:
        "你好！我叫OfferGoose，是阿里公司前端技术高级的。今天我由我来主持你的面试。咱们开始之前，能不能请你简单做个自我介绍，包括你之前的项目经历和技术栈，好吗？",
      avatar: "/placeholder.svg?height=40&width=40",
      name: "面试官",
      badge: "AI",
    },
  ];

  const startASR = async () => {
    recordStopping.current = false;
    setContent('');

    try {
      const params = {
        url: 'ws://localhost:3001/api/asr/ws',
        config: {
          user: {
            uid: 'byted sdk demo',
          },
          audio: {
            format: 'pcm',
            rate: 16000,
            bits: 16,
            channel: 1,
          },
          request: {
            model_name: 'bigmodel',
            show_utterances: true
          }
        }
      };
      asrClient.connect(params);
      await asrClient.startRecord();

      setHeader('正在录音');
      console.log('开始录音');

    } catch (error) {
      console.error('启动录音失败:', error);
      setHeader('连接失败');
    }
  };



  const stopASR = () => {
    if (recordStopping.current) {
      return;
    }
    recordStopping.current = true;

    asrClient.stopRecord();

    setHeader('录音结束');
  };

  // 点击录音按钮后，调用录音开始或录音结束
  const changeRecordStatus = () => {
    if (recordStatus) {
      stopASR();
    } else {
      startASR();
    }
    setRecordStatus(!recordStatus);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">O</span>
            </div>
            <span className="font-semibold text-gray-800">OfferGoose</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">00:00:33</span>
            <Button variant="outline" size="sm">
              面试设置
            </Button>
            <Button variant="destructive" size="sm">
              结束面试
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex pt-16">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "system" && (
                  <div className="flex items-start gap-3 mb-6">
                    <div className="text-2xl">{msg.icon}</div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      {msg.content}
                    </div>
                  </div>
                )}

                {msg.type === "interviewer" && (
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={msg.avatar || "/placeholder.svg"} />
                      <AvatarFallback>面</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{msg.name}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          {msg.badge}
                        </Badge>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p className="text-gray-800 leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="请回车提交答案或按麦克风录音"
                  className="pr-12"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      // Handle send message
                      setMessage("")
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => changeRecordStatus()}
                >
                  {recordStatus ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">好的，好的面试官</span>
                <Button variant="outline" size="sm">
                  清空文本
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  回答完毕
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">对话历史</h3>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`p-3 cursor-pointer transition-colors ${conv.active ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {conv.title === "AI" ? (
                        <Bot className="w-4 h-4 text-green-600" />
                      ) : conv.title === "你" ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">{conv.title}</span>
                    </div>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  {conv.title === "面试官" && conv.active && (
                    <p className="text-xs text-gray-600 mt-1">
                      你好！我叫OfferGoose，是阿里公司前端技术高级的。今天我由我来主持你的面试...
                    </p>
                  )}
                  {conv.title === "AI" && (
                    <p className="text-xs text-gray-600 mt-1">
                      你应该关注项目经历与JD的匹配度，突出React、性能优化和团队协作经验...
                    </p>
                  )}
                  {conv.title === "你" && <p className="text-xs text-gray-600 mt-1">你好面试官，我是张三...</p>}
                </Card>
              ))}
            </div>

            {/* Warning Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-6">
              <div className="flex items-start gap-2">
                <span className="text-orange-500 text-sm">⚠️</span>
                <div className="text-xs text-orange-700">
                  <p className="font-medium mb-1">请确保您的网络，否则无法正常使用对话功能！</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

