import { createClient } from '@/utils/supabase/server'
import { rejectSubmission, approveSubmission, runAiAnalysis } from './actions'
import { Check, X, Sparkles, Bot } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  // 获取待处理数据
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            🛡️ 核保数据审核台
          </h1>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            待处理: {submissions?.length || 0}
          </span>
        </header>

        <div className="space-y-6">
          {submissions?.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* 顶部状态栏 */}
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>ID: {item.id}</span>
                <span>{new Date(item.created_at).toLocaleString('zh-CN')}</span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 左侧：用户原始提交 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">用户原始提交</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">{item.disease_type}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">{item.product_name}</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        item.verdict === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.verdict}
                      </span>
                    </div>
                    <p className="text-slate-700 bg-slate-50 p-4 rounded-lg text-sm leading-relaxed border border-slate-100">
                      {item.content || '（用户未填写详细描述）'}
                    </p>
                  </div>
                </div>

                {/* 右侧：AI 智能分析区 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI 参谋建议
                    </h3>
                  </div>

                  {item.ai_analysis ? (
                    // 🎯 状态 A: 已经分析完成，展示结果
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-purple-400 text-xs">标准病种</span>
                          <div className="font-medium text-slate-800">{item.ai_analysis.disease_type}</div>
                        </div>
                        <div>
                          <span className="text-purple-400 text-xs">核保结论</span>
                          <div className="font-medium text-slate-800">{item.ai_analysis.verdict}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-400 text-xs">病情细节提取</span>
                        <div className="font-medium text-slate-800">{item.ai_analysis.condition_detail}</div>
                      </div>
                      <div>
                        <span className="text-purple-400 text-xs">避坑指南</span>
                        <div className="font-medium text-purple-800">{item.ai_analysis.ai_suggestion}</div>
                      </div>
                    </div>
                  ) : (
                    // 💤 状态 B: 还没分析，显示按钮
                    <div className="h-full min-h-[140px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      <form action={runAiAnalysis.bind(null, item.id, item.content || '')}>
                        <button className="flex items-center gap-2 bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:bg-purple-50 transition-all text-sm font-medium group">
                          <Bot className="w-4 h-4 group-hover:animate-bounce" />
                          点击调用 DeepSeek 分析
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <form action={rejectSubmission.bind(null, item.id)}>
                  <button className="px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                    驳回废弃
                  </button>
                </form>
                
                <form action={approveSubmission.bind(null, item.id)}>
                  <button className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:scale-105 active:scale-95">
                    <Check className="w-4 h-4" />
                    {item.ai_analysis ? '确认 AI 结果并入库' : '直接批准 (不推荐)'}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}