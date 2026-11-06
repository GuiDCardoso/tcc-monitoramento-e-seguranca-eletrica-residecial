import { prisma } from "@/lib/prisma";
import { estimateEnergyKwh } from "@/lib/energy";

export const TARIFA_KWH = 0.85;

export async function buildMonthlyReport(clienteId: string, month: number, year: number) {
  const dataInicio = new Date(year, month - 1, 1);
  const dataFim = new Date(year, month, 1);
  const cliente = await prisma.usuario.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      nome: true,
      email: true,
      residencias: {
        select: {
          disjuntores: {
            select: {
              id: true,
              nome: true,
              leituras: {
                where: { registradoEm: { gte: dataInicio, lt: dataFim } },
                orderBy: { registradoEm: "asc" },
                select: { registradoEm: true, potenciaAparenteVA: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cliente) return null;

  const detalhesCircuitos = await Promise.all(
    cliente.residencias.flatMap((residencia) =>
      residencia.disjuntores.map(async (disjuntor) => {
        const leituraAnterior = await prisma.leitura.findFirst({
          where: { disjuntorId: disjuntor.id, registradoEm: { lt: dataInicio } },
          orderBy: { registradoEm: "desc" },
          select: { registradoEm: true, potenciaAparenteVA: true },
        });
        const leituras = [
          ...(leituraAnterior ? [leituraAnterior] : []),
          ...disjuntor.leituras,
        ];
        const kwh = estimateEnergyKwh(leituras, dataInicio, dataFim);
        return { nome: disjuntor.nome, kwh, valor: kwh * TARIFA_KWH };
      }),
    ),
  );

  const consumoTotalKwh = detalhesCircuitos.reduce((total, circuito) => total + circuito.kwh, 0);
  const subtotal = consumoTotalKwh * TARIFA_KWH;
  const estimativaImpostos = subtotal * 0.29;

  return {
    cliente,
    detalhesCircuitos,
    dataInicio,
    nomeMes: dataInicio.toLocaleDateString("pt-BR", { month: "long" }),
    month,
    year,
    consumoTotalKwh,
    subtotal,
    estimativaImpostos,
    totalFatura: subtotal + estimativaImpostos,
  };
}
