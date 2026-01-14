'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// 1. 初始化 Supabase (发动机)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SubmitPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // 2. 处理提交逻辑
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 阻止表单默认刷新
    setLoading(true)

    // 获取表单数据
    const formData = new FormData(e.currentTarget)
    const diseaseType = formData.get('disease_type') as string
    const productName = formData.get('product_name') as string
    const verdict = formData.get('verdict') as string
    const content = formData.get('content') as string

    // 简单校验
    if (!diseaseType || !content || !verdict) {
      alert('请完整填写必填项（疾病、结论、详细情况）')
      setLoading(false)
      return
    }

    // 3. 写入 Supabase 数据库
    const { error } = await supabase
      .from('cases')
      .insert([
        {
          disease_type: diseaseType,
          product_name: productName || '未知产品',
          verdict: verdict,
          content: content,
          // 自动生成一个简单的标题 summary
          summary: `${diseaseType} - ${verdict === 'pass' ? '标体' : verdict === 'exclude' ? '除外' : '拒保'}`,
          source: '用户提交'
        }
      ])

    if (error) {
      console.error('提交失败:', error)
      alert('提交失败，请重试')
    } else {
      setSuccess(true)
      // 3秒后刷新页面或重置状态
      setTimeout(() => {
        setSuccess(false)
        // 可选：清空表单 (这里简单处理，实际上刷新页面更方便)
        window.location.reload() 
      }, 2000)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      
      {/* 顶部返回导航 */}
      <div className="w-full max-w-md mb-6">
         <Link href="/" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 font-medium">
           &larr; 返回首页
         </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          📝 提交核保案例
        </h1>
        <p className="text-gray-500 text-sm mb-8 text-center">
          您的分享将帮助更多病友买到合适的保险
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center animate-pulse">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-bold text-lg">提交成功！</h3>
            <p className="text-sm mt-1">感谢您的无私贡献。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. 疾病大类 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">疾病大类 <span className="text-red-500">*</span></label>
              <select name="disease_type" className="w-full p-3 border-2 border-gray-100 rounded-lg focus:border-blue-500 outline-none bg-white transition-all font-medium" required>
                <option value="">请选择...</option>
                <option value="甲状腺">甲状腺 (结节/甲亢/甲减)</option>
                <option value="乳腺">乳腺 (结节/增生)</option>
                <option value="肺部">肺部 (结节/磨玻璃)</option>
                <option value="乙肝">乙肝 (大三阳/小三阳)</option>
                <option value="高血压">高血压</option>
                <option value="糖尿病">糖尿病</option>
                <option value="抑郁症">抑郁症/焦虑症</option>
                <option value="其他">其他</option>
              </select>
            </div>

            {/* 2. 投保产品 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">投保产品 (选填)</label>
              <input 
                name="product_name" 
                type="text" 
                placeholder="例如：平安e生保、国寿福..."
                className="w-full p-3 border-2 border-gray-100 rounded-lg focus:border-blue-500 outline-none placeholder-gray-400 transition-all"
              />
            </div>

            {/* 3. 核保结论 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">最终结论 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                <label className="cursor-pointer group">
                  <input type="radio" name="verdict" value="pass" className="peer sr-only" defaultChecked />
                  <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-green-500 peer-checked:bg-green-50 transition-all group-hover:border-green-200">
                    <div className="text-xl mb-1">✅</div>
                    <div className="text-xs font-bold text-gray-600 peer-checked:text-green-700">正常承保</div>
                  </div>
                </label>

                <label className="cursor-pointer group">
                  <input type="radio" name="verdict" value="exclude" className="peer sr-only" />
                  <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-yellow-500 peer-checked:bg-yellow-50 transition-all group-hover:border-yellow-200">
                    <div className="text-xl mb-1">⚠️</div>
                    <div className="text-xs font-bold text-gray-600 peer-checked:text-yellow-700">除外/加费</div>
                  </div>
                </label>

                <label className="cursor-pointer group">
                  <input type="radio" name="verdict" value="reject" className="peer sr-only" />
                  <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-red-500 peer-checked:bg-red-50 transition-all group-hover:border-red-200">
                    <div className="text-xl mb-1">🚫</div>
                    <div className="text-xs font-bold text-gray-600 peer-checked:text-red-700">拒保</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. 详细情况 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">详细情况 / 避坑指南 <span className="text-red-500">*</span></label>
              <textarea 
                name="content" 
                rows={5}
                placeholder="请详细描述下具体病情（比如：结节大小、分级）、核保过程中的波折，给后人一些参考..."
                className="w-full p-3 border-2 border-gray-100 rounded-lg focus:border-blue-500 outline-none placeholder-gray-400 text-gray-900 resize-none transition-all"
                required
              ></textarea>
            </div>

            {/* 5. 提交按钮 */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🚀 正在提交...' : '提交案例'}
            </button>

          </form>
        )}
      </div>
    </div>
  )
}