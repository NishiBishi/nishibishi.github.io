// devpanel.js — le panneau ⚙ : réglage LIVE des tokens de la DA (tokens.css), sur
// n'importe quelle page. Outil d'auteur : en ligne le bouton est masqué (touche ² / `
// reste active). Réglages auto-sauvés (localStorage) → « Copier CSS » → coller le bloc
// dans theme/tokens.css pour les rendre définitifs. Le DOM du panneau est injecté ici :
// aucune page n'a de markup à porter. Styles : section DEV PANEL de theme.css.

(function () {
  // Chaque entrée pilote une variable CSS de tokens.css. Pour exposer un nouveau
  // réglage : ajouter la variable dans tokens.css + une ligne ici. C'est tout.
  const DEV_VARS = [
    { group: 'Couleurs', cssVar: '--accent',   label: 'Accent néon',   type: 'color' },
    { group: 'Couleurs', cssVar: '--accent-2', label: 'Accent chaud',  type: 'color' },
    { group: 'Couleurs', cssVar: '--bg',       label: 'Fond',          type: 'color' },
    { group: 'Couleurs', cssVar: '--bg-panel', label: 'Fond cartes',   type: 'color' },
    { group: 'Couleurs', cssVar: '--ink',      label: 'Texte',         type: 'color' },
    { group: 'Couleurs', cssVar: '--ink-dim',  label: 'Texte second.', type: 'color' },
    { group: 'Layout',   cssVar: '--card-r',   label: 'Rayon cartes',  type: 'range', min: 0,   max: 30,   step: 1,    unit: 'px' },
    { group: 'Layout',   cssVar: '--maxw',     label: 'Largeur max',   type: 'range', min: 900, max: 1400, step: 10,   unit: 'px' },
    { group: 'Typo',     cssVar: '--h1-track', label: 'Espacement H1', type: 'range', min: 0,   max: 0.3,  step: 0.01, unit: 'em' },
    { group: 'Effets',   cssVar: '--grid-op',  label: 'Damier fond',   type: 'range', min: 0,   max: 0.1,  step: 0.005, unit: '' },
  ];

  // --- DOM du panneau (injecté, aucune page ne porte ce markup) ---------------
  const toggleBtn = document.createElement('div');
  toggleBtn.id = 'devToggle'; toggleBtn.title = 'Dev panel (² ou `)'; toggleBtn.textContent = '⚙';
  const panel = document.createElement('aside');
  panel.id = 'devPanel';
  panel.innerHTML =
    '<div class="dp-head">DEV PANEL <button id="dpClose" title="Fermer">×</button></div>' +
    '<div id="dpBody"></div>' +
    '<div class="dp-foot">' +
    '<div class="dp-btns"><button id="dpCopy">Copier CSS</button><button id="dpReset">Reset</button></div>' +
    '<div class="dp-hint">² ou ` : afficher / masquer · réglages auto-sauvés</div>' +
    '</div>';
  document.body.append(toggleBtn, panel);

  const rootEl  = document.documentElement;
  const LS_KEY  = 'nishi-dev-vars';
  const body    = panel.querySelector('#dpBody');

  // Valeurs par défaut = ce qui est écrit dans tokens.css (lu avant tout override)
  DEV_VARS.forEach(v => { v.def = getComputedStyle(rootEl).getPropertyValue(v.cssVar).trim(); });

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) {}

  const current = v => saved[v.cssVar] !== undefined ? saved[v.cssVar] : v.def;
  const apply   = (v, val) => rootEl.style.setProperty(v.cssVar, val);
  const persist = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch (e) {} };

  // Applique les réglages sauvés au chargement
  DEV_VARS.forEach(v => { if (saved[v.cssVar] !== undefined) apply(v, saved[v.cssVar]); });

  // Construit les contrôles, groupés
  let lastGroup = null;
  DEV_VARS.forEach(v => {
    if (v.group !== lastGroup) {
      const g = document.createElement('div');
      g.className = 'dp-group'; g.textContent = v.group;
      body.appendChild(g); lastGroup = v.group;
    }
    const row = document.createElement('div');
    row.className = 'dp-row';
    const lbl = document.createElement('label');
    lbl.textContent = v.label;
    const input = document.createElement('input');
    const val = document.createElement('span');
    val.className = 'dp-val';

    if (v.type === 'color') {
      input.type = 'color';
      input.value = current(v);
      val.textContent = input.value;
      input.addEventListener('input', () => {
        apply(v, input.value); val.textContent = input.value;
        saved[v.cssVar] = input.value; persist();
      });
    } else {
      input.type = 'range';
      input.min = v.min; input.max = v.max; input.step = v.step;
      input.value = parseFloat(current(v));
      val.textContent = input.value + v.unit;
      input.addEventListener('input', () => {
        const out = input.value + v.unit;
        apply(v, out); val.textContent = out;
        saved[v.cssVar] = out; persist();
      });
    }
    v.input = input; v.readout = val;
    row.append(lbl, input, val);
    body.appendChild(row);
  });

  // Outil d'auteur : en ligne, le bouton ⚙ est masqué et rien ne s'ouvre tout seul.
  // La touche ² / ` continue de marcher partout.
  const IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (!IS_LOCAL) toggleBtn.style.display = 'none';

  // Ouvre le panneau à la toute première visite — en local ET sur l'accueil seulement
  // (sur les pages projet il ne s'impose pas, il se convoque au clavier)
  try {
    if (IS_LOCAL && document.getElementById('heroSlides') && !localStorage.getItem('nishi-dev-seen')) {
      panel.classList.add('open');
      localStorage.setItem('nishi-dev-seen', '1');
    }
  } catch (e) {}

  // Afficher / masquer : bouton ⚙, croix, touches ² ou `
  const toggle = () => panel.classList.toggle('open');
  toggleBtn.addEventListener('click', toggle);
  panel.querySelector('#dpClose').addEventListener('click', toggle);
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === '²' || e.key === '`') toggle();
  });

  // Copier CSS : le bloc :root prêt à coller dans theme/tokens.css
  panel.querySelector('#dpCopy').addEventListener('click', async () => {
    const lines = DEV_VARS.map(v => `  ${v.cssVar}: ${current(v)};`);
    const css = `:root {\n${lines.join('\n')}\n}`;
    const btn = panel.querySelector('#dpCopy');
    try {
      await navigator.clipboard.writeText(css);
      btn.textContent = 'Copié ✓';
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = css; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
      btn.textContent = 'Copié ✓';
    }
    setTimeout(() => { btn.textContent = 'Copier CSS'; }, 1500);
  });

  // Reset : retour aux valeurs de tokens.css
  panel.querySelector('#dpReset').addEventListener('click', () => {
    saved = {};
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    DEV_VARS.forEach(v => {
      rootEl.style.removeProperty(v.cssVar);
      const def = v.def;
      if (v.type === 'color') { v.input.value = def; v.readout.textContent = def; }
      else { v.input.value = parseFloat(def); v.readout.textContent = parseFloat(def) + v.unit; }
    });
  });
})();
