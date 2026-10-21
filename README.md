# 🦎 Mission Caméléon

Jeu de société **dans la vraie vie** : le téléphone sert uniquement à donner les ordres, puis tout le monde joue à la maison, sans écran.

## Comment jouer

0. **Choisis ton mode de jeu** : 🎲 **Mode Classique** (missions surprises) ou 📸 **Mode Photo** (missions inventées à partir d'une photo de la pièce).
1. **Qui joue aujourd'hui ?** — ajoutez les prénoms (2 joueurs minimum).
2. Le téléphone tire au sort le **Caméléon** de la manche (chacun passe une fois avant qu'un joueur soit de nouveau tiré).
3. Le Caméléon appuie sur **« Découvrir ma mission secrète »** : pendant 5 s, les **Détectives** sortent de la pièce et ferment les yeux.
4. La mission s'affiche avec un compte à rebours de **60 s** (bip discret toutes les 15 s). Le Caméléon pose le téléphone face cachée et modifie un objet de la pièce.
5. À la fin, le téléphone sonne et vibre : les Détectives reviennent et cherchent ce qui a changé.
6. **Un détective a trouvé !** → point pour ce détective. **Temps écoulé** → point pour le Caméléon.
7. Tableau des scores, puis **Manche suivante**.
8. **Mode Photo** : le Caméléon photographie la pièce, l'appli repère les objets (chaise, canapé, plante, peluche, livre…) **directement sur le téléphone** et invente une mission avec eux. La photo n'est jamais envoyée ni enregistrée.
9. Au départ, on choisit **1, 2 ou 3 tours** (un tour = chacun est Caméléon une fois). Après la dernière manche, **écran du vainqueur** avec podium, puis **Rejouer**.

Les joueurs et les scores sont mémorisés sur l'appareil (localStorage) : aucun compte, aucune donnée envoyée.

## Lancer l'application

Aucun build n'est nécessaire pour jouer : il suffit de servir le dossier en HTTP (nécessaire pour le mode PWA / hors ligne).

```bash
python3 -m http.server 8080   # puis ouvrir http://localhost:8080
```

Sur téléphone, ouvrez l'adresse puis « Ajouter à l'écran d'accueil » pour l'installer comme une application. Après la première visite, le jeu fonctionne hors ligne.

## Application iPhone (App Store)

Le dossier `ios/` contient le projet Xcode prêt à publier (Capacitor), avec vibrations natives, notification de fin de minuteur et son en mode silencieux. Toutes les étapes, et les textes de la fiche App Store, sont dans **[APP_STORE.md](APP_STORE.md)**.

```bash
npm install
npm run ios   # prépare www/, synchronise le projet iOS et ouvre Xcode (sur Mac)
```

## Structure

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page unique, styles d'animation |
| `app.js` | Toute la logique : écrans, tirage du Caméléon, minuteur, sons (Web Audio), scores, banque de défis, fonctions natives iOS |
| `tailwind.css` | Tailwind CSS compilé (fonctionne hors ligne) |
| `photo.js` | Missions photo : catalogue d'objets en français, générateur de missions, reconnaissance d'objets |
| `vendor/` | TensorFlow.js et le modèle COCO-SSD (SSDLite MobileNet v2), chargés seulement en mode photo |
| `fonts/` | Police Baloo 2 embarquée (licence OFL) |
| `manifest.webmanifest`, `sw.js`, `icon*.png`, `icon.svg` | Installation PWA et cache hors ligne |
| `confidentialite.html` | Politique de confidentialité (exigée par Apple) |
| `capacitor.config.json`, `ios/`, `scripts/build-www.mjs` | Application iOS |
| `store/screenshots/` | Captures d'écran pour l'App Store |
| `resources/icon-1024.png` | Icône source 1024 × 1024 |

## Modifier le style

Les classes Tailwind sont utilisées directement dans `index.html` et `app.js`. Après avoir ajouté de nouvelles classes, recompilez la feuille de style :

```bash
npm install
npm run build:css
```

## Ajouter des objets pour les missions photo

Dans `photo.js`, le tableau `CATALOG` associe chaque objet reconnu (nom anglais du modèle COCO-SSD) à son nom français, son genre et ses missions. `{le}`, `{un}` et `{de}` sont remplacés par « la chaise », « une chaise », « de la chaise »… :

```js
'potted plant': { name: 'plante', g: 'f', emoji: '🪴', hide: true,
  actions: ['Tourne {le} d\'un demi-tour.'] },
```

## Ajouter des défis

Ajoutez une ligne dans le tableau `MISSIONS` en haut de `app.js` :

```js
{ emoji: '🧦', text: 'Mets une chaussette sur une poignée de porte.' },
```
