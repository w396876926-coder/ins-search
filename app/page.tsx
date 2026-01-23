'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. 静态数据配置 (首页榜单、分类、专家)
// ==========================================

const CATEGORIES = [
  { id: 'nodule', name: '结节/囊肿', icon: '🍒', keywords: ['肺结节', '甲状腺结节', '乳腺结节'] },
  { id: 'liver', name: '肝胆异常', icon: '🥃', keywords: ['乙肝', '脂肪肝', '胆囊息肉'] },
  { id: 'metabolic', name: '三高/痛风', icon: '🍔', keywords: ['高血压', '糖尿病', '高尿酸'] },
  { id: 'mental', name: '精神/心理', icon: '🧠', keywords: ['抑郁症', '焦虑症', '睡眠障碍'] },
  { id: 'child', name: '少儿/先天', icon: '👶', keywords: ['腺样体', '卵圆孔', '自闭症'] },
]

const EXPERTS = [
  { id: 'e1', name: 'Alex', title: '资深核保专家', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', gender: 'male' },
  { id: 'e2', name: 'Bella', title: '医学硕士', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', gender: 'female' },
]

// 首页静态榜单数据 (还原图二的效果)
const HOME_LEADERBOARD = [
  { rank: 1, name: '甲状腺结节 1-2级', ratio: '1 : 850', tag: '标体承保', desc: '百万医疗险+重疾险完美组合' },
  { rank: 2, name: '乳腺结节 3级', ratio: '1 : 600', tag: '除外+复发险', desc: '利用专项复发险补齐短板' },
  { rank: 3, name: '乙肝小三阳', ratio: '1 : 550', tag: '加费承保', desc: '虽然加费但保障全面' },
  { rank: 4, name: '肺微浸润腺癌', ratio: '1 : 120', tag: '术后逆袭', desc: '防癌医疗险+惠民保兜底' },
]

// 排序选项 (对应图四)
type SortType = 'recommend' | 'leverage' | 'coverage' | 'company'
const SORT_OPTIONS = [
  { value: 'recommend', label: '🔥 综合推荐', icon: '👍' },
  { value: 'leverage', label: '💰 高性价比', icon: '📈' },
  { value: 'coverage', label: '🛡️ 覆盖率广', icon: '☂️' },
  { value: 'company', label: '🏢 大公司', icon: 'qy' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [rawCases, setRawCases] = useState<any[]>([]) // 原始数据库案例
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])
  
  // 交互状态
  const [activeHomeTab, setActiveHomeTab] = useState<'leverage' | 'hot'>('leverage')
  const [activeSort, setActiveSort] = useState<SortType>('recommend')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null) // 控制哪个产品展开显示详情

  // 🧠 搜索逻辑
  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim()) return
    
    if (keywordOverride) setQuery(keywordOverride)
    setLoading(true)
    setHasSearched(true)
    setExpandedProductId(null) // 重置展开状态

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (data) {
      setRawCases(data)
    }
    setLoading(false)
  }

  // 🔄 核心数据聚合逻辑：把零散的 cases 聚合成 Products (对应需求 2)
  const aggregatedProducts = useMemo(() => {
    if (!rawCases.length) return []

    const productMap: Record<string, any> = {}

    rawCases.forEach(item => {
      const pName = item.product_name || '未知产品'
      if (!productMap[pName]) {
        productMap[pName] = {
          name: pName,
          company: item.company || '通用保司',
          cases: [], // 存放具体的案例列表
          passCount: 0,
          totalCount: 0,
          // 模拟一些维度分数 (因为数据库没存，这里根据名称模拟，让排序生效)
          leverageScore: pName.includes('惠民') ? 10000 : (pName.includes('医疗') ? 8000 : 100),
          companyScore: (item.company?.includes('平安') || item.company?.includes('人保')) ? 9.8 : 8.5,
          coverageScore: Math.floor(Math.random() * 2000) + 500 // 模拟热度
        }
      }
      productMap[pName].cases.push(item)
      productMap[pName].totalCount += 1
      if (item.verdict === 'pass') productMap[pName].passCount += 1
    })

    // 转为数组并排序
    let productList = Object.values(productMap)

    // 排序逻辑
    productList.sort((a: any, b: any) => {
      if (activeSort === 'leverage') return b.leverageScore - a.leverageScore
      if (activeSort === 'company') return b.companyScore - a.companyScore
      if (activeSort === 'coverage') return b.coverageScore - a.coverageScore
      // 默认综合推荐：通过率高的排前面
      return (b.passCount / b.totalCount) - (a.passCount / a.totalCount)
    })

    return productList.slice(0, 5) // 只取前 5 (对应需求 2)
  }, [rawCases, activeSort])

  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setRawCases([])
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 pb-20">
      
      {/* 顶部导航 */}
      <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={resetHome}>
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-gray-800 tracking-tight">HealthGuardian</span>
        </div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <img src={selectedExpert.image} alt="Expert" className="w-9 h-9 rounded-full border border-gray-200 group-hover:border-blue-500" />
          <div className="text-xs text-right hidden md:block">
            <div className="font-bold text-gray-800">顾问: {selectedExpert.name}</div>
            <div className="text-gray-400 group-hover:text-blue-600">切换专家 &rarr;</div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {/* =========================================
            首页状态 (对应需求 1：加上榜单)
           ========================================= */}
        {!hasSearched ? (
          <div className="text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              身体有异常，<br className="md:hidden" />还能买保险吗？
            </h1>
            <p className="text-gray-500 mb-10 max-w-xl mx-auto">
              全网核保大数据库 · <span className="text-blue-600 font-bold">AI 智能匹配</span> · 拒保复活攻略
            </p>
            
            <div className="max-w-2xl mx-auto mb-10 relative">
              <input
                type="text"
                placeholder="输入疾病名（如：甲状腺结节、大三阳）..."
                className="w-full h-14 pl-6 pr-32 rounded-full border-2 border-indigo-50 shadow-lg shadow-indigo-50/50 focus:border-blue-500 focus:outline-none transition-all text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={() => handleSearch()}
                className="absolute right-2 top-2 h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
              >
                {loading ? '...' : '生成攻略'}
              </button>
            </div>

            {/* 快速分类 */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSearch(cat.keywords[0])}
                  className="bg-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:text-blue-600 transition-all border border-gray-100 flex items-center gap-2"
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>

            {/* 🏆 首页榜单 (恢复图二的功能) */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden text-left">
               {/* 榜单 Tab */}
               <div className="flex border-b border-gray-50">
                  <button 
                    onClick={() => setActiveHomeTab('leverage')}
                    className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'leverage' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    💰 投保逆袭榜 (高杠杆)
                  </button>
                  <button 
                     onClick={() => setActiveHomeTab('hot')}
                     className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'hot' ? 'text-orange-500 bg-orange-50/50 border-b-2 border-orange-500' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    🔥 疾病焦虑榜 (热搜)
                  </button>
               </div>

               {/* 榜单列表 */}
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
        ) : (
          
          /* =========================================
             结果状态 (对应需求 2 & 3：聚合排行 + 详情展开)
             ========================================= */
          <div className="animate-fade-in-up space-y-6">
            
            {/* 1. 策略仪表盘 (保留您喜欢的图三) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">📊 {query} · AI 核保策略</h2>
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">中等风险</span>
                   </div>
                   <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 flex gap-4 items-center">
                      <div className="text-center px-4 border-r border-gray-200">
                         <div className="text-xs text-gray-400">预估杠杆</div>
                         <div className="text-2xl font-black text-blue-600">1:200</div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                         <p>✅ <span className="font-bold">首选策略：</span>除外承保重疾险 + 0免赔医疗险</p>
                         <p>🛡️ <span className="font-bold">兜底策略：</span>惠民保 (防并发症)</p>
                      </div>
                   </div>
                </div>
                <div className="text-center min-w-[120px]">
                   <img src={selectedExpert.image} className="w-14 h-14 rounded-full mx-auto mb-2 border-2 border-white shadow" />
                   <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:bg-blue-700 transition-all">
                      咨询 {selectedExpert.name}
                   </button>
                </div>
            </div>

            {/* 2. 排序 Tab (对应需求 2：图四样式) */}
            <div className="flex flex-wrap gap-3 py-2">
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

            {/* 3. 产品聚合排行榜 (对应需求 2：显示 Top 5 产品) */}
            <div className="space-y-4">
               {aggregatedProducts.length > 0 ? aggregatedProducts.map((product: any, idx) => (
                 <div key={idx} className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedProductId === product.name ? 'border-blue-500 shadow-lg ring-2 ring-blue-50' : 'border-gray-100 shadow-sm hover:border-blue-200'}`}>
                    
                    {/* 产品卡片头部 (点击可展开) */}
                    <div 
                      className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center"
                      onClick={() => setExpandedProductId(expandedProductId === product.name ? null : product.name)}
                    >
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             {/* 排名徽章 */}
                             <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx===0 ? 'bg-red-500 text-white' : idx===1 ? 'bg-orange-500 text-white' : idx===2 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {idx + 1}
                             </span>
                             <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                             <LeverageTag productName={product.name} />
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-3">
                             <span>🏢 {product.company}</span>
                             <span>📝 收录案例: {product.totalCount} 条</span>
                             <span>🔥 综合热度: {product.coverageScore}</span>
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

                    {/* 4. 详情展开区 (对应需求 3：点击产品才看案例) */}
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
                                👉 既然能买，找 {selectedExpert.name} 协助投保
                             </button>
                          </div>
                       </div>
                    )}

                 </div>
               )) : (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400">暂无该分类的推荐产品，试试搜索“惠民保”兜底？</p>
                 </div>
               )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

// 杠杆标签组件 (保持不变)
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