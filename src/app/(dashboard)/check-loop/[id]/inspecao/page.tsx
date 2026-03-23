'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Camera, MapPin, Check, X, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Equipamento {
  id: number
  tag: string
  descricao: string | null
}

export default function RegistroInspecaoPage() {
  const params = useParams()
  const router = useRouter()
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galeriaInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)

  // Form state
  const [leitura, setLeitura] = useState('')
  const [diagnosticoHart, setDiagnosticoHart] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [status, setStatus] = useState('OK')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoNome, setFotoNome] = useState<string | null>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Compress image before upload
  const compressImage = (file: File, maxWidth = 1200): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      const canvas = document.createElement('canvas')
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    setFotoNome(file.name)
    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
    // Upload
    setUploadProgress(true)
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressed, file.name)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        setFotoUrl(url)
      }
    } catch { /* ignore */ }
    setUploadProgress(false)
  }

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/equipamentos')
        if (res.ok) {
          const eqs = await res.json()
          const eq = eqs.find((e: any) => e.id === Number(params.id))
          setEquipamento(eq || null)
        }
      } catch { /* ignore */ }
      setCarregando(false)
    }
    carregar()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const res = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_equipamento: Number(params.id),
          leitura: leitura || null,
          diagnostico_hart: diagnosticoHart,
          observacoes: observacoes || null,
          status,
          foto_url: fotoUrl || null,
          latitude: gpsCoords?.lat || null,
          longitude: gpsCoords?.lng || null,
        }),
      })

      if (res.ok) {
        setSucesso(true)
        setTimeout(() => router.push('/check-loop'), 1500)
      }
    } catch { /* ignore */ }
    setSalvando(false)
  }

  if (carregando) return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Carregando...</p></div>

  if (sucesso) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-lg font-semibold text-white">Inspeção registrada!</p>
        <p className="text-sm text-slate-400">Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-sm text-slate-400">Registro de Inspeção</p>
          <p className="font-mono font-bold text-white">{equipamento?.tag} · {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leitura do Instrumento */}
        <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Leitura do Instrumento</label>
          <input
            type="text"
            value={leitura}
            onChange={(e) => setLeitura(e.target.value)}
            placeholder="Ex: 245.3"
            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800/50 text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Diagnóstico HART */}
        <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Diagnóstico HART</label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Executar diagnóstico automático</span>
            <button
              type="button"
              onClick={() => setDiagnosticoHart(!diagnosticoHart)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                diagnosticoHart ? 'bg-emerald-600' : 'bg-slate-600'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                diagnosticoHart && 'translate-x-6'
              )} />
            </button>
          </div>
        </div>

        {/* Inspeção Visual - Câmera/Galeria */}
        <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Inspeção Visual</label>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
          <input
            ref={galeriaInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
          {fotoPreview ? (
            <div className="relative">
              <img src={fotoPreview} alt="Foto capturada" className="w-full h-48 object-cover rounded-lg" />
              <button type="button" onClick={() => { setFotoPreview(null); setFotoNome(null) }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition">
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs text-slate-400 mt-2">{fotoNome}</p>
              {gpsCoords && <p className="text-xs text-emerald-400">GPS: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</p>}
              {uploadProgress && <p className="text-xs text-amber-400 mt-1">Enviando foto...</p>}
              {fotoUrl && !uploadProgress && <p className="text-xs text-emerald-400 mt-1">Foto enviada</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-emerald-600/50 transition"
              >
                <Camera className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Câmera</p>
                  <p className="text-xs text-slate-500">Tirar foto</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => galeriaInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-emerald-600/50 transition"
              >
                <Image className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Galeria</p>
                  <p className="text-xs text-slate-500">Escolher imagem</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Status da Inspeção</label>
          <div className="grid grid-cols-3 gap-2">
            {(['OK', 'Alerta', 'Pendente'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'py-2 rounded-lg text-sm font-medium transition border',
                  status === s
                    ? s === 'OK' ? 'bg-emerald-600/20 border-emerald-600 text-emerald-400'
                    : s === 'Alerta' ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400'
                    : 'bg-slate-600/20 border-slate-500 text-slate-300'
                    : 'border-slate-700 text-slate-500 hover:text-white'
                )}
              >
                {s === 'OK' ? '✓ Ok' : s === 'Alerta' ? '⚠ Alerta' : '● Pendente'}
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Observações (opcional)</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Condições do campo, anomalias visuais..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={salvando}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {salvando ? 'Salvando...' : 'Registrar Inspeção'}
        </button>
      </form>
    </div>
  )
}
