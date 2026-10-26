import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma";
import Link from "next/link";
import BotaoNovoCliente from "../components/BotaoNovoCliente";
import GraficoConsumo from "../components/GraficoConsumo";

export default async function Home() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const usuarioAtual = await prisma.usuario.findUnique({
    where: { email: session.user?.email as string }
  });

  if (!usuarioAtual) redirect("/login");

  // VISTA DO ADMINISTRADOR
  if (usuarioAtual.role === "ADMIN") {
    const todosClientes = await prisma.usuario.findMany({
      where: { role: "CLIENTE" },
      include: { residencias: { include: { disjuntores: true } } }
    });

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-blue-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <div>
              <h1 className="text-3xl font-bold text-blue-950">Painel do Administrador</h1>
              <p className="text-blue-500 mt-1">Gestão de Clientes VoltGuard</p>
            </div>
            <div className="flex gap-4 items-center">
              <BotaoNovoCliente />
              <Link href="/api/auth/signout" className="bg-white border border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 rounded font-bold transition-colors shadow-sm">
                Sair
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  <th className="p-4 text-blue-800 font-semibold">Nome do Cliente</th>
                  <th className="p-4 text-blue-800 font-semibold">Email</th>
                  <th className="p-4 text-blue-800 font-semibold text-center">Circuitos Monitorizados</th>
                  <th className="p-4 text-right text-blue-800 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {todosClientes.map(cliente => {
                  const totalCircuitos = cliente.residencias.reduce((acc, res) => acc + res.disjuntores.length, 0);
                  return (
                    <tr key={cliente.id} className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{cliente.nome}</td>
                      <td className="p-4 text-gray-600">{cliente.email}</td>
                      <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">{totalCircuitos}</td>
                      <td className="p-4 text-right">
                        <Link href={`/cliente/${cliente.id}`} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded font-bold transition-colors">
                          Gerir Circuitos
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {todosClientes.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-blue-400">Nenhum cliente registado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

// VISTA DO CLIENTE NORMAL
  const residencias = await prisma.residencia.findMany({
    where: { usuarioId: usuarioAtual.id },
    include: { 
      disjuntores: {
        include: {
          leituras: {
            orderBy: { registradoEm: 'desc' },
            take: 15 // Pega as 15 leituras mais recentes
          }
        }
      } 
    }
  });
  const disjuntoresCliente = residencias.flatMap(r => r.disjuntores);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-blue-900 p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8 w-full max-w-5xl text-left text-blue-950">Olá, {usuarioAtual.nome}</h1>
      
      <div className="w-full max-w-5xl mb-8">
        <GraficoConsumo disjuntores={disjuntoresCliente} />
      </div>
      
      <div className="flex gap-4 w-full max-w-5xl justify-end">
        <Link href={`/cliente/${usuarioAtual.id}/relatorio`} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-colors shadow-sm">
          Ver Minha Fatura Copel
        </Link>
        <Link href="/api/auth/signout" className="bg-white border border-red-500 text-red-600 hover:bg-red-50 px-6 py-2 rounded font-bold transition-colors shadow-sm">
          Sair da Conta
        </Link>
      </div>
    </div>
  );
}
