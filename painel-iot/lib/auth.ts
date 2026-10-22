// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import * as bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;
        const usuario = await prisma.usuario.findUnique({ where: { email: credentials.email } });
        if (!usuario) return null;
        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha);
        if (!senhaValida) return null;
        return { id: usuario.id, name: usuario.nome, email: usuario.email, role: usuario.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    }
  },
  pages: { signIn: '/login' },
};