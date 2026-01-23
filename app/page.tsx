'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. 静态配置 & 模拟数据
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
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [rawCases, setRawCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false) // 搜索加载
  const [analyzing, setAnalyzing] = useState(false) // AI 分析模拟状态
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])
  const [tickerIndex, setTickerIndex] = useState(0)

  // 🔄 实时快讯轮播逻辑
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKER.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // 🧠 核心搜索/分析逻辑
  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim()) return
    
    if (keywordOverride) setQuery(keywordOverride)
    
    // 模拟 100分产品的 "AI 分析过程"
    setHasSearched(false)
    setAnalyzing(true)
    
    // 延迟 1.5秒，模拟 AI 读取体检报告的感觉
    setTimeout(async () => {
        const { data } = await supabase
        .from('cases')
        .select('*')
        .or(`disease_type.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

        if (data) setRawCases(data)
        setAnalyzing(false)
        setHasSearched(true)
    }, 1500)
  }

  // 🔄 数据聚合 + AI 评分生成
  const products = useMemo(() => {
    if (!rawCases.length) return []
    const map: Record<string, any> = {}
    
    rawCases.forEach(item => {
      const pName = item.product_name || '未知产品'
      if (!map[pName]) {
        // 模拟 AI 匹配度分数 (90-99分)
        const baseScore = pName.includes('惠民') ? 85 : (pName.includes('医疗') ? 92 : 95)
        const randomFluctuation = Math.floor(Math.random() * 5)
        
        map[pName] = {
          name: pName,
          company: item.company || '严选保司',
          cases: [],
          matchScore: baseScore + randomFluctuation, // AI 匹配分
          tags: item.verdict === 'pass' ? ['标体承保', '极力推荐'] : ['除外承保', '建议兜底']
        }
      }
      map[pName].cases.push(item)
    })
    return Object.values(map).sort((a, b) => b.matchScore - a.matchScore)
  }, [rawCases])

  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setRawCases([])
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 pb-32">
      
      {/* 🚀 Feature: 顶部实时快讯 (Social Proof) */}
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

      <main className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* =========================================
            状态 A: 首页 (模拟 AI 体检分析)
           ========================================= */}
        {!hasSearched && !analyzing ? (
          <div className="text-center mt-10 animate-fade-in-up">
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-blue-100">
               ✨ AI 数字孪生核保系统 V4.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              读懂你的<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">体检报告</span>
            </h1>
            <p className="text-gray-500 mb-12 max-w-md mx-auto leading-relaxed">
              上传报告或输入病史，AI 自动解析 200+ 项指标，生成您的专属 <span className="font-bold text-gray-900">保险准入诊断书</span>。
            </p>
            
            {/* 拟物化输入框 */}
            <div className="bg-white p-2 rounded-3xl shadow-2xl shadow-blue-100/50 border border-gray-100 max-w-xl mx-auto mb-12 relative overflow-hidden group">
               {/* 模拟扫描光效 */}
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
               
               <div className="flex items-center gap-3 px-4">
                  <span className="text-xl">🩺</span>
                  <input
                    type="text"
                    placeholder="粘贴体检结论 / 输入疾病名称..."
                    className="flex-1 h-14 bg-transparent outline-none text-lg placeholder:text-gray-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={() => handleSearch()}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
                  >
                    开始诊断
                  </button>
               </div>
            </div>

            {/* 快速入口 */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
               {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => handleSearch(cat.keywords[0])} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                     <span className="text-2xl mb-2">{cat.icon}</span>
                     <span className="text-xs font-bold text-gray-700">{cat.name}</span>
                  </button>
               ))}
            </div>
          </div>
        ) : analyzing ? (
          /* =========================================
             状态 B: 模拟 AI 分析中 (酷炫加载页)
             ========================================= */
          <div className="flex flex-col items-center justify-center pt-20">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🧬</div>
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在解析病历...</h2>
             <p className="text-gray-400 text-sm">正在比对 104 家保司核保手册</p>
             <div className="mt-8 w-64 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
             </div>
          </div>
        ) : (
          /* =========================================
             状态 C: 100分结果页 (仪表盘 + 诊断书)
             ========================================= */
          <div className="animate-fade-in-up pb-24">
            
            {/* 1. AI 诊断卡片 */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-slate-900/20 mb-8 relative overflow-hidden">
               {/* 装饰背景 */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600/30 border border-blue-400/30 text-blue-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI Diagnosis Report</span>
                     </div>
                     <h2 className="text-3xl font-bold mb-2">关于“{query}”的核保诊断</h2>
                     <p className="text-slate-300 text-sm max-w-md">
                        AI 智能扫描发现，该异常在 <span className="text-white font-bold border-b border-blue-400">医疗险</span> 中存在 85% 的标体承保概率。建议优先尝试智能核保，避免留下人工拒保记录。
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-center">
                        <div className="text-3xl font-black text-green-400">92<span className="text-sm text-green-400/60">%</span></div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">通过率</div>
                     </div>
                     <div className="w-px bg-white/10 h-10"></div>
                     <div className="text-center">
                        <div className="text-3xl font-black text-blue-400">Top1</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">推荐方案</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. 匹配产品列表 (带环形图) */}
            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="font-bold text-gray-900">为您匹配到 {products.length} 款产品</h3>
               <button className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">按匹配度排序 ▾</button>
            </div>

            <div className="space-y-4">
               {products.map((p: any, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex gap-4 relative overflow-hidden group">
                     {/* 金牌角标 */}
                     {idx === 0 && <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">AI 首选</div>}
                     
                     {/* 左侧：匹配度环形图 */}
                     <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="32" cy="32" r="28" stroke="#F1F5F9" strokeWidth="4" fill="transparent" />
                           <circle cx="32" cy="32" r="28" stroke={idx===0 ? '#2563EB' : '#10B981'} strokeWidth="4" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * p.matchScore) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                           <span className={`text-sm font-black ${idx===0 ? 'text-blue-600' : 'text-green-600'}`}>{p.matchScore}</span>
                           <span className="text-[8px] text-gray-400 -mt-1">分</span>
                        </div>
                     </div>

                     {/* 右侧：信息 */}
                     <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1">
                           {p.tags.map((t:string) => <span key={t} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{t}</span>)}
                           <LeverageTag productName={p.name} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{p.name}</h4>
                        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                           <span>🏢 {p.company}</span>
                           <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                           <span>📄 收录案例 {p.cases.length} 条</span>
                        </div>
                        
                        {/* 展开的案例摘要 */}
                        <div className="bg-slate-50 p-3 rounded-xl text-xs text-gray-600 leading-relaxed border border-gray-100">
                           <span className="font-bold text-slate-900">💡 专家点评：</span>
                           {p.cases[0]?.summary || '该产品对既往症审核较宽松，建议尝试。'}
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="text-center py-8 text-xs text-gray-400">
               - AI 已完成全网检索，显示全部结果 -
            </div>

          </div>
        )}
      </main>

      {/* 🚀 Feature: 底部悬浮救援条 (Sticky Bar) */}
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

// 杠杆标签 (样式微调更精致)
const LeverageTag = ({ productName }: { productName: string }) => {
  if (!productName) return null;
  let bg = '#F1F5F9', color = '#475569', text = '基础杠杆';
  if (productName.includes('众民保') || productName.includes('惠民')) { bg = '#F3E5F5'; color = '#7B1FA2'; text = '🔥 10000倍'; }
  else if (productName.includes('医疗') || productName.includes('e生保')) { bg = '#ECFDF5'; color = '#047857'; text = '🟢 8000倍'; }
  else if (productName.includes('重疾')) { bg = '#FFFBEB'; color = '#B45309'; text = '🟡 100倍'; }
  return <span style={{backgroundColor: bg, color: color}} className="text-[10px] px-1.5 py-0.5 rounded font-bold">{text}</span>;
};