import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import ItemDetail from './pages/ItemDetail'
export default function App() {
  const { session, loading } = useAuth()
  if (loading) return <p className="p-8 text-gray-500">Loading…</p>
  if (!session) return <Routes><Route path="*" element={<Auth />} /></Routes>
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} /><Route path="/items" element={<Items />} /><Route path="/items/:id" element={<ItemDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>)
}
