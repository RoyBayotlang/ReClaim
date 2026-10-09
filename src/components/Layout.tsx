import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
export default function Layout() {
  const { session } = useAuth(); const nav = useNavigate()
  const link = ({ isActive }: { isActive: boolean }) => `px-3 py-1.5 rounded text-sm ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'}`
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="text-white font-bold tracking-tight">Re<span className="text-orange-400">Claim</span></span>
        <nav className="flex gap-1"><NavLink to="/" end className={link}>Dashboard</NavLink><NavLink to="/items" className={link}>Items</NavLink></nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-slate-300">
          <span className="hidden sm:inline">{session?.user.email}</span>
          <button className="underline" onClick={async () => { await supabase.auth.signOut(); nav('/login') }}>Log out</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4"><Outlet /></main>
    </div>)
}
