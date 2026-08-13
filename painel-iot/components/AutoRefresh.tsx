'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AutoRefresh({ intervalo = 3000 }: { intervalo?: number }) {
  const router = useRouter();

  useEffect(() => {
    // Cria um temporizador que recarrega os dados da página a cada X milissegundos
    const temporizador = setInterval(() => {
      router.refresh();
    }, intervalo);

    // Limpa o temporizador se o usuário fechar a página
    return () => clearInterval(temporizador);
  }, [router, intervalo]);

  return null; // Este componente não tem visual, ele trabalha nos bastidores
}