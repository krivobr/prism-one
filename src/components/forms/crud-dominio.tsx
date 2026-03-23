'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Check, X, Search, Power } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Registro {
  id: number
  nome: string
  ativo: boolean
  [key: string]: any
}

interface CrudDominioProps {
  tabela: string
  titulo: string
  descricao?: string
}

export function CrudDominio({ tabela, titulo, descricao }: CrudDominioProps) {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoNome, setEditandoNome] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [mostrarNovo, setMostrarNovo] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/cadastros/${tabela}`)
      if (res.ok) {
        setRegistros(await res.json())
      }
    } catch {
      setErro('Erro ao carregar registros')
    } finally {
      setCarregando(false)
    }
  }, [tabela])

  useEffect(() => { carregar() }, [carregar])

  const criar = async () => {
    if (!novoNome.trim()) return
    setErro('')
    try {
      const res = await fetch(`/api/cadastros/${tabela}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim() }),
      })
      if (res.ok) {
        setNovoNome('')
        setMostrarNovo(false)
        carregar()
      } else {
        const data = await res.json()
        setErro(data.error || 'Erro ao criar')
      }
    } catch {
      setErro('Erro ao criar registro')
    }
  }

  const salvarEdicao = async () => {
    if (!editandoNome.trim() || !editandoId) return
    setErro('')
    try {
      const res = await fetch(`/api/cadastros/${tabela}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editandoId, nome: editandoNome.trim() }),
      })
      if (res.ok) {
        setEditandoId(null)
        carregar()
      }
    } catch {
      setErro('Erro ao editar registro')
    }
  }

  const toggleAtivo = async (id: number) => {
    try {
      await fetch(`/api/cadastros/${tabela}?id=${id}`, { method: 'DELETE' })
      carregar()
    } catch {
      setErro('Erro ao alterar status')
    }
  }

  const filtrados = registros.filter((r) =>
    r.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{titulo}</h1>
          {descricao && <p className="text-sm text-slate-400 mt-0.5">{descricao}</p>}
        </div>
        <button
          onClick={() => { setMostrarNovo(true); setNovoNome('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        />
      </div>

      {erro && <p className="text-red-400 text-sm">{erro}</p>}

      {mostrarNovo && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-600/50" style={{ background: 'hsl(222 47% 13%)' }}>
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criar()}
            placeholder="Nome do novo registro..."
            className="flex-1 px-3 py-1.5 rounded border border-slate-600 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            autoFocus
          />
          <button onClick={criar} className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setMostrarNovo(false)} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 overflow-hidden" style={{ background: 'hsl(222 47% 11%)' }}>
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {busca ? 'Nenhum registro encontrado' : 'Nenhum registro cadastrado'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((reg) => (
                <tr key={reg.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    {editandoId === reg.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editandoNome}
                          onChange={(e) => setEditandoNome(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') setEditandoId(null) }}
                          className="flex-1 px-2 py-1 rounded border border-slate-600 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button onClick={salvarEdicao} className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditandoId(null)} className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className={cn('text-sm', reg.ativo ? 'text-white' : 'text-slate-500 line-through')}>{reg.nome}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      reg.ativo ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
                    )}>
                      {reg.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditandoId(reg.id); setEditandoNome(reg.nome) }} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleAtivo(reg.id)} className={cn('p-1.5 rounded transition', reg.ativo ? 'text-slate-400 hover:text-red-400 hover:bg-red-600/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-600/10')} title={reg.ativo ? 'Desativar' : 'Ativar'}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {filtrados.length} registro(s) · {registros.filter(r => r.ativo).length} ativo(s)
      </p>
    </div>
  )
}
