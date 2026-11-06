CREATE TYPE "TipoFalha" AS ENUM ('SOBRECARGA');
CREATE TYPE "StatusNotificacao" AS ENUM ('PENDENTE', 'ENVIADA', 'FALHOU', 'NAO_CONFIGURADA');

CREATE TABLE "EventoFalha" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoFalha" NOT NULL,
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "detectadoEm" TIMESTAMP(3) NOT NULL,
    "fimEm" TIMESTAMP(3),
    "correnteMaxA" DOUBLE PRECISION NOT NULL,
    "limiteCorrenteA" DOUBLE PRECISION NOT NULL,
    "notificacaoStatus" "StatusNotificacao" NOT NULL DEFAULT 'PENDENTE',
    "detalheNotificacao" TEXT,
    "disjuntorId" INTEGER NOT NULL,

    CONSTRAINT "EventoFalha_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventoFalha_disjuntorId_fimEm_idx" ON "EventoFalha"("disjuntorId", "fimEm");

ALTER TABLE "EventoFalha"
ADD CONSTRAINT "EventoFalha_disjuntorId_fkey"
FOREIGN KEY ("disjuntorId") REFERENCES "Disjuntor"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
