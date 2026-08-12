-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Residencia" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Residencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disjuntor" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "limiteCorrente" DOUBLE PRECISION NOT NULL,
    "residenciaId" INTEGER NOT NULL,

    CONSTRAINT "Disjuntor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leitura" (
    "id" SERIAL NOT NULL,
    "tensaoRms" DOUBLE PRECISION NOT NULL,
    "correnteRms" DOUBLE PRECISION NOT NULL,
    "potencia" DOUBLE PRECISION NOT NULL,
    "alerta" BOOLEAN NOT NULL DEFAULT false,
    "disjuntorId" INTEGER NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leitura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Residencia" ADD CONSTRAINT "Residencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disjuntor" ADD CONSTRAINT "Disjuntor_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leitura" ADD CONSTRAINT "Leitura_disjuntorId_fkey" FOREIGN KEY ("disjuntorId") REFERENCES "Disjuntor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
