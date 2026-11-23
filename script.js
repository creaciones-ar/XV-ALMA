/* ===== CONFIGURACIÓN (editar solo acá) ===== */
const CONFIG = {
  fecha: "April 10, 2027 21:00:00",           // sábado 10 de abril de 2027, 21:00
  youtubeId: "j3ObHjm1fAE",                   // PROVISORIA (la de Isabella): preguntar a Alma qué canción quiere. Vacío = no aparece el reproductor
  inicio: 30,                                 // segundo desde el que suena la canción (30 = salta los primeros 30 s de intro)
  whatsapp: "5491121825254",                  // 54 + 9 + número
  mapsUrl: "https://www.google.com/maps/place/Rio+Senguer+746,+Q8300+Neuqu%C3%A9n/@-38.9794053,-68.072554,17z/data=!3m1!4b1!4m6!3m5!1s0x960a323fc7a4d275:0xd9fa369a3ff6e51c!8m2!3d-38.9794053!4d-68.0699791!16s%2Fg%2F11fcv1mm5b?entry=ttu&g_ep=EgoyMDI2MTExOC4xIKXMDSoASAFQAw%3D%3D",   // link de Google Maps. Vacío = no aparece el botón
  alias: "Almi.faun2026",                     // alias o CBU. Vacío = no aparece la sección de regalos
  cvu: "",                                    // CVU o CBU. Vacío = no aparece esa fila
  titular: "Alma Guadalupe Faundez",          // nombre del titular de la cuenta
  albumUrl: "",                               // PENDIENTE: link del álbum compartido (QR y botón). Vacío = no aparece "Quiero ver tus fotos"
  confirmarAntes: "Confirmar antes del 20 de marzo",   // Vacío = no aparece
  mensajeWa: "Hola! Confirmo mi asistencia a los XV de Alma"
};

const $ = id => document.getElementById(id);

/* ===== Secciones opcionales: aparecen solo si hay dato en CONFIG ===== */
const show = (...ids) => ids.forEach(i => $(i).classList.remove('hidden'));
$('wa-btn').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensajeWa)}`;
if (CONFIG.mapsUrl) { $('maps-btn').href = CONFIG.mapsUrl; show('maps-btn'); }
if (CONFIG.alias || CONFIG.cvu) {
  $('alias').textContent = CONFIG.alias;
  $('cvu').textContent = CONFIG.cvu;
  $('gift-title').textContent = CONFIG.titular;
  if (!CONFIG.alias) $('row-alias').classList.add('hidden');
  if (!CONFIG.cvu) $('row-cvu').classList.add('hidden');
  show('gift-section', 'gift-respiro');
}
if (CONFIG.confirmarAntes) { $('confirm-note').textContent = CONFIG.confirmarAntes; show('confirm-note'); }
if (CONFIG.albumUrl) {
  $('album-link').href = CONFIG.albumUrl;
  show('album-section', 'album-respiro');
  try {                                              // el QR se genera en el propio celular
    const qr = qrcode(0, 'M'); qr.addData(CONFIG.albumUrl); qr.make();
    $('qr').src = qr.createDataURL(8, 0); $('qr').style.imageRendering = 'pixelated';
  } catch (err) {
    $('qr').src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=' + encodeURIComponent(CONFIG.albumUrl);
  }
}
if (!CONFIG.youtubeId) $('player').classList.add('hidden');   // sin canción no hay reproductor

/* ===== Música (YouTube oculto + reproductor propio) ===== */
let yt, ticker, ready = false, wantPlay = false;
const playBtn = $('btn-play'), bar = $('progress');

if (CONFIG.youtubeId) {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player('yt-player', {
    height: '1', width: '1', videoId: CONFIG.youtubeId,
    playerVars: { playsinline: 1, controls: 0, start: CONFIG.inicio },
    events: {
      onReady: () => { ready = true; if (wantPlay) yt.playVideo(); },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED && $('btn-repeat').classList.contains('on')) { yt.seekTo(CONFIG.inicio, true); yt.playVideo(); return; }
        const playing = e.data === YT.PlayerState.PLAYING;
        playBtn.classList.toggle('playing', playing);
        clearInterval(ticker);
        if (playing) ticker = setInterval(() => {
          bar.value = Math.max(0, (yt.getCurrentTime() - CONFIG.inicio) / span() * 100) || 0;
        }, 500);
      }
    }
  });
};
const isPlaying = () => ready && yt.getPlayerState() === 1;
const span = () => Math.max(1, yt.getDuration() - CONFIG.inicio);
let userPaused = false, needResume = false;
playBtn.onclick = () => { if (!ready) return; if (isPlaying()) { userPaused = true; yt.pauseVideo(); } else { userPaused = false; yt.playVideo(); } };
bar.oninput = () => ready && yt.seekTo(CONFIG.inicio + span() * bar.value / 100, true);
$('btn-prev').onclick = $('btn-next').onclick = () => { if (!ready) return; userPaused = false; yt.seekTo(CONFIG.inicio, true); yt.playVideo(); };
$('btn-repeat').onclick = e => e.currentTarget.classList.toggle('on');
$('btn-shuffle').onclick = e => e.currentTarget.classList.toggle('on');
$('yt-player').style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px';

/* ===== Abrir sobre ===== */
$('open-btn').addEventListener('click', function () {
  const env = $('envelope'), screen = $('welcome-screen');
  if (env.classList.contains('open')) return;
  env.classList.add('open');
  screen.classList.add('opening');
  wantPlay = true; if (ready) yt.playVideo();
  setTimeout(() => {
    screen.style.opacity = '0';
    setTimeout(() => {
      screen.classList.add('hidden');
      $('main-content').classList.remove('hidden');
      fitStory();
      window.scrollTo(0, 0);
    }, 600);
  }, 2900);                                         // tiempo que dura la animación del sobre
});

/* ===== Cuenta regresiva ===== */
const eventDate = new Date(CONFIG.fecha).getTime();
const pad = n => String(n).padStart(2, '0');
const tick = () => {
  const d = eventDate - Date.now();
  if (d < 0) { clearInterval(timer); $('countdown').textContent = '¡Llegó el gran día!'; return; }
  $('days').textContent = pad(Math.floor(d / 864e5));
  $('hours').textContent = pad(Math.floor(d % 864e5 / 36e5));
  $('minutes').textContent = pad(Math.floor(d % 36e5 / 6e4));
  $('seconds').textContent = pad(Math.floor(d % 6e4 / 1e3));
};
const timer = setInterval(tick, 1000);
tick();

/* ===== Ventana de regalo + copiar alias / CVU ===== */
const modal = $('gift-modal');
const openGift = () => { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
const closeGift = () => { modal.classList.add('hidden'); document.body.style.overflow = ''; };
$('open-gift').onclick = openGift;
$('close-gift').onclick = closeGift;
modal.addEventListener('click', e => { if (e.target === modal) closeGift(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGift(); });

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.onclick = async () => {
    const txt = $(btn.dataset.copy).textContent.trim();
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const t = document.createElement('textarea');
      t.value = txt; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch { }
      t.remove();
    }
    btn.textContent = '¡Copiado!';
    setTimeout(() => btn.textContent = btn.dataset.label, 2000);
  };
});

/* ===== Fotos: busca automáticamente el archivo correcto =====
   Prueba: foto3.png, "foto 3.png", foto_3.png, .jpg, .jpeg, .webp (y mayúsculas).
   Si una foto no existe todavía, se oculta (y la sección se acomoda sola). */
const V = '1';
const NAMES = n => [`foto${n}`, `foto ${n}`, `foto_${n}`];
const EXTS = ['png', 'jpg', 'jpeg', 'webp', 'PNG', 'JPG', 'JPEG'];

function candidates(n) {
  const list = [];
  NAMES(n).forEach(name => EXTS.forEach(ext => list.push(encodeURI(`${name}.${ext}`) + '?v=' + V)));
  return list;
}

function loadPhoto(img) {
  const list = candidates(img.dataset.foto);
  const framed = img.hasAttribute('data-framed');
  let i = 0;
  const next = () => {
    if (i >= list.length) {
      console.warn('No se encontró la foto', img.dataset.foto);
      img.style.display = 'none';
      const sec = img.closest('section');
      if (sec && !sec.querySelector('img[data-foto]:not([style*="none"])')) sec.classList.add('no-photo');
      fitStory();
      return;
    }
    const probe = new Image();
    const url = list[i++];
    probe.onload = () => { img.src = url; if (framed) img.classList.add('framed'); };
    probe.onerror = next;
    probe.src = url;
  };
  next();
}

document.querySelectorAll('img[data-foto]').forEach(loadPhoto);

/* ===== Texto de la historia: mismo alto que las dos fotos ===== */
function fitStory() {
  const t = document.querySelector('.story-text');
  const box = document.querySelector('.story-photos');
  if (!t || !box || !box.offsetHeight) return;
  const target = box.offsetHeight * 0.90;
  let lo = 11, hi = 24;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    t.style.fontSize = mid + 'px';
    if (t.scrollHeight > target) hi = mid; else lo = mid;
  }
  t.style.fontSize = lo + 'px';
}
document.querySelectorAll('.story-photos img').forEach(i => i.addEventListener('load', fitStory));
window.addEventListener('resize', fitStory);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStory);

/* ===== Al volver de Google Maps u otra app, la música sigue sola ===== */
function resumeMusic() {
  if (!ready || !wantPlay || userPaused || isPlaying()) return;
  yt.playVideo(); needResume = true;
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(resumeMusic, 300); });
window.addEventListener('pageshow', () => setTimeout(resumeMusic, 300));
document.addEventListener('touchend', e => {
  if (!needResume || e.target.closest('.controls')) return;
  needResume = false;
  if (!userPaused && !isPlaying()) yt.playVideo();
}, { passive: true });

/* ===== El ícono del calendario se anima una sola vez ===== */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.target.getAttribute('src')) { const im = e.target; im.src = im.src.split('?')[0] + '?t=' + Date.now(); }
  }), { threshold: 0.6 });
  document.querySelectorAll('img[data-replay]').forEach(i => io.observe(i));
}

/* ===== Íconos animados: busca el archivo con o sin "_1" en el nombre ===== */
document.querySelectorAll('img[data-icon]').forEach(img => {
  const n = img.dataset.icon, list = [`${n}_1.gif`, `${n}.gif`, `${n}_1.GIF`, `${n}.GIF`];
  let i = 0;
  const next = () => {
    if (i >= list.length) { console.warn('No se encontró el ícono', n); return; }
    const p = new Image(), u = list[i++] + '?v=1';
    p.onload = () => { img.src = u; };
    p.onerror = next;
    p.src = u;
  };
  next();
});
