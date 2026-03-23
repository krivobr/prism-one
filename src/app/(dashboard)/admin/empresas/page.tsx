'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Empresa {
  id: number
  nome: string
  slug: string
  cnpj: string | null
  plano: string
  ativo: boolean
  criado_em: string
}

const emptyForm = {
  nome: '',
  slug: '',
  cnpj: '',
  plano: 'basico',
  ativo: true,
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)

  // CRUD state
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Empresa | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [salvando, setSalvando] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Empresa | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/empresas')
      if (res.ok) setEmpresas(await res.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const planoColors: Record<string, string> = {
    basico: 'bg-slate-600/20 text-slate-400',
    pro: 'bg-cyan-600/20 text-cyan-400',
    enterprise: 'bg-purple-600/20 text-purple-400',
  }

  const planoLabels: Record<string, string> = {
    basico: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
  }

  const planoOptions = ['basico', 'pro', 'enterprise']

  const abrirNovo = () => {
    setEditando(null)
    setForm(emptyForm)
    setModalAberto(true)
  }

  const abrirEditar = (emp: Empresa) => {
    setEditando(emp)
    setForm({
      nome: emp.nome || '',
      slug: emp.slug || '',
      cnpj: emp.cnpj || '',
      plano: emp.plano || 'basico',
      ativo: emp.ativo,
    })
    setModalAberto(true)
  }

  const handleNomeChange = (nome: string) => {
    const newForm = { ...form, nome }
    // Auto-generate slug only when creating (not editing)
    if (!editando) {
      newForm.slug = slugify(nome)
    }
    setForm(newForm)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      if (editando) {
        const payload: any = {
          id: editando.id,
          nome: form.nome,
          slug: form.slug,
          cnpj: form.cnpj || null,
          plano: form.plano,
          ativo: form.ativo,
        }
        await fetch('/api/admin/empresas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/admin/empresas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            slug: form.slug,
            cnpj: form.cnpj || null,
            plano: form.plano,
          }),
        })
      }

      setModalAberto(false)
      carregar()
    } catch { /* ignore */ }
    setSalvando(false)
  }

  const excluir = async () => {
    if (!confirmExcluir) return
    setExcluindo(true)
    try {
      await fetch(`/api/admin/empresas?id=${confirmExcluir.id}`, { method: 'DELETE' })
      setConfirmExcluir(null)
      carregar()
    } catch { /* ignore */ }
    setExcluindo(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Empresas</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestão de tenants do sistema</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0">
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden" style={{ background: 'hsl(222 47% 11%)' }}>
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : empresas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>Nenhuma empresa cadastrada</p>
            <p className="text-xs mt-2 text-slate-600">Somente Super Admins podem visualizar todas as empresas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">CNPJ</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Plano</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map(emp => (
                <tr key={emp.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium">{emp.nome}</p>
                    <p className="text-xs text-slate-500">{emp.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{emp.cnpj || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', planoColors[emp.plano] || planoColors.basico)}>
                      {planoLabels[emp.plano] || emp.plano}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', emp.ativo ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400')}>{emp.ativo ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => abrirEditar(emp)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmExcluir(emp)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editando ? 'Editar Empresa' : 'Nova Empresa'}</h2>
              <button onClick={() => setModalAberto(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Nome da empresa"
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="nome-da-empresa"
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Plano</label>
                <select
                  value={form.plano}
                  onChange={(e) => setForm({ ...form, plano: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {planoOptions.map(p => (
                    <option key={p} value={p}>{planoLabels[p]}</option>
                  ))}
                </select>
              </div>

              {editando && (
                <div className="flex items-center gap-3">
                  <label className="block text-xs font-medium text-slate-400">Status</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, ativo: !form.ativo })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      form.ativo ? 'bg-emerald-600' : 'bg-slate-600'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      form.ativo ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                  <span className={cn('text-xs font-medium', form.ativo ? 'text-emerald-400' : 'text-red-400')}>
                    {form.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome || !form.slug}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        aberto={!!confirmExcluir}
        titulo="Desativar Empresa"
        mensagem={`Tem certeza que deseja desativar a empresa ${confirmExcluir?.nome}? Esta ação pode ser revertida.`}
        textoBotao="Desativar"
        tipo="danger"
        onConfirm={excluir}
        onCancel={() => setConfirmExcluir(null)}
        carregando={excluindo}
      />
    </div>
  )
}
