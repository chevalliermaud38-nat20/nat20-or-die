# Nat20 or Die - Gestionnaire de Campagnes D&D

Une application web progressive pour gérer vos campagnes Donjons & Dragons, accessible sur Mac et Android.

## 🎲 Fonctionnalités

### ✅ Implémentées (MVP)
- **Gestion des campagnes** : Créer, éditer, supprimer plusieurs campagnes
- **Monde** : Catégories personnalisées (religion, politique, histoire, etc.)
- **Scénario** : Actes et chapitres avec résumés
- **Schéma visuel** : Visualisation de la structure du scénario
- **Import CSV** : Importer des données pour monstres, objets, sorts

### 🚧 À venir
- Fiches de personnage (PJ/PNJ)
- Système de combat avec initiative
- Cartes interactives
- Bibliothèque de règles
- Liens entre les éléments

## 🚀 Démarrage rapide

1. Clonez ou téléchargez le projet
2. Ouvrez `index.html` dans votre navigateur
3. Commencez à créer votre première campagne !

## 🔧 Configuration

### Firebase (Optionnel)
Pour la synchronisation cloud, configurez vos clés Firebase dans `app.js` :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### Mode Local (Sans configuration)
L'application fonctionne entièrement en local avec `localStorage` si Firebase n'est pas configuré.

## 📱 Utilisation

### Sur Mac
- Utilisez Chrome, Firefox ou Safari
- Mode tablette recommandé (redimensionnez la fenêtre)

### Sur Android
- Ouvrez dans Chrome
- Ajoutez à l'écran d'accueil pour une expérience PWA

## 📊 Structure des données

### Campagne
```json
{
  "id": "unique-id",
  "name": "Nom de la campagne",
  "description": "Description",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "world": {
    "Religion": [
      {
        "name": "Nom du dieu",
        "description": "Description"
      }
    ]
  },
  "scenario": {
    "acts": [
      {
        "title": "Acte 1",
        "chapters": [
          {
            "title": "Chapitre 1",
            "summary": "Résumé"
          }
        ]
      }
    ]
  }
}
```

## 📤 Import CSV

Format attendu :
```csv
nom,description,type
Gobelin,Petite créature verte,Monstre
Potion de soin,Restaure 1d4 PV,Objet
```

## 🛠 Technologies

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Styling** : TailwindCSS
- **Icons** : Font Awesome
- **Database** : Firebase Firestore (optionnel)
- **Storage** : LocalStorage (fallback)

## 📝 Prochaines étapes

1. **Phase 2** : Fiches de personnage et PNJ
2. **Phase 3** : Système de combat
3. **Phase 4** : Cartes et lieux
4. **Phase 5** : Bibliothèque complète

## 🤝 Contribution

Ce projet est développé pour un usage personnel mais reste open source. N'hésitez pas à proposer des améliorations !

## 📞 Support

Pour toute question ou problème, contactez le développeur.

---

*Lancé avec ❤️ pour les passionnés de D&D*
