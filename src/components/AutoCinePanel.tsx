import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Settings, Image as ImageIcon, Film, FileText, CheckCircle, Loader,
  Terminal, ChevronRight, ChevronDown, AlertCircle, Maximize, Monitor,
  Smartphone, Square, Users, User, Map, Layers, Plus, Upload, X, Eye,
  Video, Anchor, ArrowRight, RotateCcw, Link as LinkIcon, RefreshCw,
  Camera, Clapperboard, Download, Copy, Check, Sparkles, Wand2, Paintbrush,
  Cpu, MousePointerClick, ListTodo, Tag, LayoutGrid, Zap, AlertTriangle, Grid3X3, Bug, Trash2, Edit3
} from 'lucide-react';

export const AutoCinePanel: React.FC = () => {
  // --- State Management ---
  const [topic, setTopic] = useState("");
  const [poeApiKey, setPoeApiKey] = useState("dLxfBB6sLW5BDdKw0N3smMiHkIw67JEMLlXVwzYrmrI");

  // Video Settings
  const [enableVideo, setEnableVideo] = useState(true);
  const [videoModel, setVideoModel] = useState("sora-2");
  const [videoResolution, setVideoResolution] = useState("1280x720");
  const [videoDuration, setVideoDuration] = useState("8s");

  // Custom Assets
  const [customAssets, setCustomAssets] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyboardInputRef = useRef<HTMLInputElement>(null);

  const [isStitching, setIsStitching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const [showDebug, setShowDebug] = useState(false);

  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [scriptData, setScriptData] = useState<any>(null);
  const [storyboardUrl, setStoryboardUrl] = useState<string | null>(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  // Prompt Editing State
  const [soraPrompt, setSoraPrompt] = useState("");
  const [storyboardPrompt, setStoryboardPrompt] = useState("");

  const [lastNanoRequest, setLastNanoRequest] = useState<any>(null);
  const [lastSoraRequest, setLastSoraRequest] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- Helper Functions ---
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${timestamp}] ${String(message)}`, ...prev]);
  };

  useEffect(() => {
    if (currentStep >= 2) {
      setIsScriptExpanded(false);
    }
  }, [currentStep]);

  // Auto-fill edit boxes
  useEffect(() => {
    if (scriptData) {
        // 1. Fill Video Prompt (Sora)
        if (scriptData.sora_prompt) {
            setSoraPrompt(scriptData.sora_prompt);
        } else if (scriptData.summary) {
            setSoraPrompt(scriptData.summary);
        } else if (scriptData.summary === "") {
            setSoraPrompt("Generate a cinematic video based strictly on the provided storyboard image. Maintain consistency with the visual style. High quality, 8k resolution.");
        }

        // 2. Fill Drawing Prompt (Nano)
        if (!storyboardPrompt) {
            let baseSbPrompt = scriptData.storyboard_prompt;
            if (!baseSbPrompt) {
                 if (!scriptData.summary && !scriptData.sora_prompt) {
                     baseSbPrompt = "Cinematic storyboard from uploaded images, 3x3 grid layout.";
                 } else {
                     const context = scriptData.summary || topic;
                     baseSbPrompt = `Create a 3x3 grid storyboard about: ${context}.`;
                     if (customAssets.length > 0) {
                         baseSbPrompt += " Use the provided reference images.";
                     }
                 }
            }
            setStoryboardPrompt(baseSbPrompt);
        }
    }
  }, [scriptData]);

  // --- API Functions ---
  const callPoeGPT = async (messages: any[], model = "gpt-5", jsonMode = false) => {
    if (!poeApiKey) {
        addLog("⚠️ 未检测到 Key，使用模拟数据");
        return null;
    }

    let finalMessages = messages;
    let finalJsonMode = jsonMode;

    if (model === "gpt-5") {
        const systemMsg = messages.find(m => m.role === "system");
        const userMsg = messages.find(m => m.role === "user");

        if (systemMsg && userMsg) {
            // Check if user content is array (multimodal) or string
            const userContentStr = Array.isArray(userMsg.content)
                ? userMsg.content.find((c: any) => c.type === 'text')?.text || ""
                : userMsg.content;

            // Reconstruct user message preserving images if any
            const newContent = Array.isArray(userMsg.content)
                ? [
                    { type: "text", text: `[Instruction]\n${systemMsg.content}\n\n[User Input]\n${userContentStr}` },
                    ...userMsg.content.filter((c: any) => c.type === 'image_url')
                  ]
                : `[Instruction]\n${systemMsg.content}\n\n[User Input]\n${userMsg.content}`;

            finalMessages = [{
                role: "user",
                content: newContent
            }];
        }
        finalJsonMode = false;
    }

    try {
      const response = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${poeApiKey}` },
        body: JSON.stringify({
            model,
            messages: finalMessages,
            response_format: finalJsonMode ? { type: "json_object" } : undefined,
            ...(model === "gpt-5" ? { reasoning_effort: "medium" } : {})
        })
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Status ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      addLog(`⚠️ GPT调用失败 (${error.message})，切换至模拟模式`);
      return null;
    }
  };

  const callNanoBananaForStoryboard = async (promptText: string, assets: any[] = []) => {
    const MOCK_STORYBOARD = "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop";

    if (!poeApiKey) {
        await new Promise(r => setTimeout(r, 1500));
        return MOCK_STORYBOARD;
    }

    try {
      let messageContent: any[] = [{ type: "text", text: promptText }];
      if (assets.length > 0) {
          assets.forEach(asset => {
              messageContent.push({ type: "image_url", image_url: { url: asset.url } });
          });
      }

      const requestPayload = {
          model: "nano-banana-pro",
          messages: [{ role: "user", content: messageContent }],
          "aspect_ratio": "16:9",
          "image_only": true,
          "image_size": "1K"
      };

      setLastNanoRequest({
          endpoint: "nano-banana-pro",
          prompt: promptText,
          hasReferences: assets.length > 0,
          fullPayload: requestPayload
      });

      const response = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${poeApiKey}` },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Status ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const content = data.choices[0].message.content;
      const match = content.match(/!\[.*?\]\((.*?)\)/) || content.match(/https?:\/\/[^\s)]+/);
      return match ? match[1] || match[0] : MOCK_STORYBOARD;
    } catch (error: any) {
      addLog(`⚠️ 绘图API失败: ${error.message}，使用演示图片`);
      await new Promise(r => setTimeout(r, 1000));
      return MOCK_STORYBOARD;
    }
  };

  const callVideoGeneration = async (userPrompt: string, startImageUrl: string | null) => {
    const MOCK_VIDEO = "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4";

    if (!poeApiKey) {
        await new Promise(r => setTimeout(r, 3000));
        return MOCK_VIDEO;
    }

    const durationValue = videoDuration.replace("s", "");
    const finalPrompt = userPrompt;

    const messageContent = startImageUrl
        ? [{ type: "text", text: finalPrompt }, { type: "image_url", image_url: { url: startImageUrl } }]
        : finalPrompt;

    const requestPayload = {
        model: videoModel,
        messages: [{ role: "user", content: messageContent }],
        "size": videoResolution,
        "duration": durationValue
    };

    setLastSoraRequest({
        endpoint: videoModel,
        prompt: finalPrompt,
        fullPayload: requestPayload
    });

    const executeRequest = async () => {
        const response = await fetch("https://api.poe.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${poeApiKey}` },
            body: JSON.stringify(requestPayload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices[0].message.content;
        const match = content.match(/https?:\/\/[^\s)]+\.mp4/) || content.match(/https?:\/\/[^\s)]+/);
        const mdMatch = content.match(/\((https?:\/\/.*?)\)/);
        return match ? match[0] : (mdMatch ? mdMatch[1] : MOCK_VIDEO);
    };

    try { return await executeRequest(); }
    catch (error: any) {
        addLog(`⚠️ 视频API失败: ${error.message}，使用演示视频`);
        await new Promise(r => setTimeout(r, 2000));
        return MOCK_VIDEO;
    }
  };

  const stitchImages = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return null;
    setIsStitching(true);
    addLog(`🧩 正在智能拼接 ${fileList.length} 张图片...`);
    const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
    try {
        const images = await Promise.all(Array.from(fileList).map(loadImage));
        const count = images.length;
        let cols = Math.ceil(Math.sqrt(count));
        let rows = Math.ceil(count / cols);
        if (count === 4) { cols = 2; rows = 2; }
        else if (count === 6) { cols = 3; rows = 2; }
        else if (count === 9) { cols = 3; rows = 3; }
        const baseWidth = images[0].width;
        const baseHeight = images[0].height;
        const canvas = document.createElement('canvas');
        canvas.width = baseWidth * cols;
        canvas.height = baseHeight * rows;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        images.forEach((img, i) => {
            const x = (i % cols) * baseWidth;
            const y = Math.floor(i / cols) * baseHeight;
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, baseWidth, baseHeight);
        });
        const stitchedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        addLog(`✅ 拼图完成 (${cols}x${rows})`);
        setIsStitching(false);
        return stitchedDataUrl;
    } catch (e: any) {
        addLog(`❌ 拼图失败: ${e.message}`);
        setIsStitching(false);
        return null;
    }
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length === 0) return;
      const readers = files.map(file => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ file, base64: reader.result });
          reader.readAsDataURL(file);
      }));
      Promise.all(readers).then((results: any) => {
          results.forEach((res: any, index: number) => {
              const newAsset = { id: `custom_${Date.now()}_${index}`, type: 'character', name: res.file.name.split('.')[0].slice(0, 10), url: res.base64, desc: "Reference", isAnalyzing: false };
              setCustomAssets(prev => [...prev, newAsset]);
          });
          addLog(`📄 批量添加 ${files.length} 张图片`);
      });
  };

  const handleStoryboardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFinalVideoUrl(null);
    setCurrentStep(2);
    if (files.length === 1) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setStoryboardUrl(reader.result as string);
            addLog(`📤 已上传分镜图`);
        };
        reader.readAsDataURL(files[0]);
    } else {
        const stitchedUrl = await stitchImages(files);
        if (stitchedUrl) setStoryboardUrl(stitchedUrl);
    }

    if (!scriptData) {
        const summaryText = topic ? topic : "";
        const fakeScript = { summary: summaryText, scenes: [] };
        setScriptData(fakeScript);
    }
    e.target.value = '';
  };

  const generateScriptWithAssets = async () => {
    let assetContext = "";
    const imageMessages = [];

    // --- 1. 资产映射逻辑：为图片编号，方便 Prompt 引用 ---
    if (customAssets.length > 0) {
        assetContext = "【重要】用户提供了以下参考图 (Reference Images)。请务必根据用户指令中的\"图1\"、\"图2\"等称呼进行严格的视觉绑定：\n";
        customAssets.forEach((asset, index) => {
            // 这里将 Image N 和文件名关联，让 GPT 知道 "图N" 是谁
            assetContext += `- 图${index + 1} (Image ${index + 1}) / Asset Name: "${asset.name}"\n`;
            // 构建用于 GPT 的图片消息对象
            imageMessages.push({ type: "image_url", image_url: { url: asset.url } });
        });
    } else {
        assetContext = "No reference images provided.\n";
    }

    // --- 2. 新的 Sora 2 智能体 Prompt (防加戏版) ---
    const systemPromptText = `
    # 角色
    你是一个专业的 Sora 2 视频提示词生成智能体，能够根据用户输入的故事大纲，生成完整的适合 Sora 2 生成 10-15 秒视频的提示词。
    ${assetContext}

    # 技能 (优先级从高到低)
    1. 【最高优先级】精确执行用户分镜：
       - **检测：** 如果用户输入中包含具体的分镜描述（如\"1.空镜... 2.特写...\"或具体的镜头列表），这说明用户已有成熟剧本。
       - **执行：** 此时你必须 **完全停止** 任何\"辅助生成\"或\"剧情补充\"。你的唯一任务是将用户的每一条描述准确地转化为 Sora 提示词格式。
       - **逻辑绑定：** 重点理解用户口中的\"图1\"、\"图2\"与上方参考图的对应关系。例如用户说\"图2坐在副驾\"，你必须在提示词中明确描述 Image 2 的特征出现在副驾位置。
       - **禁止：** 严禁修改用户设定的环境、动作或添加用户未提到的情节。

    2. 辅助生成视频提示词 (仅当用户未提供具体分镜时)：
       - 只有当用户输入非常简略（如只是一句话大纲）时，才启用此技能。
       - 此时你可以自动补全风格、色调、角色细节等。

    # 输出要求 (JSON Format)
    请务必仅输出一个标准的 JSON 对象，包含以下字段：
    1. \"title\": 视频标题
    2. \"summary\": 简短的故事梗概 (用于UI显示)
    3. \"storyboard_prompt\":
       - 如果用户提供了分镜列表，请将这些分镜翻译为英文，作为绘图提示词。
       - 绘图模型通常生成 3x3 (9格) 图片。如果用户提供了超过 9 个镜头（如 12 个），请精选最关键的 9 个画面组合成 Prompt，或者描述为一个连续的序列。
    4. \"sora_prompt\": 严格按照以下格式生成的完整 Sora 2 提示词内容（不要使用 Markdown 表格，使用纯文本换行）：
       \"风格\"：[具体风格]
       \"色调\"：[色调描述]
       \"BGM 与音效\"：[详细描述]
       \"基础设定与场景\"：\"场景\"：[描述]
       \"角色 1\"：[详细信息]
       \"角色 2\"：[详细信息]
       \"镜头与故事顺序\"：\"开场广角镜头\"：[描述]...（此处包含所有镜头、台词、动作、特效的详细描述）

    # 限制
    1. 只根据用户输入生成与 Sora 2 视频提示词相关的内容。
    2. 输出内容必须是合法的 JSON 格式。
    `;

    // 构建多模态 User 消息内容
    const userContent: any[] = [
        { type: "text", text: `[Instruction]\n${systemPromptText}\n\n[User Input]\n故事大纲/分镜描述: ${topic}` },
        ...imageMessages // 将所有图片作为消息的一部分
    ];

    addLog("🧠 正在规划剧本 (智能体模式: 严格遵循用户分镜)...");

    // 调用 GPT，直接传递包含图片和文本的 userContent
    const content = await callPoeGPT([{ role: "user", content: userContent }], "gpt-5", true);

    try {
        // 增强的 JSON 提取逻辑
        const jsonMatch = content?.match(/```json([\s\S]*?)```/) || content?.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        return JSON.parse(jsonString.trim());
    } catch (e) {
        console.error("JSON Parse Error:", e, content);
        return null;
    }
  };

  const handleSmartGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);

    let currentScript = scriptData;
    let currentStoryboard = storyboardUrl;

    if (currentScript && currentScript.summary !== topic && !(currentScript.summary === "" && topic !== "")) {
        addLog("🔄 检测到新主题，正在重新规划...");
        currentScript = null;
        currentStoryboard = null;
        setScriptData(null);
        setStoryboardUrl(null);
        setFinalVideoUrl(null);
        setSoraPrompt("");
    }

    if (!currentScript) {
        setLogs([]);
        setCurrentStep(1);

        currentScript = await generateScriptWithAssets();

        if (!currentScript) {
            await new Promise(r => setTimeout(r, 800));

            const hasRefs = customAssets.length > 0;
            const assetNames = customAssets.map(a => a.name).join(", ");

            let fallbackSbPrompt = `Create a 3x3 grid storyboard about: ${topic}.`;
            if (hasRefs) {
                fallbackSbPrompt += ` Use reference characters: ${assetNames}. Match reference style exactly.`;
            }

            currentScript = {
                title: "智能生成剧本 (模拟)",
                summary: topic,
                sora_prompt: topic, // Fallback
                storyboard_prompt: fallbackSbPrompt,
                scenes: []
            };
            addLog("⚡ 剧本已就绪 (本地智能模式)");
        }
        setScriptData(currentScript);
    } else {
        addLog("✅ 复用现有剧本...");
    }

    if (!currentStoryboard) {
        setCurrentStep(2);
        addLog("🎨 正在绘制九宫格关键帧...");

        const promptToUse = storyboardPrompt || currentScript.storyboard_prompt;

        const sbUrl = await callNanoBananaForStoryboard(promptToUse, customAssets);

        if (sbUrl) {
            setStoryboardUrl(sbUrl);
            currentStoryboard = sbUrl;
            addLog("✅ 九宫格生成完毕");
        } else {
            addLog("❌ 绘制失败，请重试");
            setIsGenerating(false);
            return;
        }
    } else {
        addLog("✅ 复用现有分镜...");
    }

    if (enableVideo) {
        setCurrentStep(3);
        // 优先使用智能体生成的 sora_prompt
        const promptToUse = soraPrompt || currentScript.sora_prompt || currentScript.summary || "Generate video";

        addLog(`🎥 正在召唤 ${videoModel} 生成 ${videoDuration} 视频...`);
        const vidUrl = await callVideoGeneration(promptToUse, currentStoryboard);

        if (vidUrl) {
            setFinalVideoUrl(vidUrl);
            addLog("✅ 视频生成成功！");
        } else {
            addLog("❌ 视频生成失败");
        }
    } else {
        addLog("⏸️ 已暂停：等待手动生成视频");
    }

    setIsGenerating(false);
  };

  const handleReset = () => {
      setTopic("");
      setScriptData(null);
      setStoryboardUrl(null);
      setFinalVideoUrl(null);
      setSoraPrompt("");
      setStoryboardPrompt("");
      setLogs([]);
      setCurrentStep(0);
      addLog("🧹 状态已清空，可以开始新创作");
  };

  const handleRegenerateStoryboard = async () => {
      if (!storyboardPrompt || isGenerating) return;
      setIsGenerating(true);
      setCurrentStep(2);
      setFinalVideoUrl(null);
      addLog("🎨 正在重新绘制九宫格...");
      const sbUrl = await callNanoBananaForStoryboard(storyboardPrompt, customAssets);
      if (sbUrl) { setStoryboardUrl(sbUrl); addLog("✅ 重绘完成"); }
      setIsGenerating(false);
  };

  const handleGenerateVideo = async () => {
      if (!storyboardUrl || isGenerating) return;
      setIsGenerating(true);
      setCurrentStep(3);
      addLog(`🎥 正在生成 ${videoDuration} 视频...`);
      const vidUrl = await callVideoGeneration(soraPrompt, storyboardUrl);
      if (vidUrl) { setFinalVideoUrl(vidUrl); addLog("✅ 生成成功"); }
      setIsGenerating(false);
  };

  const downloadFile = (url: string, name: string) => {
      const link = document.createElement('a'); link.href = url; link.download = name; link.target = '_blank';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-purple-500/30">
      <header className="h-14 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            AutoCine <span className="text-zinc-600 text-xs font-medium ml-1">Pro Flow</span>
          </h1>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowDebug(!showDebug)} className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${showDebug ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                <Bug className="w-3 h-3" /> Debug
            </button>
            <button className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300">Docs</button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        <aside className="w-80 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col">
            <div className="flex p-2 gap-1 border-b border-zinc-800">
                <button onClick={() => setActiveTab('create')} className={`flex-1 py-2 text-xs font-medium rounded-md ${activeTab === 'create' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'}`}>配置</button>
                <button onClick={() => setActiveTab('assets')} className={`flex-1 py-2 text-xs font-medium rounded-md ${activeTab === 'assets' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'}`}>参考图 ({customAssets.length})</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
                {activeTab === 'create' ? (
                    <>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-zinc-400">Poe API Key</label>
                            <input type="password" value={poeApiKey || ""} onChange={(e) => setPoeApiKey(e.target.value)} placeholder="sk-..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-400">自动生成视频</label>
                                <div onClick={() => setEnableVideo(!enableVideo)} className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${enableVideo ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${enableVideo ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            {enableVideo && (
                                <div className="space-y-2">
                                    <div className="flex flex-col bg-zinc-900 p-2 rounded border border-zinc-800">
                                        <label className="text-[10px] text-zinc-500 font-mono mb-1">Duration</label>
                                        <select value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} className="w-full bg-zinc-800 border-none rounded text-[10px] text-zinc-300 py-1 px-1">
                                            <option value="4s">4s (标准)</option>
                                            <option value="8s">8s (中长)</option>
                                            <option value="12s">12s (极长)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-purple-400 transition-colors">
                            <Plus className="w-5 h-5" /><span className="text-xs font-medium">批量上传参考图</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleBatchUpload} />
                        <div className="space-y-2">
                            {customAssets.map((asset) => (
                                <div key={asset.id} className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 flex gap-3 relative">
                                    <div className="w-12 h-12 rounded bg-black shrink-0"><img src={asset.url} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-zinc-300 truncate">{asset.name}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setCustomAssets(prev => prev.filter(a => a.id !== asset.id))} className="absolute top-1 right-1 text-zinc-500 hover:text-red-400"><X className="w-3 h-3"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="h-40 border-t border-zinc-800 bg-[#09090b] p-3 overflow-y-auto font-mono text-[10px] space-y-1">
                {logs.map((log, i) => <div key={i} className="text-zinc-400 truncate">{String(log)}</div>)}
            </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#0f0f11] overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-700 pb-40">
                {scriptData && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsScriptExpanded(!isScriptExpanded)}>
                            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" /> AI 剧本</h2>
                            {isScriptExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500"/> : <ChevronRight className="w-4 h-4 text-zinc-500"/>}
                        </div>
                        {isScriptExpanded && (
                            <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-lg text-sm text-zinc-400 italic">
                                {scriptData.summary ? (
                                    <span>"{scriptData.summary}"</span>
                                ) : (
                                    <span className="text-zinc-500 not-italic flex items-center gap-2"><ImageIcon className="w-4 h-4"/> 已进入「纯图片模式」，视频将完全基于画面生成。</span>
                                )}
                                {scriptData.summary === topic && scriptData.summary !== "" && <span className="ml-2 text-[10px] text-purple-400 bg-purple-900/30 px-1 rounded">(用户自定义模式)</span>}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-blue-500" /> 九宫格分镜</h2>
                            <div className="flex gap-2">
                                {storyboardUrl ? (
                                    <>
                                        <button onClick={handleRegenerateStoryboard} disabled={isGenerating} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white flex items-center gap-1"><RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`}/> 重绘</button>
                                        <button onClick={() => storyboardInputRef.current?.click()} disabled={isGenerating} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white flex items-center gap-1"><Upload className="w-3 h-3"/> 替换</button>
                                        <button onClick={() => storyboardUrl && downloadFile(storyboardUrl, 'storyboard.png')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white"><Download className="w-3 h-3"/></button>
                                    </>
                                ) : (
                                    <button onClick={() => storyboardInputRef.current?.click()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center gap-1"><Grid3X3 className="w-3 h-3"/> 上传/拼图</button>
                                )}
                                <input type="file" ref={storyboardInputRef} className="hidden" accept="image/*" multiple onChange={handleStoryboardUpload} />
                            </div>
                        </div>
                        <div className="aspect-video bg-[#18181b] rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                            {isStitching ? <div className="text-center"><Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2"/><p className="text-xs text-zinc-500">拼图中...</p></div> :
                             storyboardUrl ? <img src={storyboardUrl} className="w-full h-full object-contain" /> :
                             <div className="text-center"><ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2"/><p className="text-xs text-zinc-500">等待生成...</p></div>}
                        </div>

                        {(storyboardUrl || currentStep === 2) && (
                            <div className="w-full mt-2">
                                <div className="flex items-center gap-2 mb-1 text-xs text-zinc-500"><Edit3 className="w-3 h-3" /><span>绘图提示词 (Storyboard Prompt)</span></div>
                                <textarea className="w-full h-16 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-400 resize-none focus:border-blue-500 focus:text-zinc-200" value={storyboardPrompt} onChange={(e) => setStoryboardPrompt(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2"><Clapperboard className="w-5 h-5 text-pink-500" /> 最终成片 ({videoDuration})</h2>
                            <div className="flex gap-2">
                                {storyboardUrl && (
                                    <button onClick={handleGenerateVideo} disabled={isGenerating} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ${finalVideoUrl ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-pink-600 hover:bg-pink-500 text-white'}`}>
                                        {isGenerating && currentStep === 3 ? <Loader className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3 fill-current"/>}
                                        {finalVideoUrl ? "重生成" : "生成视频"}
                                    </button>
                                )}
                                {finalVideoUrl && <button onClick={() => downloadFile(finalVideoUrl, 'video.mp4')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white"><Download className="w-3 h-3"/></button>}
                            </div>
                        </div>
                        <div className="aspect-video bg-[#18181b] rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                            {finalVideoUrl ? (
                                <div className="w-full h-full relative">
                                    <video src={finalVideoUrl} className="w-full h-full object-cover" controls autoPlay loop />
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] font-medium text-white">Sora-2 · {videoDuration}</div>
                                </div>
                            ) : (
                                <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                                    {isGenerating && currentStep === 3 ? <Loader className="w-8 h-8 text-pink-500 animate-spin mb-2"/> :
                                     <div className="w-full">
                                        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400"><Settings className="w-3 h-3" /><span>视频生成指令 (Sora-2 Prompt)</span></div>
                                        <textarea className="w-full h-24 bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-zinc-300 resize-none focus:border-pink-500" placeholder="等待剧本..." value={soraPrompt} onChange={(e) => setSoraPrompt(e.target.value)} />
                                     </div>
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-zinc-800 bg-[#09090b] p-6">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative flex bg-zinc-900 rounded-xl border border-zinc-700/50 p-2 items-end shadow-2xl gap-2">
                        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="输入故事主题..." className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-500 p-3 outline-none resize-none h-14 max-h-32" />
                        <button onClick={handleReset} className="mb-1 p-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" title="重置/新建"><Trash2 className="w-4 h-4"/></button>
                        <button onClick={handleSmartGenerate} disabled={isGenerating || isStitching} className={`mb-1 mr-1 px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isGenerating ? 'bg-zinc-800 text-zinc-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'}`}>
                            {isGenerating ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 fill-current"/>}
                            {scriptData && storyboardUrl ? "直接生成视频" : scriptData ? "生成分镜" : "启动全流程"}
                        </button>
                    </div>
                </div>
            </div>

            {showDebug && (
                <div className="fixed bottom-0 left-0 right-0 h-64 bg-black/95 border-t border-zinc-800 p-4 overflow-y-auto font-mono text-xs text-zinc-400 z-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-bold flex items-center gap-2"><Bug className="w-4 h-4"/> Debug Info</h3>
                        <button onClick={() => setShowDebug(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-full pb-8">
                        <div><strong className="text-purple-400 block">Nano Request:</strong><pre className="bg-zinc-900 p-2 rounded border border-zinc-800">{JSON.stringify(lastNanoRequest, null, 2)}</pre></div>
                        <div><strong className="text-pink-400 block">Sora Request:</strong><pre className="bg-zinc-900 p-2 rounded border border-zinc-800">{JSON.stringify(lastSoraRequest, null, 2)}</pre></div>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AutoCinePanel;
