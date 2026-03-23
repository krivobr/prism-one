import 'next-auth'

declare module 'next-auth' {
  interface User {
    papel?: string
    id_empresa?: number
    empresa_nome?: string
    empresa_slug?: string
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      papel: string
      id_empresa: number
      empresa_nome: string
      empresa_slug: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    papel: string
    id_empresa: number
    empresa_nome: string
    empresa_slug: string
  }
}
