import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import ProblemPage from './pages/ProblemPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/problem/:num" element={<ProblemPage />} />
      </Route>
    </Routes>
  )
}
