'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. 数据配置 (分类、专家、排序)
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

const SAFETY_NET_PLANS = [
  { name: '各地“惠民保”', tag: '政府指导', desc: '不限年龄、职业、既往症。只要有当地医保，100% 可投保。', price: '约 100-200元/年' },
  { name: '税优健康险', tag: '国家政策', desc: '国家强制要求保险公司承保，保证续保，既往症按比例赔付。', price: '费率适中' }
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])

  // 📊 统计数据状态 (用于生成图三的分析面板)
  const [stats, setStats] = useState({
    passRate: 0, excludeRate: 0, rejectRate: 0,
    riskLevel: '低', leverageRatio: '1 : 500'
  })

  // 🧠 核心搜索逻辑
  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim()) return
    
    if (keywordOverride) setQuery(keywordOverride)
    setLoading(true)
    setHasSearched(true)

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setResults(data)
      
      // --- ⚡️ 实时计算胜率 (还原图三的功能) ---
      const total = data.length
      const passCount = data.filter(i => i.verdict === 'pass').length
      const excludeCount = data.filter(i => i.verdict === 'exclude').length
      const rejectCount = data.filter(i => i.verdict === 'reject').length
      
      let calculatedRisk = '低'
      let ratio = '1 : 500' // 默认低风险高杠杆

      if (rejectCount / total > 0.5) {
        calculatedRisk = '高'
        ratio = '1 : 80' // 高风险杠杆降低
      } else if ((excludeCount + rejectCount) / total > 0.4) {
        calculatedRisk = '中'
        ratio = '1 : 200'
      }

      setStats({
        passRate: Math.round(((passCount + excludeCount) / total) * 100), // 通过率 = 标体+除外
        excludeRate: Math.round((excludeCount / total) * 100),
        rejectRate: Math.round((rejectCount / total) * 100),
        riskLevel: calculatedRisk,
        leverageRatio: ratio
      })
    } else {
      setResults([])
      setStats({ passRate: 0, excludeRate: 0, rejectRate: 0, riskLevel: '未知', leverageRatio: '-' })
    }
    setLoading(false)
  }

  // 🔄 重置回首页 (对应问题 1)
  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setResults([])
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-900 pb-20">
      
      {/* 顶部导航 */}
      <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        {/* ✅ 问题1解决：点击 Logo 回到首页 */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={resetHome}>
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-gray-800 tracking-tight">HealthGuardian</span>
        </div>
        
        {/* 专家切换 */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <img src={selectedExpert.image} alt="Expert" className="w-9 h-9 rounded-full border border-gray-200 group-hover:border-blue-500" />
          <div className="text-xs text-right hidden md:block">
            <div className="font-bold text-gray-800">顾问: {selectedExpert.name}</div>
            <div className="text-gray-400 group-hover:text-blue-600">切换专家 &rarr;</div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-12">
        
        {/* =========================================
            首页状态 (对应问题 2：还原图二的文案)
           ========================================= */}
        {!hasSearched ? (
          <div className="text-center mt-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              身体有异常，<br className="md:hidden" />还能买保险吗？
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              全网最全核保数据库。
              <span className="text-blue-600 font-bold"> 智能匹配杠杆策略</span>，
              帮您找到 <span className="font-bold text-gray-900">赔得最多、保得最全</span> 的组合方案。
            </p>
            
            <div className="max-w-2xl mx-auto mb-12 relative">
              <input
                type="text"
                placeholder="输入疾病名（如：肺结节、乳腺癌、高血压）..."
                className="w-full h-16 pl-8 pr-36 rounded-full border-2 border-blue-100 shadow-lg shadow-blue-50 focus:border-blue-500 focus:outline-none transition-all text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={() => handleSearch()}
                className="absolute right-2 top-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-md"
              >
                {loading ? '分析中...' : '生成攻略'}
              </button>
            </div>

            {/* 快速分类 */}
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSearch(cat.keywords[0])}
                  className="bg-white px-5 py-3 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 flex items-center gap-2"
                >
                  <span className="text-lg">{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          
          /* =========================================
             结果状态 (对应问题 3：融合图三分析 + 咨询)
             ========================================= */
          <div className="animate-fade-in-up space-y-8">
            
            {/* 1. 胜率分析大卡片 (完美还原图三) */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-50 overflow-hidden border border-gray-100">
              <div className="p-8 border-b border-gray-50">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    📊 “{query}” 核保胜率分析
                  </h2>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    stats.riskLevel === '高' ? 'bg-rose-100 text-rose-700' :
                    stats.riskLevel === '中' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {stats.riskLevel}风险
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-8 text-center md:text-left">
                  <div>
                    <div className="text-sm text-gray-400 mb-1 font-medium">通过率 (含除外)</div>
                    <div className="text-4xl font-black text-gray-900">{stats.passRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1 font-medium">拒保率</div>
                    <div className="text-4xl font-black text-rose-500">{stats.rejectRate}%</div>
                  </div>
                  <div className="hidden md:block">
                     <div className="text-sm text-gray-400 mb-1 font-medium">最佳承保机会</div>
                     <div className="text-lg font-bold text-gray-800">
                        {results.find(r => r.verdict === 'pass')?.company || '多家对比'}
                     </div>
                  </div>
                </div>
              </div>

              {/* 2. 杠杆策略 + 专家咨询 (这里是融合的关键点！) */}
              <div className="bg-slate-50 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                
                {/* 左侧：杠杆策略 (图三的内容) */}
                <div className="flex-1 w-full bg-white rounded-2xl border border-blue-100 p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-gray-900">💰 您的专属保障杠杆组合</div>
                        <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">精准修补</div>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-4xl font-black text-blue-600 font-mono">{stats.leverageRatio}</div>
                        <div className="text-xs text-gray-400">投入1元 : 赔付{stats.leverageRatio.split(':')[1]}元</div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex gap-2 items-center text-sm">
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-1 rounded">主险</span>
                            <span className="text-gray-600">重疾险 (接受除外) + 百万医疗</span>
                        </div>
                        <div className="flex gap-2 items-center text-sm">
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1 rounded">补丁</span>
                            <span className="text-gray-600">特定疾病/复发险 (填补除外缺口)</span>
                        </div>
                    </div>
                </div>

                {/* 右侧：专家咨询 (您的咨询需求) */}
                <div className="w-full md:w-auto min-w-[240px] text-center">
                    <img src={selectedExpert.image} className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white shadow-md" />
                    <div className="font-bold text-gray-900 mb-1">方案太复杂？</div>
                    <p className="text-xs text-gray-500 mb-4">让 {selectedExpert.name} 为您 1对1 解读核保结论</p>
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <span>💬 免费咨询 {selectedExpert.name}</span>
                    </button>
                    <div className="text-[10px] text-gray-400 mt-2">已有 {Math.floor(Math.random() * 500) + 200} 人咨询</div>
                </div>

              </div>
            </div>

            {/* 3. 兜底方案 (如果全拒保) */}
            {(stats.rejectRate > 80 || results.length === 0) && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6">
                <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">🛡️ 国家队兜底方案 (100% 可投保)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {SAFETY_NET_PLANS.map((plan) => (
                    <div key={plan.name} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-gray-900">{plan.name}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{plan.tag}</span>
                      </div>
                      <div className="text-xs text-gray-500">{plan.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 真实过往案例列表 */}
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">真实过往案例 ({results.length})</h3>
               <div className="space-y-4">
                {results.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex gap-2 mb-2">
                                {item.verdict === 'pass' && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">✅ 标体</span>}
                                {item.verdict === 'exclude' && <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">⚠️ 除外</span>}
                                {item.verdict === 'reject' && <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">🚫 拒保</span>}
                                <span className="text-xs text-gray-400 py-0.5">{item.product_name}</span>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">{item.summary || item.content.substring(0, 20)}</h4>
                            <LeverageTag productName={item.product_name} />
                        </div>
                        {/* 列表里的咨询按钮 */}
                        <button className="hidden md:flex px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 items-center gap-1">
                            <img src={selectedExpert.image} className="w-4 h-4 rounded-full" />
                            <span>专家解读</span>
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.content}</p>
                    
                    {/* 移动端显示的咨询按钮 */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end md:hidden">
                        <button className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md">
                            免费咨询 {selectedExpert.name}
                        </button>
                    </div>
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

// 杠杆标签组件
const LeverageTag = ({ productName }: { productName: string }) => {
  if (!productName) return null;
  let style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#E3F2FD', color: '#1565C0' };
  let text = '🔵 基础杠杆';

  if (productName.includes('众民保') || productName.includes('惠民')) {
    style.backgroundColor = '#F3E5F5'; style.color = '#7B1FA2'; text = '🔥 10000倍杠杆 | 极高投产比';
  } else if (productName.includes('医疗') || productName.includes('e生保') || productName.includes('好医保')) {
    style.backgroundColor = '#E8F5E9'; style.color = '#2E7D32'; text = '🟢 8000倍杠杆 | 高投产比';
  } else if (productName.includes('重疾') || productName.includes('达尔文')) {
    style.backgroundColor = '#FFF8E1'; style.color = '#F57F17'; text = '🟡 100倍杠杆 | 收入补偿';
  }
  return <span style={style}>{text}</span>;
};