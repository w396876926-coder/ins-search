'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. 静态数据配置 (全中文)
// ==========================================

const EXPERTS = [
  { id: 'e1', name: 'Alex', title: '首席核保官', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', desc: '前平安核保部经理，经手 3000+ 非标体案例' },
  { id: 'e2', name: 'Bella', title: '医学顾问', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', desc: '临床医学硕士，擅长结节/三高核保' },
]

const LIVE_TICKER = [
  '👏 1分钟前，上海张女士（甲状腺3级）成功投保【尊享e生】',
  '👏 5分钟前，北京李先生（乙肝大三阳）通过人工核保，标体承保',
  '👏 12分钟前，广州王先生（肺结节）成功领取【众民保】理赔金',
  '👏 刚刚，深圳赵女士预约了 Alex 的1对1核保服务',
]

const CATEGORIES = [
  { id: 'nodule', name: '结节/囊肿', icon: '🍒', keywords: ['肺结节', '甲状腺结节'] },
  { id: 'liver', name: '肝胆异常', icon: '🥃', keywords: ['乙肝', '脂肪肝'] },
  { id: 'metabolic', name: '三高/慢病', icon: '🍔', keywords: ['高血压', '糖尿病'] },
  { id: 'mental', name: '精神/心理', icon: '🧠', keywords: ['抑郁症', '焦虑症'] },
  { id: 'child', name: '少儿/先天', icon: '👶', keywords: ['腺样体', '自闭症'] },
]

const HOME_LEADERBOARD = [
  { rank: 1, name: '甲状腺结节 1-2级', ratio: '1 : 850', tag: '标体承保', desc: '百万医疗险+重疾险完美组合' },
  { rank: 2, name: '乳腺结节 3级', ratio: '1 : 600', tag: '除外+复发险', desc: '利用专项复发险补齐短板' },
  { rank: 3, name: '乙肝小三阳', ratio: '1 : 550', tag: '加费承保', desc: '虽然加费但保障全面' },
  { rank: 4, name: '肺微浸润腺癌', ratio: '1 : 120', tag: '术后逆袭', desc: '防癌医疗险+惠民保兜底' },
]

type SortType = 'recommend' | 'leverage' | 'coverage' | 'company'
const SORT_OPTIONS = [
  { value: 'recommend', label: '🔥 综合推荐', icon: '👍' },
  { value: 'leverage', label: '💰 高性价比', icon: '📈' },
  { value: 'coverage', label: '🛡️ 覆盖率广', icon: '☂️' },
  { value: 'company', label: '🏢 大公司', icon: 'qy' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [rawCases, setRawCases] = useState<any[]>([])
  const [analyzing, setAnalyzing] = useState(false) // AI 分析状态
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])
  const [tickerIndex, setTickerIndex] = useState(0)
  
  // 交互状态 (保留您喜欢的 V3.0 逻辑)
  const [activeHomeTab, setActiveHomeTab] = useState<'leverage' | 'hot'>('leverage')
  const [activeSort, setActiveSort] = useState<SortType>('recommend')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  
  // 摄像头引用
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🔄 跑马灯逻辑
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKER.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // 🧠 搜索与 AI 分析逻辑
  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    // 允许空搜索以便演示
    if (!searchTerm.trim() && !keywordOverride) return 
    
    if (keywordOverride) setQuery(keywordOverride)
    
    // 进入 AI 分析模式 (V5.0 特效)
    setHasSearched(false)
    setAnalyzing(true)
    setExpandedProductId(null)
    
    // 延迟 1.5秒 模拟分析过程
    setTimeout(async () => {
        const finalSearch = searchTerm || '结节'

        const { data } = await supabase
        .from('cases')
        .select('*')
        .or(`disease_type.ilike.%${finalSearch}%, content.ilike.%${finalSearch}%, product_name.ilike.%${finalSearch}%`)
        .order('created_at', { ascending: false })

        if (data) setRawCases(data)
        setAnalyzing(false)
        setHasSearched(true)
    }, 1500)
  }

  // 📸 图片上传/拍照逻辑 (V5.0 功能)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQuery(`已上传: ${file.name}`)
      setAnalyzing(true)
      
      setTimeout(async () => {
         // 强制演示甲状腺结果
         setQuery('AI识别结果：甲状腺结节 2级')
         
         const { data } = await supabase
          .from('cases')
          .select('*')
          .ilike('disease_type', '%甲状腺%') 
          .order('created_at', { ascending: false })
          
         if (data) setRawCases(data)
         setAnalyzing(false)
         setHasSearched(true)
      }, 2000)
    }
  }

  // 🔄 数据聚合逻辑 (这是您喜欢的 V3.0 版本的核心逻辑，已恢复)
  const aggregatedProducts = useMemo(() => {
    if (!rawCases.length) return []
    const map: Record<string, any> = {}
    
    rawCases.forEach(item => {
      const pName = item.product_name || '未知产品'
      if (!map[pName]) {
        // 恢复中文判断逻辑
        const baseScore = pName.includes('惠民') ? 85 : (pName.includes('医疗') ? 92 : 95)
        const randomFluctuation = Math.floor(Math.random() * 5)
        
        map[pName] = {
          name: pName,
          company: item.company || '严选保司',
          cases: [],
          matchScore: baseScore + randomFluctuation,
          passCount: 0,
          totalCount: 0,
          // 恢复中文关键词权重
          leverageScore: pName.includes('惠民') ? 10000 : (pName.includes('医疗') ? 8000 : 100),
          companyScore: (item.company?.includes('平安') || item.company?.includes('人保')) ? 9.8 : 8.5,
          coverageScore: Math.floor(Math.random() * 2000) + 500
        }
      }
      map[pName].cases.push(item)
      map[pName].totalCount += 1
      if (item.verdict === 'pass') map[pName].passCount += 1
    })
    
    let productList = Object.values(map)

    // 恢复 V3.0 的排序逻辑
    productList.sort((a: any, b: any) => {
      if (activeSort === 'leverage') return b.leverageScore - a.leverageScore
      if (activeSort === 'company') return b.companyScore - a.companyScore
      if (activeSort === 'coverage') return b.coverageScore - a.coverageScore
      return b.matchScore - a.matchScore // 默认按 AI 匹配度排序
    })

    return productList
  }, [rawCases, activeSort])

  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setRawCases([])
    setAnalyzing(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 pb-32">
      
      {/* 隐藏的文件输入框 */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 顶部跑马灯 */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center overflow-hidden relative">
         <div className="animate-fade-in-up key={tickerIndex}">
            {LIVE_TICKER[tickerIndex]}
         </div>
      </div>

      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md py-4 px-6 sticky top-0 z-40 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetHome}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">H</div>
          <span className="font-bold text-gray-800 text-lg">HealthGuardian</span>
        </div>
        <div className="flex items-center gap-2">
            <img src={selectedExpert.image} className="w-8 h-8 rounded-full border border-gray-200" />
            <span className="text-xs font-bold hidden md:inline">顾问在线</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* =========================================
            状态 A: 首页 (AI 输入 + V3.0 榜单)
           ========================================= */}
        {!hasSearched && !analyzing ? (
          <div className="text-center mt-10 animate-fade-in-up">
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-blue-100">
               ✨ AI 数字孪生核保系统 V5.5
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              读懂你的<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">体检报告</span>
            </h1>
            <p className="text-gray-500 mb-12 max-w-md mx-auto leading-relaxed">
              支持 <span className="text-blue-600 font-bold">拍照上传</span> 或输入病史，AI 自动解析 200+ 项指标，生成您的专属 <span className="font-bold text-gray-900">保险准入诊断书</span>。
            </p>
            
            {/* 拟物化输入框 + 拍照按钮 */}
            <div className="bg-white p-2 rounded-3xl shadow-2xl shadow-blue-100/50 border border-gray-100 max-w-xl mx-auto mb-12 relative overflow-hidden group">
               <div className="flex items-center gap-2 px-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-2xl hover:bg-gray-100 transition-colors active:scale-95"
                  >
                    📷
                  </button>
                  <input
                    type="text"
                    placeholder="粘贴体检结论 / 输入疾病名称..."
                    className="flex-1 h-14 bg-transparent outline-none text-lg placeholder:text-gray-400 min-w-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={() => handleSearch()}
                    className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg whitespace-nowrap"
                  >
                    开始诊断
                  </button>
               </div>
            </div>

            {/* 快速分类 */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-16">
               {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => handleSearch(cat.keywords[0])} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                     <span className="text-2xl mb-2">{cat.icon}</span>
                     <span className="text-xs font-bold text-gray-700">{cat.name}</span>
                  </button>
               ))}
            </div>

             {/* 首页榜单 (V3.0 样式) */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden text-left">
               <div className="flex border-b border-gray-50">
                  <button 
                    onClick={() => setActiveHomeTab('leverage')}
                    className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'leverage' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    💰 投保逆袭榜
                  </button>
                  <button 
                     onClick={() => setActiveHomeTab('hot')}
                     className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'hot' ? 'text-orange-500 bg-orange-50/50 border-b-2 border-orange-500' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    🔥 疾病焦虑榜
                  </button>
               </div>

               <div className="divide-y divide-gray-50">
                  {HOME_LEADERBOARD.map((item, idx) => (
                    <div key={idx} className="p-5 flex items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleSearch(item.name.split(' ')[0])}>
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg mr-4 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx===1 ? 'bg-gray-100 text-gray-700' : idx===2 ? 'bg-orange-50 text-orange-700' : 'text-gray-400'}`}>{item.rank}</div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-gray-900">{item.name}</span>
                             <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-bold">{item.tag}</span>
                          </div>
                          <div className="text-xs text-gray-400">{item.desc}</div>
                       </div>
                       <div className="text-right hidden md:block">
                          <div className="text-xs text-gray-400">杠杆率</div>
                          <div className="font-mono font-bold text-blue-600">{item.ratio}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : analyzing ? (
          /* =========================================
             状态 B: 模拟分析中 (V5.0 动画)
             ========================================= */
          <div className="flex flex-col items-center justify-center pt-20">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🧬</div>
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在扫描报告...</h2>
             <p className="text-gray-400 text-sm">正在提取: {query.includes('上传') ? 'OCR 图像文字' : query}</p>
             <div className="mt-8 w-64 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
             </div>
          </div>
        ) : (
          /* =========================================
             状态 C: 结果页 (黑金诊断卡 + V3.0 列表)
             ========================================= */
          <div className="animate-fade-in-up pb-24">
            
            {/* 1. AI 诊断卡片 (深色主题 - 您的最爱) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-slate-900/20 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600/30 border border-blue-400/30 text-blue-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI Report</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold mb-2 break-all">{query.includes('AI') ? query : `关于“${query}”的核保诊断`}</h2>
                     <p className="text-slate-300 text-sm max-w-md">
                        AI 智能扫描发现，该异常在 <span className="text-white font-bold border-b border-blue-400">医疗险</span> 中存在 85% 的标体承保概率。
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-center">
                        <div className="text-3xl font-black text-green-400">92<span className="text-sm text-green-400/60">%</span></div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">通过率</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. 排序选项 */}
            <div className="flex flex-wrap gap-3 py-2 mb-4">
               {SORT_OPTIONS.map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => setActiveSort(opt.value as SortType)}
                   className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                     activeSort === opt.value 
                       ? 'bg-slate-900 text-white shadow-lg' 
                       : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                   }`}
                 >
                   <span>{opt.icon}</span> {opt.label}
                 </button>
               ))}
            </div>

            {/* 3. 聚合产品列表 (V3.0 核心逻辑：可展开 + 案例) */}
            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="font-bold text-gray-900">为您匹配到 {aggregatedProducts.length} 款产品</h3>
            </div>

            <div className="space-y-4">
               {aggregatedProducts.length > 0 ? (
                 <>
                   {aggregatedProducts.map((product: any, idx) => (
                     <div key={idx} className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedProductId === product.name ? 'border-blue-500 shadow-lg ring-2 ring-blue-50' : 'border-gray-100 shadow-sm hover:border-blue-200'}`}>
                        
                        {/* 卡片头部 (点击展开) */}
                        <div 
                          className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center relative"
                          onClick={() => setExpandedProductId(expandedProductId === product.name ? null : product.name)}
                        >
                            {/* 第一名金牌 */}
                           {idx === 0 && activeSort === 'recommend' && <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">AI 首选</div>}

                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                 {/* 排名数字 */}
                                 <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx===0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {idx + 1}
                                 </span>
                                 <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                                 <LeverageTag productName={product.name} />
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-3">
                                 <span>🏢 {product.company}</span>
                                 <span>📄 收录案例: {product.totalCount} 条</span>
                                 <span className={`font-bold ${product.matchScore > 90 ? 'text-green-600' : 'text-yellow-600'}`}>匹配度: {product.matchScore}%</span>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                              <div className="text-right">
                                 <div className="text-xs text-gray-400">核保通过率</div>
                                 <div className="text-lg font-black text-green-600">
                                    {Math.round((product.passCount / product.totalCount) * 100)}%
                                 </div>
                              </div>
                              <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedProductId === product.name ? 'rotate-180 bg-gray-100' : 'bg-gray-50'}`}>
                                 ⌄
                              </button>
                           </div>
                        </div>

                        {/* 展开的详情页 (V3.0 逻辑) */}
                        {expandedProductId === product.name && (
                           <div className="bg-slate-50 border-t border-gray-100 p-5 animate-fade-in-down">
                              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                 📂 真实用户核保记录 ({product.cases.length})
                              </h4>
                              <div className="space-y-3">
                                 {product.cases.map((c: any) => (
                                    <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 text-sm shadow-sm">
                                       <div className="flex gap-2 mb-2">
                                          {c.verdict === 'pass' && <span className="bg-green-100 text-green-700 px-1.5 rounded text-[10px] font-bold">✅ 标体</span>}
                                          {c.verdict === 'exclude' && <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded text-[10px] font-bold">⚠️ 除外</span>}
                                          {c.verdict === 'reject' && <span className="bg-red-100 text-red-700 px-1.5 rounded text-[10px] font-bold">🚫 拒保</span>}
                                          <span className="text-gray-400 text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                                       </div>
                                       <p className="text-gray-700 leading-relaxed mb-2">{c.content}</p>
                                       <div className="bg-blue-50/50 p-2 rounded-lg text-xs text-blue-700 font-medium">
                                          💡 专家点评: {c.summary || '注意核保尺度，建议尝试智能核保。'}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                              <div className="mt-4 text-center">
                                 <button className="text-sm font-bold text-blue-600 bg-white border border-blue-200 px-6 py-2 rounded-full shadow-sm hover:bg-blue-50">
                                    👉 申请 {selectedExpert.name} 协助投保
                                 </button>
                              </div>
                           </div>
                        )}

                     </div>
                   ))}
                   
                   <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-400 text-xs font-medium">
                         <span>✨</span>
                         <span>已显示全部热门核保方案，数据持续更新中</span>
                         <span>✨</span>
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400">暂无该分类的推荐产品，试试搜索“惠民保”兜底？</p>
                 </div>
               )}
            </div>
            
          </div>
        )}
      </main>

      {/* 底部悬浮救援条 (Sticky Bar) */}
      <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-50">
         <div className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl shadow-blue-900/20 rounded-2xl p-2 pl-5 flex items-center justify-between ring-1 ring-gray-900/5">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <img src={selectedExpert.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
               </div>
               <div className="text-xs">
                  <div className="font-bold text-gray-900">看不懂方案？</div>
                  <div className="text-gray-500">让 {selectedExpert.name} 帮您把关</div>
               </div>
            </div>
            <button className="bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:scale-105 transition-transform">
               免费咨询
            </button>
         </div>
      </div>

    </div>
  )
}

// 杠杆标签 (保留中文逻辑)
const LeverageTag = ({ productName }: { productName: string }) => {
  if (!productName) return null;
  let bg = '#F1F5F9', color = '#475569', text = '基础杠杆';
  if (productName.includes('众民保') || productName.includes('惠民')) { bg = '#F3E5F5'; color = '#7B1FA2'; text = '🔥 10000倍'; }
  else if (productName.includes('医疗') || productName.includes('e生保') || productName.includes('好医保')) { bg = '#ECFDF5'; color = '#047857'; text = '🟢 8000倍'; }
  else if (productName.includes('重疾') || productName.includes('达尔文') || productName.includes('超级玛丽')) { bg = '#FFFBEB'; color = '#B45309'; text = '🟡 100倍'; }
  return <span style={{backgroundColor: bg, color: color}} className="text-[10px] px-1.5 py-0.5 rounded font-bold">{text}</span>;
};