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

  if (!cliente) return <div className="text-white p-8">Cliente não encontrado.</div>;

  const disjuntores = cliente.residencias.flatMap(r => r.disjuntores);

  async function excluirCircuito(formData: FormData) {
    "use server";
    const circuitoIdString = formData.get("circuitoId") as string;
    const circuitoIdNumero = parseInt(circuitoIdString, 10);
    
    await prisma.disjuntor.delete({ where: { id: circuitoIdNumero } });
    revalidatePath(`/cliente/${params.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0A1931] text-[#F6FAFD] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{cliente.nome}</h1>
            <p className="text-[#4A7FA7]">{cliente.email}</p>
          </div>
          <Link href="/" className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-bold transition-colors">Voltar</Link>
        </div>

        <h2 className="text-xl font-semibold mb-4">Adicionar Novo Circuito</h2>
        <FormCircuito usuarioId={cliente.id} />

        <h2 className="text-xl font-semibold mb-4 mt-8">Circuitos Registados</h2>
        <div className="bg-[#1A3D63] rounded-lg shadow-lg border border-[#4A7FA7] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A1931] border-b border-[#4A7FA7]">
                <th className="p-3">ID do Hardware</th>
                <th className="p-3">Nome do Circuito</th>
                <th className="p-3">Limite de Segurança</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {disjuntores.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum circuito registado.</td></tr>
              ) : (
                disjuntores.map(d => (
                  <tr key={d.id} className="border-b border-[#4A7FA7] hover:bg-[#2A4D73]">
                    <td className="p-3 font-mono text-yellow-400">{d.id}</td>
                    <td className="p-3">{d.nome}</td>
                    <td className="p-3">{d.limiteCorrente} A</td>
                    <td className="p-3 text-right">
                      <form action={excluirCircuito}>
                        <input type="hidden" name="circuitoId" value={d.id} />
                        <button type="submit" className="text-red-500 hover:text-red-400 font-bold transition-colors">
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