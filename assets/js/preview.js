// Modo prévia: a Loja fica escondida para o público e aparece só em quem abriu o link especial.
// Ativar:    qualquer página com ?previa=loja-vdc-7k3p
// Desativar: qualquer página com ?previa=sair
// Isso esconde a Loja, mas não é uma senha: quem tiver o link também vê.
(function () {
  const KEY = "mvc-previa";
  const CODE = "loja-vdc-7k3p";
  try {
    const param = new URLSearchParams(location.search).get("previa");
    if (param === CODE) localStorage.setItem(KEY, "1");
    if (param === "sair") localStorage.removeItem(KEY);
    if (localStorage.getItem(KEY) === "1") document.documentElement.classList.add("previa");
  } catch {
    // Sem armazenamento (ex.: janela anônima): a Loja fica escondida.
  }
})();
