'use client'

import { submitCase } from './actions'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, AlertCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
    >
      {pending ? '正在提交...' : '提交我的核保经历'}
    </button>
  )
}

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回搜索
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">分享核保结果</h1>
          <p className="text-slate-500">
            你的每一条数据，都能帮助其他病友少走弯路。
          </p>
        </div>

        <form action={submitCase} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">疾病大类</label>
              <select name="disease_type" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">请选择...</option>
                <option value="甲状腺">甲状腺 (结节/癌)</option>
                <option value="乳腺">乳腺 (结节/增生)</option>
                <option value="肺部">肺部 (结节)</option>
                <option value="乙肝">乙肝 (大三阳/小三阳)</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">投保产品</label>
              <input type="text" name="product_name" required placeholder="例如：众安尊享e生2023" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">最终结论是？</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="cursor-pointer relative">
                <input type="radio" name="verdict" value="pass" className="peer sr-only" required />
                <div className="p-4 rounded-xl border-2 border-slate-100 hover:border-green-200 bg-white peer-checked:border-green-500 peer-checked:bg-green-50 transition-all text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <span className="block font-medium text-slate-700">✅ 正常承保</span>
                </div>
              </label>

              <label className="cursor-pointer relative">
                <input type="radio" name="verdict" value="exclude" className="peer sr-only" />
                <div className="p-4 rounded-xl border-2 border-slate-100 hover:border-yellow-200 bg-white peer-checked:border-yellow-500 peer-checked:bg-yellow-50 transition-all text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <span className="block font-medium text-slate-700">⚠️ 除外/加费</span>
                </div>
              </label>

              <label className="cursor-pointer relative">
                <input type="radio" name="verdict" value="reject" className="peer sr-only" />
                <div className="p-4 rounded-xl border-2 border-slate-100 hover:border-red-200 bg-white peer-checked:border-red-500 peer-checked:bg-red-50 transition-all text-center">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <span className="block font-medium text-slate-700">🔴 拒保</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">详细情况 / 避坑指南</label>
            <textarea name="content" rows={4} placeholder="请详细描述下具体病情..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}