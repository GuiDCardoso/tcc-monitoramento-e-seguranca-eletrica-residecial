'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Define o formato dos dados que o gráfico vai receber
interface LeituraGrafico {
  horario: string;
  corrente: number;
  potencia: number;
}

interface GraficoProps {
  dados: LeituraGrafico[];
}

export default function GraficoConsumo({ dados }: GraficoProps) {
  // Se não houver dados o suficiente, mostra um aviso amigável
  if (!dados || dados.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">Aguardando histórico de leituras...</p>
      </div>
    );
  }

  return (
    <div className="h-56 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="horario" 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            tickMargin={10}
          />
          <YAxis 
            yAxisId="esquerda" 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line 
            yAxisId="esquerda"
            type="monotone" 
            dataKey="corrente" 
            stroke="#1A3D63" 
            strokeWidth={3}
            dot={{ r: 3, fill: '#1A3D63' }}
            name="Corrente (A)" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}