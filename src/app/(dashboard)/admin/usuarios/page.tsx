'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Shield, Pencil, Trash2, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Usuario {
  id: number
  nome: string
  email: string
  papel: string
  ativo: boolean
  ultimo_acesso: string | null
}

const emptyForm = {
  nome: '',
  email: '',
  senha: '',
  papel: 'visualizador',
  ativo: true,
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)

  // CRUD state
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [salvando, setSalvando] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Usuario | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      if (res.ok) setUsuarios(await res.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const papelColors: Record<string, string> = {
    super_admin: 'bg-red-600/20 text-red-400',
    admin: 'bg-purple-600/20 text-purple-400',
    gestor: 'bg-cyan-600/20 text-cyan-400',
    tecnico: 'bg-emerald-600/20 text-emerald-400',
    visualizador: 'bg-slate-600/20 text-slate-400',
  }

  const papelLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    gestor: 'Gestor',
    tecnico: 'Técnico',
    visualizador: 'Visualizador',
  }

  const papelOptions = ['super_admin', 'admin', 'gestor', 'tecnico', 'visualizador']

  const formatDate = (d: string | null) => {
    if (!d) return 'Nunca'
    return new Date(d).toLocaleDateString('pt-BR') + ' ' + new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const abrirNovo = () => {
    setEditando(null)
    setForm(emptyForm)
    setModalAberto(true)
  }

  const abrirEditar = (usr: Usuario) => {
    setEditando(usr)
    setForm({
      nome: usr.nome || '',
      email: usr.email || '',
      senha: '',
      papel: usr.papel || 'visualizador',
      ativo: usr.ativo,
    })
    setModalAberto(true)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      if (editando) {
        const payload: any = {
          id: editando.id,
          nome: form.nome,
          email: form.email,
          papel: form.papel,
          ativo: form.ativo,
        }
        if (form.senha) payload.senha = form.senha
        await fetch('/api/admin/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            senha: form.senha,
            papel: form.papel,
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
      await fetch(`/api/admin/usuarios?id=${confirmExcluir.id}`, { method: 'DELETE' })
      setConfirmExcluir(null)
      carregar()
    } catch { /* ignore */ }
    setExcluindo(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Usuários</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestão de usuários e papéis</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden" style={{ background: 'hsl(222 47% 11%)' }}>
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Papel</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Último Acesso</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usr => (
                <tr key={usr.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-sm text-white font-medium">{usr.nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{usr.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', papelColors[usr.papel] || papelColors.visualizador)}>
                      <Shield className="w-3 h-3" />
                      {papelLabels[usr.papel] || usr.papel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">{formatDate(usr.ultimo_acesso)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', usr.ativo ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400')}>{usr.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => abrirEditar(usr)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmExcluir(usr)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <h2 className="text-lg font-bold text-white">{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
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
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {editando ? 'Senha (deixe vazio para manter)' : 'Senha *'}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder={editando ? 'Deixe vazio para manter a senha atual' : 'Senha'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Papel *</label>
                <select
                  value={form.papel}
                  onChange={(e) => setForm({ ...form, papel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {papelOptions.map(p => (
                    <option key={p} value={p}>{papelLabels[p]}</option>
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
                    {form.ativo ? 'Ativo' : 'Inativo'}
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
                disabled={salvando || !form.nome || !form.email || (!editando && !form.senha)}
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
        titulo="Desativar Usuário"
        mensagem={`Tem certeza que deseja desativar o usuário ${confirmExcluir?.nome}? Esta ação pode ser revertida.`}
        textoBotao="Desativar"
        tipo="danger"
        onConfirm={excluir}
        onCancel={() => setConfirmExcluir(null)}
        carregando={excluindo}
      />
    </div>
  )
}
