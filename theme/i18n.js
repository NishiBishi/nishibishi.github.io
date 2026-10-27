// i18n.js — le bilinguisme EN / FR du site. Chargé dans le <head> (avant tout rendu) : il pose la
// langue sur <html lang>, et theme.css (§1 BASE) masque alors l'exemplaire de l'autre langue.
// Pas de flash : le choix est appliqué avant que le <body> ne soit lu.
//
// Convention de contenu (docs/GUIDE_POSTS.md §8) — chaque texte visible existe en DEUX exemplaires
// côte à côte, même balise, EN d'abord :
//     <span lang="en">Next project</span><span lang="fr">Projet suivant</span>
// Les attributs portent leur version FR en data-fr-* (l'EN d'origine reste dans l'attribut) :
//     <img alt="Eve in the cabin" data-fr-alt="Eve dans la cabine">      <title data-fr="…">
// ⚠ L'attribut lang ne sert QU'À ça : un lang="en" posé dans un texte FR serait masqué en FR.
//
// Langue retenue : ?lang=fr|en dans l'adresse > choix mémorisé > langue du navigateur > EN.
// Le sélecteur EN / FR est injecté dans la nav : aucune page ne porte son markup.
// Styles : theme.css §2 NAV (.lang-switch).

(function () {
  const LANGS = ['en', 'fr'];
  const LS_KEY = 'nishi-lang';
  const ATTRS = ['alt', 'title', 'aria-label'];
  const root = document.documentElement;

  const store = {
    get() { try { return localStorage.getItem(LS_KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(LS_KEY, v); } catch (e) {} },
  };

  function initialLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) { store.set(q); return q; }   // un lien ?lang=fr vaut choix
    const saved = store.get();
    if (LANGS.includes(saved)) return saved;
    const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
    return nav.startsWith('fr') ? 'fr' : 'en';
  }

  // Attributs + titre de l'onglet. L'EN d'origine est mis de côté au premier passage (data-en-*).
  function applyAttrs(lang) {
    ATTRS.forEach(a => {
      document.querySelectorAll(`[data-fr-${a}]`).forEach(el => {
        if (!el.hasAttribute(`data-en-${a}`)) el.setAttribute(`data-en-${a}`, el.getAttribute(a) || '');
        el.setAttribute(a, el.getAttribute(`data-${lang}-${a}`));
      });
    });
    const t = document.querySelector('title');
    if (t && t.dataset.fr) {
      if (!t.dataset.en) t.dataset.en = t.textContent;
      document.title = t.dataset[lang];
    }
    document.querySelectorAll('.lang-switch button').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang));
    });
  }

  function setLang(lang) {
    root.lang = lang;
    store.set(lang);
    applyAttrs(lang);
    // un ?lang= resté dans l'adresse reprendrait la main au rechargement : on l'aligne
    try {
      const u = new URL(location.href);
      if (u.searchParams.has('lang')) { u.searchParams.set('lang', lang); history.replaceState(null, '', u); }
    } catch (e) {}
  }

  function mountSwitch() {
    const nav = document.querySelector('nav');
    if (!nav || nav.querySelector('.lang-switch')) return;
    const box = document.createElement('div');
    box.className = 'lang-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Language / Langue');
    box.setAttribute('data-i18n-same', '');   // libellé bilingue exprès (pour le vérificateur)
    box.innerHTML = LANGS
      .map(l => `<button type="button" data-set-lang="${l}">${l.toUpperCase()}</button>`)
      .join('<span class="ls-sep" aria-hidden="true">/</span>');
    // dernier enfant de la nav : à droite de Work · About · Contact (accueil) ou de « ← Back »
    // (posts) — placement et rangées mobiles : theme.css §2 et §12
    nav.appendChild(box);
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-set-lang]');
      if (b) setLang(b.dataset.setLang);
    });
  }

  const lang = initialLang();
  root.lang = lang;   // immédiat : le CSS masque la bonne moitié dès le premier rendu
  document.addEventListener('DOMContentLoaded', () => { mountSwitch(); applyAttrs(lang); });
})();
