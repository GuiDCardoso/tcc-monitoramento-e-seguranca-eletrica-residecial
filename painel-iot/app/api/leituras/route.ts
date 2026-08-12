import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Recebe e converte o JSON enviado pelo ESP32
    const body = await request.json();
    const { tensao_rms, circuitos } = body;

    // Validação básica
    if (!tensao_rms || !circuitos) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Busca a residência padrão (Para o protótipo, usaremos a primeira)
    // Se não existir, criamos um usuário, uma residência e os disjuntores mockados
    let residencia = await prisma.residencia.findFirst({
      include: { disjuntores: true }
    });

    if (!residencia) {
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome: 'Admin', email: 'admin@voltguard.com', senha: '123', isAdmin: true,
          residencias: {
            create: {
              nome: 'Laboratório de Testes',
              disjuntores: {
                create: [
                  { nome: 'geral', limiteCorrente: 30.0 },
                  { nome: 'chuveiro', limiteCorrente: 20.0 },
                  { nome: 'ar_condicionado', limiteCorrente: 15.0 },
                  { nome: 'tomadas', limiteCorrente: 10.0 },
                  { nome: 'iluminacao', limiteCorrente: 5.0 },
                ]
              }
            }
          }
        }
      });
      residencia = await prisma.residencia.findFirst({ include: { disjuntores: true } });
    }

    // 3. Prepara as leituras para inserção no banco
    const leiturasParaInserir = [];

    // Itera sobre o objeto "circuitos" recebido do ESP32
    for (const [chave, dados] of Object.entries(circuitos)) {
      const dadosCircuito = dados as { corrente: number, potencia: number };
      
      // Encontra o ID do disjuntor correspondente no banco
      const disjuntor = residencia?.disjuntores.find(d => d.nome === chave);
      
      if (disjuntor) {
        // Verifica se a corrente ultrapassou o limiar de segurança
        const emAlerta = dadosCircuito.corrente > disjuntor.limiteCorrente;

        leiturasParaInserir.push({
          tensaoRms: tensao_rms,
          correnteRms: dadosCircuito.corrente,
          potencia: dadosCircuito.potencia,
          alerta: emAlerta,
          disjuntorId: disjuntor.id
        });
      }
    }

    // 4. Salva todas as leituras simultaneamente no PostgreSQL
    await prisma.leitura.createMany({
      data: leiturasParaInserir
    });

    return NextResponse.json({ sucesso: true, mensagem: 'Leituras registradas' }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de leituras:', error);
    return NextResponse.json({ erro: 'Falha interna no servidor' }, { status: 500 });
  }
}