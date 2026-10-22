"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormCircuito({ usuarioId }: { usuarioId: string }) {
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("");
  const router = useRouter();

  const adicionarCircuito = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/circuitos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId, nomeDisjuntor: nome, limiteCorrente: limite }),
    });
    setNome(""); setLimite("");
    router.refresh();
  };

  return (
    <form onSubmit={adicionarCircuito} className="flex gap-4 mb-6 bg-[#1A3D63] p-4 rounded-lg border border-[#4A7FA7]">
      <input type="text" placeholder="Nome (Ex: Chuveiro)" required className="flex-1 p-2 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7]" value={nome} onChange={e => setNome(e.target.value)} />
      <input type="number" step="0.1" placeholder="Limite (Amperes)" required className="w-40 p-2 rounded bg-[#0A1931] text-[#F6FAFD] border border-[#4A7FA7]" value={limite} onChange={e => setLimite(e.target.value)} />
      <button type="submit" className="bg-[#4A7FA7] hover:bg-[#B3CFE5] hover:text-[#0A1931] px-4 py-2 rounded font-bold transition-colors">Adicionar</button>
    </form>
  );
}