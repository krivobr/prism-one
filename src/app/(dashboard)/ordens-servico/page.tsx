'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, AlertCircle, Pencil, Trash2, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface OrdemServico {
  id: number
  data: string
  numero_os: string | null
  descricao: string
  pendencia: boolean
  prioridade: string | null
  id_equipamento: number
  id_tipo: number | null
  id_causa: number | null
  id_executante: number | null
  observacoes: string | null
  equipamento: { tag: string; descricao: string | null }
  tipo: { nome: string } | null
  causa: { nome: string } | null
  executante: { nome: string } | null
}

interface Opcao { id: number; nome: string; ativo?: boolean }
interface Equipamento { id: number; tag: string; descricao: string | null }

export default function OrdensServicoPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [tipos, setTipos] = useState<Opcao[]>([])
  const [causas, setCausas] = useState<Opcao[]>([])
  const [executantes, setExecutantes] = useState<Opcao[]>([])

  // CRUD
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<OrdemServico | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<OrdemServico | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form
  const [fData, setFData] = useState('')
  const [fNumOs, setFNumOs] = useState('')
  const [fEquip, setFEquip] = useState('')
  const [fTipo, setFTipo] = useState('')
  const [fCausa, setFCausa] = useState('')
  const [fExec, setFExec] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fObs, setFObs] = useState('')
  const [fPend, setFPend] = useState(false)
  const [fPrior, setFPrior] = useState('media')

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/ordens-servico')
      if (res.ok) setOrdens(await res.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    Promise.all([
      fetch('/api/equipamentos').then(r => r.ok ? r.json() : []),
      fetch('/api/cadastros/tipos').then(r => r.ok ? r.json() : []),
      fetch('/api/cadastros/causas').then(r => r.ok ? r.json() : []),
      fetch('/api/cadastros/executantes').then(r => r.ok ? r.json() : []),
    ]).then(([eqs, ts, cs, exs]) => {
      setEquipamentos(eqs)
      setTipos(ts)
      setCausas(cs)
      setExecutantes(exs)
    })
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const filtradas = ordens.filter(o =>
    o.equipamento.tag.toLowerCase().includes(busca.toLowerCase()) ||
    o.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    (o.tipo?.nome || '').toLowerCase().includes(busca.toLowerCase())
  )

  const resetForm = () => {
    setFData(new Date().toISOString().split('T')[0])
    setFNumOs('')
    setFEquip('')
    setFTipo('')
    setFCausa('')
    setFExec('')
    setFDesc('')
    setFObs('')
    setFPend(false)
    setFPrior('media')
  }

  const abrirNovo = () => { setEditando(null); resetForm(); setModalAberto(true) }

  const abrirEditar = (os: OrdemServico) => {
    setEditando(os)
    setFData(os.data.split('T')[0])
    setFNumOs(os.numero_os || '')
    setFEquip(os.id_equipamento.toString())
    setFTipo(os.id_tipo?.toString() || '')
    setFCausa(os.id_causa?.toString() || '')
    setFExec(os.id_executante?.toString() || '')
    setFDesc(os.descricao)
    setFObs(os.observacoes || '')
    setFPend(os.pendencia)
    setFPrior(os.prioridade || 'media')
    setModalAberto(true)
  }

  const salvar = async () => {
    if (!fEquip || !fDesc) return
    setSalvando(true)
    try {
      const payload: any = {
        data: new Date(fData + 'T00:00:00').toISOString(),
        numero_os: fNumOs || null,
        id_equipamento: Number(fEquip),
        id_tipo: fTipo ? Number(fTipo) : null,
        id_causa: fCausa ? Number(fCausa) : null,
        id_executante: fExec ? Number(fExec) : null,
        descricao: fDesc,
        observacoes: fObs || null,
        pendencia: fPend,
        prioridade: fPrior,
      }

      if (editando) {
        payload.id = editando.id
        await fetch('/api/ordens-servico', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/ordens-servico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      await fetch(`/api/ordens-servico?id=${confirmExcluir.id}`, { method: 'DELETE' })
      setConfirmExcluir(null)
      carregar()
    } catch { /* ignore */ }
    setExcluindo(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-sm text-slate-400 mt-0.5">Registros de manutenção e intervenções</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0">
          <Plus className="w-4 h-4" />
          Nova OS
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por TAG, descrição ou tipo..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-x-auto" style={{ background: 'hsl(222 47% 11%)' }}>
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma ordem de serviço encontrada</div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">TAG</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Causa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Executante</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Pendência</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((os) => (
                <tr key={os.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{formatDate(os.data)}</td>
                  <td className="px-4 py-3"><span className="text-sm font-mono font-semibold text-emerald-400">{os.equipamento.tag}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{os.tipo?.nome || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{os.causa?.nome || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 max-w-[300px] truncate">{os.descricao}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{os.executante?.nome || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {os.pendencia ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-400">
                        <AlertCircle className="w-3 h-3" /> Sim
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => abrirEditar(os)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmExcluir(os)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-slate-500">{filtradas.length} ordem(ns) · {ordens.filter(o => o.pendencia).length} com pendência</p>

      {/* Create/Edit Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editando ? 'Editar OS' : 'Nova Ordem de Serviço'}</h2>
              <button onClick={() => setModalAberto(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Equipamento *</label>
                  <select value={fEquip} onChange={(e) => setFEquip(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.tag}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Data *</label>
                  <input type="date" value={fData} onChange={(e) => setFData(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nº OS</label>
                  <input type="text" value={fNumOs} onChange={(e) => setFNumOs(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                  <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {tipos.filter(t => t.ativo !== false).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Causa</label>
                  <select value={fCausa} onChange={(e) => setFCausa(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {causas.filter(c => c.ativo !== false).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Executante</label>
                  <select value={fExec} onChange={(e) => setFExec(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {executantes.filter(e => e.ativo !== false).map(ex => <option key={ex.id} value={ex.id}>{ex.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Prioridade</label>
                  <select value={fPrior} onChange={(e) => setFPrior(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button type="button" onClick={() => setFPend(!fPend)} className={cn('relative w-12 h-6 rounded-full transition-colors', fPend ? 'bg-yellow-600' : 'bg-slate-600')}>
                    <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', fPend && 'translate-x-6')} />
                  </button>
                  <span className="text-sm text-slate-300">Pendência</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descrição *</label>
                <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Observações</label>
                <textarea value={fObs} onChange={(e) => setFObs(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !fEquip || !fDesc} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50">
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
        titulo="Excluir Ordem de Serviço"
        mensagem={`Tem certeza que deseja excluir a OS de ${confirmExcluir?.equipamento.tag}? Esta ação não pode ser desfeita.`}
        onConfirm={excluir}
        onCancel={() => setConfirmExcluir(null)}
        carregando={excluindo}
      />
    </div>
  )
}
