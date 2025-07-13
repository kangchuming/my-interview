import { useState, useRef, useEffect } from "react"
import { LabASR, LabTTS } from 'byted-ailab-speech-sdk';
import { v4 as uuid } from 'uuid';
import { Settings, MessageSquare, User, Bot, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import useVoiceStore from './store/voiceStore';
import { getToken } from './utils/getToken';
import { smallChat } from './utils/smallchat';
import { getLoopAns } from './utils/getLoopAns';
import { buildFullUrl } from './utils/buildFullUrl';
import type { PositionType } from './types/index';


const greetings = {
  "前端": "您好！我是今天的前端技术面试官，很高兴见到您。我在前端开发领域有8年经验，主要负责React、Vue、Node等技术栈的面试。",
  "后端": "您好！我是今天的后端技术面试官，很高兴见到您。我在后端开发领域有8年经验，主要关注分布式系统、微服务架构等技术。",
  "算法": "您好！我是今天的算法工程师面试官，很高兴见到您。我在机器学习和推荐系统领域有丰富经验。",
  "产品": "您好！我是今天的产品经理面试官，很高兴见到您。我在产品设计和用户体验方面有多年经验。",
  "测试": "您好！我是今天的测试开发面试官，很高兴见到您。我在自动化测试和质量保障方面有丰富经验。",
  "运营": "您好！我是今天的运营面试官，很高兴见到您。我在用户增长和数据分析方面有多年经验。",
  "数据": "您好！我是今天的数据工程师面试官，很高兴见到您。我在大数据处理和数据分析方面有丰富经验。",
  "DevOps": "您好！我是今天的DevOps面试官，很高兴见到您。我在CI/CD和云原生技术方面有多年经验。"
};

export default function OfferGooseChat() {
  const [recordStatus, setRecordStatus] = useState(false);
  const [content, setContent] = useState(""); // 设置语音识别的内容
  const [positionType, setPositionType] = useState('前端');
  const [header, setHeader] = useState(''); // 设置ws连接的提示语
  const recordStopping = useRef(false); // 记录记录停止标志
  const [fullResponse, setFullResponse] = useState({});
  const [openingRemarks, setOpeningRemarks] = useState(""); // 获取开场白
  const [messages, setMessages] = useState([
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
        `${greetings[positionType as keyof typeof greetings]}, 请简单介绍一下你过往工作经历`,
      avatar: "/placeholder.svg?height=40&width=40",
      name: "面试官",
      badge: "AI",
    },
  ])
  const openingRemarksRef = useRef<string>(''); //获取开场白
  const [audioUrl, setAudioUrl] = useState('');
  const [audioAuthorized, setAudioAuthorized] = useState(false); // 音频授权状态
  const [ques, getQues] = useState('');
  // 如有需要，可以缓存音频数据
  const downloadCache = useRef(new Uint8Array(0));
  const isServerError = useRef(false);
  const idRef = useRef(3); // 更新每次id
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
  const questionRef = useRef(useVoiceStore.getState().queContent); // 接收大模型返回的内容

  const textToSpeech = async (text: string) => {
    setAudioUrl('');
    downloadCache.current = new Uint8Array(0);

    // 第1步：配置参数
    const speaker = 'BV001_streaming';        // 选择音色（不同的人声）
    const appid = '6132990956';
    const accessKey = 'W9SXb2UZH5L-2VEZ9w7YgBk7pwoA_ngN'; // 使用正确的TTS Access Key
    const cluster = 'volcano_tts'; // TTS需要cluster参数
    const text_type = 'plain';
    const auth: Record<string, string> = {};

    // 第2步：获取认证
    const token = await getToken(appid, accessKey);
    if (token) {
      auth.api_jwt = token;
    }


    // 第3步：建立连接并合成语音
    const url = 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary';
    const serviceUrl = buildFullUrl(url, auth);

    const audioUrl = LabTTS().start({
      debug: true,
      url: serviceUrl,
      config: {
        app: { appid: appid, token: auth.api_jwt, cluster: cluster },
        user: { uid: 'byted sdk DEMO' },
        audio: {
          encoding: 'mp3',      // 音频格式
          rate: 24000,          // 采样率
          voice_type: speaker,  // 音色
        },
        request: {
          reqid: uuid(),
          text: text,           // 你要转换的文字！！！
          text_type,   // 纯文本
          operation: 'submit',
        },
      },
      onStart: () => {
        isServerError.current = false;
        console.log('开始合成语音...');
      },
      onMessage: (audioBuffer: ArrayBuffer) => {
        // 下载缓存音频二进制包
        const newDownloadCache = new Uint8Array(downloadCache.current.byteLength + audioBuffer.byteLength);
        newDownloadCache.set(downloadCache.current, 0);
        newDownloadCache.set(new Uint8Array(audioBuffer), downloadCache.current.byteLength);
        downloadCache.current = newDownloadCache;
      },
      onError: (err) => {
        console.error('语音合成失败:', err);
      },
      onClose: () => {
        console.log('语音合成完成');
      },
    });

    setAudioUrl(audioUrl);
    return audioUrl; // 返回可播放的音频URL
  };

  // 将AI面试官的回复转成语音
  const speakInterviewerResponse = async (response: string) => {
    try {
      await textToSpeech(response);

      // 等待音频合成完成后播放
      setTimeout(() => {
        if (downloadCache.current.byteLength > 0) {
          const blob = new Blob([downloadCache.current], { type: 'audio/mp3' });
          const blobUrl = URL.createObjectURL(blob);
          const audio = new Audio(blobUrl);

          audio.onended = () => {
            URL.revokeObjectURL(blobUrl); // 清理内存
          };

          audio.play().catch(error => {
            console.error('播放音频失败:', error);
          });

          console.log('正在播放面试官语音...');
        } else {
          console.warn('没有音频数据可播放');
        }
      }, 1500); // 等待1秒确保音频数据接收完成

    } catch (error) {
      console.error('语音合成失败:', error);
    }
  };

  // 开启声音授权并自动播放
  const enableAudioAndPlay = async () => {
    try {
      // 创建一个很短的静音音频来获取播放权限
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      await silentAudio.play();
      setAudioAuthorized(true);
      console.log('音频播放已授权');

      // 授权成功后自动播放第一条面试官消息
      const firstInterviewerMessage = messages.find(msg => msg.type === "interviewer");
      if (firstInterviewerMessage) {
        setTimeout(() => {
          speakInterviewerResponse(firstInterviewerMessage.content);
        }, 500);
      }
    } catch (error) {
      console.error('音频授权失败:', error);
      alert('请允许音频播放权限');
    }
  };

  const conversations = [
    { id: 1, title: "面试官", time: "00:00:33", active: true },
    { id: 2, title: "AI", time: "00:00:12" },
    { id: 3, title: "你", time: "00:00:15" },
    { id: 4, title: "面试官", time: "00:00:12" },
  ]

  const startASR = async () => {
    recordStopping.current = false;
    setHeader('正在连接...');
    setContent('');

    try {
      const appid = '6132990956';
      const accessKey = 'W9SXb2UZH5L-2VEZ9w7YgBk7pwoA_ngN';
      const auth: Record<string, string> = {};

      // 大模型配置
      const token = await getToken(appid, accessKey);
      if (token) {
        auth.api_resource_id = 'volc.bigasr.sauc.duration';
        auth.api_app_key = appid;
        auth.api_access_key = `Jwt; ${token}`;
      }

      const fullUrl = buildFullUrl('wss://openspeech.bytedance.com/api/v3/sauc/bigmodel', auth);
      console.log('连接URL:', fullUrl);

      const params = {
        url: fullUrl,
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

  // 获取开场白
  const getOpeningRemarks = async () => {
    try {
      await smallChat(
        '前端',
        '面试候选人',
        // onContent: 实时接收每个内容片段
        (content: string) => {
          console.log('实时接收内容:', content);
          // 实时更新ref和状态
          openingRemarksRef.current += content;
          setOpeningRemarks(openingRemarksRef.current);
        },
        // onComplete: 流式传输完成
        (fullContent: string) => {
          console.log('开场白获取完成:', fullContent);
          openingRemarksRef.current = fullContent;
          setOpeningRemarks(fullContent);
        },
        // onError: 错误处理
        (error: unknown) => {
          console.error('获取开场白失败:', error);
        }
      );

    } catch (err) {
      console.error('获取开场白失败:', err);
    }
  }

  // 获取面试官的问题
  const getLoopsAnsFn = async (positionType: PositionType, projectKeywords: string[], skillGaps: string[], message: string) => {
    try {
      const res = await getLoopAns(positionType, projectKeywords, skillGaps, message);
      // console.log(111, res);
      setMessages(prevMessages => [...prevMessages, {
        id: idRef.current++,
        type: "interviewer",
        content: res,
        avatar: "/placeholder.svg?height=40&width=40",
        name: "面试官",
        badge: "AI",
      }]);

    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    console.log('页面加载完成，等待用户点击播放语音');
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">O</span>
            </div>
            <span className="font-semibold text-gray-800">网易面试</span>
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
                        <p className="text-gray-800 leading-relaxed mb-3">{msg.content}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => speakInterviewerResponse(msg.content)}
                          className="text-xs"
                        >
                          🔊 播放语音
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {msg.type === "candidate" && (
                  <div className="flex items-end gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={msg.avatar || "/candidate.svg"} />
                      <AvatarFallback>选</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{msg.name}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          {msg.badge}
                        </Badge>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p className="text-gray-800 leading-relaxed mb-3">{msg.content}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => speakInterviewerResponse(msg.content)}
                          className="text-xs"
                        >
                          🔊 播放语音
                        </Button>
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
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请回车提交答案或按麦克风录音"
                  className="pr-12"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // Handle send message
                      setMessages(prevMessages => [...prevMessages, {
                        id: idRef.current++,
                        type: "candidate",
                        content,
                        avatar: "/candidate.svg?height=40&width=40",
                        name: "候选人",
                        badge: "Candidate",
                      }]);
                      // getLoopsAns(positionType as PositionType, {} as InterviewPrompt, {}, content);
                      getLoopsAnsFn(
                        "前端" as PositionType,
                        ['微前端', 'RAG', '全栈'],
                        ["JavaScript基础", "HTML/CSS功底", "浏览器原理", "闭包", "作用域", "内存管理", "React/Vue熟练度", "工程化能力", "性能优化", "前端架构", "组件设计", "状态管理"],
                        content, // 面试消息
                      );
                      setContent("")

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
                <Button variant="outline" size="sm">
                  清空文本
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-black-200" onClick={() => enableAudioAndPlay()}>
                  开启声音
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

