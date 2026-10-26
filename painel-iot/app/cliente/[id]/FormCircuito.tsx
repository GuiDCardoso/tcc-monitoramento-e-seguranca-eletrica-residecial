"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormCircuito({ usuarioId }: { usuarioId: string }) {
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/circuitos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId,
        nome,
        limiteCorrente: parseFloat(limite)
      })
    });

    setNome("");
    setLimite("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-bold text-blue-900 mb-1">Nome do Circuito (Ex: Chuveiro, Geral)</label>
        <input 
          type="text" 
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full p-2 bg-gray-50 border border-blue-200 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required 
        />
      </div>
      <div className="w-48">
        <label className="block text-sm font-bold text-blue-900 mb-1">Limite Segurança (A)</label>
        <input 
          type="number" 
          step="0.1"
          value={limite}
          onChange={e => setLimite(e.target.value)}
          className="w-full p-2 bg-gray-50 border border-blue-200 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required 
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? "Adicionando..." : "Adicionar Circuito"}
      </button>
    </form>
  );
}