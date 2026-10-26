import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import FormCircuito from "./FormCircuito";
import { revalidatePath } from "next/cache";

export default async function PaginaCliente(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const cliente = await prisma.usuario.findUnique({
    where: { id: params.id },
    include: { residencias: { include: { disjuntores: true } } }
  });

  if (!cliente) return <div className="text-blue-900 p-8">Cliente não encontrado.</div>;

  const disjuntores = cliente.residencias.flatMap(r => r.disjuntores);

  async function excluirCircuito(formData: FormData) {
    "use server";
    const circuitoIdString = formData.get("circuitoId") as string;
    const circuitoIdNumero = parseInt(circuitoIdString, 10);
    
    await prisma.disjuntor.delete({ where: { id: circuitoIdNumero } });
    revalidatePath(`/cliente/${params.id}`);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div>
            <h1 className="text-3xl font-bold text-blue-950">{cliente.nome}</h1>
            <p className="text-blue-500">{cliente.email}</p>
          </div>
          <Link href="/" className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded font-bold transition-colors shadow-sm">
            Voltar
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-4 border-b border-blue-50 pb-2">Adicionar Novo Circuito</h2>
          <FormCircuito usuarioId={cliente.id} />
        </div>

        <h2 className="text-xl font-bold text-blue-900 mb-4 px-2">Circuitos Registados</h2>
        <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 border-b border-blue-100">
                <th className="p-4 text-blue-800 font-semibold">ID do Hardware</th>
                <th className="p-4 text-blue-800 font-semibold">Nome do Circuito</th>
                <th className="p-4 text-blue-800 font-semibold">Limite Segurança</th>
                <th className="p-4 text-right text-blue-800 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {disjuntores.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-blue-400">Nenhum circuito registado.</td></tr>
              ) : (
                disjuntores.map(d => (
                  <tr key={d.id} className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-mono text-blue-600 bg-blue-50/30 font-semibold">{d.id}</td>
                    <td className="p-4 font-medium text-gray-700">{d.nome}</td>
                    <td className="p-4 text-gray-600">{d.limiteCorrente} A</td>
                    <td className="p-4 text-right">
                      <form action={excluirCircuito}>
                        <input type="hidden" name="circuitoId" value={d.id} />
                        <button type="submit" className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded font-bold transition-colors">
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}