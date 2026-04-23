import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'

// 지연 로드: 무거운 페이지들
const Chat = lazy(() => import('@/pages/Chat'))
const Products = lazy(() => import('@/pages/Products'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const OrderComplete = lazy(() => import('@/pages/OrderComplete'))
const ContractPrintView = lazy(() => import('@/pages/ContractPrintView'))
const Login = lazy(() => import('@/pages/Login'))

// 관리자 페이지 — 별도 청크로 분리
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'))
const AdminDocuments = lazy(() => import('@/pages/admin/AdminDocuments'))

import { useAuthStore } from '@/store/authStore'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <span className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Full-page print view — outside Layout wrapper */}
        <Route path="contract/:orderId/:type" element={<ContractPrintView />} />

        {/* 관리자 대시보드 */}
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminAnalytics />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="documents" element={<AdminDocuments />} />
        </Route>

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-complete" element={<OrderComplete />} />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
