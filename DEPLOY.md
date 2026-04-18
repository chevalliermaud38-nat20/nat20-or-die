# 🚀 Déploiement de Nat20 or Die

## Option 1: GitHub Pages (Gratuit et recommandé)

### Étape 1: Créer un repository GitHub
1. Va sur https://github.com et crée un nouveau repository nommé `nat20-or-die`
2. Choisis "Public" ou "Private" selon ta préférence

### Étape 2: Téléverser les fichiers
1. Copie tous les fichiers du projet dans le repository
2. Ou utilise GitHub Desktop pour synchroniser

### Étape 3: Activer GitHub Pages
1. Dans ton repository, va dans `Settings` > `Pages`
2. Sous "Build and deployment", choisis `Deploy from a branch`
3. Sélectionne `main` branch et `/ (root)`
4. Clique sur `Save`

### Étape 4: Accès
Ton application sera disponible à :
`https://[ton-username].github.io/nat20-or-die`

## Option 2: Netlify (Plus simple)

### Étape 1: Créer un compte
1. Va sur https://netlify.com et crée un compte gratuit

### Étape 2: Glisser-déposer
1. Fais un ZIP de tous les fichiers du projet
2. Glisse le ZIP sur la page d'accueil Netlify
3. Netlify déploie automatiquement

### Étape 3: Personnalisation
Tu auras une URL comme : `https://amazing-pasteur-123456.netlify.app`

## 📱 Installation sur les appareils

### Sur Mac
1. Ouvre l'URL dans Chrome
2. Clique sur l'icône "Installer" dans la barre d'adresse
3. L'application s'installe comme une app native

### Sur Android
1. Ouvre l'URL dans Chrome
2. Clique sur les 3 points > "Ajouter à l'écran d'accueil"
3. L'application apparaît sur ton écran d'accueil

### Sur iPad/Tablette
1. Ouvre l'URL dans Safari
2. Clique sur "Partager" > "Sur l'écran d'accueil"
3. L'application s'installe comme une app iOS

## 🔧 Synchronisation des données

### Actuellement: LocalStorage
- Les données sont sauvegardées localement sur chaque appareil
- **Pas de synchronisation automatique** entre Mac et tablette

### Pour synchroniser: 2 options

#### Option A: Firebase (Recommandé)
1. Crée un compte Firebase gratuit
2. Remplace les clés dans `app.js`
3. Les données se synchronisent automatiquement

#### Option B: Export/Import manuel
1. Utilise la fonction "Export" pour sauvegarder
2. Importe le fichier sur l'autre appareil

## 📁 Fichiers nécessaires

Ces fichiers doivent être uploadés sur ton hébergeur :
- `index.html` (page principale)
- `app.js` (logique JavaScript)
- `manifest.json` (configuration PWA)
- `sw.js` (service worker pour offline)
- `README.md` (documentation)

## 🎯 Résultat final

Une application web progressive (PWA) qui :
- Fonctionne sur Mac et Android
- S'installe comme une application native
- Fonctionne hors ligne
- Synchronise les données (si Firebase configuré)

## 🆘 Support

Si tu as besoin d'aide pour le déploiement :
1. Envoie-moi l'URL de ton déploiement
2. Je vérifierai que tout fonctionne correctement
