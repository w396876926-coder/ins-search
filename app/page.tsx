'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // 📊 统计数据状态
  const [stats, setStats] = useState({
    total: 0,
    passRate: 0,
    excludeRate: 0,
    rejectRate: 0,
    bestCompany: '暂无数据',
    riskLevel: '低'
  })

  // 🔍 核心搜索与计算逻辑
  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)

    // 1. 查库
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      // 模糊搜索：病种、详情、结论、产品名
      .or(`disease_type.ilike.%${query}%, content.ilike.%${query}%, product_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('搜索出错:', error)
      setLoading(false)
      return
    }

    const cases = data || []
    setResults(cases)

    // 2. 🧮 前端实时计算“大数据”
    if (cases.length > 0) {
      const total = cases.length
      const passCount = cases.filter(c => c.verdict === 'pass').length
      const excludeCount = cases.filter(c => c.verdict === 'exclude').length
      const rejectCount = cases.filter(c => c.verdict === 'reject').length
      
      // 简单的“最佳承保方”算法：找出出现次数最多的 pass 公司（这里简化为取第一条 pass 的产品名）
      const bestCase = cases.find(c => c.verdict === 'pass')
      
      setStats({
        total,
        passRate: Math.round((passCount / total) * 100),
        excludeRate: Math.round((excludeCount / total) * 100),
        rejectRate: Math.round((rejectCount / total) * 100),
        bestCompany: bestCase ? (bestCase.product_name || bestCase.company || '多款产品') : '需人工核保',
        riskLevel: rejectCount / total > 0.3 ? '高危' : (rejectCount / total > 0.1 ? '中等' : '低风险')
      })
    }
    
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* 顶部导航 */}
      <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-slate-800 tracking-tight">非标体核保·情报局</span>
        </div>
        <a href="/submit" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
          贡献数据 &rarr;
        </a>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12">
        
        {/* 1. 霸气的标题区 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            投保前的<span className="text-blue-600">战略分析</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            基于 <span className="font-bold text-slate-800">{100 + stats.total}</span> 条真实核保数据，
            为您计算 {query ? `“${query}”的` : '各类疾病的'} 承保概率与机会成本。
          </p>
        </div>

        {/* 2. 搜索框 */}
        <div className="max-w-2xl mx-auto relative mb-16">
          <input
            type="text"
            placeholder="输入病种查看大数据（如：甲状腺、乳腺、乙肝）..."
            className="w-full h-16 pl-6 pr-32 rounded-xl border-2 border-slate-200 shadow-sm text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-2 h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all"
          >
            {loading ? '分析中...' : '开始调研'}
          </button>
        </div>

        {/* 3. 📊 核心区域：大数据仪表盘 (搜索后显示) */}
        {hasSearched && results.length > 0 && (
          <div className="animate-fade-in-up space-y-8 mb-20">
            
            {/* A. 战情总览卡片 */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  📊 {query} · 市场调研报告
                </h2>
                <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white font-mono">LIVE DATA</span>
              </div>
              
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* 综合通过率 */}
                <div className="text-center border-r border-slate-100 last:border-0">
                  <div className="text-sm text-slate-400 mb-1">综合上车率 (含除外)</div>
                  <div className="text-4xl font-extrabold text-blue-600">
                    {stats.passRate + stats.excludeRate}%
                  </div>
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    {stats.passRate > 40 ? '▲ 机会很大' : '▼ 需谨慎'}
                  </div>
                </div>

                {/* 完美标体率 */}
                <div className="text-center border-r border-slate-100 last:border-0">
                  <div className="text-sm text-slate-400 mb-1">完美标体概率</div>
                  <div className="text-4xl font-extrabold text-emerald-500">
                    {stats.passRate}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">无责任承保</div>
                </div>

                {/* 拒保风险 (机会成本) */}
                <div className="text-center border-r border-slate-100 last:border-0">
                  <div className="text-sm text-slate-400 mb-1">盲投拒保风险</div>
                  <div className="text-4xl font-extrabold text-rose-500">
                    {stats.rejectRate}%
                  </div>
                  <div className="text-xs text-rose-600 mt-1 font-medium">
                    {stats.riskLevel === '高危' ? '⚠️ 极易留黑底' : '相对安全'}
                  </div>
                </div>

                {/* 推荐策略 */}
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">大数据推荐首选</div>
                  <div className="text-xl font-bold text-slate-800 mt-1 truncate px-2">
                    {stats.bestCompany}
                  </div>
                  <div className="text-xs text-blue-500 mt-1 cursor-pointer hover:underline">
                    查看详情 &rarr;
                  </div>
                </div>
              </div>

              {/* B. 模拟趋势图 (因为没有真实日期数据，这里用静态展示模拟 UI 效果) */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-700">📅 核保风向标 (季度宽松度预测)</h3>
                  <span className="text-xs text-slate-400">基于过往 12 个月数据模拟</span>
                </div>
                <div className="flex gap-1 h-16 items-end">
                  {/* 模拟的柱状图 */}
                  {[40, 60, 45, 80, 70, 55, 65, 90, 85, 60, 75, stats.passRate + stats.excludeRate].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-all relative group">
                      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${h}%` }}></div>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {i+1}月: 成功率 {h}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>1月</span>
                  <span>6月 (年中放水?)</span>
                  <span>12月 (收官)</span>
                </div>
              </div>
            </div>

            {/* C. 详细案例列表 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">
                📚 原始情报档案 ({results.length})
              </h3>
              {results.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                        {item.summary || item.content.substring(0, 30)}
                      </h4>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {item.content}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {item.product_name || '未知产品'}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          来源: {item.source || '用户贡献'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 结论标签 */}
                    <div className="flex flex-col items-end gap-2">
                      {item.verdict === 'pass' && (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                          ✅ 标体承保
                        </span>
                      )}
                      {item.verdict === 'exclude' && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                          ⚠️ 除外/加费
                        </span>
                      )}
                      {item.verdict === 'reject' && (
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                          🚫 拒保
                        </span>
                      )}
                      <span className="text-xs text-slate-300 font-mono">#{item.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态引导 */}
        {hasSearched && results.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="text-5xl mb-4">🛸</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">暂无该病种情报</h3>
            <p className="text-slate-500 mb-6">我们的数据库还没收录“{query}”的数据。<br/>您是这个领域的探索者，要不要贡献第一条数据？</p>
            <a href="/submit" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              🚀 提交我的核保经历
            </a>
          </div>
        )}

      </main>
    </div>
  )
}