This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Telemetria elétrica

O ESP32 envia `disjuntorId`, `corrente` (A), `tensao` (V nominal) e `rssiDbm` para
`POST /api/leituras`, autenticando-se com o cabeçalho `X-Device-Key`. Configure
`ESP32_API_KEY` no servidor e use o mesmo valor no firmware; mantenha a chave fora
do repositório. O firmware fornecido ainda aponta para o endereço HTTP local
`192.168.0.10`; para uso na VPS, substitua-o pelo domínio público HTTPS e configure
validação do certificado raiz com `WiFiClientSecure` (não desative a validação).
Como esta versão não usa sensor de tensão, ajuste `tensaoNominalV` no firmware
conforme a instalação; o painel registra
`corrente × tensão nominal` como potência aparente (VA), não como potência ativa (W);
fator de potência real não está disponível. Os valores de energia e custo são
estimativas que assumem fator de potência 1. A integração mensal usa a regra
trapezoidal e ignora intervalos entre leituras superiores a 15 segundos.
O status online/offline é inferido pelo tempo desde a última leitura (limite de
15 segundos); sem leitura inicial, o painel informa que ainda não há telemetria.
O relatório mensal e o CSV exibem estimativas calculadas apenas a partir dos
intervalos válidos entre amostras.

## Alertas de sobrecarga

Uma sobrecarga é registrada quando duas leituras consecutivas excedem o limite
do circuito por pelo menos 5 segundos (sem lacunas maiores que 15 segundos).
O painel mantém o cartão em destaque enquanto o evento estiver aberto e fecha
o evento quando uma nova leitura volta ao limite ou abaixo dele. Isto é
monitorização e notificação; não desliga a alimentação nem substitui um disjuntor.

Para notificações, configure no ambiente do servidor `WHATSAPP_ACCESS_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_RECIPIENT` (somente dígitos),
`WHATSAPP_GRAPH_API_VERSION`, `WHATSAPP_TEMPLATE_NAME` e
`WHATSAPP_TEMPLATE_LANGUAGE`. O modelo aprovado na Meta deve ter três
parâmetros no corpo: nome do circuito, corrente máxima e limite configurado.
Não envie tokens ou segredos pelo chat nem os grave no repositório.

## Atualização em tempo real

O painel usa SSE autenticado. A API publica notificações PostgreSQL
`LISTEN/NOTIFY` após gravar uma leitura; o servidor Next.js deve permanecer
em execução numa VPS/Docker e ter acesso ao mesmo PostgreSQL. O fluxo mantém
uma conexão PostgreSQL por navegador conectado (até 20 conexões SSE por processo
Next.js); configure o pool do banco considerando também as conexões do Prisma.
Em proxies reversos, desative o buffering para a rota `/api/leituras/stream`.

Antes de publicar as mudanças do banco, aplique as migrations no ambiente alvo
com `npx prisma migrate deploy` a partir da pasta `painel-iot`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy em VPS

O SSE exige um processo Next.js persistente e acesso ao PostgreSQL para publicar
eventos. A hospedagem deve manter conexões HTTP abertas e não pode encerrar as
rotas em funções serverless. Configure TLS no proxy reverso e mantenha desativado
o buffering para `/api/leituras/stream`.

Antes de liberar o ESP32 na internet, configure o domínio HTTPS no firmware e
instale nele o certificado raiz adequado para validar a conexão TLS.
