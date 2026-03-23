'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const result = await signIn('credentials', {
      email,
      senha,
      redirect: false,
    })

    setCarregando(false)

    if (result?.error) {
      setErro('Email ou senha inválidos')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'hsl(222 47% 8%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">FSTECH</p>
          <h1 className="text-3xl font-bold text-white mt-1">PRISM<sup className="text-xs align-super">™</sup> ONE</h1>
          <p className="text-slate-400 text-sm mt-2">Gestão de Instrumentação Industrial</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700/50 p-8" style={{ background: 'hsl(222 47% 11%)' }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {erro && (
            <p className="text-red-400 text-sm mt-3">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-6 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          FSTECH PRISM™ One · v1.0
        </p>
      </div>
    </div>
  )
}
