// Service worker do Crochê com Amor — deixa o app "instalável" (PWA) e recebe as notificações.
// IMPORTANTE: não interceptamos as requisições (sem event.respondWith).
// O handler de fetch existe só para satisfazer o critério de instalabilidade;
// deixar o navegador lidar com o carregamento evita quebrar a página em redes
// instáveis (que foi o erro de carregamento no 1º acesso pelo celular).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch vazio: NÃO chama respondWith, então cada requisição segue
// o fluxo normal do navegador (rede), sem risco de falha por cache vazio.
self.addEventListener("fetch", () => {});

// Notificação vinda do servidor (push ainda não ligado neste app).
// payload: {title, body, url, tag, image}
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : "" }; }
  const titulo = d.title || "Crochê com Amor";
  const opcoes = {
    body: d.body || "",
    icon: "/assets/icon-ca-192.png",
    tag: d.tag || "clube",
    renotify: false,
    data: { url: d.url || "/#inicio" },
  };
  if (d.image) opcoes.image = d.image;
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// Toque na notificação: abre (ou traz pra frente) o app já na tela certa.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const alvo = new URL((event.notification.data && event.notification.data.url) || "/#inicio", self.location.origin).href;
  event.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of abertas) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        c.postMessage({ tipo: "abrir", url: alvo });
        return;
      }
    }
    await self.clients.openWindow(alvo);
  })());
});
