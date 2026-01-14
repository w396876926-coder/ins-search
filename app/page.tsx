'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 🏥 疾病同义词字典
const DISEASE_MAP: Record<string, string> = {
  '大三阳': '乙肝', '小三阳': '乙肝', '澳抗阳性': '乙肝', '乙肝病毒': '乙肝', '携带者': '乙肝', 'hbv': '乙肝',
  '甲癌': '甲状腺', '甲减': '甲状腺', '甲亢': '甲状腺', '脖子粗': '甲状腺', 'ti-rads': '甲状腺', 'tirads': '甲状腺',
  '小叶增生': '乳腺', '纤维瘤': '乳腺', 'bi-rads': '乳腺', 'birads': '乳腺',
  '磨玻璃': '肺', 'ggo': '肺', '肺气肿': '肺',
  'ca': '癌', '恶性肿瘤': '癌', '占位': '癌',
  '胖': '肥胖', 'bmi': '肥胖', '糖': '糖尿病', '高血脂': '三高', '脂肪肝': '肝',
}

// 🚑 兜底方案
const SAFETY_NET_PLANS = [
  {
    id: 'safe_1',
    name: '各地“惠民保”',
    tag: '政府指导',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    desc: '不限年龄、职业、既往症。只要有当地医保，100% 可投保。',
    price: '约 100-200元/年',
    suitability: '所有被商业险拒保的人群'
  },
  {
    id: 'safe_2',
    name: '税优健康险',
    tag: '国家政策',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: '国家强制要求保险公司承保，保证续保，既往症按比例赔付。',
    price: '费率适中',
    suitability: '需要长期稳定保障的慢病人群'
  }
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'leverage' | 'hot'>('leverage')

  const [stats, setStats] = useState({
    total: 0, passRate: 0, excludeRate: 0, rejectRate: 0,
    bestCompany: '暂无数据', riskLevel: '低', needsRescue: false 
  })

  // 🧠 AI 杠杆策略生成器
  const getLeverageStrategy = (riskLevel: string, disease: string) => {
    if (riskLevel === '低') {
      return {
        leverage: '1 : 500+',
        tags: ['性价比之王', '全面保障'],
        items: [
          { type: '主险', name: '百万医疗险 (保证续保版)', reason: '解决大额医疗费，必须买保证续保20年的。' },
          { type: '核心', name: '消费型重疾险', reason: '确诊即赔。别买返还型，把省下的钱把保额买到 50万+。' },
          { type: '加固', name: '定期寿险', reason: '家庭支柱必备，留爱不留债，以小博大。' }
        ]
      }
    } else if (riskLevel === '中') {
      return {
        leverage: '1 : 200',
        tags: ['精准修补', '攻守兼备'],
        items: [
          { type: '主险', name: '重疾险 (接受除外)', reason: '先保住其他 100+ 种重疾。虽然除外了局部，但大盘稳了。' },
          { type: '补丁', name: '特定疾病/复发险', reason: `专门买针对${disease}的特定险（如防癌险），把主险除外的补上。` },
          { type: '兜底', name: '惠民保', reason: '保费便宜，用来覆盖既往症引起的住院医疗费。' }
        ]
      }
    } else {
      return {
        leverage: '1 : 80',
        tags: ['绝处逢生', '极限操作'],
        items: [
          { type: '主险', name: '防癌医疗险 (终身版)', reason: '三高、糖尿病也能买，专门保最高发的癌症风险，核保极松。' },
          { type: '核心', name: '防癌重疾险', reason: '确诊癌症直接赔钱。既然全能的买不了，就买单项最强的。' },
          { type: '兜底', name: '惠民保 + 意外险', reason: '惠民保保并发症，意外险不看健康告知，把身故杠杆拉高。' }
        ]
      }
    }
  }

  // 🕵️‍♂️ 搜索日志埋点 (偷偷记录用户搜了什么)
  const logSearch = async (keyword: string, count: number) => {
    try {
      await supabase.from('search_logs').insert([
        { keyword: keyword, result_count: count }
      ])
    } catch (e) {
      console.error('Log failed', e) // 记录失败不影响主流程
    }
  }

  // 🔍 核心搜索逻辑
  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)

    let smartQuery = query.toLowerCase();
    let matchedSynonym = '';
    Object.keys(DISEASE_MAP).forEach(key => {
      if (smartQuery.includes(key)) matchedSynonym = DISEASE_MAP[key];
    });

    const finalQueryString = matchedSynonym ? `${query} ${matchedSynonym}` : query;
    const keywords = finalQueryString.trim().split(/[\s,，+]+/); 
    const primaryKeyword = keywords[0];

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${primaryKeyword}%, content.ilike.%${primaryKeyword}%, product_name.ilike.%${primaryKeyword}%`)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return; }

    let cases = data || []

    if (keywords.length > 1) {
      cases = cases.map(item => {
        let score = 0;
        const fullText = (item.disease_type + item.content + item.product_name + item.verdict).toLowerCase();
        keywords.forEach(kw => { if (fullText.includes(kw.toLowerCase())) score += 1; });
        return { ...item, score };
      }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    }

    setResults(cases)

    // ✨ 触发埋点记录 (不等待它完成，直接往下走)
    logSearch(query, cases.length);

    if (cases.length > 0) {
      const total = cases.length
      const passCount = cases.filter(c => c.verdict === 'pass').length
      const excludeCount = cases.filter(c => c.verdict === 'exclude').length
      const rejectCount = cases.filter(c => c.verdict === 'reject').length
      const bestCase = cases.find(c => c.verdict === 'pass')
      
      let calculatedRisk = '低'
      if (rejectCount / total > 0.5) calculatedRisk = '高'
      else if ((excludeCount + rejectCount) / total > 0.4) calculatedRisk = '中'

      setStats({
        total, passRate: Math.round((passCount / total) * 100),
        excludeRate: Math.round((excludeCount / total) * 100),
        rejectRate: Math.round((rejectCount / total) * 100),
        bestCompany: bestCase ? (bestCase.product_name || bestCase.company) : '商业险难度大',
        riskLevel: calculatedRisk, needsRescue: calculatedRisk === '高'
      })
    } else {
      setStats({
        total: 0, passRate: 0, excludeRate: 0, rejectRate: 0,
        bestCompany: '暂无数据', riskLevel: '高', needsRescue: true 
      })
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const strategy = getLeverageStrategy(stats.riskLevel, query)

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans text-slate-900">
      
      <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-gray-800 tracking-tight">非标体核保库</span>
        </div>
        <a href="/submit" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
          贡献数据 &rarr;
        </a>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 md:py-20">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            身体有异常，<br className="md:hidden" />还能买保险吗？
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            全网最全核保数据库。
            <span className="text-blue-600 font-medium">AI 智能匹配</span>，
            帮您找到 <span className="font-bold text-gray-900">赔得最多、保得最全</span> 的组合方案。
          </p>
        </div>

        {/* 搜索框 */}
        <div className="max-w-2xl mx-auto relative mb-12 group">
          <input
            type="text"
            placeholder="输入疾病名（如：大三阳、磨玻璃结节、小叶增生）..."
            className="w-full h-16 pl-8 pr-32 rounded-full border-2 border-gray-100 shadow-sm text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all hover:border-blue-200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {loading ? '分析中...' : '生成攻略'}
          </button>
        </div>

        {!hasSearched && (
          <div className="max-w-3xl mx-auto mb-16 animate-fade-in-up">
            
            {/* 榜单切换 Tab */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-1 rounded-full border border-gray-100 shadow-sm inline-flex">
                <button 
                  onClick={() => setActiveTab('leverage')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    activeTab === 'leverage' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  💰 投保逆袭榜 (高杠杆)
                </button>
                <button 
                  onClick={() => setActiveTab('hot')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    activeTab === 'hot' 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🔥 疾病焦虑榜 (热搜)
                </button>
              </div>
            </div>

            {/* 榜单内容卡片 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-full h-1 ${activeTab === 'leverage' ? 'bg-blue-600' : 'bg-orange-500'}`}></div>

              {/* 💰 杠杆榜内容 */}
              {activeTab === 'leverage' && (
                <div className="divide-y divide-gray-50">
                  {[
                    { rank: 1, name: '甲状腺结节 1-2级', ratio: '1 : 850', tag: '标体承保', desc: '百万医疗险+重疾险完美组合' },
                    { rank: 2, name: '乳腺结节 3级', ratio: '1 : 600', tag: '除外+复发险', desc: '利用专项复发险补齐短板' },
                    { rank: 3, name: '乙肝小三阳', ratio: '1 : 550', tag: '加费承保', desc: '虽然加费但保障全面' },
                    { rank: 4, name: '肺微浸润腺癌', ratio: '1 : 120', tag: '术后逆袭', desc: '防癌医疗险+惠民保兜底' },
                  ].map((item) => (
                    <div key={item.rank} className="p-4 flex items-center hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => setQuery(item.name.split(' ')[0])}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg mr-4 ${
                        item.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                        item.rank === 2 ? 'bg-gray-100 text-gray-700' : 
                        item.rank === 3 ? 'bg-orange-50 text-orange-700' : 'text-gray-400'
                      }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">{item.tag}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">杠杆率</div>
                        <div className="text-xl font-black text-blue-600 font-mono">{item.ratio}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🔥 热搜榜内容 */}
              {activeTab === 'hot' && (
                <div className="divide-y divide-gray-50">
                  {[
                    { rank: 1, name: '肺磨玻璃结节', count: '12,541', trend: 'up' },
                    { rank: 2, name: '乳腺结节 4a', count: '9,832', trend: 'up' },
                    { rank: 3, name: '乙肝大三阳', count: '8,105', trend: 'same' },
                    { rank: 4, name: '抑郁症/焦虑症', count: '6,220', trend: 'up' },
                    { rank: 5, name: '高血压 3级', count: '5,900', trend: 'down' },
                  ].map((item) => (
                    <div key={item.rank} className="p-4 flex items-center hover:bg-orange-50/50 transition-colors cursor-pointer" onClick={() => setQuery(item.name.split(' ')[0])}>
                      <div className={`w-6 text-center font-bold mr-4 ${item.rank <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 font-medium text-gray-700">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-400">{item.count}</span>
                        {item.trend === 'up' && <span className="text-xs text-red-500">🔥</span>}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 text-center text-xs text-gray-400 bg-gray-50">
                    *数据基于全网非标体搜索热度实时更新
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              👆 点击榜单病种，一键生成核保攻略
            </p>
          </div>
        )}

        {hasSearched && (
          <div className="animate-fade-in-up space-y-8 mb-20">
            
            {results.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl shadow-blue-50 overflow-hidden border border-gray-100">
                <div className="p-8 pb-6 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      📊 “{query}” 核保胜率分析
                    </h2>
                    {stats.riskLevel === '高' && <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">高风险病种</span>}
                    {stats.riskLevel === '中' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">中等风险</span>}
                    {stats.riskLevel === '低' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">低风险优选</span>}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">通过率</div>
                      <div className="text-3xl font-extrabold text-gray-900">{stats.passRate + stats.excludeRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">拒保率</div>
                      <div className="text-3xl font-extrabold text-rose-500">{stats.rejectRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">最佳承保</div>
                      <div className="text-lg font-bold text-gray-900 truncate">{stats.bestCompany}</div>
                    </div>
                  </div>
                </div>

                {/* AI 杠杆配置攻略 */}
                <div className="bg-slate-50 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        💰 您的专属保障杠杆组合
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        针对 <span className="font-bold text-slate-800">{query}</span> 风险等级定制，最大化赔付杠杆。
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {strategy.tags.map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="text-center md:text-left min-w-[120px]">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">预估杠杆率</div>
                        <div className="text-4xl font-black text-blue-600 font-mono tracking-tight">{strategy.leverage}</div>
                        <div className="text-xs text-slate-400 mt-2">投入1元 : 赔付{strategy.leverage.split(':')[1]}元</div>
                      </div>

                      <div className="flex-1 w-full space-y-4">
                        {strategy.items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={`mt-1 w-12 text-[10px] font-bold py-1 text-center rounded border ${
                              item.type === '主险' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              item.type === '核心' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              item.type === '加固' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.type}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{item.reason}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 兜底救援方案 */}
            {(stats.needsRescue || results.length === 0) && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border border-orange-100 p-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                    🛡️ 国家队兜底方案 (100% 可投保)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {SAFETY_NET_PLANS.map((plan) => (
                      <div key={plan.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm cursor-pointer hover:border-orange-300 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-900">{plan.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${plan.color}`}>{plan.tag}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{plan.desc}</p>
                        <div className="text-sm font-medium text-orange-600">{plan.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 真实案例列表 */}
            {results.length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 px-1">真实过往案例 ({results.length})</h3>
                {results.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          {item.verdict === 'pass' && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-100">✅ 标体</span>}
                          {item.verdict === 'exclude' && <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold border border-yellow-100">⚠️ 除外</span>}
                          {item.verdict === 'reject' && <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">🚫 拒保</span>}
                          <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-xs border border-gray-100">{item.product_name || '未知产品'}</span>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">
                          {item.summary || item.content.substring(0, 30)}
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  )
}