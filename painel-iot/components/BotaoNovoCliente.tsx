"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BotaoNovoCliente() {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });

    if (res.ok) {
      setAberto(false);
      setNome(""); setEmail(""); setSenha("");
      router.refresh(); // Recarrega a tabela do servidor com os novos dados
    }
  };

  return (
    <>
      <button onClick={() => setAberto(true)} className="bg-[#4A7FA7] hover:bg-[#B3CFE5] hover:text-[#0A1931] px-4 py-2 rounded font-bold transition-colors">
        + Novo Cliente
      </button>
      
      {aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A3D63] p-6 rounded-lg w-full max-w-md border border-[#4A7FA7]">
            <h2 className="text-xl font-bold mb-4 text-[#F6FAFD]">Registar Novo Cliente</h2>
            <form onSubmit={salvarCliente} className="flex flex-col gap-3">
              <input type="text" placeholder="Nome completo" required className="p-3 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7] focus:outline-none focus:border-[#B3CFE5]" value={nome} onChange={e => setNome(e.target.value)} />
              <input type="email" placeholder="E-mail" required className="p-3 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7] focus:outline-none focus:border-[#B3CFE5]" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" placeholder="Palavra-passe provisória" required className="p-3 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7] focus:outline-none focus:border-[#B3CFE5]" value={senha} onChange={e => setSenha(e.target.value)} />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-bold transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#4A7FA7] hover:bg-[#B3CFE5] hover:text-[#0A1931] rounded text-[#F6FAFD] font-bold transition-colors">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}