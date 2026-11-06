// Assistente de compra da Loja: conversa guiada por botões, sem servidor.
// Usa PRODUCTS, PAYMENTS, money e INSTAGRAM_DM de loja.js (carregado antes).

const chatOpen = document.getElementById("chatOpen");
const chatPanel = document.getElementById("chatPanel");
const chatClose = document.getElementById("chatClose");
const chatLog = document.getElementById("chatLog");
const chatActions = document.getElementById("chatActions");

const pixKey = document.getElementById("cartPixCopy").dataset.key;
const pixKeyLabel = document.querySelector(".cart__pix-key").textContent;

const order = { product: null, name: "", payment: null };
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
  options.forEach(({ label, action }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat__option";
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

function askText(label, placeholder, onSubmit) {
  chatActions.textContent = "";
  const form = document.createElement("form");
  form.className = "chat__form";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "chat__input";
  input.placeholder = placeholder;
  input.maxLength = 60;
  input.required = true;
  input.autocomplete = "given-name";
  input.setAttribute("aria-label", label);

  const send = document.createElement("button");
  send.type = "submit";
  send.className = "btn btn--primary chat__send";
  send.textContent = "Enviar";

  form.append(input, send);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
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

function chatOrderMessage() {
  const { product, name, payment } = order;
  const price = product.price === null ? "" : ` - ${money(product.price)}`;
  const parts = [
    `Olá! Meu nome é ${name} e gostaria de fazer este pedido pelo site:`,
    "",
    `• 1x ${product.name} (${product.author})${price}`,
    "",
  ];
  if (product.price !== null) parts.push(`Total: ${money(product.price)}`);
  parts.push(`Pagamento: ${PAYMENTS[payment].label}`, "", PAYMENTS[payment].closing);
  return parts.join("\n");
}

// ---------- Etapas da conversa ----------

function stepStart() {
  addMessage("Olá! Sou o assistente da Loja do Ministério Vida de Cristo. Como posso ajudar?");
  stepMenu();
}

function stepMenu() {
  setOptions([
    { label: "Quero comprar", action: stepChooseProduct },
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
    { label: "Quero comprar", action: stepChooseProduct },
    { label: "Voltar ao início", action: stepBack },
  ]);
}

function stepDelivery() {
  addMessage("É um eBook em PDF. Assim que confirmarmos o pagamento, enviamos o arquivo pela conversa do Instagram da Igreja.");
  setOptions([
    { label: "Quero comprar", action: stepChooseProduct },
    { label: "Voltar ao início", action: stepBack },
  ]);
}

function stepTalk() {
  addMessage("Vou abrir a conversa com a Igreja no Instagram.");
  window.open(INSTAGRAM_DM, "_blank", "noopener");
  setOptions([{ label: "Voltar ao início", action: stepBack }]);
}

function stepBack() {
  addMessage("Em que mais posso ajudar?");
  stepMenu();
}

function stepChooseProduct() {
  if (PRODUCTS.length === 1) {
    order.product = PRODUCTS[0];
    addProductCard(order.product);
    stepName();
    return;
  }
  addMessage("Qual produto você quer?");
  setOptions(
    PRODUCTS.map((product) => ({
      label: product.name,
      action: () => {
        order.product = product;
        stepName();
      },
    }))
  );
}

function stepName() {
  addMessage("Ótima escolha! Qual é o seu nome?");
  askText("Seu nome", "Digite seu nome", (name) => {
    order.name = name;
    stepPayment();
  });
}

function stepPayment() {
  addMessage(`Prazer, ${order.name}! Como você prefere pagar?`);
  setOptions([
    { label: "Pix", action: () => stepPix() },
    { label: "Cartão de crédito", action: () => stepCard() },
  ]);
}

function stepPix() {
  order.payment = "pix";
  addMessage(`Faça o Pix de ${money(order.product.price)} para a chave da Igreja (CNPJ):
${pixKeyLabel}`);
  addMessage("Depois de pagar, toque em Enviar pedido. Vou copiar seu pedido e abrir o Instagram. É só colar na conversa e mandar o comprovante.");
  setOptions([
    { label: "Copiar chave Pix", action: copyPixKey },
    { label: "Enviar pedido", action: sendOrder },
    { label: "Trocar forma de pagamento", action: stepPayment },
  ]);
}

function stepCard() {
  order.payment = "cartao";
  addMessage("Pelo Instagram, a Igreja envia um link seguro para você pagar com cartão. Nunca mande os dados do cartão por mensagem.");
  addMessage("Toque em Enviar pedido. Vou copiar seu pedido e abrir o Instagram. É só colar na conversa.");
  setOptions([
    { label: "Enviar pedido", action: sendOrder },
    { label: "Trocar forma de pagamento", action: stepPayment },
  ]);
}

async function copyPixKey() {
  try {
    await copyText(pixKey);
    addMessage("Chave Pix copiada! Agora é só colar no app do seu banco.");
  } catch {
    addMessage(`Não consegui copiar sozinho. Copie a chave: ${pixKey}`);
  }
  stepPixAfterCopy();
}

function stepPixAfterCopy() {
  setOptions([
    { label: "Enviar pedido", action: sendOrder },
    { label: "Trocar forma de pagamento", action: stepPayment },
  ]);
}

// O Instagram não aceita mensagem pronta no link: o pedido vai copiado para a pessoa colar.
// Copia antes de abrir a nova aba, porque a cópia falha quando a página perde o foco.
async function sendOrder() {
  const message = chatOrderMessage();
  let copied = true;
  try {
    await copyText(message);
  } catch {
    copied = false;
  }
  window.open(INSTAGRAM_DM, "_blank", "noopener");
  if (copied) {
    addMessage("Pronto! Copiei seu pedido e abri o Instagram. Cole na conversa e envie.");
  } else {
    addMessage("Abri o Instagram, mas não consegui copiar o pedido. Copie o texto abaixo e cole na conversa:");
    addMessage(message).classList.add("chat__msg--order");
  }
  setOptions([{ label: "Começar de novo", action: stepBack }]);
}

// ---------- Abrir e fechar ----------

function openChat() {
  chatPanel.hidden = false;
  chatOpen.setAttribute("aria-expanded", "true");
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

chatOpen.addEventListener("click", () => (chatPanel.hidden ? openChat() : closeChat()));
chatClose.addEventListener("click", closeChat);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !chatPanel.hidden) closeChat();
});
