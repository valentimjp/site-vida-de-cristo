// Assistente de compra da Loja: conversa guiada por botões, sem servidor.
// Usa PRODUCTS, money, ORDER_EMAIL, PIX_KEY, PIX_KEY_LABEL e INSTAGRAM_DM de loja.js (carregado antes).

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

// O e-mail aceita assunto e texto prontos no link: a pessoa só anexa o comprovante e envia.
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

function stepPix() {
  addMessage(`Agora é só fazer o Pix de ${money(order.product.price)} para a chave da Igreja (CNPJ):\n${PIX_KEY_LABEL}`);
  addMessage("Quando terminar, toque em Já fiz o Pix.");
  setOptions([
    { label: "Copiar chave Pix", action: copyPixKey },
    { label: "Já fiz o Pix", action: stepReceipt, primary: true },
    { label: "Corrigir meus dados", action: stepName },
  ]);
}

async function copyPixKey() {
  try {
    await copyText(PIX_KEY);
    addMessage("Chave Pix copiada! Cole no app do seu banco.");
  } catch {
    addMessage(`Não consegui copiar sozinho. A chave é: ${PIX_KEY_LABEL}`);
  }
  setOptions([
    { label: "Já fiz o Pix", action: stepReceipt, primary: true },
    { label: "Corrigir meus dados", action: stepName },
  ]);
}

function stepReceipt() {
  addMessage("Falta só um passo: enviar o comprovante.");
  addMessage("Toque em Enviar comprovante. Seu e-mail vai abrir com a mensagem pronta para a Igreja. É só anexar o comprovante do Pix e enviar.");
  setOptions([
    { label: "Enviar comprovante", action: openReceiptEmail, primary: true },
    { label: "Corrigir meus dados", action: stepName },
  ]);
}

function openReceiptEmail() {
  window.location.href = orderMailto();
  addMessage(`Pronto! Assim que conferirmos o pagamento, enviamos o eBook para ${order.email}.`);
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
