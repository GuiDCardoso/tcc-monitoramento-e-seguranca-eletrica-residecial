"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MAX_TELEMETRY_GAP_MS } from "@/lib/telemetry";

type DisjuntorChart = {
  id: number;
  nome: string;
  eventosFalha?: {
    id: number;
    inicioEm: Date | string;
    correnteMaxA: number;
    limiteCorrenteA: number;
  }[];
  leituras?: {
    registradoEm: Date | string;
    potenciaAparenteVA: number;
    rssiDbm: number | null;
  }[];
};

type ChartRow = {
  hora: string;
  [circuitName: string]: string | number;
};

type TooltipDidaticoProps = {
  active?: boolean;
  payload?: { color?: string; value?: number | string; name?: string }[];
  label?: string | number;
};

const TooltipDidatico = ({ active, payload, label }: TooltipDidaticoProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-blue-200 rounded-lg shadow-xl min-w-[250px]">
        <p className="font-bold text-blue-900 mb-3 border-b border-blue-100 pb-2">Horário: {label}</p>
        {payload.map((entry, index) => {
          const voltAmpere = Number(entry.value ?? 0);
          const custoHoraEstimado = ((voltAmpere / 1000) * 0.85).toFixed(2);
          
          let nivel = "Baixo"; let corNivel = "text-green-700 bg-green-100";
          if (voltAmpere > 2000) { nivel = "Alto (Atenção)"; corNivel = "text-red-700 bg-red-100"; }
          else if (voltAmpere > 500) { nivel = "Médio"; corNivel = "text-orange-700 bg-orange-100"; }

          return (
            <div key={index} className="mb-4 last:mb-0">
              <p className="font-bold flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
                {entry.name ?? "Circuito"}
              </p>
              <div className="pl-5 text-sm mt-1 space-y-1">
                <p className="text-gray-600">Potência aparente: <strong className="text-gray-800">{voltAmpere} VA</strong></p>
                <p className="text-gray-600">Custo estimado/h (FP=1): <strong className="text-gray-800">R$ {custoHoraEstimado}</strong></p>
                <span className={`inline-block px-2 py-1 mt-1 rounded text-xs font-bold ${corNivel}`}>Nível: {nivel}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function GraficoConsumo({ disjuntores }: { disjuntores: DisjuntorChart[] }) {
  const router = useRouter();
  const cores = ["#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#8B5CF6"];
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/leituras/stream");
    const refresh = () => router.refresh();
    eventSource.addEventListener("leituras", refresh);
    eventSource.addEventListener("open", refresh);
    return () => {
      eventSource.removeEventListener("leituras", refresh);
      eventSource.removeEventListener("open", refresh);
      eventSource.close();
    };
  }, [router]);

  useEffect(() => {
    const atualizarRelogio = () => setAgora(Date.now());
    atualizarRelogio();
    const interval = setInterval(atualizarRelogio, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!disjuntores || disjuntores.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 flex items-center justify-center h-[400px]">
        <p className="text-blue-500 font-medium">Nenhum circuito registado.</p>
      </div>
    );
  }

  // Processa as leituras reais da Base de Dados
  const dadosProcessados: Record<string, ChartRow> = {};

  disjuntores.forEach(d => {
    // Inverte a ordem para cronológica (da esquerda para a direita)
    const leituras = d.leituras ? [...d.leituras].reverse() : [];
    
    leituras.forEach((leitura) => {
      // Formata a data para extrair apenas a hora exata
      const hora = new Date(leitura.registradoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      if (!dadosProcessados[hora]) {
        dadosProcessados[hora] = { hora };
      }
      dadosProcessados[hora][d.nome] = leitura.potenciaAparenteVA;
    });
  });

  const dadosReais = Object.values(dadosProcessados).sort((a, b) => a.hora.localeCompare(b.hora));
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 w-full h-[400px]">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-blue-900">Monitorização de Energia</h3>
          <p className="text-sm text-blue-500">Potência aparente (VA); atualização em tempo real</p>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={dadosReais} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="hora" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `${val} VA`} />
            <Tooltip content={<TooltipDidatico />} cursor={{ stroke: '#93C5FD', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '10px' }} />
            {disjuntores.map((d, index) => (
              <Line key={d.id} type="monotone" dataKey={d.nome} stroke={cores[index % cores.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {disjuntores.map((d, index) => {
          const ultimaLeitura = d.leituras?.[0];
          const voltAmpere = ultimaLeitura?.potenciaAparenteVA ?? 0;
          const custoHoraEstimado = ((voltAmpere / 1000) * 0.85).toFixed(2);
          const eventoAberto = d.eventosFalha?.[0];
          const emSobrecarga = Boolean(eventoAberto);
          const instanteUltimaLeitura = ultimaLeitura
            ? new Date(ultimaLeitura.registradoEm).getTime()
            : null;
          const dispositivoStatus =
            instanteUltimaLeitura === null
              ? "Sem telemetria"
              : agora === null
                ? "Verificando..."
                : agora - instanteUltimaLeitura <= MAX_TELEMETRY_GAP_MS
                  ? "Online"
                  : "Offline";
          
          let nivel = "Baixo"; let corNivel = "text-green-700 bg-green-100";
          if (voltAmpere > 2000) { nivel = "Alto (Atenção)"; corNivel = "text-red-700 bg-red-100"; }
          else if (voltAmpere > 500) { nivel = "Médio"; corNivel = "text-orange-700 bg-orange-100"; }

          return (
            <div key={d.id} className={`bg-white p-5 rounded-xl shadow-md border-l-4 ${emSobrecarga ? "border-red-600 bg-red-50 animate-pulse" : "border-blue-100"}`} style={emSobrecarga ? undefined : { borderLeftColor: cores[index % cores.length] }}>
              <h4 className={`font-bold mb-2 ${emSobrecarga ? "text-red-800" : "text-blue-900"}`}>{d.nome}</h4>
              <div className="space-y-1">
                {eventoAberto && (
                  <p role="alert" className="font-bold text-red-700">
                    SOBRECARGA: {eventoAberto.correnteMaxA.toFixed(1)} A (limite {eventoAberto.limiteCorrenteA.toFixed(1)} A)
                  </p>
                )}
                <p className="text-gray-600 text-sm">Potência aparente: <span className="font-bold text-gray-900">{voltAmpere} VA</span></p>
                <p className="text-gray-600 text-sm">Custo estimado/h (FP=1): <span className="font-bold text-gray-900">R$ {custoHoraEstimado}</span></p>
                <p className="text-gray-600 text-sm">Fator de potência: <span className="font-bold text-gray-900">não medido</span></p>
                <p className="text-gray-600 text-sm">Sinal Wi-Fi: <span className="font-bold text-gray-900">{ultimaLeitura?.rssiDbm ?? "sem dado"}{ultimaLeitura?.rssiDbm != null ? " dBm" : ""}</span></p>
                <p className="text-gray-600 text-sm">Dispositivo: <span className={`font-bold ${dispositivoStatus === "Online" ? "text-green-700" : "text-red-700"}`}>{dispositivoStatus}</span></p>
                <p className="mt-2"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${corNivel}`}>Nível: {nivel}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}