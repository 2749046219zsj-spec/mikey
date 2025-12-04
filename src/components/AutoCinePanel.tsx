import React, { useState, useRef } from 'react';
import {
  Play, Settings, Image as ImageIcon, Film, Loader, Terminal,
  Video, Plus, X, RotateCcw, Camera, Clapperboard
} from 'lucide-react';

interface CustomAsset {
  id: string;
  type: 'character' | 'environment' | 'scale_ref';
  name: string;
  url: string;
  desc: string;
  isAnalyzing: boolean;
}

interface Scene {
  id: number;
  char_ids?: string[];
  env_id?: string;
  shot_type: string;
  desc: string;
  action_prompt: string;
}

interface ScriptData {
  title: string;
  characters?: Array<{ id: string; name: string; visual_prompt: string }>;
  environments?: Array<{ id: string; name: string; visual_prompt: string }>;
  scenes?: Scene[];
}

interface FrameData extends Scene {
  url: string;
}

export const AutoCinePanel: React.FC = () => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const GEMINI_PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

  const [topic, setTopic] = useState("A和B在C里面玩耍，B突然打了A一下，A被打哭了，B溜走了剩下A自己哭泣");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [consistencyMode, setConsistencyMode] = useState(true);
  const [enableVideo, setEnableVideo] = useState(false);
  const [videoModel, setVideoModel] = useState("sora-2");
  const [videoResolution, setVideoResolution] = useState("720x1280");
  const [videoDuration, setVideoDuration] = useState("4s");
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [characterAssets, setCharacterAssets] = useState<Record<string, string>>({});
  const [sceneAssets, setSceneAssets] = useState<Record<string, string>>({});
  const [finalFrames, setFinalFrames] = useState<FrameData[]>([]);
  const [videoResults, setVideoResults] = useState<Record<number, string>>({});
  const [regeneratingScenes, setRegeneratingScenes] = useState<Record<number, boolean>>({});
  const [generatingVideos, setGeneratingVideos] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const callPoeGPT = async (messages: any[], model = "gpt-5", jsonMode = false) => {
    try {
      const requestBody: any = {
        model: model,
        messages: messages,
      };

      if (jsonMode) {
        requestBody.response_format = { type: "json_object" };
      }

      const response = await fetch(GEMINI_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      addLog(`[Error] API 调用失败: ${(error as Error).message}`);
      return null;
    }
  };

  const callNanaBanana = async (prompt: string, refImageUrls: string[] = []) => {
    try {
      const finalPrompt = `(Single cinematic shot:2.0), (one full scene), ${prompt} --ar ${aspectRatio} --v 6.0 --no grid, split screen, collage, multiple views, comic panels, borders, white frame`;

      let messageContent;
      if (refImageUrls.length > 0) {
        messageContent = [
          { type: "text", text: finalPrompt },
          ...refImageUrls.map(url => ({ type: "image_url", image_url: { url: url } }))
        ];
      } else {
        messageContent = finalPrompt;
      }

      const response = await fetch(GEMINI_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          model: "nano-banana-pro",
          messages: [{ role: "user", content: messageContent }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const match = content.match(/!\[.*?\]\((.*?)\)/) || content.match(/https?:\/\/[^\s)]+/);
      return match ? match[1] || match[0] : null;
    } catch (error) {
      addLog(`[Error] 绘图失败: ${(error as Error).message}`);
      return null;
    }
  };

  const callVideoGeneration = async (actionPrompt: string, startImageUrl: string) => {
    let finalPrompt = actionPrompt;
    if (videoModel === "sora-2") {
      finalPrompt = `${actionPrompt} --resolution ${videoResolution} --duration ${videoDuration}`;
    } else if (videoModel === "veo-3.1") {
      finalPrompt = `${actionPrompt} (cinematic video, high quality)`;
    }

    try {
      let messageContent;
      if (startImageUrl) {
        messageContent = [
          { type: "text", text: finalPrompt },
          { type: "image_url", image_url: { url: startImageUrl } }
        ];
      } else {
        messageContent = finalPrompt;
      }

      const response = await fetch(GEMINI_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          model: videoModel,
          messages: [{ role: "user", content: messageContent }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      const match = content.match(/https?:\/\/[^\s)]+\.mp4/) || content.match(/https?:\/\/[^\s)]+/);
      if (match) return match[0];

      const mdMatch = content.match(/\((https?:\/\/.*?)\)/);
      return mdMatch ? mdMatch[1] : null;
    } catch (error) {
      addLog(`[Error] ${videoModel} 生成失败: ${(error as Error).message}`);
      return null;
    }
  };

  const analyzeAssetImage = async (assetId: string, base64Image: string) => {
    setCustomAssets(prev => prev.map(a => a.id === assetId ? { ...a, isAnalyzing: true, desc: "AI 正在识别..." } : a));
    const prompt = `Analyze this image for a video asset library. Classify type: "character" OR "environment". Name it (2-3 words). Concise visual description (under 40 words). JSON: { "type": "...", "name": "...", "description": "..." }`;
    const messages = [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: base64Image } }] }];
    const responseText = await callPoeGPT(messages, "gpt-5", true);
    try {
      const result = JSON.parse(responseText!.replace(/```json\n?|\n?```/g, "").trim());
      setCustomAssets(prev => prev.map(a => a.id === assetId ? { ...a, type: result.type?.toLowerCase() || 'character', name: result.name || a.name, desc: result.description || "识别完成", isAnalyzing: false } : a));
      addLog(`✅ 识别成功: [${result.type}] ${result.name}`);
    } catch (e) {
      setCustomAssets(prev => prev.map(a => a.id === assetId ? { ...a, desc: responseText || "分析失败", isAnalyzing: false } : a));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const name = `Asset_${customAssets.length + 1}`;
      const newAsset: CustomAsset = { id: `custom_${Date.now()}`, type: 'character', name, url: base64, desc: "Waiting for AI...", isAnalyzing: false };
      setCustomAssets(prev => [...prev, newAsset]);
      analyzeAssetImage(newAsset.id, base64);
    };
    reader.readAsDataURL(file);
  };

  const generateSingleVideo = async (sceneId: number) => {
    if (generatingVideos[sceneId]) return;

    const scene = scriptData?.scenes?.find(s => s.id === sceneId);
    const frame = finalFrames.find(f => f.id === sceneId);

    if (!scene || !frame || !frame.url) {
      addLog(`[Error] 无法生成视频：找不到场景数据或图片未生成`);
      return;
    }

    setGeneratingVideos(prev => ({ ...prev, [sceneId]: true }));
    addLog(`🎬 正在为场景 ${sceneId} 生成视频 (模型: ${videoModel})...`);

    const videoUrl = await callVideoGeneration(scene.action_prompt, frame.url);

    if (videoUrl) {
      addLog(`✅ 场景 ${sceneId} 视频生成成功！`);
      setVideoResults(prev => ({ ...prev, [sceneId]: videoUrl }));
    } else {
      addLog(`❌ 场景 ${sceneId} 视频生成失败。`);
    }

    setGeneratingVideos(prev => ({ ...prev, [sceneId]: false }));
  };

  const regenerateSceneImage = async (sceneId: number) => {
    if (regeneratingScenes[sceneId] || !scriptData) return;
    setRegeneratingScenes(prev => ({ ...prev, [sceneId]: true }));
    addLog(`🔄 正在重绘场景 ${sceneId}...`);

    const scene = scriptData.scenes?.find(s => s.id === sceneId);
    if (!scene) return;

    const refUrls: string[] = [];
    if (scene.env_id && sceneAssets[scene.env_id]) refUrls.push(sceneAssets[scene.env_id]);
    if (scene.char_ids) scene.char_ids.forEach(cid => { if (characterAssets[cid]) refUrls.push(characterAssets[cid]); });
    customAssets.filter(a => a.type === 'scale_ref').forEach(a => refUrls.push(a.url));

    let newUrl = await callNanaBanana(scene.action_prompt, refUrls);
    if (!newUrl) {
      newUrl = `https://placehold.co/600x338/574b90/FFF?text=Regenerated+${sceneId}`;
    } else {
      addLog(`✅ 场景 ${sceneId} 重绘成功`);
    }

    setFinalFrames(prev => prev.map(f => f.id === sceneId ? { ...f, url: newUrl! } : f));
    setRegeneratingScenes(prev => ({ ...prev, [sceneId]: false }));
  };

  const generateScriptWithAssets = async () => {
    let assetContext = "";
    if (customAssets.length > 0) {
      assetContext = "IMPORTANT: PRIORITIZE USING THESE CUSTOM ASSETS IDs IN THE SCRIPT.\n";
      customAssets.filter(a => a.type !== 'scale_ref').forEach(asset => {
        assetContext += `- Type: ${asset.type.toUpperCase()} | Name: "${asset.name}" | ID: "${asset.id}" | Visual Desc: "${asset.desc}"\n`;
      });
    }

    const systemPrompt = `
      You are an AI Video Director. Asset-based workflow.
      ${assetContext}

      Tasks:
      1. Define Characters. (Use custom IDs if applicable)
      2. Define Environments. (Use custom IDs if applicable)
      3. Write Scenes with explicit Shot Types.

      Output JSON:
      {
        "title": "Title",
        "characters": [ { "id": "id", "name": "Name", "visual_prompt": "Desc" } ],
        "environments": [ { "id": "id", "name": "Name", "visual_prompt": "Desc" } ],
        "scenes": [ { "id": 1, "char_ids": ["id"], "env_id": "id", "shot_type": "Medium Shot", "desc": "Story", "action_prompt": "Prompt" } ]
      }
    `;

    addLog("🧠 正在规划剧本...");
    const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: `主题：${topic}` }];
    const content = await callPoeGPT(messages, "gpt-5", true);
    try {
      return JSON.parse(content!.replace(/```json\n?|\n?```/g, "").trim());
    } catch (e) {
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setLogs([]);
    setCurrentStep(1);
    setScriptData(null);
    setCharacterAssets({});
    setSceneAssets({});
    setFinalFrames([]);
    setVideoResults({});

    let script = await generateScriptWithAssets();
    if (!script) {
      await new Promise(r => setTimeout(r, 500));
      script = {
        title: "演示项目",
        characters: [{ id: "c1", name: "Hacker", visual_prompt: "Cyberpunk girl" }],
        environments: [{ id: "e1", name: "Alley", visual_prompt: "Rain" }],
        scenes: [{ id: 1, char_ids: ["c1"], env_id: "e1", shot_type: "Wide Shot", desc: "Start", action_prompt: "Start" }]
      };
      addLog("⚠️ API 调用失败，使用演示数据");
    }
    setScriptData(script);

    setCurrentStep(2);
    const newCharAssets: Record<string, string> = {};
    const newSceneAssets: Record<string, string> = {};

    addLog("--- 准备资产 ---");

    if (script.characters) {
      for (const char of script.characters) {
        const custom = customAssets.find(c => c.id === char.id);
        if (custom) {
          newCharAssets[char.id] = custom.url;
          addLog(`🔗 [角色] 直接引用: ${char.name}`);
        } else {
          addLog(`🎨 [角色] AI 绘制: ${char.name}`);
          let url = await callNanaBanana(char.visual_prompt);
          if (!url) url = `https://placehold.co/400x400/2d3436/FFF?text=${char.name}`;
          newCharAssets[char.id] = url;
        }
        setCharacterAssets(prev => ({ ...prev, [char.id]: newCharAssets[char.id] }));
      }
    }
    if (script.environments) {
      for (const env of script.environments) {
        const custom = customAssets.find(c => c.id === env.id);
        if (custom) {
          newSceneAssets[env.id] = custom.url;
          addLog(`🔗 [场景] 直接引用: ${env.name}`);
        } else {
          addLog(`🎨 [场景] AI 绘制: ${env.name}`);
          let url = await callNanaBanana(env.visual_prompt);
          if (!url) url = `https://placehold.co/600x338/101820/FFF?text=${env.name}`;
          newSceneAssets[env.id] = url;
        }
        setSceneAssets(prev => ({ ...prev, [env.id]: newSceneAssets[env.id] }));
      }
    }

    setCurrentStep(3);
    addLog("--- 合成分镜 ---");
    const frames: FrameData[] = [];
    let prevFrameUrl: string | null = null;

    if (script.scenes) {
      for (const scene of script.scenes) {
        addLog(`合成场景 ${scene.id} [${scene.shot_type}]...`);

        const refUrls: string[] = [];
        if (scene.env_id && newSceneAssets[scene.env_id]) refUrls.push(newSceneAssets[scene.env_id]);
        if (scene.char_ids) scene.char_ids.forEach(cid => { if (newCharAssets[cid]) refUrls.push(newCharAssets[cid]); });
        customAssets.filter(a => a.type === 'scale_ref').forEach(a => refUrls.push(a.url));
        if (consistencyMode && prevFrameUrl) refUrls.unshift(prevFrameUrl);

        let finalUrl = await callNanaBanana(scene.action_prompt, refUrls);
        if (!finalUrl) finalUrl = `https://placehold.co/600x338/34495e/FFF?text=Scene+${scene.id}`;

        if (finalUrl && !finalUrl.includes("placehold")) prevFrameUrl = finalUrl;

        frames.push({ ...scene, url: finalUrl });
        setFinalFrames([...frames]);
      }
    }

    if (enableVideo) {
      setCurrentStep(4);
      for (const frame of frames) {
        addLog(`🎥 生成视频 Scene ${frame.id} (${videoModel})...`);
        const videoUrl = await callVideoGeneration(frame.action_prompt, frame.url);
        setVideoResults(prev => ({ ...prev, [frame.id]: videoUrl || '' }));
      }
      addLog("全流程任务结束 (含视频)。");
    } else {
      addLog("任务结束 (仅图片模式)。点击图片上的 '生成视频' 按钮可手动制作。");
    }

    setIsGenerating(false);
  };

  return (
    <div className="bg-slate-950 text-slate-200 font-sans">
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {showConfig && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400">配置选项</h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 bg-slate-950/50 rounded border border-slate-700">
                <p className="text-xs text-slate-400">
                  API 通过服务器代理调用
                  <span className="ml-2 text-green-400">✓ 已就绪</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-indigo-400">绘图 (Nano-Banana)</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">视觉连续性</span>
                  <button
                    onClick={() => setConsistencyMode(!consistencyMode)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${consistencyMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${consistencyMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-pink-400">视频生成配置</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${enableVideo ? 'text-pink-400' : 'text-slate-500'}`}>
                      {enableVideo ? '自动生成' : '手动生成'}
                    </span>
                    <button
                      onClick={() => setEnableVideo(!enableVideo)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${enableVideo ? 'bg-pink-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${enableVideo ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">选择模型</label>
                    <select
                      value={videoModel}
                      onChange={(e) => setVideoModel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs focus:border-pink-500 outline-none"
                    >
                      <option value="sora-2">Sora-2 (OpenAI)</option>
                      <option value="veo-3.1">Veo-3.1 (Google)</option>
                    </select>
                  </div>
                  {videoModel === "sora-2" && (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={videoResolution}
                        onChange={(e) => setVideoResolution(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                      >
                        <option value="720x1280">720x1280</option>
                        <option value="1280x720">1280x720</option>
                      </select>
                      <select
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                      >
                        <option value="4s">4s</option>
                        <option value="8s">8s</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!showConfig && (
            <button
              onClick={() => setShowConfig(true)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              显示配置
            </button>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> 自定义资产库
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> 上传图片
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {customAssets.map((asset) => (
                <div key={asset.id} className="bg-slate-950 p-2 rounded border border-slate-800 flex gap-3 relative group">
                  <div className="w-12 h-12 shrink-0 bg-black rounded overflow-hidden">
                    <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <input
                        value={asset.name}
                        onChange={(e) => setCustomAssets(prev => prev.map(a => a.id === asset.id ? {...a, name: e.target.value} : a))}
                        className="bg-transparent text-xs font-bold text-slate-300 w-20 outline-none focus:text-indigo-400"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCustomAssets(prev => prev.map(a => a.id === asset.id ? {...a, type: 'character'} : a))}
                          className={`text-[8px] px-1 rounded ${asset.type === 'character' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                        >
                          角色
                        </button>
                        <button
                          onClick={() => setCustomAssets(prev => prev.map(a => a.id === asset.id ? {...a, type: 'environment'} : a))}
                          className={`text-[8px] px-1 rounded ${asset.type === 'environment' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                        >
                          场景
                        </button>
                        <button
                          onClick={() => setCustomAssets(prev => prev.map(a => a.id === asset.id ? {...a, type: 'scale_ref'} : a))}
                          className={`text-[8px] px-1 rounded ${asset.type === 'scale_ref' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                        >
                          比例
                        </button>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2" title={asset.desc}>
                      {asset.isAnalyzing ? "AI 识别中..." : asset.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => setCustomAssets(prev => prev.filter(a => a.id !== asset.id))}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {customAssets.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-600 border border-dashed border-slate-800 rounded flex flex-col items-center gap-2">
                  <ImageIcon className="w-6 h-6 opacity-30"/>
                  <span>请上传图片以启用自定义资产</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-500" /> 故事创作
            </h2>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm mb-4"
              placeholder="输入故事梗概..."
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${isGenerating ? 'bg-slate-800 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {isGenerating ? <Loader className="animate-spin w-4 h-4"/> : (enableVideo ? <Video className="w-4 h-4"/> : <ImageIcon className="w-4 h-4"/>)}
              {isGenerating ? "生成中..." : (enableVideo ? "开始生成 (含视频)" : "开始生成 (仅图片)")}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-slate-400 border-l-2 border-slate-800 pl-2">{log}</div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className={`transition-all duration-500 ${currentStep >= 3 ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
              <h3 className="text-sm font-semibold text-slate-300">分镜与视频合成</h3>
            </div>

            <div className="space-y-6">
              {finalFrames.map((frame) => (
                <div key={frame.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Generated Frame</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => generateSingleVideo(frame.id)}
                            disabled={generatingVideos[frame.id]}
                            title={`使用 ${videoModel} 生成此镜头的视频`}
                            className="p-1 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                          >
                            {generatingVideos[frame.id] ? <Loader className="w-3 h-3 animate-spin"/> : <Clapperboard className="w-3 h-3"/>}
                          </button>

                          <button
                            onClick={() => regenerateSceneImage(frame.id)}
                            disabled={regeneratingScenes[frame.id]}
                            title="重绘"
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded"
                          >
                            <RotateCcw className={`w-3 h-3 ${regeneratingScenes[frame.id] ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative group">
                        {frame.url && !regeneratingScenes[frame.id] ? (
                          <img src={frame.url} className="w-full h-full object-cover" alt={`Scene ${frame.id}`} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <Loader className="animate-spin text-slate-600 w-6 h-6"/>
                            <span className="text-[10px] text-slate-500">
                              {regeneratingScenes[frame.id] ? "Redrawing..." : "Loading..."}
                            </span>
                          </div>
                        )}
                        {frame.shot_type && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-[8px] text-white rounded flex items-center gap-1">
                            <Camera className="w-2 h-2"/> {frame.shot_type}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{frame.desc}</p>
                    </div>

                    <div className="w-full md:w-1/2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] text-pink-500 uppercase tracking-wider font-bold">Video ({videoModel})</p>
                        {(currentStep === 4 || generatingVideos[frame.id]) && !videoResults[frame.id] && (
                          <div className="flex items-center gap-1 text-[9px] text-indigo-400">
                            <Loader className="w-3 h-3 animate-spin"/> Generating...
                          </div>
                        )}
                      </div>
                      <div className={`aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative ${!videoResults[frame.id] ? 'opacity-50' : ''}`}>
                        {videoResults[frame.id] ? (
                          <div className="w-full h-full flex items-center justify-center relative group">
                            <img src={frame.url} className="w-full h-full object-cover opacity-60" alt={`Video preview ${frame.id}`} />
                            <a
                              href={videoResults[frame.id]}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 flex items-center justify-center hover:bg-black/40 transition-colors"
                            >
                              <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center shadow-lg shadow-pink-900/50">
                                <Play className="w-5 h-5 text-white ml-1" />
                              </div>
                            </a>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                            <Video className="w-8 h-8 opacity-20" />
                            <span className="text-xs">等待生成...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
