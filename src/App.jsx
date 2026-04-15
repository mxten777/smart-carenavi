import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Chat from '@/pages/Chat'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Checkout from '@/pages/Checkout'
import OrderComplete from '@/pages/OrderComplete'
import ContractPrintView from '@/pages/ContractPrintView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full-page print view — outside Layout wrapper */}
        <Route path="contract/:orderId/:type" element={<ContractPrintView />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-complete" element={<OrderComplete />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
