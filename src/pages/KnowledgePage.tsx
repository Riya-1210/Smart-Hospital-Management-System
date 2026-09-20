import { useState } from 'react';
import { BookOpen, Search, FileText } from 'lucide-react';
import { knowledgeBase } from '../data/demoData';

export default function KnowledgePage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<typeof knowledgeBase[0] | null>(null);
  const [category, setCategory] = useState('All');

  const QUICK_QUESTIONS = [
    "What is the emergency escalation procedure?",
    "What is the ICU workflow?",
    "What is the pharmacy escalation process?",
    "What is the mass casualty incident protocol?",
    "What is the patient transfer protocol?"
  ];

  const categories = ['All', ...Array.from(new Set(knowledgeBase.map(k => k.category)))];

  const filtered = knowledgeBase.filter(k => {
    const matchCat = category === 'All' || k.category === category;
    const matchQuery = !query || k.title.toLowerCase().includes(query.toLowerCase()) ||
      k.content.toLowerCase().includes(query.toLowerCase()) ||
      k.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
    return matchCat && matchQuery;
  });

  const handleQuick = (q: string) => {
    setQuery(q);
    const match = knowledgeBase.find(k =>
      q.toLowerCase().includes('emergency') && k.id === 'KB-001' ? true :
      q.toLowerCase().includes('icu') && k.id === 'KB-002' ? true :
      q.toLowerCase().includes('pharmacy') && k.id === 'KB-003' ? true :
      q.toLowerCase().includes('mass') && k.id === 'KB-004' ? true :
      q.toLowerCase().includes('transfer') && k.id === 'KB-005' ? true :
      false
    );
    if (match) setSelected(match);
  };

  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpen size={20} className="text-[#78856F]" />
            Hospital Knowledge Assistant
          </h1>
          <p className="page-subtitle">Query hospital policies and protocols from the knowledge base</p>
        </div>
        <span className="demo-tag">Demo / Simulation</span>
      </div>

      <div className="rounded-lg p-3 border" style={{ background: '#EFF3ED', borderColor: '#A8B39F' }}>
        <p className="text-sm text-[#34483A]">
          This assistant answers questions from hospital policy documents and standard operating procedures. It does not invent policies — only references available documents.
        </p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8A83]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Ask about hospital protocols, procedures, or policies..."
            className="w-full bg-white border border-warm-300 rounded-lg pl-10 pr-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-sage-400"
          />
        </div>

        <div className="mb-4">
          <div className="text-xs font-semibold text-warm-700 mb-2">Quick Questions</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleQuick(q)}
                className="text-xs bg-warm-100 border border-warm-300 hover:border-sage-400 hover:text-warm-900 text-warm-600 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-warm-700 mb-2">Filter by Category</div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-all font-medium ${
                  category === c
                    ? 'bg-[#34483A] text-white border-[#34483A]'
                    : 'bg-white text-[#5C5A54] border-[#C8C3BB] hover:border-[#78856F]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Results */}
        <div className="space-y-2">
          {filtered.map(k => (
            <div
              key={k.id}
              onClick={() => setSelected(k)}
              className={`card cursor-pointer transition-all ${
                selected?.id === k.id
                  ? 'border-[#34483A] bg-[#E8EDE6]'
                  : 'hover:border-[#A8B39F]'
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <FileText size={14} className="text-[#78856F] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[#292824]">{k.title}</div>
                  <div className="text-xs text-[#78856F]">{k.source}</div>
                </div>
              </div>
              <div className="text-xs text-[#5C5A54] mb-2 line-clamp-2">{k.content.slice(0, 100)}...</div>
              <div className="flex flex-wrap gap-1">
                {k.tags.map(t => <span key={t} className="badge-info">{t}</span>)}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card text-center py-10 text-[#8C8A83]">
              <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
              <div className="text-sm">No documents match your search.</div>
              <div className="text-xs mt-1">Try different keywords or clear the filter.</div>
            </div>
          )}
        </div>

        {/* Document Detail */}
        {selected ? (
          <div className="card">
            <div className="flex items-start gap-2 mb-4">
              <FileText size={16} className="text-[#78856F] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-[#292824]">{selected.title}</h3>
                <div className="text-xs text-[#78856F]">{selected.source}</div>
                <span className="badge-info mt-1 inline-flex">{selected.category}</span>
              </div>
            </div>

            <div className="rounded-lg p-4 mb-4" style={{ background: '#F4F6F2', border: '1px solid #C5CEBC' }}>
              <div className="text-xs font-semibold text-[#8C8A83] mb-2 uppercase tracking-wide">Protocol Content</div>
              <div className="text-sm text-[#292824] whitespace-pre-line leading-relaxed">{selected.content}</div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-[#5C5A54] mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => <span key={t} className="badge-info">{t}</span>)}
              </div>
            </div>

            <div className="rounded-lg p-3 border" style={{ background: '#F5EDD8', borderColor: '#D9B97A' }}>
              <div className="text-xs text-[#9A7535]">
                Source: <span className="font-semibold">{selected.source}</span>
              </div>
              <div className="text-xs text-[#8C8A83] mt-1">
                This information is from the hospital's documentation. Always verify with current official policies. The AI does not invent policies — it only references available documents.
              </div>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center py-14 text-[#8C8A83]">
            <div className="text-center">
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Select a document to view full content</div>
              <div className="text-xs mt-1">or ask a quick question above</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
