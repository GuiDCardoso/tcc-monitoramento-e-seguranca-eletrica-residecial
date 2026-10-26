"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TooltipDidatico = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-blue-200 rounded-lg shadow-xl min-w-[250px]">
        <p className="font-bold text-blue-900 mb-3 border-b border-blue-100 pb-2">Horário: {label}</p>
        {payload.map((entry: any, index: number) => {
          const watts = entry.value;
          const kw = watts / 1000;
          const custoHora = (kw * 0.85).toFixed(2);
          
          let nivel = "Baixo"; let corNivel = "text-green-700 bg-green-100";
          if (watts > 2000) { nivel = "Alto (Atenção)"; corNivel = "text-red-700 bg-red-100"; }
          else if (watts > 500) { nivel = "Médio"; corNivel = "text-orange-700 bg-orange-100"; }

          return (
            <div key={index} className="mb-4 last:mb-0">
              <p className="font-bold flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
                {entry.name}
              </p>
              <div className="pl-5 text-sm mt-1 space-y-1">
                <p className="text-gray-600">Consumo: <strong className="text-gray-800">{watts} W</strong></p>
                <p className="text-gray-600">Gasto Estimado: <strong className="text-gray-800">R$ {custoHora} / h</strong></p>
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

export default function GraficoConsumo({ disjuntores }: { disjuntores: any[] }) {
  const router = useRouter();
  const cores = ["#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#8B5CF6"];

  // Atualiza o gráfico sozinho a cada 5 segundos para buscar novos dados do ESP32
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  if (!disjuntores || disjuntores.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 flex items-center justify-center h-[400px]">
        <p className="text-blue-500 font-medium">Nenhum circuito registado.</p>
      </div>
    );
  }

  // Processa as leituras reais da Base de Dados
  const dadosProcessados: Record<string, any> = {};

  disjuntores.forEach(d => {
    // Inverte a ordem para cronológica (da esquerda para a direita)
    const leituras = d.leituras ? [...d.leituras].reverse() : [];
    
    leituras.forEach((leitura: any) => {
      // Formata a data para extrair apenas a hora exata
      const hora = new Date(leitura.registradoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      if (!dadosProcessados[hora]) {
        dadosProcessados[hora] = { hora };
      }
      dadosProcessados[hora][d.nome] = leitura.potencia;
    });
  });

  const dadosReais = Object.values(dadosProcessados).sort((a: any, b: any) => a.hora.localeCompare(b.hora));
  const ultimoDado = dadosReais.length > 0 ? dadosReais[dadosReais.length - 1] : {} as any;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 w-full h-[400px]">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-blue-900">Monitorização de Energia</h3>
          <p className="text-sm text-blue-500">Histórico de consumo em tempo real</p>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={dadosReais} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="hora" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `${val}W`} />
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
          const watts = ultimoDado[d.nome] || 0;
          const kw = watts / 1000;
          const custoHora = (kw * 0.85).toFixed(2);
          
          let nivel = "Baixo"; let corNivel = "text-green-700 bg-green-100";
          if (watts > 2000) { nivel = "Alto (Atenção)"; corNivel = "text-red-700 bg-red-100"; }
          else if (watts > 500) { nivel = "Médio"; corNivel = "text-orange-700 bg-orange-100"; }

          return (
            <div key={d.id} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-100" style={{ borderLeftColor: cores[index % cores.length] }}>
              <h4 className="font-bold text-blue-900 mb-2">{d.nome}</h4>
              <div className="space-y-1">
                <p className="text-gray-600 text-sm">Consumo Atual: <span className="font-bold text-gray-900">{watts} W</span></p>
                <p className="text-gray-600 text-sm">Gasto Estimado: <span className="font-bold text-gray-900">R$ {custoHora} / h</span></p>
                <p className="mt-2"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${corNivel}`}>Nível: {nivel}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}