import Link from 'next/link'
import { Check } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">提交成功！</h1>
        <p className="text-slate-500 mb-8">
          感谢你的分享。你的数据将经过 AI 初审 + 人工复核后上线，帮助更多病友。
        </p>
        <Link 
          href="/" 
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}