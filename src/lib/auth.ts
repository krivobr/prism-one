import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null

        const usuario = await prisma.pO_Usuario.findUnique({
          where: { email: credentials.email as string },
          include: { empresa: true },
        })

        if (!usuario || !usuario.ativo) return null
        if (!usuario.empresa.ativo) return null

        const senhaValida = await bcrypt.compare(
          credentials.senha as string,
          usuario.senha
        )
        if (!senhaValida) return null

        await prisma.pO_Usuario.update({
          where: { id: usuario.id },
          data: { ultimo_acesso: new Date() },
        })

        return {
          id: String(usuario.id),
          name: usuario.nome,
          email: usuario.email,
          papel: usuario.papel,
          id_empresa: usuario.id_empresa,
          empresa_nome: usuario.empresa.nome,
          empresa_slug: usuario.empresa.slug,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.papel = (user as any).papel
        token.id_empresa = (user as any).id_empresa
        token.empresa_nome = (user as any).empresa_nome
        token.empresa_slug = (user as any).empresa_slug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).papel = token.papel
        ;(session.user as any).id_empresa = token.id_empresa
        ;(session.user as any).empresa_nome = token.empresa_nome
        ;(session.user as any).empresa_slug = token.empresa_slug
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
