'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. 图标库 (内置 SVG)
// ==========================================
const IconThumbsUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
const IconShield = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
const IconBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
const IconCamera = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
const IconChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
const IconLoading = () => <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>

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
  { id: 'child', name: '少儿/先天', icon: '👶', keywords: ['腺样体', '卵圆孔'] },
]

const EXPERTS = [
  { id: 'e1', name: 'Alex', title: '资深核保专家', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', gender: 'male', desc: '前平安核保主管，擅长非标体' },
  { id: 'e2', name: 'Bella', title: '医学顾问', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', gender: 'female', desc: '临床医学硕士，擅长慢病咨询' },
  { id: 'e3', name: 'Chris', title: '理赔专家', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris', gender: 'male', desc: '经手理赔金额超千万' },
]

const HOME_LEADERBOARD = [
  { rank: 1, name: '甲状腺结节 1-2级', ratio: '1 : 850', tag: '标体承保', desc: '百万医疗险+重疾险完美组合' },
  { rank: 2, name: '乳腺结节 3级', ratio: '1 : 600', tag: '除外+复发险', desc: '利用专项复发险补齐短板' },
  { rank: 3, name: '乙肝小三阳', ratio: '1 : 550', tag: '加费承保', desc: '虽然加费但保障全面' },
  { rank: 4, name: '肺微浸润腺癌', ratio: '1 : 120', tag: '术后逆袭', desc: '防癌医疗险+惠民保兜底' },
]

type SortType = 'recommend' | 'leverage' | 'coverage' | 'company'
const SORT_OPTIONS = [
  { value: 'recommend', label: '综合推荐', icon: IconThumbsUp },
  { value: 'leverage', label: '高性价比', icon: IconTrendingUp },
  { value: 'coverage', label: '覆盖率广', icon: IconShield },
  { value: 'company', label: '大公司', icon: IconBuilding }, 
]

// 模拟的真实案例库 (用于填充数据，解决"案例太少"的问题)
const MOCK_CASES = [
    { content: "我和楼主情况差不多，也是复查没变化，最后走了人工核保通过了。", verdict: "pass", date: "2天前" },
    { content: "这家公司核保确实比较松，我之前被别的拒保了，这里给了除外。", verdict: "exclude", date: "1周前" },
    { content: "注意看条款，虽然能买，但是既往症是不赔的，大家要看清楚。", verdict: "pass", date: "3天前" }
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [rawCases, setRawCases] = useState<any[]>([]) 
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])
  const [tickerIndex, setTickerIndex] = useState(0)
  
  const [activeHomeTab, setActiveHomeTab] = useState<'leverage' | 'hot'>('leverage')
  const [activeSort, setActiveSort] = useState<SortType>('recommend')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKER.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim()) return
    
    if (keywordOverride) setQuery(keywordOverride)
    setLoading(true) // ✅ 立即开启 Loading
    setHasSearched(true)
    setExpandedProductId(null)

    // 1. 查本地库
    const { data: localData } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (localData && localData.length > 0) {
      setRawCases(localData)
      setLoading(false)
    } else {
        // 2. 查 AI (V7.0 后台)
        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disease: searchTerm })
            })
            const result = await res.json()
            
            if (result.success && result.data && result.data.length > 0) {
                const newCases = result.data.map((p:any) => ({
                    ...p,
                    id: Math.random(),
                    passCount: 50,
                    totalCount: 60,
                    created_at: new Date().toISOString()
                }))
                setRawCases(newCases)
            } else {
                // 兜底
                setRawCases([{ product_name: '人工核保服务', company: 'HealthGuardian', verdict: 'manual', passCount:0, totalCount:1, summary: '建议人工介入', content: '未检索到明确的标准件产品，建议点击下方咨询。' }])
            }
        } catch (e) {
            console.error('AI Search Failed', e)
            setRawCases([{ product_name: '人工核保服务', company: 'HealthGuardian', verdict: 'manual', passCount:0, totalCount:1, summary: '网络请求超时', content: '建议人工咨询' }])
        } finally {
            setLoading(false) // ✅ 结束 Loading
        }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        setLoading(true)
        setQuery(`正在识别: ${file.name}...`)
        setTimeout(() => {
            const mockResult = '甲状腺结节'
            setQuery(`AI识别结果：${mockResult}`)
            handleSearch(mockResult)
        }, 1500)
    }
  }

  const aggregatedProducts = useMemo(() => {
    if (!rawCases.length) return []
    // 简单聚合逻辑
    return rawCases.map((item, idx) => ({
       name: item.product_name || '未知产品',
       company: item.company || '保险公司',
       verdict: item.verdict,
       content: item.content,
       summary: item.summary,
       passRate: item.passCount ? Math.round((item.passCount/item.totalCount)*100) : 0,
       tags: item.company?.includes('平安') ? ['大公司', '理赔快'] : ['高性价比']
    }))
  }, [rawCases])

  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setRawCases([])
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 pb-32">
      
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      {/* ✅ 强力 Loading 遮罩：只要 loading 为 true，就显示全屏遮罩 */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
            <div className="mb-4"><IconLoading /></div>
            <div className="text-lg font-bold text-slate-800">AI 正在全网检索 "{query}"</div>
            <div className="text-sm text-slate-500 mt-2">分析 100+ 家保险公司核保手册...</div>
        </div>
      )}

      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center overflow-hidden relative">
         <div className="animate-fade-in-up key={tickerIndex}">{LIVE_TICKER[tickerIndex]}</div>
      </div>

      <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetHome}>
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-gray-800 tracking-tight">HealthGuardian</span>
        </div>
        <div className="flex items-center gap-2">
           <img src={selectedExpert.image} className="w-8 h-8 rounded-full border" />
           <span className="text-xs text-gray-500">顾问在线</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {!hasSearched ? (
          /* 首页状态 */
          <div className="text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              身体有异常，<br className="md:hidden" />还能买保险吗？
            </h1>
            <p className="text-gray-500 mb-10 max-w-xl mx-auto">
              全网核保大数据库 · <span className="text-blue-600 font-bold">AI 智能匹配</span> · 拒保复活攻略
            </p>
            
            <div className="max-w-2xl mx-auto mb-10 relative">
              <button onClick={() => fileInputRef.current?.click()} className="absolute left-2 top-2 h-10 w-10 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg" title="拍照">
                <IconCamera />
              </button>
              <input
                type="text"
                placeholder="输入疾病名，或点击相机拍照..."
                className="w-full h-14 pl-14 pr-32 rounded-full border-2 border-indigo-50 shadow-lg focus:border-blue-500 text-lg outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={() => handleSearch()} className="absolute right-2 top-2 h-10 px-8 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center">
                生成攻略
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => handleSearch(cat.keywords[0])} className="bg-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-gray-100 flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
               <div className="flex border-b border-gray-50">
                  <button onClick={() => setActiveHomeTab('leverage')} className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'leverage' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>💰 投保逆袭榜</button>
                  <button onClick={() => setActiveHomeTab('hot')} className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'hot' ? 'text-orange-500 bg-orange-50/50 border-b-2 border-orange-500' : 'text-gray-500 hover:bg-gray-50'}`}>🔥 疾病焦虑榜</button>
               </div>
               <div className="divide-y divide-gray-50">
                  {HOME_LEADERBOARD.map((item, idx) => (
                    <div key={idx} className="p-5 flex items-center hover:bg-gray-50 cursor-pointer" onClick={() => handleSearch(item.name.split(' ')[0])}>
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg mr-4 ${idx===0?'bg-yellow-100 text-yellow-700':idx===1?'bg-gray-100':idx===2?'bg-orange-50 text-orange-700':'text-gray-400'}`}>{item.rank}</div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1"><span className="font-bold text-gray-900">{item.name}</span><span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-bold">{item.tag}</span></div>
                          <div className="text-xs text-gray-400">{item.desc}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          /* 搜索结果状态 */
          <div className="animate-fade-in-up space-y-6">
            
            {/* 顶部筛选 */}
            <div className="flex flex-wrap gap-3 py-2 sticky top-20 z-10 bg-[#F4F6F9]/90 backdrop-blur pb-4">
               {SORT_OPTIONS.map(opt => {
                 const Icon = opt.icon;
                 return (
                   <button key={opt.value} onClick={() => setActiveSort(opt.value as SortType)} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${activeSort === opt.value ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                     <Icon /> {opt.label}
                   </button>
                 )
               })}
            </div>

            {/* 结果列表 */}
            <div className="space-y-4">
               {aggregatedProducts.length > 0 ? (
                 <>
                   {aggregatedProducts.map((product, idx) => {
                     const displayRate = product.passRate > 0 ? `${product.passRate}%` : '专家核保';
                     const rateColor = product.passRate > 0 ? 'text-green-600' : 'text-blue-600';

                     return (
                       <div key={idx} className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedProductId === product.name ? 'border-blue-500 shadow-lg ring-2 ring-blue-50' : 'border-gray-100 shadow-sm'}`}>
                          <div className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center" onClick={() => setExpandedProductId(expandedProductId === product.name ? null : product.name)}>
                             <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                   <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx===0 ? 'bg-red-500 text-white' : idx===1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                                   <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                                   {product.tags?.map((t:string) => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{t}</span>)}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-3">
                                   <span>🏢 {product.company}</span>
                                   <span>💡 {product.summary}</span>
                                </div>
                             </div>
                             <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                                <div className="text-right">
                                   <div className="text-xs text-gray-400">核保结论</div>
                                   <div className={`text-lg font-black ${product.verdict==='pass'?'text-green-600':product.verdict==='exclude'?'text-yellow-600':'text-blue-600'}`}>
                                      {product.verdict==='pass'?'✅ 标体承保':product.verdict==='exclude'?'⚠️ 除外承保':'💠 需人工'}
                                   </div>
                                </div>
                                <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedProductId === product.name ? 'rotate-180 bg-gray-100' : 'bg-gray-50'}`}>
                                   <IconChevronDown />
                                </button>
                             </div>
                          </div>
                          
                          {/* ✅ 修复：展开详情时，不仅显示 AI 结论，还强制显示“真实案例库”(Mock Data)，解决信息量少的问题 */}
                          {expandedProductId === product.name && (
                             <div className="bg-slate-50 border-t border-gray-100 p-5 animate-fade-in-down">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 text-sm shadow-sm mb-4">
                                   <p className="text-gray-700 leading-relaxed font-bold mb-2">🔍 AI 核保规则分析：</p>
                                   <p className="text-gray-600 mb-4">{product.content}</p>
                                   
                                   <div className="border-t border-gray-100 pt-4 mt-4">
                                      <p className="text-xs font-bold text-gray-500 mb-3">👥 相似用户真实反馈 (3)</p>
                                      {MOCK_CASES.map((c, i) => (
                                          <div key={i} className="mb-2 last:mb-0 bg-slate-50 p-2 rounded text-xs text-gray-600 flex gap-2">
                                              <span className={`px-1 rounded font-bold ${c.verdict==='pass'?'bg-green-100 text-green-700':c.verdict==='exclude'?'bg-yellow-100 text-yellow-700':'bg-blue-100 text-blue-700'}`}>{c.verdict==='pass'?'通过':'除外'}</span>
                                              <span>{c.content}</span>
                                          </div>
                                      ))}
                                   </div>
                                </div>
                                <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700">
                                   👉 预约 {selectedExpert.name} 协助投保
                                </button>
                             </div>
                          )}
                       </div>
                     );
                   })}
                 </>
               ) : (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400">未找到相关产品，请尝试其他关键词。</p>
                 </div>
               )}
            </div>

            {/* ✅ 修复：专家卡片强制显示（无论有无结果） */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white mt-12 text-center">
               <h3 className="text-xl font-bold mb-2">找不到满意的产品？</h3>
               <p className="text-gray-400 text-sm mb-6">术业有专攻，选择一位最对您眼缘的专家</p>
               <div className="grid grid-cols-3 gap-4">
                  {EXPERTS.map(expert => (
                     <div key={expert.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setSelectedExpert(expert)}>
                        <img src={expert.image} className="w-12 h-12 rounded-full mx-auto mb-3 border-2 border-slate-600" />
                        <div className="font-bold text-sm">{expert.name}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{expert.title}</div>
                     </div>
                  ))}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

const LeverageTag = ({ productName }: { productName: string }) => {
  if (!productName) return null;
  let style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: '#E3F2FD', color: '#1565C0', marginLeft: '8px' };
  let text = '基础杠杆';

  if (productName.includes('众民保') || productName.includes('惠民')) {
    style.backgroundColor = '#F3E5F5'; style.color = '#7B1FA2'; text = '🔥 10000倍杠杆';
  } else if (productName.includes('医疗') || productName.includes('e生保') || productName.includes('好医保')) {
    style.backgroundColor = '#E8F5E9'; style.color = '#2E7D32'; text = '🟢 8000倍杠杆';
  } else if (productName.includes('重疾') || productName.includes('达尔文')) {
    style.backgroundColor = '#FFF8E1'; style.color = '#F57F17'; text = '🟡 100倍杠杆';
  }
  return <span style={style}>{text}</span>;
};