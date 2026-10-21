'use strict';

/* =========================================================
   Missions photo : l'appareil repère les objets de la pièce (sur le téléphone,
   sans internet) puis invente une mission avec eux.
   Détection : TensorFlow.js + COCO-SSD, chargés seulement à la première photo.
   ========================================================= */

(() => {
  const VENDOR = 'vendor/';
  const MAX_SIDE = 640;
  const MIN_SCORE = 0.4;

  // g : genre ; small : un enfant peut le déplacer ; surface : on peut poser quelque chose dessus ;
  // hide : on peut cacher quelque chose derrière ou dessous. Les objets fragiles, coupants,
  // électriques ou vivants sont ignorés ou seulement utilisés comme repère.
  const CATALOG = {
    chair: { name: 'chaise', plural: 'chaises', g: 'f', emoji: '🪑', surface: true, hide: true,
      actions: ['Tourne {un} dans l\'autre sens.', 'Recule {un} d\'un grand pas.'],
      two: 'Inverse la place de deux chaises.' },
    couch: { name: 'canapé', g: 'm', emoji: '🛋️', surface: true, hide: true,
      actions: ['Retourne un coussin {de}.', 'Cache un petit objet sous un coussin {de}.', 'Échange la place de deux coussins {de}.'] },
    bed: { name: 'lit', g: 'm', emoji: '🛏️', surface: true, hide: true,
      actions: ['Change la place de l\'oreiller sur {le}.', 'Replie un coin de la couverture {de}.', 'Cache un doudou sous la couverture {de}.'] },
    'dining table': { name: 'table', g: 'f', emoji: '🍽️', surface: true, hide: true,
      actions: ['Déplace un objet posé sur {le}.', 'Ajoute un petit objet sur {le}.', 'Recule une chaise {de}.'] },
    tv: { name: 'télé', g: 'f', emoji: '📺',
      actions: ['Pose un petit objet devant {le}.', 'Cache la télécommande près {de}.'] },
    laptop: { name: 'ordinateur', g: 'm', emoji: '💻',
      actions: ['Pose un crayon à côté {de}.'] },
    'potted plant': { name: 'plante', g: 'f', emoji: '🪴', hide: true,
      actions: ['Tourne {le} d\'un demi-tour.', 'Pose un doudou au pied {de}.'] },
    vase: { name: 'vase', g: 'm', emoji: '🏺',
      actions: ['Pose un petit objet à côté {de}.'] },
    clock: { name: 'horloge', g: 'f', emoji: '🕰️',
      actions: ['Pose un petit objet sous {le}.'] },
    refrigerator: { name: 'frigo', g: 'm', emoji: '🧊',
      actions: ['Change un aimant de place sur {le}.', 'Pose un petit objet sur le dessus {de}.'] },
    bench: { name: 'banc', g: 'm', emoji: '🪑', surface: true, hide: true,
      actions: ['Pose un petit objet sur {le}.'] },
    book: { name: 'livre', plural: 'livres', g: 'm', emoji: '📚', small: true,
      actions: ['Retourne {un} à l\'envers.', 'Ouvre {un} et laisse-le ouvert.'],
      two: 'Échange la place de deux livres.' },
    'teddy bear': { name: 'peluche', g: 'f', emoji: '🧸', small: true,
      actions: ['Tourne {le} face au mur.', 'Mets {le} la tête en bas.', 'Change {le} de place.'] },
    remote: { name: 'télécommande', g: 'f', emoji: '🎛️', small: true,
      actions: ['Cache {le} sous un coussin.', 'Retourne {le}.'] },
    mouse: { name: 'souris', g: 'f', emoji: '🖱️', small: true,
      actions: ['Retourne {le} à l\'envers.'] },
    cup: { name: 'tasse', g: 'f', emoji: '☕', small: true,
      actions: ['Change {le} de place.', 'Tourne l\'anse {de} de l\'autre côté.'] },
    bottle: { name: 'bouteille', g: 'f', emoji: '🥤', small: true,
      actions: ['Change {le} de place.'] },
    bowl: { name: 'bol', g: 'm', emoji: '🥣', small: true,
      actions: ['Retourne {le} à l\'envers.', 'Change {le} de place.'] },
    spoon: { name: 'cuillère', g: 'f', emoji: '🥄', small: true,
      actions: ['Pose {le} dans un endroit bizarre.'] },
    banana: { name: 'banane', g: 'f', emoji: '🍌', small: true,
      actions: ['Cache {le}.', 'Change {le} de place.'] },
    apple: { name: 'pomme', g: 'f', emoji: '🍎', small: true,
      actions: ['Cache {le}.', 'Change {le} de place.'] },
    orange: { name: 'orange', g: 'f', emoji: '🍊', small: true,
      actions: ['Cache {le}.', 'Change {le} de place.'] },
    'sports ball': { name: 'ballon', g: 'm', emoji: '⚽', small: true,
      actions: ['Cache {le}.', 'Change {le} de place.'] },
    backpack: { name: 'sac à dos', g: 'm', emoji: '🎒', small: true,
      actions: ['Ouvre la fermeture {de}.', 'Retourne {le} dans l\'autre sens.'] },
    handbag: { name: 'sac', g: 'm', emoji: '👜', small: true,
      actions: ['Change {le} de place.', 'Ouvre {le}.'] },
    umbrella: { name: 'parapluie', g: 'm', emoji: '☂️', small: true,
      actions: ['Change {le} de place.'] },
    suitcase: { name: 'valise', g: 'f', emoji: '🧳', hide: true,
      actions: ['Tourne {le} dans l\'autre sens.'] },
    frisbee: { name: 'frisbee', g: 'm', emoji: '🥏', small: true, actions: ['Cache {le}.'] },
    'baseball glove': { name: 'gant', g: 'm', emoji: '🧤', small: true, actions: ['Change {le} de place.'] },
    tie: { name: 'cravate', g: 'f', emoji: '👔', small: true, actions: ['Accroche {le} à une poignée de porte.'] },
  };

  /* ---------- Petite grammaire française ---------- */

  const elides = (o) => /^[aeiouyhéèêâîô]/i.test(o.name);
  const forms = (o) => ({
    le: elides(o) ? `l'${o.name}` : `${o.g === 'f' ? 'la' : 'le'} ${o.name}`,
    un: `${o.g === 'f' ? 'une' : 'un'} ${o.name}`,
    de: elides(o) ? `de l'${o.name}` : `${o.g === 'f' ? 'de la' : 'du'} ${o.name}`,
  });
  const fill = (tpl, o) => {
    const f = forms(o);
    return tpl.replace(/\{(le|un|de)\}/g, (_, k) => f[k]);
  };
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Génération des missions ---------- */

  // room.objects : [{ cls, count }]
  function missionsFor(room) {
    const found = room.objects.map(({ cls, count }) => ({ ...CATALOG[cls], cls, count })).filter((o) => o.name);
    const list = [];
    for (const o of found) {
      for (const tpl of o.actions) list.push({ emoji: o.emoji, text: capitalize(fill(tpl, o)) });
      if (o.two && o.count >= 2) list.push({ emoji: o.emoji, text: o.two });
    }
    // Missions qui combinent deux objets repérés : un petit objet et un repère
    const smalls = found.filter((o) => o.small);
    const places = found.filter((o) => !o.small || o.surface || o.hide);
    for (const m of smalls) {
      for (const p of places) {
        if (p.cls === m.cls) continue;
        const M = forms(m);
        const P = forms(p);
        if (p.surface) list.push({ emoji: m.emoji, text: capitalize(`Pose ${M.le} sur ${P.le}.`) });
        if (p.hide) list.push({ emoji: m.emoji, text: capitalize(`Cache ${M.le} derrière ${P.le}.`) });
        list.push({ emoji: m.emoji, text: capitalize(`Mets ${M.le} juste à côté ${P.de}.`) });
      }
    }
    return list;
  }

  function generateMission(room, usedTexts = []) {
    const all = missionsFor(room);
    if (!all.length) return null;
    const fresh = all.filter((m) => !usedTexts.includes(m.text));
    const pool = fresh.length ? fresh : all;
    return { ...pool[Math.floor(Math.random() * pool.length)], fromPhoto: true };
  }

  function describe(cls) {
    const o = CATALOG[cls];
    return o ? { emoji: o.emoji, name: o.name } : null;
  }

  /* ---------- Détection sur le téléphone ---------- */

  let modelPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Chargement impossible : ${src}`));
      document.head.appendChild(s);
    });
  }

  function loadModel() {
    if (!modelPromise) {
      modelPromise = (async () => {
        if (!window.tf) await loadScript(VENDOR + 'tf.min.js');
        if (!window.cocoSsd) await loadScript(VENDOR + 'coco-ssd.min.js');
        return window.cocoSsd.load({ base: 'lite_mobilenet_v2', modelUrl: VENDOR + 'coco-ssd/model.json' });
      })();
      modelPromise.catch(() => { modelPromise = null; });   // on pourra réessayer
    }
    return modelPromise;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Photo illisible'));
      img.src = url;
    });
  }

  // Renvoie les objets reconnus (sans la photo, qui n'est jamais enregistrée)
  // et les cadres à dessiner sur l'aperçu, en pourcentage de l'image.
  async function analyze(file) {
    const url = URL.createObjectURL(file);
    const [model, img] = await Promise.all([loadModel(), loadImage(url)]);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const detections = await model.detect(canvas, 30, MIN_SCORE);

    const counts = {};
    const boxes = [];
    for (const d of detections) {
      if (!CATALOG[d.class]) continue;
      counts[d.class] = (counts[d.class] || 0) + 1;
      const [x, y, w, h] = d.bbox;
      boxes.push({
        cls: d.class,
        left: (x / canvas.width) * 100,
        top: (y / canvas.height) * 100,
        width: (w / canvas.width) * 100,
        height: (h / canvas.height) * 100,
      });
    }
    const objects = Object.entries(counts).map(([cls, count]) => ({ cls, count }));
    return { objects, boxes, url, ratio: canvas.width / canvas.height };
  }

  window.RoomScan = { analyze, loadModel, generateMission, missionsFor, describe };
})();
