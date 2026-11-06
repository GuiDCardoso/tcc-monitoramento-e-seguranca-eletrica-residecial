import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { buildMonthlyReport, TARIFA_KWH } from "@/lib/monthly-report";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number): string {
  const text = String(value);
  const safeText = typeof value === "string" && /^[\u0000-\u0020]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function formatDecimal(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  const { id: clienteId } = await context.params;
  const searchParams = new URL(request.url).searchParams;
  const now = new Date();
  const month = searchParams.has("mes") ? Number(searchParams.get("mes")) : now.getMonth() + 1;
  const year = searchParams.has("ano") ? Number(searchParams.get("ano")) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ erro: "Mês ou ano inválido" }, { status: 400 });
  }

  const usuarioAtual = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!usuarioAtual) {
    return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 401 });
  }
  if (usuarioAtual.role !== "ADMIN" && usuarioAtual.id !== clienteId) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const report = await buildMonthlyReport(clienteId, month, year);
  if (!report) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  const rows = [
    ["Circuito", "Consumo estimado (kWh)", "Tarifa estimada (R$/kWh)", "Custo estimado (R$)"],
    ...report.detalhesCircuitos.map((circuito) => [
      circuito.nome,
      formatDecimal(circuito.kwh),
      formatDecimal(TARIFA_KWH),
      formatDecimal(circuito.valor),
    ]),
    ["SUBTOTAL ESTIMADO", formatDecimal(report.consumoTotalKwh), "", formatDecimal(report.subtotal)],
    ["IMPOSTOS ESTIMADOS", "", "", formatDecimal(report.estimativaImpostos)],
    ["TOTAL ESTIMADO COM IMPOSTOS", "", "", formatDecimal(report.totalFatura)],
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="voltguard-${year}-${String(month).padStart(2, "0")}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
