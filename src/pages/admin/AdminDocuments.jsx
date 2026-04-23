import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** 텍스트를 최대 chunkSize 글자 단위로 분할 */
function splitIntoChunks(text, chunkSize = 500, overlap = 50) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push({ content: text.slice(start, end).trim(), chunk_index: chunks.length })
    start += chunkSize - overlap
  }
  return chunks.filter((c) => c.content.length > 20)
}

export default function AdminDocuments() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [chunks, setChunks] = useState({}) // docId → chunk[]
  const [form, setForm] = useState({ title: '', content: '', docType: 'policy' })
  const [saving, setSaving] = useState(false)
  const [embedding, setEmbedding] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchDocs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('policy_documents')
      .select('id, title, doc_type, created_at')
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  const loadChunks = async (docId) => {
    if (chunks[docId]) { setExpandedId(docId); return }
    const { data } = await supabase
      .from('document_chunks')
      .select('id, content, chunk_index')
      .eq('document_id', docId)
      .order('chunk_index')
    setChunks((prev) => ({ ...prev, [docId]: data ?? [] }))
    setExpandedId(docId)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용은 필수입니다'); return
    }
    setSaving(true); setError(null); setSuccess(null)

    // 1. 문서 저장
    const { data: doc, error: docErr } = await supabase
      .from('policy_documents')
      .insert({ title: form.title.trim(), content: form.content.trim(), doc_type: form.docType })
      .select('id')
      .single()

    if (docErr) { setError(docErr.message); setSaving(false); return }

    // 2. 청크 분할 저장
    const chunkRows = splitIntoChunks(form.content).map((c) => ({
      document_id: doc.id,
      content: c.content,
      chunk_index: c.chunk_index,
      metadata: { title: form.title.trim(), doc_type: form.docType },
    }))

    const { error: chunkErr } = await supabase.from('document_chunks').insert(chunkRows)
    if (chunkErr) { setError('청크 저장 오류: ' + chunkErr.message); setSaving(false); return }

    // 3. 임베딩 자동 생성 (비동기 — 실패해도 무시)
    setSuccess(`문서 등록 완료 — ${chunkRows.length}개 청크 생성됨. 임베딩 생성 중…`)
    setForm({ title: '', content: '', docType: 'policy' })
    setSaving(false)
    fetchDocs()

    try {
      await supabase.functions.invoke('embed', { body: { target: 'chunks' } })
      setSuccess(`문서 등록 완료 — ${chunkRows.length}개 청크 + 임베딩 생성됨`)
    } catch {
      setSuccess(`문서 등록 완료 — ${chunkRows.length}개 청크 생성됨 (임베딩은 수동 생성 필요)`)
    }
  }

  const handleGenerateAllEmbeddings = async () => {
    if (!confirm('제품과 문서 청크 전체의 임베딩을 생성합니다. 시간이 걸릴 수 있습니다.')) return
    setEmbedding(true); setError(null); setSuccess(null)
    const { data, error: fnErr } = await supabase.functions.invoke('embed', { body: { target: 'all' } })
    setEmbedding(false)
    if (fnErr || data?.error) {
      setError('임베딩 오류: ' + (fnErr?.message ?? data?.error))
    } else {
      setSuccess(data?.message ?? '임베딩 생성 완료')
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('문서와 관련 청크를 모두 삭제합니다. 계속하시겠습니까?')) return
    await supabase.from('policy_documents').delete().eq('id', docId)
    setDocs((prev) => prev.filter((d) => d.id !== docId))
    if (expandedId === docId) setExpandedId(null)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RAG 정책 문서 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">업로드된 문서는 자동으로 청크로 분할되어 AI 상담에 활용됩니다</p>
        </div>
        <button
          onClick={handleGenerateAllEmbeddings}
          disabled={embedding}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition-colors font-medium"
        >
          <svg className={`w-4 h-4 ${embedding ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {embedding ? '임베딩 생성 중…' : '전체 임베딩 재생성'}
        </button>
      </div>

      {/* 등록 폼 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">새 문서 등록</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">문서 제목 *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="장기요양보험 복지용구 급여 기준"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">문서 유형</label>
              <select
                value={form.docType}
                onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
              >
                <option value="policy">정책</option>
                <option value="manual">매뉴얼</option>
                <option value="guide">가이드</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              문서 내용 * <span className="text-gray-400 font-normal">(텍스트 붙여넣기 — 500자 단위로 자동 청크 분할)</span>
            </label>
            <textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="문서 전체 텍스트를 붙여넣으세요..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-brand-400 font-mono leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.content.length.toLocaleString()}자 · 예상 청크 수: {splitIntoChunks(form.content).length}개
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-emerald-600 font-medium">{success}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm px-5 py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? '저장 중…' : '문서 등록 & 청크 분할'}
          </button>
        </div>
      </div>

      {/* 문서 목록 */}
      <h2 className="font-semibold text-gray-900 mb-3">등록된 문서 ({docs.length})</h2>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">등록된 문서가 없습니다</div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => expandedId === doc.id ? setExpandedId(null) : loadChunks(doc.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    doc.doc_type === 'policy' ? 'bg-blue-50 text-blue-700'
                    : doc.doc_type === 'manual' ? 'bg-purple-50 text-purple-700'
                    : 'bg-green-50 text-green-700'
                  }`}>
                    {doc.doc_type}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">{doc.title}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === doc.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedId === doc.id && (
                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    청크 목록 ({chunks[doc.id]?.length ?? 0}개)
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(chunks[doc.id] ?? []).map((c) => (
                      <div key={c.id} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                        <span className="text-xs text-gray-400 mr-2">#{c.chunk_index}</span>
                        <span className="text-xs text-gray-600 font-mono leading-relaxed">
                          {c.content.slice(0, 150)}{c.content.length > 150 ? '…' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
