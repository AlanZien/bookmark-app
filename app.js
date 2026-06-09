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

const CATEGORIE_DEFAUT = 'Sans catégorie';

/* --- Rendu --- */

function afficherFavoris(favoris) {
  const conteneur = document.getElementById('liste-favoris');
  const msgVide = document.getElementById('liste-vide');

  conteneur.innerHTML = '';

  if (favoris.length === 0) {
    msgVide.textContent = 'Aucun favori enregistré.';
    msgVide.hidden = false;
    return;
  }

  msgVide.hidden = true;

  /* Regrouper par catégorie en conservant l'ordre d'insertion */
  const groupes = {};
  favoris.forEach((favori, index) => {
    const cle = favori.categorie || CATEGORIE_DEFAUT;
    if (!groupes[cle]) groupes[cle] = [];
    groupes[cle].push({ favori, index });
  });

  /* Trier les catégories : nommées d'abord (ordre alpha), "Sans catégorie" en dernier */
  const categories = Object.keys(groupes).sort((a, b) => {
    if (a === CATEGORIE_DEFAUT) return 1;
    if (b === CATEGORIE_DEFAUT) return -1;
    return a.localeCompare(b, 'fr');
  });

  categories.forEach((categorie) => {
    const section = document.createElement('section');
    section.className = 'groupe-categorie';

    const titre = document.createElement('h2');
    titre.className = 'groupe-categorie-titre';
    titre.textContent = categorie;
    section.appendChild(titre);

    const ul = document.createElement('ul');
    ul.className = 'groupe-liste';

    groupes[categorie].forEach(({ favori, index }) => {
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

      ul.appendChild(li);
    });

    section.appendChild(ul);
    conteneur.appendChild(section);
  });

  /* Mettre à jour le datalist pour l'autocomplétion des catégories */
  const datalist = document.getElementById('categories-existantes');
  datalist.innerHTML = categories
    .filter(c => c !== CATEGORIE_DEFAUT)
    .map(c => `<option value="${echapper(c)}">`)
    .join('');
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
  const champCategorie = document.getElementById('categorie');
  const zoneErreur = document.getElementById('erreur');
  const champRecherche = document.getElementById('recherche');

  let favoris = chargerFavoris();

  function filtrerEtAfficher() {
    const terme = champRecherche.value.trim().toLowerCase();
    if (!terme) {
      afficherFavoris(favoris);
      return;
    }
    const resultats = favoris.filter(f =>
      f.titre.toLowerCase().includes(terme) ||
      f.url.toLowerCase().includes(terme)
    );
    if (resultats.length === 0) {
      const conteneur = document.getElementById('liste-favoris');
      const msgVide = document.getElementById('liste-vide');
      conteneur.innerHTML = '';
      msgVide.textContent = `Aucun résultat pour « ${terme} ».`;
      msgVide.hidden = false;
      return;
    }
    afficherFavoris(resultats);
  }

  filtrerEtAfficher();

  champRecherche.addEventListener('input', filtrerEtAfficher);

  /* Ajout d'un favori */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const titre = champTitre.value;
    const url = champUrl.value;
    const categorie = champCategorie.value.trim();
    const erreur = validerChamps(titre, url);

    if (erreur) {
      zoneErreur.textContent = erreur;
      zoneErreur.hidden = false;
      return;
    }

    zoneErreur.hidden = true;

    favoris.push({ titre: titre.trim(), url: url.trim(), categorie });
    sauvegarderFavoris(favoris);
    champRecherche.value = '';
    filtrerEtAfficher();

    form.reset();
    champTitre.focus();
  });

  /* Suppression via délégation d'événement sur le conteneur */
  const conteneur = document.getElementById('liste-favoris');
  conteneur.addEventListener('click', (e) => {
    const bouton = e.target.closest('.btn-supprimer');
    if (!bouton) return;

    const li = bouton.closest('.favori');
    const index = parseInt(li.dataset.index, 10);

    favoris.splice(index, 1);
    sauvegarderFavoris(favoris);
    filtrerEtAfficher();
  });
})();
