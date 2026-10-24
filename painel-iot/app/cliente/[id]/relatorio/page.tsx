import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function RelatorioCopel(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string; ano?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const clienteId = params.id;

  const dataHoje = new Date();
  const mesAtual = searchParams.mes ? parseInt(searchParams.mes) : dataHoje.getMonth() + 1;
  const anoAtual = searchParams.ano ? parseInt(searchParams.ano) : dataHoje.getFullYear();

  const dataInicio = new Date(anoAtual, mesAtual - 1, 1);
  const dataFim = new Date(anoAtual, mesAtual, 1);

  const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
  const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;
  const mesSeguinte = mesAtual === 12 ? 1 : mesAtual + 1;
  const anoSeguinte = mesAtual === 12 ? anoAtual + 1 : anoAtual;
  
  const nomeMes = dataInicio.toLocaleDateString('pt-BR', { month: 'long' });

  const cliente = await prisma.usuario.findUnique({
    where: { id: clienteId },
    include: {
      residencias: {
        include: {
          disjuntores: {
            include: {
              leituras: {
                where: { registradoEm: { gte: dataInicio, lt: dataFim } }
              }
            }
          }
        }
      }
    }
  });

  if (!cliente) return <div className="text-white p-8">Cliente não encontrado.</div>;

  const TARIFA_KWH = 0.85; 
  let consumoTotalKwh = 0;

  const detalhesCircuitos = cliente.residencias.flatMap(r => 
    r.disjuntores.map(d => {
      const kwhCircuito = d.leituras.reduce((acc, leitura) => acc + (leitura.potencia / 1000), 0);
      consumoTotalKwh += kwhCircuito;
      return { nome: d.nome, kwh: kwhCircuito, valor: kwhCircuito * TARIFA_KWH };
    })
  );

  const subtotal = consumoTotalKwh * TARIFA_KWH;
  const estimativaImpostos = subtotal * 0.29;
  const totalFatura = subtotal + estimativaImpostos;

  return (
    <div className="min-h-screen bg-[#0A1931] text-[#F6FAFD] p-8">
      <div className="max-w-3xl mx-auto bg-white text-black p-8 rounded-lg shadow-2xl print:shadow-none">
        
        <div className="flex justify-between items-start border-b-4 border-orange-500 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-orange-600 tracking-tighter">COPEL <span className="text-gray-700 text-lg font-medium">| Simulação VoltGuard</span></h1>
            <p className="text-sm text-gray-500 mt-1">Conta de Energia Elétrica - Uso Residencial</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="font-bold text-gray-700 mb-2">Mês de Referência</p>
            <div className="flex items-center gap-3 bg-gray-100 p-2 rounded print:bg-transparent print:p-0">
              <Link className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm font-bold print:hidden" href={`?mes=${mesAnterior}&ano=${anoAnterior}`}>&lt;</Link>
              <span className="text-xl font-black uppercase min-w-[150px] text-center">{nomeMes} {anoAtual}</span>
              <Link className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm font-bold print:hidden" href={`?mes=${mesSeguinte}&ano=${anoSeguinte}`}>&gt;</Link>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded mb-8">
          <p className="font-bold text-lg uppercase">{cliente.nome}</p>
          <p className="text-gray-600">{cliente.email}</p>
          <p className="text-gray-600 mt-2 text-sm font-mono">ID Instalação: {cliente.id.split('-')[0]}</p>
        </div>

        <h2 className="font-bold text-lg border-b-2 border-gray-200 pb-2 mb-4">Demonstrativo de Consumo por Circuito</h2>
        <table className="w-full text-left mb-8 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Circuito Monitorizado</th>
              <th className="p-2 text-right">Consumo (kWh)</th>
              <th className="p-2 text-right">Tarifa (R$)</th>
              <th className="p-2 text-right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {detalhesCircuitos.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum circuito registado.</td></tr>
            ) : (
              detalhesCircuitos.map((circuito, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="p-2 font-semibold text-gray-700">{circuito.nome}</td>
                  <td className="p-2 text-right">{circuito.kwh.toFixed(2)}</td>
                  <td className="p-2 text-right">{TARIFA_KWH.toFixed(2)}</td>
                  <td className="p-2 text-right">{(circuito.valor).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <span>Subtotal Consumo:</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-gray-600">
              <span>Trib. (ICMS/PIS/COF):</span>
              <span>R$ {estimativaImpostos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-xl text-orange-600 border-t-2 border-gray-200 pt-2">
              <span>Total a Pagar:</span>
              <span>R$ {totalFatura.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center print:hidden">
          <Link className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded font-bold transition-colors" href="/">
            Voltar ao Painel
          </Link>
        </div>

      </div>
    </div>
  );
}