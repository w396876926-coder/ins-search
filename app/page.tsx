'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. 数据字典与模拟数据 (新架构核心配置)
// ==========================================

// 🏷️ 快速分类入口 (对应需求 Point 1)
const CATEGORIES = [
  { id: 'nodule', name: '结节/囊肿', icon: '🍒', keywords: ['肺结节', '甲状腺结节', '乳腺结节'] },
  { id: 'liver', name: '肝胆异常', icon: '🥃', keywords: ['乙肝', '脂肪肝', '胆囊息肉'] },
  { id: 'metabolic', name: '三高/痛风', icon: '🍔', keywords: ['高血压', '糖尿病', '高尿酸'] },
  { id: 'mental', name: '精神/心理', icon: '🧠', keywords: ['抑郁症', '焦虑症', '睡眠障碍'] },
  { id: 'child', name: '少儿/先天', icon: '👶', keywords: ['腺样体', '卵圆孔', '自闭症'] },
]

// 👨‍⚕️ 颜值专家库 (对应需求 Point 5)
const EXPERTS = [
  { id: 'e1', name: 'Alex', title: '资深核保专家', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', gender: 'male', tags: ['帅哥', '逻辑强'] },
  { id: 'e2', name: 'Bella', title: '医学硕士', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', gender: 'female', tags: ['美女', '温柔'] },
  { id: 'e3', name: 'Chris', title: '前核保员', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris', gender: 'male', tags: ['严谨', '干货'] },
]

// 📊 排序选项 (对应需求 Point 3)
type SortType = 'recommend' | 'leverage' | 'coverage' | 'reliability'
const SORT_OPTIONS = [
  { value: 'recommend', label: '综合推荐' },
  { value: 'leverage', label: '💰 性价比高 (杠杆)' },
  { value: 'coverage', label: '🛡️ 覆盖率广' },
  { value: 'reliability', label: '🏢 可靠度高 (大公司)' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeSort, setActiveSort] = useState<SortType>('recommend')
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0]) // 默认选中第一个专家

  // 🔍 搜索逻辑
  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim()) return
    
    if (keywordOverride) setQuery(keywordOverride)
    setLoading(true)
    setHasSearched(true)

    // 调用 Supabase 查询
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (data) {
      // 模拟点击率和投产比数据 (因为数据库暂时没这两个字段，前端先模拟展示效果，为了 Point 3 的排序功能)
      const enrichedData = data.map(item => ({
        ...item,
        clickRate: Math.floor(Math.random() * 5000) + 1000, // 模拟点击率
        companyScore: item.company?.includes('平安') || item.company?.includes('人保') ? 9.8 : 8.5, // 模拟可靠度
        leverageScore: item.product_name?.includes('惠民') ? 10000 : 8000 // 模拟杠杆
      }))
      setResults(enrichedData)
    }
    setLoading(false)
  }

  // 🔄 排序逻辑 (对应需求 Point 3)
  const sortedResults = [...results].sort((a, b) => {
    if (activeSort === 'leverage') return b.leverageScore - a.leverageScore
    if (activeSort === 'coverage') return b.clickRate - a.clickRate // 点击率高代表覆盖广
    if (activeSort === 'reliability') return b.companyScore - a.companyScore
    return 0 // 默认推荐
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 pb-20">
      
      {/* 顶部导航 & 创始人引流 (对应 Point 5) */}
      <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-gray-800 tracking-tight">HealthGuardian</span>
        </div>
        
        {/* 右上角专家切换 */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <img src={selectedExpert.image} alt="Expert" className="w-10 h-10 rounded-full border-2 border-blue-100 group-hover:border-blue-500 transition-colors" />
          <div className="text-xs text-right hidden md:block">
            <div className="font-bold text-gray-800 group-hover:text-blue-600">专属顾问: {selectedExpert.name}</div>
            <div className="text-gray-400 group-hover:text-blue-500">点此切换专家 &rarr;</div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {/* 1. 搜索与快速分类区 (对应 Point 1) */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
            不确定自己属于哪类？<br className="md:hidden" />AI 帮你快速归类
          </h1>
          
          <div className="relative max-w-2xl mx-auto mb-8">
            <input
              type="text"
              placeholder="输入疾病名称（如：大三阳）..."
              className="w-full h-14 pl-6 pr-32 rounded-full border-2 border-blue-100 shadow-sm focus:border-blue-500 focus:outline-none transition-all text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={() => handleSearch()}
              className="absolute right-2 top-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
            >
              {loading ? '分析中...' : '搜索'}
            </button>
          </div>

          {/* 快速分类 Tag (Point 1: 关键改动) */}
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleSearch(cat.keywords[0])}
                className="bg-white px-5 py-3 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 flex items-center gap-2"
              >
                <span className="text-lg">{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {hasSearched && (
          <div className="animate-fade-in-up">
            
            {/* 2. 排序与筛选 (对应 Point 3) */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveSort(opt.value as SortType)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    activeSort === opt.value 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 结果列表 */}
            <div className="space-y-6">
              {sortedResults.length > 0 ? sortedResults.map((item, index) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                  
                  {/* 核心信息区 */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {/* 杠杆率计算公式 (对应 Point 2) */}
                        <LeverageTag productName={item.product_name} />
                        <h3 className="text-xl font-bold text-gray-900 mt-2 flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">No.{index + 1}</span>
                          {item.product_name || '推荐保险产品'}
                        </h3>
                        {/* 公司概况 (Point 4) */}
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                           <span>🏢 出品方：{item.company || '未知保司'}</span>
                           <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                           <span>✅ 核保结论：{item.verdict === 'pass' ? '标体承保' : item.verdict === 'exclude' ? '除外承保' : '拒保'}</span>
                        </div>
                      </div>
                      
                      {/* 专家抖音引流 (对应 Point 4) */}
                      <div className="hidden md:block text-center min-w-[80px]">
                        <img src={selectedExpert.image} className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-blue-100" />
                        <a href="#" className="block text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors">
                          📺 专家解读
                        </a>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {item.content}
                    </p>

                    {/* 底部功能栏 (对应 Point 4 & 5) */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">🔥 {item.clickRate} 人点击</span>
                        <span className="flex items-center gap-1">⭐ 可靠度 {item.companyScore}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors">
                          产品详情
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-1">
                          💬 免费咨询 {selectedExpert.name}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400">暂无相关数据，换个关键词或分类试试？</p>
                </div>
              )}
            </div>

            {/* 底部专家墙 (对应 Point 5: 创始人/颜值引流) */}
            <div className="mt-16 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white text-center">
              <h3 className="text-xl font-bold mb-2">👩‍⚕️ 没找到合适的？</h3>
              <p className="text-indigo-200 text-sm mb-6">选择一位您喜欢的顾问，1对1免费协助核保</p>
              
              <div className="flex justify-center gap-6 overflow-x-auto pb-4">
                {EXPERTS.map(expert => (
                  <div 
                    key={expert.id}
                    onClick={() => setSelectedExpert(expert)}
                    className={`cursor-pointer p-4 rounded-xl transition-all min-w-[100px] ${
                      selectedExpert.id === expert.id ? 'bg-white/20 ring-2 ring-white transform scale-105' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <img src={expert.image} className="w-14 h-14 rounded-full mx-auto mb-3 bg-white" />
                    <div className="font-bold text-sm">{expert.name}</div>
                    <div className="text-xs text-indigo-200 mb-2">{expert.title}</div>
                    <div className="flex gap-1 justify-center flex-wrap">
                      {expert.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-indigo-500/50 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
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

// ==========================================
// 杠杆标签组件 (保持不变，因为非常符合 Point 2)
// ==========================================
const LeverageTag = ({ productName }: { productName: string }) => {
  if (!productName) return null;

  let style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px',
    fontSize: '11px', fontWeight: 700, marginBottom: '4px', backgroundColor: '#E3F2FD', color: '#1565C0',
  };
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