import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import ProblemPage from './pages/ProblemPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/problem/:num" element={<ProblemPage />} />
        {/* 兜底：非法哈希（如残留的锚点 hash）一律回首页，避免白屏 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
