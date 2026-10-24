import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email }
        });

        if (!usuario) return null;

        // Comparação simples para ambiente de desenvolvimento/TCC
        if (credentials.senha === usuario.senha) {
          return { 
            id: usuario.id, 
            name: usuario.nome, 
            email: usuario.email, 
            role: usuario.role 
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/login', // Força o NextAuth a usar a página que criámos
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session?.user) (session.user as any).role = token.role;
      return session;
    }
  }
};