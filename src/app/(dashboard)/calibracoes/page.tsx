'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, FileText, Pencil, Trash2, Eye, X, Save, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Ponto {
  numero_ponto: number
  percentual_escala: number | null
  valor_aplicado: number | null
  valor_lido_subida: number | null
  valor_lido_descida: number | null
  erro_subida: number | null
  erro_descida: number | null
}

interface Calibracao {
  id: number
  data: string
  tipo: string
  resultado: string | null
  desvio_maximo: number | null
  unidade_entrada: string | null
  unidade_saida: string | null
  id_equipamento: number
  id_executante: number | null
  observacoes: string | null
  equipamento: { tag: string; descricao: string | null }
  executante: { nome: string } | null
  pontos: Ponto[]
}

interface Equipamento { id: number; tag: string; descricao: string | null }
interface Executante { id: number; nome: string }

const emptyPonto = (): Ponto => ({
  numero_ponto: 1, percentual_escala: 0, valor_aplicado: null,
  valor_lido_subida: null, valor_lido_descida: null, erro_subida: null, erro_descida: null,
})

export default function CalibracoesPage() {
  const [calibracoes, setCalibs] = useState<Calibracao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [executantes, setExecutantes] = useState<Executante[]>([])

  // CRUD
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Calibracao | null>(null)
  const [detalhe, setDetalhe] = useState<Calibracao | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<Calibracao | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form
  const [formData, setFormData] = useState('')
  const [formTipo, setFormTipo] = useState('Calibração sem ajuste')
  const [formEquip, setFormEquip] = useState('')
  const [formExec, setFormExec] = useState('')
  const [formUe, setFormUe] = useState('')
  const [formUs, setFormUs] = useState('')
  const [formObs, setFormObs] = useState('')
  const [formPontos, setFormPontos] = useState<Ponto[]>([emptyPonto()])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/calibracoes')
      if (res.ok) setCalibs(await res.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    Promise.all([
      fetch('/api/equipamentos').then(r => r.ok ? r.json() : []),
      fetch('/api/cadastros/executantes').then(r => r.ok ? r.json() : []),
    ]).then(([eqs, execs]) => {
      setEquipamentos(eqs)
      setExecutantes(execs)
    })
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const filtradas = calibracoes.filter(c =>
    c.equipamento.tag.toLowerCase().includes(busca.toLowerCase()) ||
    (c.equipamento.descricao || '').toLowerCase().includes(busca.toLowerCase())
  )

  const resetForm = () => {
    setFormData(new Date().toISOString().split('T')[0])
    setFormTipo('Calibração sem ajuste')
    setFormEquip('')
    setFormExec('')
    setFormUe('')
    setFormUs('')
    setFormObs('')
    setFormPontos([emptyPonto()])
  }

  const abrirNovo = () => {
    setEditando(null)
    resetForm()
    setModalAberto(true)
  }

  const abrirEditar = (cal: Calibracao) => {
    setEditando(cal)
    setFormData(cal.data.split('T')[0])
    setFormTipo(cal.tipo)
    setFormEquip(cal.id_equipamento.toString())
    setFormExec(cal.id_executante?.toString() || '')
    setFormUe(cal.unidade_entrada || '')
    setFormUs(cal.unidade_saida || '')
    setFormObs(cal.observacoes || '')
    setFormPontos(cal.pontos.length > 0 ? cal.pontos : [emptyPonto()])
    setModalAberto(true)
  }

  const addPonto = () => {
    setFormPontos([...formPontos, { ...emptyPonto(), numero_ponto: formPontos.length + 1, percentual_escala: formPontos.length * 25 }])
  }

  const updatePonto = (idx: number, field: keyof Ponto, val: string) => {
    const updated = [...formPontos]
    ;(updated[idx] as any)[field] = val ? parseFloat(val) : null
    setFormPontos(updated)
  }

  const removePonto = (idx: number) => {
    setFormPontos(formPontos.filter((_, i) => i !== idx).map((p, i) => ({ ...p, numero_ponto: i + 1 })))
  }

  const calcDesvioMax = () => {
    let max = 0
    for (const p of formPontos) {
      if (p.erro_subida != null && Math.abs(p.erro_subida) > max) max = Math.abs(p.erro_subida)
      if (p.erro_descida != null && Math.abs(p.erro_descida) > max) max = Math.abs(p.erro_descida)
    }
    return max
  }

  const salvar = async () => {
    if (!formEquip) return
    setSalvando(true)
    try {
      const desvio = calcDesvioMax()
      const payload: any = {
        data: new Date(formData + 'T00:00:00').toISOString(),
        tipo: formTipo,
        id_equipamento: Number(formEquip),
        id_executante: formExec ? Number(formExec) : null,
        unidade_entrada: formUe || null,
        unidade_saida: formUs || null,
        observacoes: formObs || null,
        desvio_maximo: desvio || null,
        resultado: desvio <= 1 ? 'Aprovado' : 'Reprovado',
        pontos: formPontos.map(p => ({
          numero_ponto: p.numero_ponto,
          percentual_escala: p.percentual_escala,
          valor_aplicado: p.valor_aplicado,
          valor_lido_subida: p.valor_lido_subida,
          valor_lido_descida: p.valor_lido_descida,
          erro_subida: p.erro_subida,
          erro_descida: p.erro_descida,
        })),
      }

      if (editando) {
        payload.id = editando.id
        await fetch('/api/calibracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/calibracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      await fetch(`/api/calibracoes?id=${confirmExcluir.id}`, { method: 'DELETE' })
      setConfirmExcluir(null)
      carregar()
    } catch { /* ignore */ }
    setExcluindo(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Calibrações</h1>
          <p className="text-sm text-slate-400 mt-0.5">Registros de calibração dos instrumentos</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0">
          <Plus className="w-4 h-4" />
          Nova Calibração
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por TAG..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-x-auto" style={{ background: 'hsl(222 47% 11%)' }}>
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>Nenhuma calibração registrada</p>
            <p className="text-xs mt-1">Clique em &quot;Nova Calibração&quot; para registrar</p>
          </div>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">TAG</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Tipo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Pontos</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Desvio Máx</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Resultado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Executante</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((cal) => (
                <tr key={cal.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300">{formatDate(cal.data)}</td>
                  <td className="px-4 py-3"><span className="text-sm font-mono font-semibold text-emerald-400">{cal.equipamento.tag}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{cal.tipo}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-400">{cal.pontos.length}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {cal.desvio_maximo != null ? (
                      <span className={cn(cal.desvio_maximo > 1 ? 'text-red-400' : 'text-emerald-400')}>{cal.desvio_maximo.toFixed(2)}%</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      cal.resultado === 'Aprovado' ? 'bg-emerald-600/20 text-emerald-400' :
                      cal.resultado === 'Reprovado' ? 'bg-red-600/20 text-red-400' :
                      'bg-slate-600/20 text-slate-400'
                    )}>{cal.resultado || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{cal.executante?.nome || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetalhe(cal)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Ver pontos"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => abrirEditar(cal)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmExcluir(cal)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-slate-500">{filtradas.length} calibração(ões)</p>

      {/* Detail Modal - Pontos de Calibração */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetalhe(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Pontos de Calibração</h2>
                <p className="text-sm text-slate-400">{detalhe.equipamento.tag} · {formatDate(detalhe.data)} · {detalhe.tipo}</p>
              </div>
              <button onClick={() => setDetalhe(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border border-slate-700/50 p-3 text-center" style={{ background: 'hsl(222 47% 8%)' }}>
                <p className="text-xs text-slate-500">Unid. Entrada</p>
                <p className="text-sm font-medium text-white">{detalhe.unidade_entrada || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 p-3 text-center" style={{ background: 'hsl(222 47% 8%)' }}>
                <p className="text-xs text-slate-500">Unid. Saída</p>
                <p className="text-sm font-medium text-white">{detalhe.unidade_saida || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 p-3 text-center" style={{ background: 'hsl(222 47% 8%)' }}>
                <p className="text-xs text-slate-500">Desvio Máx</p>
                <p className={cn('text-sm font-medium', detalhe.desvio_maximo && detalhe.desvio_maximo > 1 ? 'text-red-400' : 'text-emerald-400')}>{detalhe.desvio_maximo?.toFixed(2) || '—'}%</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 p-3 text-center" style={{ background: 'hsl(222 47% 8%)' }}>
                <p className="text-xs text-slate-500">Resultado</p>
                <p className={cn('text-sm font-medium', detalhe.resultado === 'Aprovado' ? 'text-emerald-400' : 'text-red-400')}>{detalhe.resultado || '—'}</p>
              </div>
            </div>

            {detalhe.pontos.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50" style={{ background: 'hsl(222 47% 8%)' }}>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">Ponto</th>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">% Escala</th>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">Aplicado</th>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">Subida</th>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">Descida</th>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">Erro Sub %</th>
                      <th className="px-3 py-2 text-xs text-slate-400 text-center">Erro Desc %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalhe.pontos.map((p) => (
                      <tr key={p.numero_ponto} className="border-b border-slate-700/30 last:border-0">
                        <td className="px-3 py-2 text-center text-white font-medium">{p.numero_ponto}</td>
                        <td className="px-3 py-2 text-center text-slate-300">{p.percentual_escala ?? '—'}%</td>
                        <td className="px-3 py-2 text-center text-slate-300">{p.valor_aplicado ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-300">{p.valor_lido_subida ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-300">{p.valor_lido_descida ?? '—'}</td>
                        <td className="px-3 py-2 text-center">{p.erro_subida != null ? <span className={Math.abs(p.erro_subida) > 1 ? 'text-red-400' : 'text-emerald-400'}>{p.erro_subida.toFixed(2)}</span> : '—'}</td>
                        <td className="px-3 py-2 text-center">{p.erro_descida != null ? <span className={Math.abs(p.erro_descida) > 1 ? 'text-red-400' : 'text-emerald-400'}>{p.erro_descida.toFixed(2)}</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6">Nenhum ponto registrado</p>
            )}

            {detalhe.observacoes && (
              <div className="mt-4 rounded-lg border border-slate-700/50 p-3" style={{ background: 'hsl(222 47% 8%)' }}>
                <p className="text-xs text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-300">{detalhe.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editando ? 'Editar Calibração' : 'Nova Calibração'}</h2>
              <button onClick={() => setModalAberto(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Equipamento *</label>
                  <select value={formEquip} onChange={(e) => setFormEquip(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.tag} - {eq.descricao || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Data *</label>
                  <input type="date" value={formData} onChange={(e) => setFormData(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                  <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Calibração sem ajuste</option>
                    <option>Calibração com ajuste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Executante</label>
                  <select value={formExec} onChange={(e) => setFormExec(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {executantes.filter((e: any) => e.ativo !== false).map(ex => <option key={ex.id} value={ex.id}>{ex.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Unid. Entrada</label>
                  <input type="text" value={formUe} onChange={(e) => setFormUe(e.target.value)} placeholder="pH, mA, m³/h..." className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Unid. Saída</label>
                  <input type="text" value={formUs} onChange={(e) => setFormUs(e.target.value)} placeholder="mA, V..." className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Pontos de Calibração */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pontos de Calibração</label>
                  <button type="button" onClick={addPonto} className="text-xs text-emerald-400 hover:text-emerald-300 transition">+ Adicionar ponto</button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/50" style={{ background: 'hsl(222 47% 8%)' }}>
                        <th className="px-2 py-2 text-slate-400">#</th>
                        <th className="px-2 py-2 text-slate-400">% Escala</th>
                        <th className="px-2 py-2 text-slate-400">Aplicado</th>
                        <th className="px-2 py-2 text-slate-400">Subida</th>
                        <th className="px-2 py-2 text-slate-400">Descida</th>
                        <th className="px-2 py-2 text-slate-400">Erro Sub %</th>
                        <th className="px-2 py-2 text-slate-400">Erro Desc %</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formPontos.map((p, i) => (
                        <tr key={i} className="border-b border-slate-700/30 last:border-0">
                          <td className="px-2 py-1 text-center text-white">{i + 1}</td>
                          {(['percentual_escala', 'valor_aplicado', 'valor_lido_subida', 'valor_lido_descida', 'erro_subida', 'erro_descida'] as const).map(field => (
                            <td key={field} className="px-1 py-1">
                              <input type="number" step="any" value={p[field] ?? ''} onChange={(e) => updatePonto(i, field, e.target.value)}
                                className="w-full px-1 py-1 rounded border border-slate-600 bg-slate-800/50 text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </td>
                          ))}
                          <td className="px-1 py-1 text-center">
                            {formPontos.length > 1 && (
                              <button type="button" onClick={() => removePonto(i)} className="text-red-400 hover:text-red-300">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Observações</label>
                <textarea value={formObs} onChange={(e) => setFormObs(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !formEquip} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50">
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        aberto={!!confirmExcluir}
        titulo="Excluir Calibração"
        mensagem={`Tem certeza que deseja excluir a calibração de ${confirmExcluir?.equipamento.tag} do dia ${confirmExcluir ? formatDate(confirmExcluir.data) : ''}? Esta ação não pode ser desfeita.`}
        onConfirm={excluir}
        onCancel={() => setConfirmExcluir(null)}
        carregando={excluindo}
      />
    </div>
  )
}
