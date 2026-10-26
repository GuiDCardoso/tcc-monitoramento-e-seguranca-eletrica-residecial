"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { email, senha, redirect: false });
    
    if (res?.error) {
      setErro("Credenciais inválidas. Tente novamente.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-blue-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-950 tracking-tight">VoltGuard</h1>
          <p className="text-blue-500 mt-2 text-sm">Monitorização e Segurança Elétrica</p>
        </div>
        
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium border border-red-100 text-center">{erro}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-blue-900 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="seu@email.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-900 mb-1">Palavra-passe</label>
            <input 
              type="password" 
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="••••••••"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-4"
          >
            Entrar no Painel
          </button>
        </form>
      </div>
    </div>
  );
}