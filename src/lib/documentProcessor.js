import { supabase } from './supabase'

// ============================================================
// RAG 확장: 문서 처리 파이프라인
// ============================================================
// 흐름: 파일 업로드 → Storage 저장 → 텍스트 추출 → Chunking → document_chunks 저장
// 추후: chunk 저장 시 embedding 생성 → pgvector HNSW 인덱스로 시맨틱 검색

const CHUNK_SIZE = 500     // 청크당 최대 글자수
const CHUNK_OVERLAP = 50   // 청크 간 중복 글자수 (컨텍스트 연속성)

// ============================================================
// 1. 파일 업로드 → Supabase Storage
// ============================================================

/**
 * PDF/TXT 파일을 Storage에 업로드하고 policy_documents 레코드 생성
 * @param {File} file
 * @param {string} title
 * @param {string} docType - 'policy' | 'manual' | 'guide'
 * @returns {Promise<{documentId: string, storagePath: string}>}
 */
export async function uploadDocument(file, title, docType = 'policy') {
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
  const storagePath = `documents/${fileName}`

  // Storage 업로드
  const { error: uploadError } = await supabase.storage
    .from('policy-docs')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) throw new Error(`파일 업로드 실패: ${uploadError.message}`)

  // policy_documents 레코드 생성
  const { data: doc, error: dbError } = await supabase
    .from('policy_documents')
    .insert({
      title,
      doc_type: docType,
      storage_path: storagePath,
    })
    .select('id')
    .single()

  if (dbError) throw new Error(`문서 메타데이터 저장 실패: ${dbError.message}`)

  return { documentId: doc.id, storagePath }
}

// ============================================================
// 2. 텍스트 추출 (MVP: TXT 직접 읽기 / 추후 PDF.js 연동)
// ============================================================

/**
 * File 객체에서 텍스트 추출
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractText(file) {
  if (file.type === 'text/plain') {
    return file.text()
  }

  // PDF 지원은 추후 pdfjs-dist 라이브러리 연동
  // import * as pdfjsLib from 'pdfjs-dist'
  // const pdf = await pdfjsLib.getDocument(...)
  // ...

  throw new Error(`지원하지 않는 파일 형식: ${file.type}. 현재 .txt 파일만 지원합니다.`)
}

// ============================================================
// 3. Chunking (슬라이딩 윈도우)
// ============================================================

/**
 * 텍스트를 겹치는 청크로 분할
 * @param {string} text
 * @param {number} chunkSize
 * @param {number} overlap
 * @returns {string[]}
 */
export function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  const chunks = []

  // 문단 기준으로 먼저 분리
  const paragraphs = cleanText.split('\n\n')
  let currentChunk = ''

  for (const para of paragraphs) {
    if ((currentChunk + para).length <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        // overlap: 이전 청크 끝부분을 다음 청크에 포함
        currentChunk = currentChunk.slice(-overlap) + '\n\n' + para
      } else {
        // 단일 문단이 chunkSize 초과 → 강제 분할
        for (let i = 0; i < para.length; i += chunkSize - overlap) {
          chunks.push(para.slice(i, i + chunkSize).trim())
        }
        currentChunk = ''
      }
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim())

  return chunks.filter((c) => c.length > 10)
}

// ============================================================
// 4. document_chunks 저장
// ============================================================

/**
 * 청크 배열을 Supabase document_chunks 테이블에 저장
 * @param {string} documentId
 * @param {string[]} chunks
 * @returns {Promise<number>} 저장된 청크 수
 */
export async function saveChunks(documentId, chunks) {
  const rows = chunks.map((content, index) => ({
    document_id: documentId,
    content,
    chunk_index: index,
    metadata: { char_count: content.length },
  }))

  const { error } = await supabase.from('document_chunks').insert(rows)
  if (error) throw new Error(`청크 저장 실패: ${error.message}`)

  return rows.length
}

// ============================================================
// 5. 파이프라인 통합
// ============================================================

/**
 * 전체 문서 처리 파이프라인
 * @param {File} file
 * @param {string} title
 * @param {string} docType
 * @param {function} onProgress - (step: string, progress: number) => void
 * @returns {Promise<{documentId: string, chunkCount: number}>}
 */
export async function processDocument(file, title, docType = 'policy', onProgress = () => {}) {
  onProgress('업로드 중...', 10)
  const { documentId } = await uploadDocument(file, title, docType)

  onProgress('텍스트 추출 중...', 30)
  const text = await extractText(file)

  // 추출된 텍스트를 policy_documents.content에 업데이트
  await supabase
    .from('policy_documents')
    .update({ content: text.slice(0, 5000) }) // 미리보기용 앞 5000자
    .eq('id', documentId)

  onProgress('청크 분할 중...', 60)
  const chunks = chunkText(text)

  onProgress('저장 중...', 80)
  const chunkCount = await saveChunks(documentId, chunks)

  // --------------------------------------------------------
  // TODO: Embedding 생성 (pgvector 활성화 후 아래 코드 적용)
  // --------------------------------------------------------
  // onProgress('임베딩 생성 중...', 90)
  // for (const chunk of savedChunks) {
  //   const embedding = await openai.embeddings.create({
  //     model: 'text-embedding-3-small',
  //     input: chunk.content,
  //   })
  //   await supabase
  //     .from('document_chunks')
  //     .update({ embedding: embedding.data[0].embedding })
  //     .eq('id', chunk.id)
  // }
  // --------------------------------------------------------

  onProgress('완료', 100)
  return { documentId, chunkCount }
}

// ============================================================
// 6. Vector 검색 (pgvector 활성화 후 대체 예정)
// ============================================================

/**
 * [향후 구현] vector similarity 검색
 * 현재는 LIKE 검색으로 대체 (rag.js의 searchPolicyChunks 참고)
 *
 * 활성화 조건:
 * 1. Supabase에서 pgvector extension 활성화
 * 2. document_chunks에 embedding vector(1536) 컬럼 추가
 * 3. HNSW 인덱스 생성: CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops)
 *
 * @param {string} query
 * @param {number} topK
 */
export async function vectorSearch(query, topK = 5) {
  // const queryEmbedding = await openai.embeddings.create({...})
  // const { data } = await supabase.rpc('match_chunks', {
  //   query_embedding: queryEmbedding.data[0].embedding,
  //   match_threshold: 0.7,
  //   match_count: topK,
  // })
  throw new Error('vector 검색은 pgvector 확장 활성화 후 사용 가능합니다.')
}
