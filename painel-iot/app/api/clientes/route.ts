import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import * as bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { nome, email, senha } = await req.json();
    const hashSenha = await bcrypt.hash(senha, 10);

    const novoCliente = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: hashSenha,
        role: "CLIENTE",
      },
    });

    return NextResponse.json({ success: true, cliente: novoCliente });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 500 });
  }
}