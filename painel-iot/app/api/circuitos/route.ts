import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const { usuarioId, nomeDisjuntor, limiteCorrente } = await req.json();

    let residencia = await prisma.residencia.findFirst({ where: { usuarioId } });
    if (!residencia) {
      residencia = await prisma.residencia.create({ data: { nome: "Casa Principal", usuarioId } });
    }

    const disjuntor = await prisma.disjuntor.create({
      data: { 
        nome: nomeDisjuntor, 
        limiteCorrente: parseFloat(limiteCorrente), 
        residenciaId: residencia.id 
      }
    });

    return NextResponse.json({ success: true, disjuntor });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar circuito." }, { status: 500 });
  }
}