import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { disjuntorId, corrente, tensao } = body;

    if (!disjuntorId || corrente === undefined || tensao === undefined) {
      return NextResponse.json({ erro: "Dados incompletos enviados pelo ESP32" }, { status: 400 });
    }

    const potencia = parseFloat(corrente) * parseFloat(tensao);

    // Grava a medição usando os nomes exatos do schema.prisma
    const leitura = await prisma.leitura.create({
      data: {
        disjuntorId: parseInt(disjuntorId),
        tensaoRms: parseFloat(tensao),
        correnteRms: parseFloat(corrente),
        potencia: potencia,
      }
    });

    return NextResponse.json({ sucesso: true, leituraId: leitura.id }, { status: 201 });
    
  } catch (error) {
    console.error("Erro na API de Leituras:", error);
    return NextResponse.json({ erro: "Falha ao gravar no banco de dados" }, { status: 500 });
  }
}