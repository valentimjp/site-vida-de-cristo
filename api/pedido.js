// Função do Vercel: recebe o pedido da Loja com o comprovante do Pix e envia por e-mail para a Igreja.
// Configuração (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY  chave do Resend (obrigatória)
//   ORDER_EMAIL     e-mail que recebe os pedidos (opcional; padrão abaixo)
//   ORDER_FROM      remetente (opcional; sem domínio próprio, use o padrão do Resend)

const ORDER_EMAIL = process.env.ORDER_EMAIL || "min.vidadecristo@gmail.com";
const ORDER_FROM = process.env.ORDER_FROM || "Loja Vida de Cristo <onboarding@resend.dev>";

// Preço vem daqui, não do navegador, para ninguém alterar o valor do pedido
const PRODUCTS = {
  "livro-transformados": { name: "Transformados", author: "Frederico Gurgel", price: 10 },
};

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const FILE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value, max) => String(value || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function validate(body) {
  const product = PRODUCTS[body.productId];
  const name = clean(body.name, 80);
  const email = clean(body.email, 120);
  const file = body.file || {};
  const extension = FILE_TYPES[file.type];

  if (!product) return { error: "Produto inválido." };
  if (!name) return { error: "Informe seu nome." };
  if (!EMAIL_PATTERN.test(email)) return { error: "E-mail inválido." };
  if (!extension || typeof file.data !== "string") return { error: "Envie o comprovante em imagem (JPG, PNG) ou PDF." };

  const size = Buffer.from(file.data, "base64").length;
  if (!size || size > MAX_FILE_BYTES) return { error: "O comprovante precisa ter até 3 MB." };

  return { product, name, email, file, extension };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Envio pelo site ainda não configurado." });

  const order = validate(req.body || {});
  if (order.error) return res.status(400).json({ error: order.error });

  const { product, name, email, file, extension } = order;
  const text = [
    "Novo pedido pelo site do Ministério Vida de Cristo:",
    "",
    `Nome: ${name}`,
    `E-mail para receber o eBook: ${email}`,
    `Produto: ${product.name} (${product.author})`,
    `Valor: ${money(product.price)}`,
    "Pagamento: Pix",
    "",
    "O comprovante está em anexo. Confira o Pix no banco e responda este e-mail com o PDF do eBook:",
    "a resposta vai direto para a pessoa.",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: ORDER_FROM,
        to: [ORDER_EMAIL],
        reply_to: email,
        subject: `Pedido pelo site: ${product.name} - ${name}`,
        text,
        attachments: [{ filename: `comprovante-pix.${extension}`, content: file.data }],
      }),
    });
    if (!response.ok) {
      console.error("Resend recusou o envio:", response.status, await response.text());
      return res.status(502).json({ error: "Não foi possível enviar agora." });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Falha ao chamar o Resend:", error);
    return res.status(502).json({ error: "Não foi possível enviar agora." });
  }
};
