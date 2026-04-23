import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadProductImage, updateProductImageUrl } from '@/lib/supabase'

const CATEGORY_OPTIONS = ['이동보조', '욕창예방', '목욕', '배설', '안전']
const EMPTY_FORM = {
  name: '', category: '이동보조', price: '', description: '',
  target_grade: [1, 2, 3, 4, 5], is_active: true,
}

function SlidePanel({ editingId, form, setForm, onSave, onClose, saving, error, handleGradeToggle }) {
  if (editingId === null) return null
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{editingId === 'new' ? '새 제품 등록' : '제품 수정'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">제품명 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="전동침대 (3모터)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
              >
                {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">가격 (원) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                placeholder="1500000"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">설명</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand-400"
              placeholder="제품에 대한 상세 설명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">지원 등급</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGradeToggle(g)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.target_grade.includes(g)
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">선택한 등급: {form.target_grade.join(', ')}등급</p>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-gray-800">제품 활성화</p>
              <p className="text-xs text-gray-500">비활성 시 서비스에서 숨김</p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 px-6 pb-2">{error}</p>}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 btn-primary text-sm py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const uploadTargetRef = useRef(null)

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const openNew = () => { setForm(EMPTY_FORM); setEditingId('new'); setError(null) }
  const openEdit = (p) => {
    setForm({
      name: p.name, category: p.category, price: String(p.price),
      description: p.description ?? '',
      target_grade: p.target_grade ?? [1,2,3,4,5],
      is_active: p.is_active,
    })
    setEditingId(p.id)
    setError(null)
  }

  const handleGradeToggle = (g) => {
    setForm((f) => ({
      ...f,
      target_grade: f.target_grade.includes(g)
        ? f.target_grade.filter((x) => x !== g)
        : [...f.target_grade, g].sort(),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) { setError('이름과 가격은 필수입니다'); return }
    setSaving(true); setError(null)
    const payload = {
      name: form.name.trim(), category: form.category, price: Number(form.price),
      description: form.description.trim() || null,
      target_grade: form.target_grade, is_active: form.is_active,
    }
    const { error: e } = editingId === 'new'
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', editingId)
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); setEditingId(null)
    fetchProducts()
  }

  const handleToggleActive = async (p) => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  const handleImageClick = (productId) => {
    uploadTargetRef.current = productId
    fileInputRef.current?.click()
  }

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTargetRef.current) return
    const productId = uploadTargetRef.current
    setUploadingId(productId)
    try {
      const url = await uploadProductImage(file, productId)
      await updateProductImageUrl(productId, url)
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, image_url: url } : p))
    } catch (err) {
      alert('이미지 업로드 실패: ' + err.message)
    } finally {
      setUploadingId(null)
      e.target.value = ''
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {products.length}개</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          제품 추가
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleImageFile}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm">등록된 제품이 없습니다</p>
          <button onClick={openNew} className="mt-3 text-sm text-brand-600 hover:underline">첫 제품 추가</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['제품', '카테고리', '가격', '지원 등급', '상태', '이미지', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-600">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                    {p.price.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((g) => (
                        <span
                          key={g}
                          className={`w-5 h-5 rounded text-xs flex items-center justify-center font-medium ${
                            (p.target_grade ?? []).includes(g)
                              ? 'bg-brand-100 text-brand-600'
                              : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${p.is_active ? 'bg-brand-600' : 'bg-gray-300'}`}
                      title={p.is_active ? '클릭하여 비활성화' : '클릭하여 활성화'}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleImageClick(p.id)}
                      disabled={uploadingId === p.id}
                      className="text-xs text-gray-400 hover:text-brand-600 border border-gray-200 hover:border-brand-300 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {uploadingId === p.id ? '업로드 중…' : '이미지'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => openEdit(p)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-brand-600 hover:underline transition-opacity"
                    >
                      수정 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {products.length}개 등록됨
          </div>
        </div>
      )}

      <SlidePanel
        editingId={editingId}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onClose={() => setEditingId(null)}
        saving={saving}
        error={error}
        handleGradeToggle={handleGradeToggle}
      />
    </div>
  )
}

