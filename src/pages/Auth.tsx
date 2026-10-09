import { useState, FormEvent } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
export default function Auth() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [f, setF] = useState({ email: '', password: '', full_name: '', business_name: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (f.password.length < 6) return toast.error('Password must be at least 6 characters')
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name, business_name: f.business_name } } })
    if (error) toast.error(error.message); else if (mode === 'register') toast.success('Account created')
  }
  const inp = 'w-full border rounded px-3 py-2 text-sm'
  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">Re<span className="text-orange-500">Claim</span></h1>
        <p className="text-sm text-gray-500">Refurbishment & asset recovery tracking</p>
        {mode === 'register' && <><input className={inp} placeholder="Your name" required value={f.full_name} onChange={set('full_name')} />
          <input className={inp} placeholder="Business name" required value={f.business_name} onChange={set('business_name')} /></>}
        <input className={inp} type="email" placeholder="Email" required value={f.email} onChange={set('email')} />
        <input className={inp} type="password" placeholder="Password" required value={f.password} onChange={set('password')} />
        <button className="w-full bg-slate-900 text-white rounded py-2 text-sm">{mode === 'login' ? 'Log in' : 'Register'}</button>
        <button type="button" className="text-sm text-blue-600" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}</button>
      </form>
    </div>)
}
