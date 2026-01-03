'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase 客户端 (用于公开搜索，使用你的环境变量)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // 🔍 核心功能：只搜不填，直接查库
  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)

    // 在 cases 表（正式库）里模糊搜索
    // 搜索逻辑：只要 疾病名、正文、或摘要里 包含关键词，都算命中
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${query}%, content.ilike.%${query}%, summary.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('搜索出错:', error)
    } else {
      setResults(data || [])
    }
    setLoading(false)
  }

  // 监听回车键，提升体验
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 1. 顶部极简导航 */}
      <nav className="w-full border-b border-gray-100 py-4 px-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
          🛡️ 非标体核保库 <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Beta</span>
        </div>
        {/* 这里保留一个入口，给直接想提交的人 */}
        <a href="/submit" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
          提交新案例 &rarr;
        </a>
      </nav>

      {/* 2. 核心搜索区 (模仿 Google 首页布局) */}
      <main className="flex-1 flex flex-col items-center px-4 pt-20 md:pt-32">
        
        {/* 标题 */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 text-center tracking-tight">
          身体有异常，还能买保险吗？
        </h1>
        <p className="text-lg text-gray-500 mb-10 text-center max-w-xl">
          输入您的疾病名称（如：甲状腺、乳腺、高血压），<br className="md:hidden"/>
          <span className="text-blue-600 font-medium">1秒查询</span> 过往核保结论，拒绝盲目投保。
        </p>

        {/* 大搜索框 */}
        <div className="w-full max-w-2xl relative mb-16 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="试着搜一下：甲状腺结节 3级..."
            className="w-full h-16 pl-14 pr-32 rounded-full border border-gray-200 shadow-sm text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all hover:shadow-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all shadow-sm active:scale-95"
          >
            {loading ? '...' : '搜索'}
          </button>
        </div>

        {/* 3. 搜索结果展示区 */}
        <div className="w-full max-w-3xl pb-20 space-y-6">
          
          {/* A. 没搜到时的引导 (关键：这时候才让用户填表) */}
          {hasSearched && results.length === 0 && !loading && (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
              <div className="text-4xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">暂未收录相关案例</h3>
              <p className="text-gray-500 mb-6">数据库里暂时还没有关于“{query}”的记录。</p>
              
              <a href="/submit" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                🚀 免费提交 AI 核保分析
              </a>
              <p className="text-xs text-gray-400 mt-4">提交后，AI 将为您分析核保可能性，并加入数据库帮助他人。</p>
            </div>
          )}

          {/* B. 搜到了！直接展示卡片 */}
          {results.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              {/* 头部：标签 */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium">
                    {item.disease_type || '未分类'}
                  </span>
                  {/* 动态颜色标签 */}
                  {item.verdict === 'pass' && <span className="px-2 py-1 bg-green-50 text-green-600 border border-green-100 text-xs rounded-md font-medium">✨ 正常承保</span>}
                  {item.verdict === 'exclude' && <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 text-xs rounded-md font-medium">⚠️ 除外承保</span>}
                  {item.verdict === 'reject' && <span className="px-2 py-1 bg-gray-100 text-gray-500 border border-gray-200 text-xs rounded-md font-medium">🚫 拒保</span>}
                </div>
                <span className="text-xs text-gray-300">#{item.id}</span>
              </div>
              
              {/* 内容：优先显示 AI 总结 */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                 {item.summary || item.content.substring(0, 40) + '...'}
              </h3>
              
              <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                {item.content}
              </p>

              {/* 底部 AI 分析条 */}
              {item.ai_analysis && (
                 <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-50 flex gap-3 items-start">
                   <span className="text-lg">🤖</span>
                   <p className="text-sm text-blue-800 leading-snug">
                     <strong>AI 分析建议：</strong> 
                     该案例中，用户因 {item.disease_type} 被判定为
                     {item.verdict === 'exclude' ? '除外承保（该部位不保）' : '正常承保'}。
                     <span className="opacity-70">具体结论需视最新核保风控而定。</span>
                   </p>
                 </div>
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}