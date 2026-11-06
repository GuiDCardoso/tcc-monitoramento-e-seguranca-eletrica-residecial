import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { publishReadingUpdate } from "../../../lib/telemetry-events";
import { hasSustainedOverload } from "../../../lib/telemetry";
import { enviarAlertaWhatsApp } from "../../../lib/whatsapp";

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateDeviceKey(request: Request): boolean | null {
  const expectedKey = process.env.ESP32_API_KEY;
  if (!expectedKey) return null;

  const providedKey = request.headers.get("x-device-key");
  if (!providedKey) return false;

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);
  return expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: Request) {
  try {
    const deviceKeyValid = validateDeviceKey(request);
    if (deviceKeyValid === null) {
      return NextResponse.json({ erro: "ESP32_API_KEY não está configurada no servidor" }, { status: 503 });
    }
    if (!deviceKeyValid) {
      return NextResponse.json({ erro: "Chave do dispositivo inválida" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ erro: "O corpo da requisição deve ser JSON válido" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ erro: "Formato de dados inválido" }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const disjuntorId = parseFiniteNumber(payload.disjuntorId);
    const corrente = parseFiniteNumber(payload.corrente);
    const tensaoNominalV = parseFiniteNumber(payload.tensao);
    const rssiDbm = payload.rssiDbm === undefined ? null : parseFiniteNumber(payload.rssiDbm);

    if (
      disjuntorId === null ||
      !Number.isInteger(disjuntorId) ||
      disjuntorId <= 0 ||
      corrente === null ||
      corrente < 0 ||
      tensaoNominalV === null ||
      tensaoNominalV <= 0 ||
      (payload.rssiDbm !== undefined && (rssiDbm === null || rssiDbm < -127 || rssiDbm > 0))
    ) {
      return NextResponse.json({ erro: "Dados incompletos enviados pelo ESP32" }, { status: 400 });
    }

    const potenciaAparenteVA = corrente * tensaoNominalV;
    const resultado = await prisma.$transaction(async (tx) => {
      const disjuntor = await tx.disjuntor.findUnique({
        where: { id: disjuntorId },
        select: {
          id: true,
          nome: true,
          limiteCorrente: true,
          residencia: { select: { usuarioId: true } },
        },
      });
      if (!disjuntor) return null;

      const [leituraAnterior, eventoAberto] = await Promise.all([
        tx.leitura.findFirst({
          where: { disjuntorId },
          orderBy: { registradoEm: "desc" },
          select: { alerta: true, registradoEm: true },
        }),
        tx.eventoFalha.findFirst({
          where: { disjuntorId, fimEm: null },
          orderBy: { inicioEm: "desc" },
        }),
      ]);
      const acimaDoLimite = corrente > disjuntor.limiteCorrente;
      const leitura = await tx.leitura.create({
        data: {
          disjuntorId,
          tensaoNominalV,
          correnteRms: corrente,
          potenciaAparenteVA,
          rssiDbm,
          alerta: acimaDoLimite,
        },
      });

      if (!acimaDoLimite && eventoAberto) {
        await tx.eventoFalha.update({
          where: { id: eventoAberto.id },
          data: { fimEm: leitura.registradoEm },
        });
      }

      if (acimaDoLimite && eventoAberto) {
        const eventoAtualizado = await tx.eventoFalha.update({
          where: { id: eventoAberto.id },
          data: { correnteMaxA: Math.max(eventoAberto.correnteMaxA, corrente) },
        });
        return {
          leitura,
          eventoNovo: null,
          eventoAtualizado,
          usuarioId: disjuntor.residencia.usuarioId,
          nomeDisjuntor: disjuntor.nome,
        };
      }

      const eventoNovo =
        acimaDoLimite &&
        hasSustainedOverload(leituraAnterior, leitura.registradoEm)
          ? await tx.eventoFalha.create({
              data: {
                tipo: "SOBRECARGA",
                inicioEm: leituraAnterior.registradoEm,
                detectadoEm: leitura.registradoEm,
                correnteMaxA: corrente,
                limiteCorrenteA: disjuntor.limiteCorrente,
                disjuntorId,
              },
            })
          : null;

      return {
        leitura,
        eventoNovo,
        eventoAtualizado: null,
        usuarioId: disjuntor.residencia.usuarioId,
        nomeDisjuntor: disjuntor.nome,
      };
    });

    if (!resultado) {
      return NextResponse.json({ erro: "Circuito não encontrado" }, { status: 404 });
    }

    let atualizacaoTempoReal: "publicada" | "falhou" = "publicada";
    try {
      await publishReadingUpdate(resultado.usuarioId);
    } catch (error) {
      console.error("Leitura salva, mas não foi possível publicar atualização SSE:", error);
      atualizacaoTempoReal = "falhou";
    }

    let notificacao: {
      status: "ENVIADA" | "FALHOU" | "NAO_CONFIGURADA" | null;
      detalhe: string | null;
    } = { status: null, detalhe: null };

    if (resultado.eventoNovo) {
      try {
        notificacao = await enviarAlertaWhatsApp({
          nomeCircuito: resultado.nomeDisjuntor,
          correnteMaxA: resultado.eventoNovo.correnteMaxA,
          limiteCorrenteA: resultado.eventoNovo.limiteCorrenteA,
        });
      } catch (error) {
        console.error("Falha de comunicação com a WhatsApp Cloud API:", error);
        notificacao = {
          status: "FALHOU",
          detalhe: error instanceof Error ? error.message : "Erro desconhecido no envio.",
        };
      }

      if (notificacao.status !== null) {
        try {
          await prisma.eventoFalha.update({
            where: { id: resultado.eventoNovo.id },
            data: {
              notificacaoStatus: notificacao.status,
              detalheNotificacao: notificacao.detalhe,
            },
          });
        } catch (error) {
          console.error("Não foi possível registrar o resultado da notificação:", error);
          notificacao = {
            status: "FALHOU",
            detalhe: "O resultado do envio não pôde ser gravado no banco.",
          };
        }

        if (notificacao.status !== "ENVIADA") {
          console.error("Alerta de sobrecarga não enviado:", notificacao.detalhe);
        }
      }
    }

    return NextResponse.json({
      sucesso: true,
      leituraId: resultado.leitura.id,
      potenciaAparenteVA,
      estimativaAssumeFatorPotenciaUnitario: true,
      eventoFalhaId: resultado.eventoNovo?.id ?? resultado.eventoAtualizado?.id ?? null,
      notificacao,
      atualizacaoTempoReal,
    }, { status: 201 });
    
  } catch (error) {
    console.error("Erro na API de Leituras:", error);
    return NextResponse.json({ erro: "Falha ao gravar no banco de dados" }, { status: 500 });
  }
}