const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", open);
});

// Copiar chave Pix (página Ofertas)
const copyPix = document.getElementById("copyPix");

if (copyPix) {
  const label = copyPix.querySelector("span");

  copyPix.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyPix.dataset.key);
      label.textContent = "Chave copiada!";
    } catch {
      label.textContent = "Copie: " + copyPix.dataset.key;
    }
    copyPix.classList.add("is-copied");
    setTimeout(() => {
      label.textContent = "Copiar chave Pix";
      copyPix.classList.remove("is-copied");
    }, 2500);
  });
}

// Revela os elementos .reveal quando entram na tela
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}
