import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuarioId, nome, limiteCorrente } = body;

    // 1. Procura se o cliente já tem uma Residência registada
    let residencia = await prisma.residencia.findFirst({
      where: { usuarioId: usuarioId }
    });

    // 2. Se não tiver, cria uma Residência padrão automaticamente
    if (!residencia) {
      residencia = await prisma.residencia.create({
        data: {
          nome: "Casa Principal",
          usuarioId: usuarioId
        }
      });
    }

    // 3. Cria o Circuito (Disjuntor) vinculado a essa Residência
    const novoCircuito = await prisma.disjuntor.create({
      data: {
        nome: nome,
        limiteCorrente: limiteCorrente,
        residenciaId: residencia.id
      }
    });

    return NextResponse.json(novoCircuito, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar circuito:", error);
    return NextResponse.json({ error: "Erro interno ao criar circuito" }, { status: 500 });
  }
}