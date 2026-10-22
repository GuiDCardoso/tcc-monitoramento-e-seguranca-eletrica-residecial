import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashSenha = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@voltguard.com' },
    update: {},
    create: {
      nome: 'Guilherme Cardoso',
      email: 'admin@voltguard.com',
      senha: hashSenha,
      role: 'ADMIN',
    },
  });

  console.log('Administrador criado com sucesso:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });