// Capas provisórias dos 4 bônus (cartão rosa-claro com o nome), até o material existir.
//   node apps/carteiras-membros/capas-bonus.cjs
const sharp = require('C:/Users/thorz/OneDrive/Desktop/Claude/Visual St - Claude/funis/mascaraspapercraft-br/node_modules/sharp');
const path = require('path');
const B = [['Curso', 'Nécessaires em Crochê'], ['Guia de', 'Acabamento Profissional'], ['Lista de Materiais', 'e Onde Comprar'], ['Mini Guia', 'Como Vender Suas Peças']];
(async () => {
  for (let i = 1; i < B.length; i++) for (const w of [480, 800]) {
    const h = w * 3 / 4, f = w / 800;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#F1D3DA"/>
      <rect x="${18 * f}" y="${18 * f}" width="${w - 36 * f}" height="${h - 36 * f}" rx="${18 * f}" fill="none" stroke="#7A1F3D" stroke-width="${3 * f}" stroke-dasharray="${12 * f} ${9 * f}"/>
      <text x="50%" y="${h * 0.30}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${44 * f}" letter-spacing="${6 * f}" fill="#7A1F3D">BÔNUS ${i + 1}</text>
      <text x="50%" y="${h * 0.48}" text-anchor="middle" font-family="Arial" font-weight="800" font-size="${78 * f}" fill="#7A1F3D">${B[i][0]}</text>
      <text x="50%" y="${h * 0.60}" text-anchor="middle" font-family="Arial" font-weight="800" font-size="${60 * f}" fill="#7A1F3D">${B[i][1]}</text>
      <text x="50%" y="${h * 0.78}" text-anchor="middle" font-family="Georgia" font-style="italic" font-size="${44 * f}" fill="#7A1F3D" fill-opacity="0.7">${i === 1 ? 'em breve' : 'Kit Completo'}</text></svg>`;
    await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(path.join(__dirname, 'assets/capas', `b${i + 1}-${w}.webp`));
  }
  console.log('ok');
})();
