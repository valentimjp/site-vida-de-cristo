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

// Próximo culto (página inicial)
const upcoming = document.getElementById("upcoming");

if (upcoming) {
  const services = [
    { weekday: 0, hour: 18, minute: 30, day: "Domingo", name: "Culto de Celebração", time: "18h30" },
    { weekday: 4, hour: 19, minute: 30, day: "Quinta-feira", name: "Culto de Ensino", time: "19h30" },
  ];
  const DURATION_MS = 2 * 60 * 60 * 1000; // culto conta como "acontecendo" por 2h
  const now = new Date();

  const next = services
    .map((service) => {
      const start = new Date(now);
      start.setHours(service.hour, service.minute, 0, 0);
      start.setDate(start.getDate() + ((service.weekday - now.getDay() + 7) % 7));
      if (start.getTime() + DURATION_MS < now.getTime()) start.setDate(start.getDate() + 7);
      return { ...service, start };
    })
    .sort((a, b) => a.start - b.start)[0];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(next.start.getFullYear(), next.start.getMonth(), next.start.getDate());
  const days = Math.round((startDay - today) / 86400000);

  let when;
  if (next.start <= now) when = "acontecendo agora";
  else if (days === 0) when = "hoje";
  else if (days === 1) when = "amanhã";
  else when = `em ${days} dias`;

  document.getElementById("upcomingDay").textContent = next.day;
  document.getElementById("upcomingName").textContent = next.name;
  document.getElementById("upcomingTime").textContent = next.time;
  document.getElementById("upcomingWhen").textContent = when;
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
