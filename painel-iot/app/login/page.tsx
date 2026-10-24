"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Envia os dados para a sua configuração do NextAuth
    await signIn("credentials", {
      email,
      senha,
      callbackUrl: "/"
    });
  };

  return (
    <div className="min-h-screen bg-[#0A1931] flex flex-col items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-[#1A3D63] p-8 rounded-lg shadow-2xl border border-[#4A7FA7] w-full max-w-md">
        <h1 className="text-3xl font-black text-orange-500 mb-2 text-center">VoltGuard</h1>
        <p className="text-[#F6FAFD] mb-8 text-sm text-center">Acesso Seguro ao Painel de Gestão</p>

        <div className="mb-4">
          <label className="block text-[#F6FAFD] mb-2 text-sm">E-mail</label>
          <input 
            type="email" 
            required 
            className="w-full p-2 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7] focus:outline-none focus:border-orange-500" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
        </div>

        <div className="mb-8">
          <label className="block text-[#F6FAFD] mb-2 text-sm">Palavra-passe</label>
          <input 
            type="password" 
            required 
            className="w-full p-2 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7] focus:outline-none focus:border-orange-500" 
            value={senha} 
            onChange={e => setSenha(e.target.value)} 
          />
        </div>

        <button type="submit" className="w-full bg-[#4A7FA7] hover:bg-[#B3CFE5] hover:text-[#0A1931] text-white font-bold py-3 px-4 rounded transition-colors">
          Entrar no Sistema
        </button>
      </form>
    </div>
  );
}