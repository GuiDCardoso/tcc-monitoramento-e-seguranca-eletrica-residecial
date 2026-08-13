import { prisma } from '../lib/prisma';
import AutoRefresh from '../components/AutoRefresh';
import GraficoConsumo from '../components/GraficoConsumo';

// Força a página a sempre buscar dados novos do banco, sem usar cache antigo
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Busca a residência e as ÚLTIMAS 10 leituras de cada disjuntor para o histórico
  const residencia = await prisma.residencia.findFirst({
    include: {
      disjuntores: {
        include: {
          leituras: {
            orderBy: { registradoEm: 'desc' },
            take: 10, 
          },
        },
      },
    },
  });

  // Bloco 1: Tela de carregamento
  if (!residencia || residencia.disjuntores.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6FAFD] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A3D63] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-[#1A3D63]">Aguardando conexão...</h2>
          <p className="text-gray-500">Nenhum dado recebido do ESP32 ainda.</p>
        </div>
      </div>
    );
  }

  // Bloco 2: O Dashboard Principal
  return (
    <div className="min-h-screen bg-[#F6FAFD] p-8 font-sans">
      <AutoRefresh intervalo={3000} /> 
      
      <header className="mb-8 flex justify-between items-center bg-[#1A3D63] p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">VoltGuard</h1>
          <p className="text-[#B3CFE5] mt-1 text-sm">{residencia.nome}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-[#B3CFE5] font-medium">Sistema Online</span>
        </div>
      </header>

      {/* Grid de Disjuntores (Agora com 2 colunas para comportar bem os gráficos) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {residencia.disjuntores.map((disjuntor) => {
          const leituras = disjuntor.leituras;
          const ultimaLeitura = leituras[0]; // A leitura no topo da lista ainda é a mais recente
          const emAlerta = ultimaLeitura?.alerta || false;

          // Preparação dos dados para o Recharts (inverte a ordem cronológica)
          const dadosGrafico = leituras.map((l) => ({
            horario: new Date(l.registradoEm).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            corrente: l.correnteRms,
            potencia: l.potencia
          })).reverse();

          return (
            <div 
              key={disjuntor.id} 
              className={`border-2 rounded-xl p-6 shadow-sm transition-shadow flex flex-col justify-between ${
                emAlerta ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-[#B3CFE5] hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold uppercase ${emAlerta ? 'text-red-700' : 'text-[#0A1931]'}`}>
                  {disjuntor.nome.replace('_', ' ')}
                </h2>
                
                {emAlerta ? (
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    ⚠️ ALERTA
                  </span>
                ) : (
                  <span className="bg-[#4A7FA7] text-white text-xs px-2 py-1 rounded">
                    {disjuntor.limiteCorrente}A Max
                  </span>
                )}
              </div>

              {ultimaLeitura ? (
                <>
                  <div className="space-y-2 mb-2 flex justify-between items-end border-b pb-4 border-gray-100">
                    <p className={emAlerta ? 'text-red-900' : 'text-gray-600'}>
                      Corrente Atual: <span className={`font-bold text-2xl ml-1 ${emAlerta ? 'text-red-600' : 'text-[#1A3D63]'}`}>
                        {ultimaLeitura.correnteRms} A
                      </span>
                    </p>
                    <p className={`text-sm ${emAlerta ? 'text-red-700' : 'text-gray-500'}`}>
                      {ultimaLeitura.potencia} W
                    </p>
                  </div>
                  
                  {/* Renderização da curva de consumo no tempo */}
                  <GraficoConsumo dados={dadosGrafico} />
                </>
              ) : (
                <p className="text-gray-400 italic">Aguardando leitura...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}