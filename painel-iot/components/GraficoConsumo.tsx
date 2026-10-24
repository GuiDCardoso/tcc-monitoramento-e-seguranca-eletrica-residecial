"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function GraficoConsumo({ disjuntores }: { disjuntores: any[] }) {
  // Paleta de cores para diferenciar até 5 circuitos no mesmo gráfico
  const cores = ["#FF9800", "#03A9F4", "#4CAF50", "#E91E63", "#9C27B0"];

  if (!disjuntores || disjuntores.length === 0) {
    return (
      <div className="bg-[#1A3D63] p-6 rounded-lg shadow-lg border border-[#4A7FA7] flex items-center justify-center h-[400px]">
        <p className="text-gray-400">Nenhum circuito registado. Fale com o administrador.</p>
      </div>
    );
  }

  // Geração de dados fictícios para visualização baseada nos SEUS circuitos reais
  const dadosExemplo = [
    { hora: '08:00' }, { hora: '10:00' }, { hora: '12:00' }, 
    { hora: '14:00' }, { hora: '16:00' }, { hora: '18:00' }
  ];

  dadosExemplo.forEach((ponto) => {
    disjuntores.forEach(d => {
      // Simula um consumo diferente para cada circuito
      (ponto as any)[d.nome] = Math.floor(Math.random() * 2000) + 100; 
    });
  });

  return (
    <div className="bg-[#1A3D63] p-6 rounded-lg shadow-lg border border-[#4A7FA7] w-full h-[400px]">
      <h3 className="text-xl font-semibold mb-6 text-[#F6FAFD]">Consumo em Tempo Real</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={dadosExemplo} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A7FA7" opacity={0.2} />
          <XAxis dataKey="hora" stroke="#B3CFE5" fontSize={12} />
          <YAxis stroke="#B3CFE5" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: '#0A1931', borderColor: '#4A7FA7', color: '#F6FAFD' }} />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          
          {/* Gera uma linha automaticamente para cada circuito existente */}
          {disjuntores.map((d, index) => (
            <Line 
              key={d.id}
              type="monotone" 
              dataKey={d.nome} 
              stroke={cores[index % cores.length]} 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 8 }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}