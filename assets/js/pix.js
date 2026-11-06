// Gera o código Pix "copia e cola" (BR Code estático) com valor, no padrão do Banco Central.
// Cada campo é: ID (2 dígitos) + tamanho (2 dígitos) + valor.

function pixField(id, value) {
  return id + String(value.length).padStart(2, "0") + value;
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63
function pixCrc16(text) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Nome e cidade: sem acentos, em maiúsculas e no tamanho máximo do padrão
function pixText(text, max) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

function pixPayload({ key, name, city, amount, txid = "***" }) {
  const account = pixField("00", "br.gov.bcb.pix") + pixField("01", key);
  const payload =
    pixField("00", "01") +
    pixField("26", account) +
    pixField("52", "0000") +
    pixField("53", "986") +
    (amount ? pixField("54", amount.toFixed(2)) : "") +
    pixField("58", "BR") +
    pixField("59", pixText(name, 25)) +
    pixField("60", pixText(city, 15)) +
    pixField("62", pixField("05", txid)) +
    "6304";
  return payload + pixCrc16(payload);
}

if (typeof module !== "undefined") module.exports = { pixPayload, pixCrc16 };
