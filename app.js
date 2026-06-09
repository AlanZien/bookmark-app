/* ============================================================
   Gestionnaire de favoris — logique principale
   Persistance : localStorage (clé "favoris")
   ============================================================ */

const CLE_STOCKAGE = 'favoris';

/* --- Utilitaires localStorage --- */

function chargerFavoris() {
  try {
    return JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || [];
  } catch {
    return [];
  }
}

function sauvegarderFavoris(favoris) {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(favoris));
}

/* --- Construction de l'URL du favicon via Google --- */

function urlFavicon(siteUrl) {
  try {
    const origine = new URL(siteUrl).origin;
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(origine)}`;
  } catch {
    return '';
  }
}

/* --- Rendu --- */

function afficherFavoris(favoris) {
  const liste = document.getElementById('liste-favoris');
  const msgVide = document.getElementById('liste-vide');

  liste.innerHTML = '';

  if (favoris.length === 0) {
    msgVide.hidden = false;
    return;
  }

  msgVide.hidden = true;

  favoris.forEach((favori, index) => {
    const li = document.createElement('li');
    li.className = 'favori';
    li.dataset.index = index;

    const favicon = urlFavicon(favori.url);

    li.innerHTML = `
      ${favicon ? `<img class="favori-favicon" src="${favicon}" alt="" loading="lazy">` : ''}
      <div class="favori-lien">
        <a href="${echapper(favori.url)}" target="_blank" rel="noopener noreferrer">${echapper(favori.titre)}</a>
        <span class="favori-url">${echapper(favori.url)}</span>
      </div>
      <button class="btn-supprimer" title="Supprimer" aria-label="Supprimer ${echapper(favori.titre)}">✕</button>
    `;

    liste.appendChild(li);
  });
}

/* Échappe les caractères HTML pour éviter les injections XSS */
function echapper(texte) {
  const div = document.createElement('div');
  div.textContent = texte;
  return div.innerHTML;
}

/* --- Validation du formulaire --- */

function validerChamps(titre, url) {
  if (!titre.trim()) return 'Le titre est requis.';
  if (!url.trim()) return "L'URL est requise.";

  try {
    const parsed = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return "L'URL doit commencer par http:// ou https://.";
    }
  } catch {
    return "L'URL n'est pas valide.";
  }

  return null;
}

/* --- Initialisation et événements --- */

(function init() {
  const form = document.getElementById('form-ajout');
  const champTitre = document.getElementById('titre');
  const champUrl = document.getElementById('url');
  const zoneErreur = document.getElementById('erreur');
  const liste = document.getElementById('liste-favoris');

  let favoris = chargerFavoris();
  afficherFavoris(favoris);

  /* Ajout d'un favori */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const titre = champTitre.value;
    const url = champUrl.value;
    const erreur = validerChamps(titre, url);

    if (erreur) {
      zoneErreur.textContent = erreur;
      zoneErreur.hidden = false;
      return;
    }

    zoneErreur.hidden = true;

    favoris.push({ titre: titre.trim(), url: url.trim() });
    sauvegarderFavoris(favoris);
    afficherFavoris(favoris);

    form.reset();
    champTitre.focus();
  });

  /* Suppression via délégation d'événement sur la liste */
  liste.addEventListener('click', (e) => {
    const bouton = e.target.closest('.btn-supprimer');
    if (!bouton) return;

    const li = bouton.closest('.favori');
    const index = parseInt(li.dataset.index, 10);

    favoris.splice(index, 1);
    sauvegarderFavoris(favoris);
    afficherFavoris(favoris);
  });
})();
