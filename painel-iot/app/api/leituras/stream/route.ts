import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { subscribeToReadingUpdates } from "../../../../lib/telemetry-events";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!usuario) {
    return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 401 });
  }

  let subscription: Awaited<ReturnType<typeof subscribeToReadingUpdates>>;
  try {
    subscription = await subscribeToReadingUpdates();
  } catch (error) {
    console.error("Não foi possível iniciar o fluxo SSE de telemetria:", error);
    return NextResponse.json({ erro: "Fluxo de telemetria indisponível" }, { status: 503 });
  }

  const { client, channel } = subscription;
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const release = (connectionError?: Error) => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        client.removeListener("notification", onNotification);
        client.removeListener("error", onClientError);
        request.signal.removeEventListener("abort", onAbort);
        const unlisten = connectionError
          ? Promise.resolve()
          : client.query(`UNLISTEN ${channel}`).catch((error: unknown) => {
              console.error("Erro ao encerrar inscrição SSE:", error);
            });
        void unlisten.finally(() => client.release(connectionError));
      };
      const onNotification = (notification: { channel?: string; payload?: string }) => {
        if (notification.channel !== channel || notification.payload !== usuario.id) return;
        try {
          controller.enqueue(encoder.encode("event: leituras\ndata: {}\n\n"));
        } catch {
          release();
        }
      };
      const onAbort = () => release();
      const onClientError = (error: Error) => {
        console.error("Conexão PostgreSQL do fluxo SSE encerrada:", error);
        release(error);
      };
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          release();
        }
      }, 15_000);

      cleanup = release;
      client.on("notification", onNotification);
      client.on("error", onClientError);
      request.signal.addEventListener("abort", onAbort, { once: true });
      controller.enqueue(encoder.encode("event: conectado\ndata: {}\n\n"));
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
