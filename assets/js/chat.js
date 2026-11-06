// Assistente de compra da Loja: conversa guiada por botões, sem servidor.
// Usa PRODUCTS, money, ORDER_EMAIL, PIX_KEY e INSTAGRAM_DM de loja.js, pixPayload de pix.js e qrcode de vendor/qrcode.js.

const chatOpen = document.getElementById("chatOpen");
const chatPanel = document.getElementById("chatPanel");
const chatClose = document.getElementById("chatClose");
const chatLog = document.getElementById("chatLog");
const chatActions = document.getElementById("chatActions");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const order = { product: null, name: "", email: "" };
let started = false;

// Rola até a última mensagem depois que o layout (inclusive os botões) se ajusta
function scrollToEnd() {
  requestAnimationFrame(() => {
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}

function addMessage(text, from = "bot") {
  const message = document.createElement("p");
  message.className = `chat__msg chat__msg--${from}`;
  message.textContent = text;
  chatLog.appendChild(message);
  scrollToEnd();
  return message;
}

function addProductCard(product) {
  const card = document.createElement("div");
  card.className = "chat__product";

  const image = document.createElement("img");
  image.src = product.image;
  image.alt = `Capa do ${product.category} ${product.name}`;

  const info = document.createElement("div");
  const name = document.createElement("p");
  name.className = "chat__product-name";
  name.textContent = product.name;
  const price = document.createElement("p");
  price.className = "chat__product-price";
  price.textContent = product.price === null ? "Consulte o valor" : money(product.price);

  info.append(name, price);
  card.append(image, info);
  chatLog.appendChild(card);
  scrollToEnd();
}

// Mostra as opções da etapa atual; ao escolher, a opção vira uma fala da pessoa
function setOptions(options) {
  chatActions.textContent = "";
  options.forEach(({ label, action, primary }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = primary ? "chat__option chat__option--primary" : "chat__option";
    button.textContent = label;
    button.addEventListener("click", () => {
      addMessage(label, "user");
      action();
    });
    chatActions.appendChild(button);
  });
  chatActions.querySelector("button")?.focus();
  scrollToEnd();
}

function askText({ label, placeholder, type = "text", autocomplete, validate, onSubmit }) {
  chatActions.textContent = "";
  const form = document.createElement("form");
  form.className = "chat__form";
  form.noValidate = true;

  const input = document.createElement("input");
  input.type = type;
  input.className = "chat__input";
  input.placeholder = placeholder;
  input.maxLength = 80;
  input.autocomplete = autocomplete;
  input.setAttribute("aria-label", label);

  const send = document.createElement("button");
  send.type = "submit";
  send.className = "btn btn--primary chat__send";
  send.textContent = "Enviar";

  const error = document.createElement("p");
  error.className = "chat__error";
  error.setAttribute("role", "alert");

  form.append(input, send, error);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    const problem = value ? validate?.(value) : "Preencha para continuar.";
    if (problem) {
      error.textContent = problem;
      input.focus();
      return;
    }
    addMessage(value, "user");
    onSubmit(value);
  });
  chatActions.appendChild(form);
  input.focus();
  scrollToEnd();
}

// Alguns navegadores deixam a cópia pendente (ex.: pedido de permissão); depois de 1,5 s, considera que falhou
function copyText(text) {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500));
  return Promise.race([navigator.clipboard.writeText(text), timeout]);
}

// Alternativa quando o envio pelo site falha: o e-mail aceita assunto e texto prontos no link.
function orderMailto() {
  const { product, name, email } = order;
  const subject = `Pedido pelo site: ${product.name}`;
  const body = [
    "Olá! Fiz um pedido pelo site do Ministério Vida de Cristo:",
    "",
    `Nome: ${name}`,
    `E-mail para receber o eBook: ${email}`,
    `Produto: ${product.name} (${product.author})`,
    `Valor: ${money(product.price)}`,
    "Pagamento: Pix",
    "",
    "Segue em anexo o comprovante do Pix.",
  ].join("\n");
  return `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------- Etapas da conversa ----------

function stepStart() {
  addMessage("Olá! Sou o assistente da Loja do Ministério Vida de Cristo. Como posso ajudar?");
  stepMenu();
}

function stepMenu() {
  setOptions([
    { label: "Quero comprar", action: stepChooseProduct, primary: true },
    { label: "Conhecer os produtos", action: stepAbout },
    { label: "Como recebo o eBook?", action: stepDelivery },
    { label: "Falar com a Igreja", action: stepTalk },
  ]);
}

function stepAbout() {
  PRODUCTS.forEach((product) => {
    addProductCard(product);
    if (product.description) addMessage(product.description);
  });
  setOptions([
    { label: "Quero comprar", action: stepChooseProduct, primary: true },
    { label: "Voltar ao início", action: stepBack },
  ]);
}

function stepDelivery() {
  addMessage("É um eBook em PDF. Você paga por Pix e envia o comprovante por e-mail. Assim que conferirmos o pagamento, mandamos o PDF para o seu e-mail.");
  setOptions([
    { label: "Quero comprar", action: stepChooseProduct, primary: true },
    { label: "Voltar ao início", action: stepBack },
  ]);
}

function stepTalk() {
  addMessage(`Você pode escrever para a Igreja no e-mail ${ORDER_EMAIL} ou pelo Instagram. Vou abrir a conversa no Instagram.`);
  window.open(INSTAGRAM_DM, "_blank", "noopener");
  setOptions([{ label: "Voltar ao início", action: stepBack }]);
}

function stepBack() {
  addMessage("Em que mais posso ajudar?");
  stepMenu();
}

function stepChooseProduct() {
  if (PRODUCTS.length === 1) {
    choose(PRODUCTS[0]);
    return;
  }
  addMessage("Qual produto você quer?");
  setOptions(PRODUCTS.map((product) => ({ label: product.name, action: () => choose(product) })));
}

function choose(product) {
  order.product = product;
  addProductCard(product);
  stepName();
}

function stepName() {
  addMessage("Ótima escolha! Qual é o seu nome?");
  askText({
    label: "Seu nome",
    placeholder: "Digite seu nome",
    autocomplete: "name",
    onSubmit: (name) => {
      order.name = name;
      stepEmail();
    },
  });
}

function stepEmail() {
  addMessage(`Prazer, ${order.name}! Qual e-mail devemos usar para enviar o eBook?`);
  askText({
    label: "Seu e-mail",
    placeholder: "seuemail@exemplo.com",
    type: "email",
    autocomplete: "email",
    validate: (email) => (EMAIL_PATTERN.test(email) ? "" : "Confira o e-mail. Exemplo: maria@gmail.com"),
    onSubmit: (email) => {
      order.email = email;
      stepPix();
    },
  });
}

function pixCode() {
  return pixPayload({
    key: PIX_KEY,
    name: "Ministério Vida de Cristo",
    city: "Rio de Janeiro",
    amount: order.product.price,
  });
}

// QR Code do Pix com o valor já preenchido (biblioteca em assets/js/vendor/qrcode.js)
function addPixQr(code) {
  const box = document.createElement("div");
  box.className = "chat__qr";
  const qr = qrcode(0, "M");
  qr.addData(code);
  qr.make();
  const image = document.createElement("img");
  image.src = qr.createDataURL(4, 2);
  image.alt = `QR Code Pix de ${money(order.product.price)} para o Ministério Vida de Cristo`;
  const caption = document.createElement("p");
  caption.textContent = "Escaneie com o app do seu banco";
  box.append(image, caption);
  chatLog.appendChild(box);
  scrollToEnd();
}

function stepPix() {
  addMessage(`Agora é só pagar ${money(order.product.price)} por Pix. O valor já vem preenchido.`);
  addPixQr(pixCode());
  addMessage("No celular, toque em Copiar código Pix e cole no app do banco, na opção Pix Copia e Cola. No computador, escaneie o QR Code.");
  pixOptions();
}

function pixOptions() {
  setOptions([
    { label: "Copiar código Pix", action: copyPixCode },
    { label: "Já fiz o Pix", action: stepReceipt, primary: true },
    { label: "Corrigir meus dados", action: stepName },
  ]);
}

async function copyPixCode() {
  const code = pixCode();
  try {
    await copyText(code);
    addMessage("Código Pix copiado! Cole no app do seu banco, na opção Pix Copia e Cola.");
  } catch {
    addMessage("Não consegui copiar sozinho. Copie o código abaixo e cole no app do banco:");
    addMessage(code).classList.add("chat__msg--order");
  }
  pixOptions();
}

// ---------- Comprovante enviado pelo site (api/pedido.js) ----------

const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_RECEIPT_BYTES = 3 * 1024 * 1024;

function stepReceipt() {
  addMessage("Falta só enviar o comprovante: pode ser o print da tela ou o PDF do banco.");
  askFile();
}

function askFile() {
  chatActions.textContent = "";
  const form = document.createElement("form");
  form.className = "chat__form";

  const input = document.createElement("input");
  input.type = "file";
  input.id = "chatReceipt";
  input.className = "chat__file";
  input.accept = "image/*,application/pdf";

  const pick = document.createElement("label");
  pick.htmlFor = "chatReceipt";
  pick.className = "chat__option";
  pick.tabIndex = 0;
  pick.textContent = "Escolher comprovante";
  pick.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });

  const send = document.createElement("button");
  send.type = "submit";
  send.className = "btn btn--primary chat__send";
  send.textContent = "Enviar comprovante";
  send.disabled = true;

  const info = document.createElement("p");
  info.className = "chat__file-name";

  const error = document.createElement("p");
  error.className = "chat__error";
  error.setAttribute("role", "alert");

  input.addEventListener("change", () => {
    const file = input.files[0];
    info.textContent = file ? `Arquivo: ${file.name}` : "";
    error.textContent = "";
    send.disabled = !file;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    if (!file) return;
    send.disabled = true;
    send.textContent = "Enviando...";
    try {
      const prepared = await prepareReceipt(file);
      await submitOrder(prepared, file.name);
    } catch (problem) {
      error.textContent = problem.message;
      send.disabled = false;
      send.textContent = "Enviar comprovante";
    }
  });

  form.append(input, pick, send, info, error);
  chatActions.appendChild(form);
  pick.focus();
  scrollToEnd();
}

// Fotos grandes ou em formatos que o servidor não aceita viram JPEG menor
async function prepareReceipt(file) {
  let blob = file;
  const isImage = file.type.startsWith("image/");
  if (isImage && (!RECEIPT_TYPES.includes(file.type) || file.size > 1.5 * 1024 * 1024)) {
    try {
      blob = await shrinkImage(file);
    } catch {
      blob = file;
    }
  }
  if (!RECEIPT_TYPES.includes(blob.type)) throw new Error("Envie o comprovante em imagem (JPG, PNG) ou PDF.");
  if (blob.size > MAX_RECEIPT_BYTES) throw new Error("O arquivo passou de 3 MB. Tente um print da tela.");
  return { type: blob.type, data: await toBase64(blob) };
}

async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("falha"))), "image/jpeg", 0.8)
  );
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Não consegui ler o arquivo. Tente outro."));
    reader.readAsDataURL(blob);
  });
}

async function submitOrder(file, fileName) {
  // Sem resposta em 20 s (rede ruim, servidor fora), desiste e oferece o envio por e-mail
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch("/api/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: order.product.id, name: order.name, email: order.email, file }),
      signal: controller.signal,
    });
  } catch {
    response = null;
  } finally {
    clearTimeout(timer);
  }

  // Erro de dados (400): a pessoa corrige e tenta de novo no mesmo formulário
  if (response && response.status === 400) {
    const { error } = await response.json().catch(() => ({}));
    throw new Error(error || "Confira os dados e tente de novo.");
  }

  addMessage(`Comprovante: ${fileName}`, "user");

  if (response && response.ok) {
    addMessage(`Recebemos seu comprovante, ${order.name}! Assim que conferirmos o pagamento, enviamos o eBook para ${order.email}.`);
    setOptions([{ label: "Começar de novo", action: stepBack }]);
    return;
  }

  // Envio pelo site indisponível: usa o aplicativo de e-mail da pessoa
  addMessage("Não consegui enviar pelo site agora. Você pode mandar o comprovante pelo seu e-mail: a mensagem já vai pronta para a Igreja.");
  setOptions([
    { label: "Enviar por e-mail", action: openReceiptEmail, primary: true },
    { label: "Tentar de novo", action: stepReceipt },
  ]);
}

function openReceiptEmail() {
  window.location.href = orderMailto();
  addMessage(`Pronto! Anexe o comprovante e envie. Assim que conferirmos o pagamento, enviamos o eBook para ${order.email}.`);
  addMessage(`Se o seu e-mail não abriu, envie o comprovante para ${ORDER_EMAIL}, com seu nome e o e-mail para receber o eBook.`);
  setOptions([
    { label: "Copiar e-mail da Igreja", action: copyOrderEmail },
    { label: "Começar de novo", action: stepBack },
  ]);
}

async function copyOrderEmail() {
  try {
    await copyText(ORDER_EMAIL);
    addMessage("E-mail da Igreja copiado!");
  } catch {
    addMessage(`O e-mail da Igreja é: ${ORDER_EMAIL}`);
  }
  setOptions([{ label: "Começar de novo", action: stepBack }]);
}

// ---------- Abrir e fechar ----------

function showChat() {
  chatPanel.hidden = false;
  chatOpen.setAttribute("aria-expanded", "true");
}

function openChat() {
  showChat();
  if (!started) {
    started = true;
    stepStart();
  } else {
    chatActions.querySelector("button, input")?.focus();
  }
}

function closeChat() {
  chatPanel.hidden = true;
  chatOpen.setAttribute("aria-expanded", "false");
  chatOpen.focus();
}

// Chamado pelo botão Comprar do catálogo: começa a conversa já com o produto escolhido
function startPurchase(product) {
  showChat();
  chatLog.textContent = "";
  started = true;
  addMessage("Olá! Vou te ajudar a fazer seu pedido.");
  choose(product);
}

chatOpen.addEventListener("click", () => (chatPanel.hidden ? openChat() : closeChat()));
chatClose.addEventListener("click", closeChat);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !chatPanel.hidden) closeChat();
});
