'use client'

import { useState } from 'react'
// 1. 换回最基础的 supabase 客户端，不依赖复杂的 auth 库
import { createClient } from '@supabase/supabase-js'

// 2. 直接用环境变量初始化 (这样最稳，不会报错)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // 🔍 核心功能：只搜不填
  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)

    // 在 cases 表（正式库）里模糊搜索
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      // 搜索 disease_type(疾病名) 或 content(详情) 或 summary(摘要)
      .or(`disease_type.ilike.%${query}%, content.ilike.%${query}%, summary.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('搜索出错:', error)
    } else {
      setResults(data || [])
    }
    setLoading(false)
  }

  // 键盘回车也能搜
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🛡️ 核保案例库 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Pro</span>
        </div>
        <a href="/submit" className="text-sm text-gray-500 hover:text-blue-600">
          找不到案例？点击提交 AI 分析 &rarr;
        </a>
      </nav>

      {/* 核心区域 */}
      <main className="flex-1 flex flex-col items-center px-4 pt-20">
        
        {/* 1. 极简的标题和搜索框 */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 text-center">
          身体有异常，还能买保险吗？
        </h1>
        <p className="text-lg text-gray-500 mb-10 text-center max-w-2xl">
          输入疾病名称（如：甲状腺、乳腺、乙肝），<br className="md:hidden"/>一键查询过往核保结论，拒绝盲目投保。
        </p>

        <div className="w-full max-w-2xl relative mb-12">
          <input
            type="text"
            placeholder="试着搜一下：甲状腺结节 3级..."
            className="w-full h-16 pl-6 pr-32 rounded-full border-2 border-gray-200 shadow-sm text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center justify-center"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 2. 搜索结果展示区 */}
        <div className="w-full max-w-4xl pb-20">
          {hasSearched && results.length === 0 && !loading && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 mb-4">📚 暂未收录相关案例</p>
              <a href="/submit" className="text-blue-600 font-medium hover:underline">
                点击这里，提交您的具体情况，让 AI 帮您分析 &rarr;
              </a>
            </div>
          )}

          <div className="grid gap-4">
            {results.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {item.disease_type || '未分类'}
                    </span>
                    {item.verdict === 'pass' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">正常承保</span>}
                    {item.verdict === 'exclude' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">除外承保</span>}
                    {item.verdict === 'reject' && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">拒保</span>}
                  </div>
                  <span className="text-xs text-gray-400">ID: {item.id}</span>
                </div>
                
                {/* 如果有 AI 摘要就显示摘要，没有就显示原内容 */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">