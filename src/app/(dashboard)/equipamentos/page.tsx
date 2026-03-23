'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Eye, ChevronDown, Trash2, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Equipamento {
  id: number
  tag: string
  descricao: string | null
  modelo: string | null
  serie: string | null
  funcao: string | null
  icd: number | null
  status: string
  ultima_calibracao: string | null
  proxima_calibracao: string | null
  area: { id: number; nome: string } | null
  familia: { id: number; nome: string } | null
  fabricante: { id: number; nome: string } | null
  processo: { id: number; nome: string } | null
  id_area: number | null
  id_familia: number | null
  id_fabricante: number | null
  id_processo: number | null
}

interface Opcao {
  id: number
  nome: string
  ativo?: boolean
}

const emptyForm = {
  tag: '', descricao: '', modelo: '', serie: '', funcao: '',
  icd: '', id_area: '', id_familia: '', id_fabricante: '', id_processo: '',
}

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroFamilia, setFiltroFamilia] = useState('')
  const [areas, setAreas] = useState<Opcao[]>([])
  const [familias, setFamilias] = useState<Opcao[]>([])
  const [fabricantes, setFabricantes] = useState<Opcao[]>([])
  const [processos, setProcessos] = useState<Opcao[]>([])
  const [selecionado, setSelecionado] = useState<Equipamento | null>(null)

  // CRUD state
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Equipamento | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [salvando, setSalvando] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Equipamento | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (filtroArea) params.set('area', filtroArea)
    if (filtroFamilia) params.set('familia', filtroFamilia)

    try {
      const res = await fetch(`/api/equipamentos?${params}`)
      if (res.ok) setEquipamentos(await res.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [busca, filtroArea, filtroFamilia])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    async function carregarFiltros() {
      const [areasRes, familiasRes, fabRes, procRes] = await Promise.all([
        fetch('/api/cadastros/areas'),
        fetch('/api/cadastros/familias'),
        fetch('/api/cadastros/fabricantes'),
        fetch('/api/cadastros/processos'),
      ])
      if (areasRes.ok) setAreas(await areasRes.json())
      if (familiasRes.ok) setFamilias(await familiasRes.json())
      if (fabRes.ok) setFabricantes(await fabRes.json())
      if (procRes.ok) setProcessos(await procRes.json())
    }
    carregarFiltros()
  }, [])

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-600/20 text-emerald-400'
      case 'Inativo': case 'inativo': return 'bg-red-600/20 text-red-400'
      case 'em_manutencao': return 'bg-yellow-600/20 text-yellow-400'
      default: return 'bg-slate-600/20 text-slate-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo'
      case 'Inativo': case 'inativo': return 'Inativo'
      case 'em_manutencao': return 'Em Manutenção'
      default: return status
    }
  }

  const abrirNovo = () => {
    setEditando(null)
    setForm(emptyForm)
    setModalAberto(true)
  }

  const abrirEditar = (eq: Equipamento) => {
    setEditando(eq)
    setForm({
      tag: eq.tag || '',
      descricao: eq.descricao || '',
      modelo: eq.modelo || '',
      serie: eq.serie || '',
      funcao: eq.funcao || '',
      icd: eq.icd?.toString() || '',
      id_area: eq.area?.id?.toString() || eq.id_area?.toString() || '',
      id_familia: eq.familia?.id?.toString() || eq.id_familia?.toString() || '',
      id_fabricante: eq.fabricante?.id?.toString() || eq.id_fabricante?.toString() || '',
      id_processo: eq.processo?.id?.toString() || eq.id_processo?.toString() || '',
    })
    setModalAberto(true)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const payload: any = {
        tag: form.tag,
        descricao: form.descricao || null,
        modelo: form.modelo || null,
        serie: form.serie || null,
        funcao: form.funcao || null,
        icd: form.icd ? parseFloat(form.icd) : null,
        id_area: form.id_area ? Number(form.id_area) : null,
        id_familia: form.id_familia ? Number(form.id_familia) : null,
        id_fabricante: form.id_fabricante ? Number(form.id_fabricante) : null,
        id_processo: form.id_processo ? Number(form.id_processo) : null,
      }

      if (editando) {
        payload.id = editando.id
        await fetch('/api/equipamentos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/equipamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      await fetch(`/api/equipamentos?id=${confirmExcluir.id}`, { method: 'DELETE' })
      setConfirmExcluir(null)
      carregar()
    } catch { /* ignore */ }
    setExcluindo(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Equipamentos</h1>
          <p className="text-sm text-slate-400 mt-0.5">Instrumentos cadastrados na planta</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0">
          <Plus className="w-4 h-4" />
          Novo Equipamento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por TAG, descrição ou função..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as Áreas</option>
            {areas.filter(a => a.ativo !== false).map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filtroFamilia}
            onChange={(e) => setFiltroFamilia(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as Famílias</option>
            {familias.filter(f => f.ativo !== false).map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 overflow-x-auto" style={{ background: 'hsl(222 47% 11%)' }}>
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : equipamentos.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum equipamento encontrado</div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">TAG</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Família</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Área</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">ICD</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Últ. Calib.</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Próx. Calib.</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentos.map((eq) => (
                <tr key={eq.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelecionado(eq)}>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold text-emerald-400">{eq.tag}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">{eq.descricao || '—'}</span>
                    {eq.funcao && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[250px]">{eq.funcao}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{eq.familia?.nome || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{eq.area?.nome || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {eq.icd ? (
                      <span className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                        eq.icd >= 20 ? 'bg-red-600/20 text-red-400' :
                        eq.icd >= 15 ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-emerald-600/20 text-emerald-400'
                      )}>
                        {eq.icd}
                      </span>
                    ) : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-400">{formatDate(eq.ultima_calibracao)}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-400">{formatDate(eq.proxima_calibracao)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(eq.status))}>
                      {getStatusLabel(eq.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelecionado(eq) }} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Ver detalhes">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); abrirEditar(eq) }} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmExcluir(eq) }} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500">{equipamentos.length} equipamento(s)</p>

      {/* Detail panel */}
      {selecionado && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setSelecionado(null)}>
          <div className="w-full max-w-lg h-full overflow-y-auto p-6 border-l border-slate-700/50" style={{ background: 'hsl(222 47% 8%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-emerald-400 font-mono font-bold text-lg">{selecionado.tag}</p>
                <p className="text-slate-400 text-sm">{selecionado.descricao}</p>
              </div>
              <button onClick={() => setSelecionado(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Section title="Dados Gerais">
                <Field label="Fabricante" value={selecionado.fabricante?.nome} />
                <Field label="Modelo" value={selecionado.modelo} />
                <Field label="Série" value={selecionado.serie} />
                <Field label="Família" value={selecionado.familia?.nome} />
                <Field label="Área" value={selecionado.area?.nome} />
                <Field label="Processo" value={selecionado.processo?.nome} />
                <Field label="Função" value={selecionado.funcao} />
              </Section>

              <Section title="Calibração">
                <Field label="ICD" value={selecionado.icd?.toString()} />
                <Field label="Última Calibração" value={formatDate(selecionado.ultima_calibracao)} />
                <Field label="Próxima Calibração" value={formatDate(selecionado.proxima_calibracao)} />
              </Section>

              <div className="flex gap-3 pt-4">
                <button onClick={() => { setSelecionado(null); abrirEditar(selecionado) }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 transition text-sm font-medium">
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button onClick={() => { setSelecionado(null); setConfirmExcluir(selecionado) }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-600 text-red-400 hover:bg-red-600/10 transition text-sm font-medium">
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editando ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              <button onClick={() => setModalAberto(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="TAG *" value={form.tag} onChange={(v) => setForm({ ...form, tag: v })} placeholder="Ex: FT-1100A" />
                <FormField label="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} placeholder="Ex: Transmissor de vazão" />
                <FormField label="Modelo" value={form.modelo} onChange={(v) => setForm({ ...form, modelo: v })} />
                <FormField label="Série" value={form.serie} onChange={(v) => setForm({ ...form, serie: v })} />
                <FormField label="ICD" value={form.icd} onChange={(v) => setForm({ ...form, icd: v })} type="number" />
                <SelectField label="Área" value={form.id_area} onChange={(v) => setForm({ ...form, id_area: v })} options={areas} />
                <SelectField label="Família" value={form.id_familia} onChange={(v) => setForm({ ...form, id_familia: v })} options={familias} />
                <SelectField label="Fabricante" value={form.id_fabricante} onChange={(v) => setForm({ ...form, id_fabricante: v })} options={fabricantes} />
                <SelectField label="Processo" value={form.id_processo} onChange={(v) => setForm({ ...form, id_processo: v })} options={processos} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Função</label>
                <textarea
                  value={form.funcao}
                  onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.tag} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50">
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
        titulo="Excluir Equipamento"
        mensagem={`Tem certeza que deseja desativar o equipamento ${confirmExcluir?.tag}? Esta ação pode ser revertida.`}
        textoBotao="Desativar"
        tipo="danger"
        onConfirm={excluir}
        onCancel={() => setConfirmExcluir(null)}
        carregando={excluindo}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
      <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white mt-0.5">{value || '—'}</p>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: Opcao[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">Selecione...</option>
        {options.filter(o => o.ativo !== false).map(o => (
          <option key={o.id} value={o.id}>{o.nome}</option>
        ))}
      </select>
    </div>
  )
}
