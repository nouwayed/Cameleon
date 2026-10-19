# 🦎 Mission Caméléon

Jeu de société **dans la vraie vie** : le téléphone sert uniquement à donner les ordres, puis tout le monde joue à la maison, sans écran.

## Comment jouer

1. **Qui joue aujourd'hui ?** — ajoutez les prénoms (2 joueurs minimum).
2. Le téléphone tire au sort le **Caméléon** de la manche (chacun passe une fois avant qu'un joueur soit de nouveau tiré).
3. Le Caméléon appuie sur **« Découvrir ma mission secrète »** : pendant 5 s, les **Détectives** sortent de la pièce et ferment les yeux.
4. La mission s'affiche avec un compte à rebours de **60 s** (bip discret toutes les 15 s). Le Caméléon pose le téléphone face cachée et modifie un objet de la pièce.
5. À la fin, le téléphone sonne et vibre : les Détectives reviennent et cherchent ce qui a changé.
6. **Un détective a trouvé !** → point pour ce détective. **Temps écoulé** → point pour le Caméléon.
7. Tableau des scores, puis **Manche suivante**.

Les joueurs et les scores sont mémorisés sur l'appareil (localStorage) : aucun compte, aucune donnée envoyée.

## Lancer l'application

Aucun build n'est nécessaire pour jouer : il suffit de servir le dossier en HTTP (nécessaire pour le mode PWA / hors ligne).

```bash
python3 -m http.server 8080   # puis ouvrir http://localhost:8080
```

Sur téléphone, ouvrez l'adresse puis « Ajouter à l'écran d'accueil » pour l'installer comme une application. Après la première visite, le jeu fonctionne hors ligne.

## Structure

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page unique, styles d'animation |
| `app.js` | Toute la logique : écrans, tirage du Caméléon, minuteur, sons (Web Audio), scores, banque de défis |
| `tailwind.css` | Tailwind CSS compilé (fonctionne hors ligne) |
| `manifest.webmanifest`, `sw.js`, `icon.svg` | Installation PWA et cache hors ligne |

## Modifier le style

Les classes Tailwind sont utilisées directement dans `index.html` et `app.js`. Après avoir ajouté de nouvelles classes, recompilez la feuille de style :

```bash
npm install
npm run build:css
```

## Ajouter des défis

Ajoutez une ligne dans le tableau `MISSIONS` en haut de `app.js` :

```js
{ emoji: '🧦', text: 'Mets une chaussette sur une poignée de porte.' },
```
