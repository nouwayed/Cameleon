# 🍏 Publier Mission Caméléon sur l'App Store

Le projet iOS est déjà prêt dans le dossier `ios/`. Il est fabriqué avec **Capacitor** : le jeu web est embarqué dans une vraie application iPhone, avec en plus :

- **de vraies vibrations** sur iPhone (bips du minuteur et alarme de fin) ;
- **une notification « ⏰ Temps écoulé ! »** à la fin des 60 s, même si le téléphone posé face cachée s'est verrouillé ;
- **le son même en mode silencieux**, sans couper la musique en cours ;
- **une police intégrée** : l'application fonctionne sans internet et ne contacte aucun service extérieur ;
- **des missions inventées à partir d'une photo de la pièce**, avec une reconnaissance d'objets qui tourne sur le téléphone (la photo n'est jamais envoyée).

---

## 1. Ce qu'il te faut

| Quoi | Où |
| --- | --- |
| Un Mac avec **Xcode** (gratuit) | Mac App Store |
| **Node.js** (version 20 ou plus) | https://nodejs.org |
| Un compte **Apple Developer** (99 € / an) | https://developer.apple.com/programs/ |
| Un iPhone pour tester (conseillé) | — |

## 2. Préparer le projet sur le Mac

```bash
git clone https://github.com/nouwayed/Cameleon.git
cd Cameleon
npm install
npm run ios
```

`npm run ios` compile le style, prépare le dossier `www/`, le copie dans le projet iOS et ouvre Xcode. **Relance cette commande après chaque modification du jeu.**

> Le premier lancement d'Xcode télécharge les modules Capacitor (Swift Package Manager). Attends que la barre de progression en haut d'Xcode ait fini.

## 3. Régler le projet dans Xcode

1. Dans la colonne de gauche, clique sur **App** (l'icône bleue tout en haut), puis la cible **App**.
2. Onglet **Signing & Capabilities** :
   - coche **Automatically manage signing** ;
   - dans **Team**, choisis ton compte Apple Developer ;
   - **Bundle Identifier** : `com.nouwayed.missioncameleon` est déjà rempli. Tu peux le changer, mais **plus jamais après la première publication**.
3. Onglet **General** : vérifie **Version** `1.0` et **Build** `1`. À chaque nouvel envoi à Apple, augmente le **Build** (2, 3, …).

L'icône, l'écran de démarrage, le nom affiché (« Mission Caméléon »), l'orientation portrait et la langue française sont déjà réglés.

## 4. Tester sur ton iPhone

1. Branche l'iPhone en USB et choisis-le en haut d'Xcode.
2. Clique sur ▶️ (ou `Cmd + R`).
3. La première fois, sur l'iPhone : **Réglages → Général → VPN et gestion de l'appareil** → fais confiance à ton compte développeur. Il faut aussi activer le **Mode développeur** (Réglages → Confidentialité et sécurité).

À vérifier pendant le test :
- [ ] L'application demande l'autorisation des notifications au lancement de la partie.
- [ ] Les bips s'entendent **même avec le bouton silencieux activé**.
- [ ] Le téléphone vibre aux bips et à la fin.
- [ ] Mission lancée, **verrouille le téléphone** : au bout de 60 s, la notification « Temps écoulé » arrive.
- [ ] En rouvrant l'application, l'écran « Détectives, revenez dans la pièce ! » est affiché.
- [ ] Mode **Photo de la pièce** : l'appli demande l'accès à l'appareil photo, repère des objets (chaise, canapé, plante…) et propose une mission qui les utilise.

## 5. Créer la fiche sur App Store Connect

Sur https://appstoreconnect.apple.com → **Apps** → **+** → **Nouvelle app** :

| Champ | Valeur |
| --- | --- |
| Plateforme | iOS |
| Nom | Mission Caméléon |
| Langue principale | Français |
| Identifiant de lot | `com.nouwayed.missioncameleon` |
| SKU | `mission-cameleon` |

### Textes prêts à copier

**Sous-titre** (30 caractères max) :
```
Le jeu de société sans écran
```

**Texte promotionnel** :
```
Le téléphone donne les ordres, puis on le pose : toute la famille joue pour de vrai dans la maison !
```

**Description** :
```
Mission Caméléon, c'est le jeu de société où le téléphone ne sert qu'à donner les ordres… puis on le pose et on joue pour de vrai, en famille, dans la maison !

COMMENT ON JOUE ?
• Le téléphone choisit au hasard le Caméléon de la manche.
• Les autres joueurs, les Détectives, sortent de la pièce et ferment les yeux.
• Le Caméléon découvre sa mission secrète : inverser deux chaises, cacher une télécommande sous un coussin, mettre une chaussette sur une poignée de porte…
• Il pose le téléphone face cachée et a 60 secondes pour modifier la pièce.
• Les Détectives reviennent et cherchent ce qui a changé !
• Trouvé ? Point pour le Détective. Sinon, le Caméléon a été trop fort !

POURQUOI LES PARENTS L'AIMENT
• Moins de temps d'écran : le téléphone reste face cachée pendant que l'on joue.
• On bouge, on observe, on rit ensemble.
• Dès 2 joueurs, jusqu'à 12.
• Des boutons géants, faciles pour les enfants.
• Chacun devient Caméléon à tour de rôle.

RESPECTUEUX DE VOTRE FAMILLE
• Aucun compte, aucune publicité, aucun achat intégré.
• Aucune donnée collectée : les prénoms et les scores restent sur votre téléphone.
• Fonctionne sans internet.
```

**Mots-clés** (100 caractères max, séparés par des virgules) :
```
famille,enfants,jeu de société,cache-cache,observation,sans écran,parents,maison,soirée,détective
```

**Catégorie** : Jeux → Famille (secondaire : Jeux → Société).

### Liens obligatoires

- **URL de la politique de confidentialité** : la page `confidentialite.html` est fournie. Une fois le site en ligne (GitHub Pages par exemple), l'adresse sera `https://nouwayed.github.io/Cameleon/confidentialite.html`.
  ⚠️ **Avant de publier, remplace `[adresse e-mail de contact]` dans `confidentialite.html` par ton adresse.**
- **URL d'assistance** : la même page, ou la page du dépôt GitHub.

### Confidentialité de l'app (« étiquette de confidentialité »)

Réponds : **« Non, nous ne collectons pas de données à partir de cette app »**. C'est exact : tout reste sur l'appareil, y compris les photos de la pièce, analysées sur le téléphone puis oubliées.

### Classification par âge

Réponds **« Aucun »** à toutes les questions (pas de violence, pas de contenu sensible, pas de navigateur web, pas de discussion entre utilisateurs). Résultat attendu : **4+**.

> **Catégorie « Enfants » (Kids) : à toi de choisir.** Elle rend l'app plus visible auprès des familles mais impose des règles strictes. L'app les respecte déjà (pas de pub, pas de statistiques, aucun lien externe), mais la vérification Apple y est plus exigeante. Sans elle, la note 4+ suffit pour que l'app soit tout public.

### Captures d'écran

Six captures au format **iPhone 6,9 pouces (1320 × 2868)** sont prêtes dans `store/screenshots/`. Glisse-les dans l'ordre dans la section **iPhone 6,9"**. Comme l'app n'est disponible que sur iPhone, aucune capture iPad n'est demandée.

Tu peux aussi faire tes propres captures dans le **Simulateur iPhone 16 Pro Max** d'Xcode (`Cmd + S` dans le simulateur).

### Notes pour l'équipe de vérification Apple

Dans **Informations pour la vérification de l'app → Notes**, colle :
```
Mission Caméléon est un jeu de société familial joué dans la vraie vie. L'application sert uniquement à désigner un joueur (le Caméléon), lui donner une mission secrète et chronométrer 60 secondes ; les joueurs jouent ensuite physiquement dans la pièce.

Pour tester : ajoutez 2 prénoms, touchez « Lancer la partie », puis « Découvrir ma mission secrète ». Le bouton « J'ai fini avant la fin » permet de passer le minuteur.

Mode « Photo de la pièce » (choix « Quelles missions ? » sur le premier écran) : l'appareil photo sert à repérer les objets de la pièce, entièrement sur l'appareil (TensorFlow.js), pour inventer une mission. Aucune photo n'est envoyée ni enregistrée.

Fonctions natives utilisées : appareil photo, notification locale à la fin du minuteur (le téléphone est posé face cachée et peut se verrouiller), retour haptique, son en mode silencieux. Aucun compte, aucune donnée collectée, fonctionne hors ligne.
```
Aucun compte de démonstration n'est nécessaire.

## 6. Envoyer l'application à Apple

1. Dans Xcode, choisis **Any iOS Device (arm64)** en haut (à la place de ton iPhone).
2. Menu **Product → Archive**.
3. La fenêtre **Organizer** s'ouvre : **Distribute App → App Store Connect → Upload**.
4. Après 10 à 30 minutes, le build apparaît dans App Store Connect (section **TestFlight**, puis dans la fiche de la version).
5. Dans la fiche de la version, sélectionne ce build, puis **Ajouter pour vérification → Soumettre**.

La réponse d'Apple arrive en général en 1 à 3 jours.

> **Astuce : TestFlight.** Avant de publier, tu peux faire tester l'app à ta famille avec l'application TestFlight : App Store Connect → TestFlight → ajoute leurs adresses e-mail.

## 7. Si Apple refuse

- **Règle 4.2 (fonctionnalité minimale, « simple site web »)** : réponds dans le Resolution Center en expliquant que l'app utilise des fonctions natives (notifications locales programmées pour un téléphone posé face cachée, retour haptique, son en mode silencieux, fonctionnement hors ligne) et que c'est un outil de jeu physique conçu pour réduire le temps d'écran.
- **Règle 5.1.1 (confidentialité)** : vérifie que l'URL de la politique de confidentialité fonctionne et contient bien une adresse de contact.

## Mettre à jour l'application plus tard

1. Modifie le jeu (`app.js`, `index.html`…).
2. `npm run ios`.
3. Dans Xcode, augmente **Version** (ex. `1.1`) et/ou **Build**.
4. **Product → Archive** → envoi, puis nouvelle version dans App Store Connect.
