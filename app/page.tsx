'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. Static Data Configuration
// ==========================================

const LIVE_TICKER = [
  '👏 1 min ago, Ms. Zhang (Shanghai, Thyroid Nodule Grade 3) successfully insured [Zunxiang e-Sheng]',
  '👏 5 mins ago, Mr. Li (Beijing, Hepatitis B) passed manual underwriting, standard coverage',
  '👏 12 mins ago, Mr. Wang (Guangzhou, Lung Nodule) received [Zhongminbao] claim payment',
  '👏 Just now, Ms. Zhao (Shenzhen) booked a 1-on-1 underwriting service with Alex',
]

const CATEGORIES = [
  { id: 'nodule', name: 'Nodule/Cyst', icon: '🍒', keywords: ['Lung Nodule', 'Thyroid Nodule', 'Breast Nodule'] },
  { id: 'liver', name: 'Liver/Gallbladder', icon: '🥃', keywords: ['Hepatitis B', 'Fatty Liver', 'Gallbladder Polyp'] },
  { id: 'metabolic', name: 'Chronic Diseases', icon: '🍔', keywords: ['Hypertension', 'Diabetes', 'High Uric Acid'] },
  { id: 'mental', name: 'Mental Health', icon: '🧠', keywords: ['Depression', 'Anxiety', 'Sleep Disorder'] },
  { id: 'child', name: 'Pediatric', icon: '👶', keywords: ['Adenoids', 'PFO', 'Autism'] },
]

const EXPERTS = [
  { id: 'e1', name: 'Alex', title: 'Senior Underwriter', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', gender: 'male' },
  { id: 'e2', name: 'Bella', title: 'Medical Consultant', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', gender: 'female' },
]

const HOME_LEADERBOARD = [
  { rank: 1, name: 'Thyroid Nodule 1-2', ratio: '1 : 850', tag: 'Standard', desc: 'Million Medical + Critical Illness combo' },
  { rank: 2, name: 'Breast Nodule 3', ratio: '1 : 600', tag: 'Exclusion+Recurrence', desc: 'Specialized recurrence insurance fills gaps' },
  { rank: 3, name: 'Hepatitis B Minor', ratio: '1 : 550', tag: 'Loading', desc: 'Comprehensive coverage despite extra premium' },
  { rank: 4, name: 'Lung Adenocarcinoma', ratio: '1 : 120', tag: 'Post-Op', desc: 'Cancer Medical Insurance + Huiminbao' },
]

type SortType = 'recommend' | 'leverage' | 'coverage' | 'company'
const SORT_OPTIONS = [
  { value: 'recommend', label: '🔥 Recommended', icon: '👍' },
  { value: 'leverage', label: '💰 High Value', icon: '📈' },
  { value: 'coverage', label: '🛡️ Wide Coverage', icon: '☂️' },
  { value: 'company', label: '🏢 Big Brand', icon: '🏢' }, // ✅ Fixed: Changed 'qy' to '🏢'
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [rawCases, setRawCases] = useState<any[]>([]) 
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0])
  const [tickerIndex, setTickerIndex] = useState(0)
  
  const [activeHomeTab, setActiveHomeTab] = useState<'leverage' | 'hot'>('leverage')
  const [activeSort, setActiveSort] = useState<SortType>('recommend')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKER.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = async (keywordOverride?: string) => {
    const searchTerm = keywordOverride || query
    if (!searchTerm.trim()) return
    
    if (keywordOverride) setQuery(keywordOverride)
    setLoading(true)
    setHasSearched(true)
    setExpandedProductId(null)

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .or(`disease_type.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (data) {
      setRawCases(data)
    }
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        setLoading(true)
        setQuery(`Scanning: ${file.name}...`)
        
        setTimeout(() => {
            const mockResult = 'Thyroid Nodule'
            setQuery(`AI Result: ${mockResult}`)
            handleSearch(mockResult)
        }, 1500)
    }
  }

  const aggregatedProducts = useMemo(() => {
    if (!rawCases.length) return []

    const productMap: Record<string, any> = {}

    rawCases.forEach(item => {
      const pName = item.product_name || 'Unknown Product'
      if (!productMap[pName]) {
        productMap[pName] = {
          name: pName,
          company: item.company || 'General Insurer',
          cases: [],
          passCount: 0,
          totalCount: 0,
          leverageScore: pName.includes('Huimin') ? 10000 : (pName.includes('Medical') ? 8000 : 100),
          companyScore: (item.company?.includes('Ping An') || item.company?.includes('PICC')) ? 9.8 : 8.5,
          coverageScore: Math.floor(Math.random() * 2000) + 500
        }
      }
      productMap[pName].cases.push(item)
      productMap[pName].totalCount += 1
      if (item.verdict === 'pass') productMap[pName].passCount += 1
    })

    let productList = Object.values(productMap)

    productList.sort((a: any, b: any) => {
      if (activeSort === 'leverage') return b.leverageScore - a.leverageScore
      if (activeSort === 'company') return b.companyScore - a.companyScore
      if (activeSort === 'coverage') return b.coverageScore - a.coverageScore
      return (b.passCount / b.totalCount) - (a.passCount / a.totalCount)
    })

    return productList 
  }, [rawCases, activeSort])

  const resetHome = () => {
    setQuery('')
    setHasSearched(false)
    setRawCases([])
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 pb-32">
      
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center overflow-hidden relative">
         <div className="animate-fade-in-up key={tickerIndex}">
            {LIVE_TICKER[tickerIndex]}
         </div>
      </div>

      <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={resetHome}>
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-gray-800 tracking-tight">HealthGuardian</span>
        </div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <img src={selectedExpert.image} alt="Expert" className="w-9 h-9 rounded-full border border-gray-200 group-hover:border-blue-500" />
          <div className="text-xs text-right hidden md:block">
            <div className="font-bold text-gray-800">Advisor: {selectedExpert.name}</div>
            <div className="text-gray-400 group-hover:text-blue-600">Switch &rarr;</div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {!hasSearched ? (
          <div className="text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Health Issues? <br className="md:hidden" />Can I Still Get Insured?
            </h1>
            <p className="text-gray-500 mb-10 max-w-xl mx-auto">
              The largest AI underwriting database · <span className="text-blue-600 font-bold">Smart Matching</span> · Rejection Rescue
            </p>
            
            <div className="max-w-2xl mx-auto mb-10 relative">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 top-2 h-10 w-10 flex items-center justify-center text-2xl bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors z-10 active:scale-95"
                title="Scan Report"
              >
                📷
              </button>

              <input
                type="text"
                placeholder="Enter disease (e.g., Thyroid Nodule)..."
                className="w-full h-14 pl-14 pr-32 rounded-full border-2 border-indigo-50 shadow-lg shadow-indigo-50/50 focus:border-blue-500 focus:outline-none transition-all text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={() => handleSearch()}
                className="absolute right-2 top-2 h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
              >
                {loading ? '...' : 'Get Plan'}
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSearch(cat.keywords[0])}
                  className="bg-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:text-blue-600 transition-all border border-gray-100 flex items-center gap-2"
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>

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
        ) : (
          
          <div className="animate-fade-in-up space-y-6">
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">📊 {query} · AI Strategy</h2>
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">Medium Risk</span>
                   </div>
                   <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 flex gap-4 items-center">
                      <div className="text-center px-4 border-r border-gray-200">
                         <div className="text-xs text-gray-400">Est. Leverage</div>
                         <div className="text-2xl font-black text-blue-600">1:200</div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                         <p>✅ <span className="font-bold">Primary:</span> Critical Illness (Exclusion) + Medical</p>
                         <p>🛡️ <span className="font-bold">Backup:</span> Huiminbao (Complications)</p>
                      </div>
                   </div>
                </div>
                <div className="text-center min-w-[120px]">
                   <img src={selectedExpert.image} className="w-14 h-14 rounded-full mx-auto mb-2 border-2 border-white shadow" />
                   <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:bg-blue-700 transition-all">
                      Ask {selectedExpert.name}
                   </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 py-2">
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

            <div className="space-y-4">
               {aggregatedProducts.length > 0 ? (
                 <>
                   {aggregatedProducts.map((product: any, idx) => {
                     // 💰 2. Fix: Smart Pass Rate logic
                     const rate = Math.round((product.passCount / product.totalCount) * 100);
                     const displayRate = rate > 0 ? `${rate}%` : 'Needs Manual'; // Friendly fallback
                     const rateColor = rate > 0 ? 'text-green-600' : 'text-blue-600'; // Blue for manual review

                     return (
                       <div key={idx} className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedProductId === product.name ? 'border-blue-500 shadow-lg ring-2 ring-blue-50' : 'border-gray-100 shadow-sm hover:border-blue-200'}`}>
                          
                          <div 
                            className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center"
                            onClick={() => setExpandedProductId(expandedProductId === product.name ? null : product.name)}
                          >
                             <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                   <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx===0 ? 'bg-red-500 text-white' : idx===1 ? 'bg-orange-500 text-white' : idx===2 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      {idx + 1}
                                   </span>
                                   <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                                   <LeverageTag productName={product.name} />
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-3">
                                   <span>🏢 {product.company}</span>
                                   <span>📝 Cases: {product.totalCount}</span>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                                <div className="text-right">
                                   <div className="text-xs text-gray-400">Pass Rate</div>
                                   <div className={`text-lg font-black ${rateColor}`}>
                                      {displayRate}
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
                                   📂 Real Cases ({product.cases.length})
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
                                      👉 Apply with {selectedExpert.name}
                                   </button>
                                </div>
                             </div>
                          )}

                       </div>
                     );
                   })}
                   
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
  let style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: '#E3F2FD', color: '#1565C0', marginLeft: '8px' };
  let text = 'Base Leverage';

  if (productName.includes('Huimin') || productName.includes('Zhongminbao')) {
    style.backgroundColor = '#F3E5F5'; style.color = '#7B1FA2'; text = '🔥 10000x';
  } else if (productName.includes('Medical') || productName.includes('e-Sheng')) {
    style.backgroundColor = '#E8F5E9'; style.color = '#2E7D32'; text = '🟢 8000x';
  } else if (productName.includes('Illness') || productName.includes('Darwin')) {
    style.backgroundColor = '#FFF8E1'; style.color = '#B45309'; text = '🟡 100x';
  }
  return <span style={style}>{text}</span>;
};