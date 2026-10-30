// Catálogo: para adicionar um produto, inclua um item nesta lista.
// price: número em reais (ex.: 49.9) ou null para mostrar "Consulte o valor".
const PRODUCTS = [
  {
    id: "livro-transformados",
    name: "Transformados",
    author: "Frederico Gurgel",
    category: "Livro",
    image: "assets/img/livro-transformados.jpg",
    price: null,
  },
];

const CART_KEY = "mvc-carrinho";
const INSTAGRAM_DM = "https://ig.me/m/vidadecristo_ofc";

const catalog = document.getElementById("catalog");
const cartPanel = document.getElementById("cartPanel");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartOpen = document.getElementById("cartOpen");
const cartClose = document.getElementById("cartClose");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartFooter = document.getElementById("cartFooter");
const cartTotal = document.getElementById("cartTotal");
const cartSend = document.getElementById("cartSend");
const cartStatus = document.getElementById("cartStatus");
const cartManual = document.getElementById("cartManual");

const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const findProduct = (id) => PRODUCTS.find((product) => product.id === id);

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    if (!saved || typeof saved !== "object") return {};
    const cart = {};
    Object.keys(saved).forEach((id) => {
      const quantity = Number(saved[id]);
      if (findProduct(id) && Number.isInteger(quantity) && quantity > 0) cart[id] = quantity;
    });
    return cart;
  } catch {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Sem armazenamento (ex.: janela anônima): o carrinho vale só para esta visita.
  }
}

const cart = loadCart();

function renderCatalog() {
  catalog.textContent = "";
  PRODUCTS.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product";

    const image = document.createElement("img");
    image.className = "product__image";
    image.src = product.image;
    image.alt = `${product.category} ${product.name}, de ${product.author}`;

    const category = document.createElement("p");
    category.className = "product__category";
    category.textContent = product.category;

    const name = document.createElement("h3");
    name.className = "product__name";
    name.textContent = product.name;

    const author = document.createElement("p");
    author.className = "product__author";
    author.textContent = product.author;

    const price = document.createElement("p");
    price.className = "product__price";
    price.textContent = product.price === null ? "Consulte o valor" : money(product.price);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--primary product__add";
    button.textContent = "Adicionar ao carrinho";
    button.addEventListener("click", () => {
      cart[product.id] = (cart[product.id] || 0) + 1;
      updateCart();
      openCart();
    });

    card.append(image, category, name, author, price, button);
    catalog.appendChild(card);
  });
}

function changeQuantity(id, amount) {
  const quantity = (cart[id] || 0) + amount;
  if (quantity > 0) cart[id] = quantity;
  else delete cart[id];
  updateCart();
}

function quantityButton(label, text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cart-item__button";
  button.setAttribute("aria-label", label);
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function renderCartItems() {
  cartItems.textContent = "";
  Object.keys(cart).forEach((id) => {
    const product = findProduct(id);
    const item = document.createElement("li");
    item.className = "cart-item";

    const image = document.createElement("img");
    image.className = "cart-item__image";
    image.src = product.image;
    image.alt = "";

    const info = document.createElement("div");
    info.className = "cart-item__info";

    const name = document.createElement("p");
    name.className = "cart-item__name";
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "cart-item__price";
    price.textContent = product.price === null ? "Consulte o valor" : money(product.price);

    const controls = document.createElement("div");
    controls.className = "cart-item__controls";

    const quantity = document.createElement("span");
    quantity.className = "cart-item__quantity";
    quantity.textContent = cart[id];

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "cart-item__remove";
    remove.textContent = "Remover";
    remove.addEventListener("click", () => {
      delete cart[id];
      updateCart();
    });

    controls.append(
      quantityButton(`Diminuir quantidade de ${product.name}`, "−", () => changeQuantity(id, -1)),
      quantity,
      quantityButton(`Aumentar quantidade de ${product.name}`, "+", () => changeQuantity(id, 1)),
      remove
    );
    info.append(name, price, controls);
    item.append(image, info);
    cartItems.appendChild(item);
  });
}

function orderMessage() {
  const lines = Object.keys(cart).map((id) => {
    const product = findProduct(id);
    const price = product.price === null ? "" : ` - ${money(product.price * cart[id])}`;
    return `• ${cart[id]}x ${product.name} (${product.author})${price}`;
  });
  const parts = ["Olá! Gostaria de fazer este pedido pelo site:", "", ...lines];
  const total = orderTotal();
  if (total !== null) parts.push("", `Total: ${money(total)}`);
  parts.push("", "Como faço para receber?");
  return parts.join("\n");
}

// Devolve null se algum item ainda não tiver preço
function orderTotal() {
  let total = 0;
  for (const id of Object.keys(cart)) {
    const product = findProduct(id);
    if (product.price === null) return null;
    total += product.price * cart[id];
  }
  return total;
}

function updateCart() {
  const ids = Object.keys(cart);
  const count = ids.reduce((sum, id) => sum + cart[id], 0);
  const total = orderTotal();

  cartCount.textContent = count;
  cartEmpty.hidden = ids.length > 0;
  cartFooter.hidden = ids.length === 0;
  cartTotal.hidden = total === null;
  cartTotal.textContent = total === null ? "" : `Total: ${money(total)}`;
  cartStatus.textContent = "";
  cartManual.hidden = true;

  renderCartItems();
  saveCart();
}

function openCart() {
  cartPanel.classList.add("is-open");
  cartBackdrop.classList.add("is-open");
  document.body.classList.add("cart-open");
  cartClose.focus();
}

function closeCart() {
  cartPanel.classList.remove("is-open");
  cartBackdrop.classList.remove("is-open");
  document.body.classList.remove("cart-open");
  cartOpen.focus();
}

cartOpen.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
});

// O Instagram não aceita mensagem pronta no link: o pedido é copiado para a pessoa colar na conversa.
cartSend.href = INSTAGRAM_DM;
cartSend.addEventListener("click", async () => {
  const message = orderMessage();
  try {
    await navigator.clipboard.writeText(message);
    cartStatus.textContent = "Pedido copiado! Cole na conversa do Instagram e envie.";
  } catch {
    cartManual.value = message;
    cartManual.hidden = false;
    cartStatus.textContent = "Não conseguimos copiar sozinhos. Copie o pedido abaixo e cole na conversa.";
  }
});

renderCatalog();
updateCart();
