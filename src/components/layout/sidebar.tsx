'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wrench,
  Gauge,
  ClipboardCheck,
  FileText,
  BarChart3,
  GitBranch,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Database,
  Users,
  Building2,
  LogOut,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  user: {
    name?: string | null
    papel?: string | null
    empresa_nome?: string | null
  }
}

// Papéis que podem ver cada item do menu
// undefined = todos podem ver
const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Equipamentos', href: '/equipamentos', icon: Wrench, papeis: ['super_admin', 'admin', 'gestor'] },
  { label: 'Calibrações', href: '/calibracoes', icon: Gauge, papeis: ['super_admin', 'admin', 'gestor'] },
  { label: 'Check Loop', href: '/check-loop', icon: ClipboardCheck },
  { label: 'Ordens de Serviço', href: '/ordens-servico', icon: FileText, papeis: ['super_admin', 'admin', 'gestor'] },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart3, papeis: ['super_admin', 'admin', 'gestor'] },
  { label: 'Fluxogramas', href: '/fluxogramas', icon: GitBranch, papeis: ['super_admin', 'admin', 'gestor'] },
]

const cadastrosSubmenu = [
  { label: 'Tipos', href: '/cadastros/tipos' },
  { label: 'Causas', href: '/cadastros/causas' },
  { label: 'Executantes', href: '/cadastros/executantes' },
  { label: 'Áreas', href: '/cadastros/areas' },
  { label: 'Processos', href: '/cadastros/processos' },
  { label: 'Famílias', href: '/cadastros/familias' },
  { label: 'Fabricantes', href: '/cadastros/fabricantes' },
  { label: 'Conexões', href: '/cadastros/conexoes' },
  { label: 'Sinais Entrada', href: '/cadastros/sinais-entrada' },
  { label: 'Sinais Saída', href: '/cadastros/sinais-saida' },
  { label: 'Alimentação', href: '/cadastros/alimentacao' },
  { label: 'Materiais', href: '/cadastros/materiais' },
  { label: 'Protocolos', href: '/cadastros/protocolos' },
  { label: 'Posição Drenos', href: '/cadastros/posicao-drenos' },
  { label: 'Tipo Ajuste Remoto', href: '/cadastros/tipo-ajuste-remoto' },
  { label: 'Tipo Indicador Local', href: '/cadastros/tipo-indicador-local' },
  { label: 'Tipo Ajuste Local', href: '/cadastros/tipo-ajuste-local' },
  { label: 'Tipo Cabeçote', href: '/cadastros/tipo-cabecote' },
  { label: 'Tipo Elem. Sensor', href: '/cadastros/tipo-elemento-sensor' },
  { label: 'Tipo Válvula', href: '/cadastros/tipo-valvula' },
  { label: 'Tipo Atuador', href: '/cadastros/tipo-atuador' },
  { label: 'Períodos', href: '/cadastros/periodos' },
]

const adminItems = [
  { label: 'Empresas', href: '/admin/empresas', icon: Building2 },
  { label: 'Usuários', href: '/admin/usuarios', icon: Users },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cadastrosOpen, setCadastrosOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700/50">
        <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">FSTECH</p>
        <h1 className="text-lg font-bold text-white">PRISM<sup className="text-[8px] align-super">™</sup> ONE</h1>
      </div>

      {/* Empresa */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <p className="text-xs text-slate-500">Empresa</p>
        <p className="text-sm text-slate-300 font-medium truncate">{user.empresa_nome ?? 'Carregando...'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.filter(item => !item.papeis || item.papeis.includes(user.papel ?? '')).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(item.href)
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* Cadastros submenu — só para admin/gestor */}
        {['super_admin', 'admin', 'gestor'].includes(user.papel ?? '') && (
          <>
            <button
              onClick={() => setCadastrosOpen(!cadastrosOpen)}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith('/cadastros')
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <span className="flex items-center gap-3">
                <Database className="w-4 h-4 shrink-0" />
                Cadastros
              </span>
              {cadastrosOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {cadastrosOpen && (
              <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5">
                {cadastrosSubmenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-1.5 rounded text-xs transition-colors',
                      isActive(item.href)
                        ? 'text-emerald-400 bg-emerald-600/10'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Admin */}
        {(user.papel === 'admin' || user.papel === 'super_admin') && (
          <>
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <span className="flex items-center gap-3">
                <Settings className="w-4 h-4 shrink-0" />
                Administração
              </span>
              {adminOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {adminOpen && (
              <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5">
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors',
                      isActive(item.href)
                        ? 'text-emerald-400 bg-emerald-600/10'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{user.name ?? 'Usuário'}</p>
            <p className="text-xs text-slate-500 capitalize">{user.papel ?? ''}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-slate-800 text-white"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 w-64 border-r border-slate-700/50 transform transition-transform duration-200 ease-in-out md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'hsl(222 47% 11%)' }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
