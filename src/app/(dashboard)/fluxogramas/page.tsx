'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, Trash2, X, Save, Upload, Eye, FileImage, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Fluxograma {
  id: number
  arquivo_url: string
  descricao: string | null
  id_equipamento: number
  criado_em: string
  equipamento: { tag: string; descricao: string | null }
}

interface Equipamento { id: number; tag: string; descricao: string | null }

export default function FluxogramasPage() {
  const [fluxogramas, setFluxogramas] = useState<Fluxograma[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  // CRUD
  const [modalAberto, setModalAberto] = useState(false)
  const [visualizar, setVisualizar] = useState<Fluxograma | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<Fluxograma | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form
  const [fEquip, setFEquip] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fArquivoUrl, setFArquivoUrl] = useState('')
  const [fArquivoNome, setFArquivoNome] = useState('')
  const [uploadando, setUploadando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/fluxogramas')
      if (res.ok) setFluxogramas(await res.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    fetch('/api/equipamentos').then(r => r.ok ? r.json() : []).then(setEquipamentos)
  }, [])

  const filtrados = fluxogramas.filter(f =>
    f.equipamento.tag.toLowerCase().includes(busca.toLowerCase()) ||
    (f.descricao || '').toLowerCase().includes(busca.toLowerCase())
  )

  const handleUpload = async (file: File) => {
    setUploadando(true)
    setFArquivoNome(file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        setFArquivoUrl(url)
      }
    } catch { /* ignore */ }
    setUploadando(false)
  }

  const abrirNovo = () => {
    setFEquip('')
    setFDesc('')
    setFArquivoUrl('')
    setFArquivoNome('')
    setModalAberto(true)
  }

  const salvar = async () => {
    if (!fEquip || !fArquivoUrl) return
    setSalvando(true)
    try {
      await fetch('/api/fluxogramas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_equipamento: Number(fEquip),
          arquivo_url: fArquivoUrl,
          descricao: fDesc || null,
        }),
      })
      setModalAberto(false)
      carregar()
    } catch { /* ignore */ }
    setSalvando(false)
  }

  const excluir = async () => {
    if (!confirmExcluir) return
    setExcluindo(true)
    try {
      await fetch(`/api/fluxogramas?id=${confirmExcluir.id}`, { method: 'DELETE' })
      setConfirmExcluir(null)
      carregar()
    } catch { /* ignore */ }
    setExcluindo(false)
  }

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Fluxogramas</h1>
          <p className="text-sm text-slate-400 mt-0.5">P&IDs e diagramas de processo</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0">
          <Plus className="w-4 h-4" />
          Novo Fluxograma
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por TAG ou descrição..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
      </div>

      {/* Grid */}
      {carregando ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 p-12 text-center" style={{ background: 'hsl(222 47% 11%)' }}>
          <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Nenhum fluxograma cadastrado</p>
          <p className="text-xs text-slate-500 mt-1">Clique em &quot;Novo Fluxograma&quot; para adicionar P&IDs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(f => (
            <div key={f.id} className="rounded-xl border border-slate-700/50 overflow-hidden group" style={{ background: 'hsl(222 47% 11%)' }}>
              {/* Preview */}
              <div className="relative h-40 bg-slate-800/50 flex items-center justify-center cursor-pointer" onClick={() => setVisualizar(f)}>
                {isImage(f.arquivo_url) ? (
                  <img src={f.arquivo_url} alt={f.descricao || f.equipamento.tag} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <FileImage className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">{f.arquivo_url.split('/').pop()}</p>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-semibold text-emerald-400">{f.equipamento.tag}</span>
                  <button onClick={() => setConfirmExcluir(f)} className="p-1 rounded text-slate-500 hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {f.descricao && <p className="text-xs text-slate-400 mt-1 truncate">{f.descricao}</p>}
                <p className="text-xs text-slate-500 mt-1">{new Date(f.criado_em).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">{filtrados.length} fluxograma(s)</p>

      {/* Fullscreen viewer */}
      {visualizar && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setVisualizar(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition z-10">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-3">
              <span className="text-emerald-400 font-mono font-bold">{visualizar.equipamento.tag}</span>
              {visualizar.descricao && <span className="text-slate-400 ml-2">— {visualizar.descricao}</span>}
            </div>
            {isImage(visualizar.arquivo_url) ? (
              <img src={visualizar.arquivo_url} alt={visualizar.descricao || ''} className="w-full max-h-[80vh] object-contain rounded-lg" />
            ) : (
              <iframe src={visualizar.arquivo_url} className="w-full h-[80vh] rounded-lg bg-white" />
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Novo Fluxograma</h2>
              <button onClick={() => setModalAberto(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Equipamento *</label>
                <select value={fEquip} onChange={(e) => setFEquip(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Selecione...</option>
                  {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.tag} - {eq.descricao || ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                <input type="text" value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="Ex: P&ID do processo de lixiviação" className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              {/* Upload area */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Arquivo *</label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />

                {fArquivoUrl ? (
                  <div className="rounded-lg border border-emerald-600/50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileImage className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-white truncate">{fArquivoNome}</span>
                    </div>
                    <button onClick={() => { setFArquivoUrl(''); setFArquivoNome('') }} className="text-slate-400 hover:text-red-400 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadando}
                    className="w-full flex flex-col items-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-emerald-600/50 transition disabled:opacity-50"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">{uploadando ? 'Enviando...' : 'Clique para selecionar arquivo'}</span>
                    <span className="text-xs text-slate-500">Imagem ou PDF</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !fEquip || !fArquivoUrl} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50">
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        aberto={!!confirmExcluir}
        titulo="Excluir Fluxograma"
        mensagem={`Tem certeza que deseja excluir o fluxograma de ${confirmExcluir?.equipamento.tag}?`}
        onConfirm={excluir}
        onCancel={() => setConfirmExcluir(null)}
        carregando={excluindo}
      />
    </div>
  )
}
