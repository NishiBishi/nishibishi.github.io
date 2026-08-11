// site.js — comportements partagés du site. Chaque bloc est GARDÉ par la présence
// de son point de montage : une page sans l'élément concerné n'exécute rien.
// (La DA vit dans tokens.css ; les styles dans theme.css ; le panneau ⚙ dans devpanel.js.)

// Apparition des cartes au scroll (accueil : .card)
(function () {
  const cards = document.querySelectorAll('.card');
  if (!cards.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  cards.forEach(c => io.observe(c));
})();

// Diaporama du hero (accueil) : fondu au noir entre chaque visuel, en boucle.
// La LISTE des visuels est une donnée de page : window.HERO_SLIDES, déclarée dans index.html.
(function () {
  const box = document.getElementById('heroSlides');
  if (!box || !Array.isArray(window.HERO_SLIDES)) return;
  const imgs = window.HERO_SLIDES.map(src => {
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    box.appendChild(img);
    return img;
  });
  let i = 0;
  imgs[0].classList.add('on');
  // mouvement réduit demandé par l'OS → image fixe, pas de cycle
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const HOLD = 5200;   // durée d'affichage d'une image
  const FADE = 1350;   // durée du fondu au noir (≥ transition CSS)
  setInterval(() => {
    imgs[i].classList.remove('on');            // fondu vers le noir...
    i = (i + 1) % imgs.length;
    setTimeout(() => imgs[i].classList.add('on'), FADE);  // ...puis la suivante émerge
  }, HOLD + FADE);
})();

// Clips en boucle : ne tournent que quand ils sont visibles à l'écran
(function () {
  const loops = document.querySelectorAll('video.loop');
  if (!loops.length) return;
  const vio = new IntersectionObserver(entries => {
    entries.forEach(e => { e.isIntersecting ? e.target.play() : e.target.pause(); });
  }, { threshold: 0.35 });
  loops.forEach(v => vio.observe(v));
})();

// Lightbox universelle : un clic sur n'importe quelle image ou clip la met en grand
(function () {
  // retire d'éventuelles lightbox codées en dur dans le HTML (versions précédentes)
  document.querySelectorAll('.lightbox').forEach(el => el.remove());

  const media = document.querySelectorAll('main img, main video.loop');
  if (!media.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox hidden';
  overlay.innerHTML = '<button class="lb-close" aria-label="Fermer">×</button><div class="lb-stage"></div>';
  document.body.appendChild(overlay);
  const stage = overlay.querySelector('.lb-stage');

  const close = () => { overlay.classList.add('hidden'); stage.innerHTML = ''; };

  const openImage = (src, alt) => {
    stage.innerHTML = '';
    const img = document.createElement('img');
    img.src = src; img.alt = alt || '';
    stage.appendChild(img);
    overlay.classList.remove('hidden');
  };

  const openVideo = (src) => {
    stage.innerHTML = '';
    const v = document.createElement('video');
    v.src = src; v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
    stage.appendChild(v);
    overlay.classList.remove('hidden');
  };

  // toutes les images du contenu
  document.querySelectorAll('main img').forEach(img => {
    img.classList.add('zoomable');
    img.addEventListener('click', () => openImage(img.currentSrc || img.src, img.alt));
  });

  // les clips en boucle (muets) : plein écran avec le son
  document.querySelectorAll('main video.loop').forEach(v => {
    v.classList.add('zoomable');
    v.addEventListener('click', () => openVideo(v.currentSrc || v.src));
  });

  // fermeture : bouton ×, fond, ou Échap
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.classList.contains('lb-close')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// Sélecteur « More projects » : remplace la carte next unique par un carrousel
// de toutes les AUTRES fiches (miniature + titre), défilable. Source unique ici.
// AJOUTER UN PROJET = une ligne dans PROJECTS (cf. docs/GUIDE_POSTS.md).
(function () {
  const PROJECTS = [
    { slug: 'material-shader-study', title: 'Material & Shader Study', tag: 'Stellar Blade', thumb: 'as-shader.jpg' },
    { slug: 'mabos-monster-process', title: "Mabo's Monster",          tag: 'Creature',      thumb: 'as-monster.jpg' },
    { slug: 'sandbox-abandoned-school', title: 'Abandoned School',      tag: 'Environment',   thumb: 'as-school.jpg' },
    { slug: 'unit-industrial-warfare', title: 'Unit · Industrial Warfare', tag: 'RTS',        thumb: 'as-rts.jpg' },
    { slug: 'wip-and-search',       title: 'WIP and Search',            tag: 'R&D',           thumb: 'as-search.jpg' },
  ];

  const mount = document.querySelector('.next-nav');
  if (!mount) return;

  const here = location.pathname.split('/').pop().replace('.html', '');
  const idx = PROJECTS.findIndex(p => p.slug === here);
  if (idx === -1) return;

  // les autres projets, en commençant par le suivant (continuité de lecture)
  const others = [];
  for (let k = 1; k < PROJECTS.length; k++) others.push(PROJECTS[(idx + k) % PROJECTS.length]);

  const section = document.createElement('section');
  section.className = 'more';
  section.innerHTML =
    '<div class="more-head"><h2>More projects</h2>' +
    '<div class="more-nav">' +
    '<button class="more-arrow" data-dir="-1" aria-label="Précédent">‹</button>' +
    '<button class="more-arrow" data-dir="1" aria-label="Suivant">›</button>' +
    '</div></div>' +
    '<div class="more-track">' +
    others.map(p =>
      `<a class="more-card" href="${p.slug}.html" style="background-image:url('../assets/${p.thumb}')">` +
      `<span class="mc-tag">${p.tag}</span>` +
      `<span class="mc-title">${p.title}</span></a>`
    ).join('') +
    '</div>';

  mount.replaceWith(section);

  // flèches : défile d'une carte ; masquées si tout tient déjà à l'écran
  const track = section.querySelector('.more-track');
  const nav = section.querySelector('.more-nav');
  const step = () => {
    const card = track.querySelector('.more-card');
    return card ? card.offsetWidth + 20 : 300;
  };
  section.querySelectorAll('.more-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      track.scrollBy({ left: (+btn.dataset.dir) * step(), behavior: 'smooth' });
    });
  });
  const syncNav = () => { nav.style.visibility = track.scrollWidth > track.clientWidth + 4 ? 'visible' : 'hidden'; };
  syncNav();
  window.addEventListener('resize', syncNav);
})();
