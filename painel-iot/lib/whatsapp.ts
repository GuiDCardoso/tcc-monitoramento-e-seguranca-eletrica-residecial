type WhatsAppAlert = {
  nomeCircuito: string;
  correnteMaxA: number;
  limiteCorrenteA: number;
};

type WhatsAppResult = {
  status: "ENVIADA" | "FALHOU" | "NAO_CONFIGURADA";
  detalhe: string | null;
};

export async function enviarAlertaWhatsApp(alerta: WhatsAppAlert): Promise<WhatsAppResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
  const missingConfiguration = [
    ["WHATSAPP_ACCESS_TOKEN", accessToken],
    ["WHATSAPP_PHONE_NUMBER_ID", phoneNumberId],
    ["WHATSAPP_RECIPIENT", recipient],
    ["WHATSAPP_GRAPH_API_VERSION", graphApiVersion],
    ["WHATSAPP_TEMPLATE_NAME", templateName],
    ["WHATSAPP_TEMPLATE_LANGUAGE", templateLanguage],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missingConfiguration.length > 0) {
    return {
      status: "NAO_CONFIGURADA",
      detalhe: `Configuração ausente: ${missingConfiguration.join(", ")}`,
    };
  }

  if (
    !accessToken ||
    !phoneNumberId ||
    !recipient ||
    !graphApiVersion ||
    !templateName ||
    !templateLanguage ||
    !/^v\d+\.\d+$/.test(graphApiVersion) ||
    !/^\d+$/.test(phoneNumberId) ||
    !/^\d{10,15}$/.test(recipient)
  ) {
    return {
      status: "FALHOU",
      detalhe: "Versão da Graph API ou identificador/número de telefone inválido.",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: alerta.nomeCircuito },
                { type: "text", text: alerta.correnteMaxA.toFixed(1) },
                { type: "text", text: alerta.limiteCorrenteA.toFixed(1) },
              ],
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    const detalhe = (await response.text()).slice(0, 500);
    return {
      status: "FALHOU",
      detalhe: `WhatsApp Cloud API respondeu HTTP ${response.status}: ${detalhe}`,
    };
  }

  return { status: "ENVIADA", detalhe: null };
}
