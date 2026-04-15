const CATEGORIES = [
  { label: '전체', emoji: '✦' },
  { label: '이동보조', emoji: '🦽' },
  { label: '욕창예방', emoji: '🛏' },
  { label: '목욕', emoji: '🚿' },
  { label: '배설', emoji: '🚽' },
  { label: '안전', emoji: '🛡' },
]
const GRADES = [
  { value: '', label: '전체 등급' },
  { value: '1', label: '1등급' },
  { value: '2', label: '2등급' },
  { value: '3', label: '3등급' },
  { value: '4', label: '4등급' },
  { value: '5', label: '5등급' },
]

export default function ProductFilter({ category, grade, onCategoryChange, onGradeChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2 flex-1">
        {CATEGORIES.map(({ label, emoji }) => {
          const isActive = (label === '전체' && !category) || label === category
          return (
            <button
              key={label}
              onClick={() => onCategoryChange(label === '전체' ? '' : label)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50'
              }`}
            >
              <span className="text-base leading-none">{emoji}</span>
              {label}
            </button>
          )
        })}
      </div>

      {/* 등급 셀렉트 */}
      <select
        value={grade}
        onChange={(e) => onGradeChange(e.target.value)}
        className="sm:w-36 px-3.5 py-2 rounded-full text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 appearance-none cursor-pointer"
      >
        {GRADES.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>
    </div>
  )
}
