I can combine the detailed report-style analysis (the "100-point vision") with the structured, user-friendly layout you preferred in the earlier version (the "comprehensive list" style).

This hybrid approach will give users the immediate satisfaction of uploading/analyzing a report, followed by a clear, organized list of insurance options that they can actually act on.

Here is the combined `page.tsx` code that integrates the "AI Report Analysis" simulation with the "Comprehensive Product List" layout.

### **Combined Code: HealthGuardian 5.0 (AI Report + Comprehensive List)**

Please **replace your entire `page.tsx` content** with the code below.

```tsx
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. Static Configuration & Mock Data
// ==========================================

const EXPERTS = [
  { id: 'e1', name: 'Alex', title: 'Senior Underwriter', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', desc: 'Former Ping An Underwriting Manager, handled 3000+ non-standard cases' },
  { id: 'e2', name: 'Bella', title: 'Medical Consultant', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', desc: 'Clinical Medicine Master, specializes in nodules/chronic diseases' },
]

const LIVE_TICKER = [
  '👏 1 min ago, Ms. Zhang (Shanghai, Thyroid Nodule Grade 3) successfully insured [Zunxiang e-Sheng]',
  '👏 5 mins ago, Mr. Li (Beijing, Hepatitis B) passed manual underwriting, standard coverage',
  '👏 12 mins ago, Mr. Wang (Guangzhou, Lung Nodule) received [Zhongminbao] claim payment',
  '👏 Just now, Ms. Zhao (Shenzhen) booked a 1-on-1 underwriting service with Alex',
]

const CATEGORIES = [
  { id: 'nodule', name: 'Nodule/Cyst', icon: '🍒', keywords: ['Lung Nodule', 'Thyroid Nodule'] },
  { id: 'liver', name: 'Liver/Gallbladder', icon: '🥃', keywords: ['Hepatitis B', 'Fatty Liver'] },
  { id: 'metabolic', name: 'Chronic Diseases', icon: '🍔', keywords: ['Hypertension', 'Diabetes'] },
  { id: 'mental', name: 'Mental Health', icon: '🧠', keywords: ['Depression', 'Anxiety'] },
  { id: 'child', name: 'Pediatric', icon: '👶', keywords: ['Adenoids', 'Autism'] },
]

const HOME_LEADERBOARD = [
  { rank: 1, name: 'Thyroid Nodule 1-2', ratio: '1 : 850', tag: 'Standard', desc: 'Perfect combo: Million Medical + Critical Illness' },
  { rank: 2, name: 'Breast Nodule 3', ratio: '1 : 600', tag: 'Exclusion+Recurrence', desc: 'Fill gaps with specialized recurrence insurance' },
  { rank: 3, name: 'Hepatitis B Minor', ratio: '1 : 550', tag: 'Loading', desc: 'Comprehensive coverage despite extra premium' },
  { rank: 4, name: 'Lung Adenocarcinoma', ratio: '1 : 120', tag: 'Post-Op', desc: 'Cancer Medical Insurance + Huiminbao' },
]

type SortType = 'recommend' | 'leverage' | 'coverage' | 'company'
const SORT_OPTIONS = [
  { value: 'recommend', label: '🔥 Recommended', icon: '👍' },
  { value: 'leverage', label: '💰 High Value', icon: '📈' },
  { value: 'coverage', label: '🛡️ Wide Coverage', icon: '☂️' },
  { value: 'company', label: '🏢 Big Brand', icon: 'qy' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [rawCases, setRawCases] = useState<any[]>([])
  const [analyzing, setAnalyzing] = useState(false) // AI Analysis State
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])
  const [tickerIndex, setTickerIndex] = useState(0)
  
  // Interactive States
  const [activeHomeTab, setActiveHomeTab] = useState<'leverage' | 'hot'>('leverage')
  const [activeSort, setActiveSort] = useState<SortType>('recommend')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  
  // Camera Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🔄 Ticker Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKER.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // 🧠 Search/Analyze Logic
  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim() && !keywordOverride) return 
    
    if (keywordOverride) setQuery(keywordOverride)
    
    // Simulate AI Analysis
    setHasSearched(false)
    setAnalyzing(true)
    setExpandedProductId(null)
    
    setTimeout(async () => {
        const finalSearch = searchTerm || 'Nodule'

        const { data } = await supabase
        .from('cases')
        .select('*')
        .or(`disease_type.ilike.%${finalSearch}%, content.ilike.%${finalSearch}%, product_name.ilike.%${finalSearch}%`)
        .order('created_at', { ascending: false })

        if (data) setRawCases(data)
        setAnalyzing(false)
        setHasSearched(true)
    }, 1500)
  }

  // 📸 File Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQuery(`Uploaded: ${file.name}`)
      setAnalyzing(true)
      
      setTimeout(async () => {
         // Force "Thyroid" result for demo
         setQuery('AI Result: Thyroid Nodule Grade 2')
         
         const { data } = await supabase
          .from('cases')
          .select('*')
          .ilike('disease_type', '%Thyroid%') 
          .order('created_at', { ascending: false })
          
         if (data) setRawCases(data)
         setAnalyzing(false)
         setHasSearched(true)
      }, 2000)
    }
  }

  // 🔄 Data Aggregation & AI Scoring
  const aggregatedProducts = useMemo(() => {
    if (!rawCases.length) return []
    const map: Record<string, any> = {}
    
    rawCases.forEach(item => {
      const pName = item.product_name || 'Unknown Product'
      if (!map[pName]) {
        const baseScore = pName.includes('Huimin') ? 85 : (pName.includes('Medical') ? 92 : 95)
        const randomFluctuation = Math.floor(Math.random() * 5)
        
        map[pName] = {
          name: pName,
          company: item.company || 'Selected Insurer',
          cases: [],
          matchScore: baseScore + randomFluctuation,
          passCount: 0,
          totalCount: 0,
          leverageScore: pName.includes('Huimin') ? 10000 : (pName.includes('Medical') ? 8000 : 100),
          companyScore: (item.company?.includes('Ping An') || item.company?.includes('PICC')) ? 9.8 : 8.5,
          coverageScore: Math.floor(Math.random() * 2000) + 500
        }
      }
      map[pName].cases.push(item)
      map[pName].totalCount += 1
      if (item.verdict === 'pass') map[pName].passCount += 1
    })
    
    let productList = Object.values(map)

    productList.sort((a: any, b: any) => {
      if (activeSort === 'leverage') return b.leverageScore - a.leverageScore
      if (activeSort === 'company') return b.companyScore - a.companyScore
      if (activeSort === 'coverage') return b.coverageScore - a.coverageScore
      return b.matchScore - a.matchScore // Default sort by AI match score
    })

    return productList
  }, [rawCases, activeSort])

  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setRawCases([])
    setAnalyzing(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 pb-32">
      
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Ticker */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center overflow-hidden relative">
         <div className="animate-fade-in-up key={tickerIndex}">
            {LIVE_TICKER[tickerIndex]}
         </div>
      </div>

      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md py-4 px-6 sticky top-0 z-40 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetHome}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">H</div>
          <span className="font-bold text-gray-800 text-lg">HealthGuardian</span>
        </div>
        <div className="flex items-center gap-2">
            <img src={selectedExpert.image} className="w-8 h-8 rounded-full border border-gray-200" />
            <span className="text-xs font-bold hidden md:inline">Advisor Online</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* =========================================
            STATE A: Home (Input & Tiers)
           ========================================= */}
        {!hasSearched && !analyzing ? (
          <div className="text-center mt-10 animate-fade-in-up">
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-blue-100">
               ✨ AI Digital Twin Underwriting V5.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Decode Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Health Report</span>
            </h1>
            <p className="text-gray-500 mb-12 max-w-md mx-auto leading-relaxed">
              Upload report or input history. AI analyzes 200+ indicators to generate your <span className="font-bold text-gray-900">Insurance Eligibility Diagnosis</span>.
            </p>
            
            {/* Input & Camera */}
            <div className="bg-white p-2 rounded-3xl shadow-2xl shadow-blue-100/50 border border-gray-100 max-w-xl mx-auto mb-12 relative overflow-hidden group">
               <div className="flex items-center gap-2 px-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-2xl hover:bg-gray-100 transition-colors active:scale-95"
                  >
                    📷
                  </button>
                  <input
                    type="text"
                    placeholder="Paste conclusion / Input disease..."
                    className="flex-1 h-14 bg-transparent outline-none text-lg placeholder:text-gray-400 min-w-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={() => handleSearch()}
                    className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg whitespace-nowrap"
                  >
                    Diagnose
                  </button>
               </div>
            </div>

            {/* Quick Categories */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-16">
               {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => handleSearch(cat.keywords[0])} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                     <span className="text-2xl mb-2">{cat.icon}</span>
                     <span className="text-xs font-bold text-gray-700">{cat.name}</span>
                  </button>
               ))}
            </div>

             {/* Home Leaderboard */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden text-left">
               <div className="flex border-b border-gray-50">
                  <button 
                    onClick={() => setActiveHomeTab('leverage')}
                    className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'leverage' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    💰 High Leverage
                  </button>
                  <button 
                     onClick={() => setActiveHomeTab('hot')}
                     className={`flex-1 py-4 text-center font-bold text-sm ${activeHomeTab === 'hot' ? 'text-orange-500 bg-orange-50/50 border-b-2 border-orange-500' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    🔥 Trending Anxiety
                  </button>
               </div>

               <div className="divide-y divide-gray-50">
                  {HOME_LEADERBOARD.map((item, idx) => (
                    <div key={idx} className="p-5 flex items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleSearch(item.name.split(' ')[0])}>
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg mr-4 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx===1 ? 'bg-gray-100 text-gray-700' : idx===2 ? 'bg-orange-50 text-orange-700' : 'text-gray-400'}`}>{item.rank}</div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-gray-900">{item.name}</span>
                             <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-bold">{item.tag}</span>
                          </div>
                          <div className="text-xs text-gray-400">{item.desc}</div>
                       </div>
                       <div className="text-right hidden md:block">
                          <div className="text-xs text-gray-400">Leverage</div>
                          <div className="font-mono font-bold text-blue-600">{item.ratio}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : analyzing ? (
          /* =========================================
             STATE B: Analyzing
             ========================================= */
          <div className="flex flex-col items-center justify-center pt-20">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🧬</div>
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Scanning Report...</h2>
             <p className="text-gray-400 text-sm">Extracting: {query.includes('Upload') ? 'OCR Text' : query}</p>
             <div className="mt-8 w-64 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
             </div>
          </div>
        ) : (
          /* =========================================
             STATE C: Result (Diagnosis + List)
             ========================================= */
          <div className="animate-fade-in-up pb-24">
            
            {/* 1. AI Diagnosis Card (Dark Theme) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-slate-900/20 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600/30 border border-blue-400/30 text-blue-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI Report</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold mb-2 break-all">{query.includes('AI') ? query : `Diagnosis for "${query}"`}</h2>
                     <p className="text-slate-300 text-sm max-w-md">
                        AI scan detected 85% probability of standard acceptance in <span className="text-white font-bold border-b border-blue-400">Medical Insurance</span>.
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-center">
                        <div className="text-3xl font-black text-green-400">92<span className="text-sm text-green-400/60">%</span></div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Pass Rate</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. Sort Options */}
            <div className="flex flex-wrap gap-3 py-2 mb-4">
               {SORT_OPTIONS.map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => setActiveSort(opt.value as SortType)}
                   className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                     activeSort === opt.value 
                       ? 'bg-slate-900 text-white shadow-lg' 
                       : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                   }`}
                 >
                   <span>{opt.icon}</span> {opt.label}
                 </button>
               ))}
            </div>

            {/* 3. Product List */}
            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="font-bold text-gray-900">Matched {aggregatedProducts.length} Products</h3>
            </div>

            <div className="space-y-4">
               {aggregatedProducts.length > 0 ? (
                 <>
                   {aggregatedProducts.map((product: any, idx) => (
                     <div key={idx} className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedProductId === product.name ? 'border-blue-500 shadow-lg ring-2 ring-blue-50' : 'border-gray-100 shadow-sm hover:border-blue-200'}`}>
                        
                        <div 
                          className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center relative"
                          onClick={() => setExpandedProductId(expandedProductId === product.name ? null : product.name)}
                        >
                            {/* Gold Badge for Top 1 */}
                           {idx === 0 && activeSort === 'recommend' && <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">AI Choice</div>}

                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                 {/* Rank Badge */}
                                 <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx===0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {idx + 1}
                                 </span>
                                 <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                                 <LeverageTag productName={product.name} />
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-3">
                                 <span>🏢 {product.company}</span>
                                 <span>📄 Cases: {product.totalCount}</span>
                                 <span className={`font-bold ${product.matchScore > 90 ? 'text-green-600' : 'text-yellow-600'}`}>Match: {product.matchScore}%</span>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                              <div className="text-right">
                                 <div className="text-xs text-gray-400">Pass Rate</div>
                                 <div className="text-lg font-black text-green-600">
                                    {Math.round((product.passCount / product.totalCount) * 100)}%
                                 </div>
                              </div>
                              <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${expandedProductId === product.name ? 'rotate-180 bg-gray-100' : 'bg-gray-50'}`}>
                                 ⌄
                              </button>
                           </div>
                        </div>

                        {expandedProductId === product.name && (
                           <div className="bg-slate-50 border-t border-gray-100 p-5 animate-fade-in-down">
                              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                 📂 Real User Cases ({product.cases.length})
                              </h4>
                              <div className="space-y-3">
                                 {product.cases.map((c: any) => (
                                    <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 text-sm shadow-sm">
                                       <div className="flex gap-2 mb-2">
                                          {c.verdict === 'pass' && <span className="bg-green-100 text-green-700 px-1.5 rounded text-[10px] font-bold">✅ Standard</span>}
                                          {c.verdict === 'exclude' && <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded text-[10px] font-bold">⚠️ Exclusion</span>}
                                          {c.verdict === 'reject' && <span className="bg-red-100 text-red-700 px-1.5 rounded text-[10px] font-bold">🚫 Rejected</span>}
                                          <span className="text-gray-400 text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                                       </div>
                                       <p className="text-gray-700 leading-relaxed mb-2">{c.content}</p>
                                       <div className="bg-blue-50/50 p-2 rounded-lg text-xs text-blue-700 font-medium">
                                          💡 Expert: {c.summary || 'Check underwriting strictly.'}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                              <div className="mt-4 text-center">
                                 <button className="text-sm font-bold text-blue-600 bg-white border border-blue-200 px-6 py-2 rounded-full shadow-sm hover:bg-blue-50">
                                    👉 Get Help from {selectedExpert.name}
                                 </button>
                              </div>
                           </div>
                        )}

                     </div>
                   ))}
                   
                   <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-400 text-xs font-medium">
                         <span>✨</span>
                         <span>All matched strategies shown</span>
                         <span>✨</span>
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400">No recommended products found.</p>
                 </div>
               )}
            </div>
            
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-50">
         <div className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl shadow-blue-900/20 rounded-2xl p-2 pl-5 flex items-center justify-between ring-1 ring-gray-900/5">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <img src={selectedExpert.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
               </div>
               <div className="text-xs">
                  <div className="font-bold text-gray-900">Confused?</div>
                  <div className="text-gray-500">Let {selectedExpert.name} check for you</div>
               </div>
            </div>
            <button className="bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:scale-105 transition-transform">
               Free Consult
            </button>
         </div>
      </div>

    </div>
  )
}

const LeverageTag = ({ productName }: { productName: string }) => {
  if (!productName) return null;
  let bg = '#F1F5F9', color = '#475569', text = 'Base Leverage';
  if (productName.includes('Huimin') || productName.includes('Zhongminbao')) { bg = '#F3E5F5'; color = '#7B1FA2'; text = '🔥 10000x'; }
  else if (productName.includes('Medical') || productName.includes('e-Sheng')) { bg = '#ECFDF5'; color = '#047857'; text = '🟢 8000x'; }
  else if (productName.includes('Illness') || productName.includes('Darwin')) { bg = '#FFFBEB'; color = '#B45309'; text = '🟡 100x'; }
  return <span style={{backgroundColor: bg, color: color}} className="text-[10px] px-1.5 py-0.5 rounded font-bold">{text}</span>;
};

```