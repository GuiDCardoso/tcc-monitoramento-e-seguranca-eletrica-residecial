import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma";
import Link from "next/link";
import BotaoNovoCliente from "../components/BotaoNovoCliente";
import GraficoConsumo from "../components/GraficoConsumo";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/api/auth/signin");
  }

  // Busca o utilizador atual na base de dados para garantir o ID e a Role
  const usuarioAtual = await prisma.usuario.findUnique({
    where: { email: session.user.email }
  });

  if (!usuarioAtual) redirect("/api/auth/signin");

  // VISTA DO ADMINISTRADOR
  if (usuarioAtual.role === "ADMIN") {
    const clientes = await prisma.usuario.findMany({
      where: { role: "CLIENTE" },
      include: { residencias: true }
    });

    return (
      <div className="min-h-screen bg-[#0A1931] text-[#F6FAFD] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Painel de Gestão - VoltGuard</h1>
            <Link href="/api/auth/signout" className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold transition-colors">Sair</Link>
          </div>

          <div className="bg-[#1A3D63] p-6 rounded-lg shadow-lg border border-[#4A7FA7]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Clientes e Circuitos</h2>
              <BotaoNovoCliente />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#4A7FA7]">
                    <th className="p-3">Nome</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3">Residências</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-400">Nenhum cliente cadastrado.</td>
                    </tr>
                  ) : (
                    clientes.map(cliente => (
                      <tr key={cliente.id} className="border-b border-[#4A7FA7] hover:bg-[#2A4D73]">
                        <td className="p-3">{cliente.nome}</td>
                        <td className="p-3">{cliente.email}</td>
                        <td className="p-3">{cliente.residencias.length}</td>
                        <td className="p-3 flex gap-2">
                          <Link href={`/cliente/${cliente.id}`} className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-sm text-white text-center">Configurar Circuitos</Link>
                          <Link href={`/cliente/${cliente.id}/relatorio`} className="bg-[#4A7FA7] hover:bg-[#B3CFE5] hover:text-[#0A1931] px-3 py-1 rounded text-sm text-white transition-colors text-center">Fatura Copel</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

// VISTA DO CLIENTE NORMAL
  
  // Busca as residências e circuitos reais deste utilizador
  const residencias = await prisma.residencia.findMany({
    where: { usuarioId: usuarioAtual.id },
    include: { disjuntores: true }
  });
  const disjuntoresCliente = residencias.flatMap(r => r.disjuntores);

  return (
    <div className="min-h-screen bg-[#0A1931] text-[#F6FAFD] p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8 w-full max-w-4xl text-left">Olá, {usuarioAtual.nome}</h1>
      
      <div className="w-full max-w-4xl mb-8">
        <GraficoConsumo disjuntores={disjuntoresCliente} />
      </div>
      
      <div className="flex gap-4 w-full max-w-4xl justify-end">
        <Link href={`/cliente/${usuarioAtual.id}/relatorio`} className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded font-bold transition-colors">
          Ver Minha Fatura Copel
        </Link>
        <Link href="/api/auth/signout" className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded font-bold transition-colors">
          Sair da Conta
        </Link>
      </div>
    </div>
  );
}