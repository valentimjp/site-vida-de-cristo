// Catálogo: para adicionar um produto, inclua um item nesta lista.
// price: número em reais (ex.: 49.9) ou null para mostrar "Consulte o valor".
const PRODUCTS = [
  {
    id: "livro-transformados",
    name: "Transformados",
    author: "Frederico Gurgel",
    category: "eBook",
    image: "assets/img/livro-transformados.jpg",
    price: 10,
    description:
      "Com base bíblica e linguagem acessível, o Pastor Frederico Gurgel mostra como a alma foi criada, por que foi ferida e como pode ser restaurada pelo Espírito Santo. eBook em PDF, com 72 páginas.",
  },
];

// A compra é feita pelo assistente (chat.js): Pix + comprovante por e-mail para a Igreja.
const ORDER_EMAIL = "min.vidadecristo@gmail.com";
const PIX_KEY = "55498200000108";
const PIX_KEY_LABEL = "55.498.200/0001-08";
const INSTAGRAM_DM = "https://ig.me/m/vidadecristo_ofc";

const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const catalog = document.getElementById("catalog");

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

    const delivery = document.createElement("p");
    delivery.className = "product__delivery";
    delivery.textContent = "Pagamento por Pix · PDF enviado por e-mail";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--primary product__add";
    button.textContent = "Comprar";
    button.addEventListener("click", () => startPurchase(product));

    card.append(image, category, name, author, price, delivery, button);
    catalog.appendChild(card);
  });
}

renderCatalog();
