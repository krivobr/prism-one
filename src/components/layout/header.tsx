'use client'

import { usePathname } from 'next/navigation'

interface HeaderProps {
  user: {
    name: string
    papel: string
  }
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/equipamentos': 'Equipamentos',
  '/calibracoes': 'Calibrações',
  '/check-loop': 'Check Loop',
  '/ordens-servico': 'Ordens de Serviço',
  '/relatorios': 'Relatórios',
  '/cadastros': 'Cadastros',
  '/admin': 'Administração',
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  const getTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname]
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path) && path !== '/') return title
    }
    return 'PRISM ONE'
  }

  return (
    <header className="h-14 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ background: 'hsl(222 47% 11%)' }}>
      <div className="ml-10 md:ml-0">
        <h2 className="text-lg font-semibold text-white">{getTitle()}</h2>
      </div>
      <div className="text-right">
        <p className="text-sm text-slate-300">{user.name}</p>
      </div>
    </header>
  )
}
