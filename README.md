# 🎮 EPI-Wordle

> **Clone moderne de Wordle développé pour l'EPI : Réseau local, chat en temps réel et design premium.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v22%2B-green.svg)
![Status](https://img.shields.io/badge/status-stable-success.svg)

---

## ✨ Fonctionnalités

### 🎯 Jeu & Gameplay
- **Immersion Totale** : Layout plein écran et animations ultra-rapides (0.15s) pour un ressenti "arcade".
- **Dictionnaire Riche** : Plus de 3100 mots français de 5 lettres soigneusement sélectionnés.
- **Mode Infini** : Rejouez autant que vous le souhaitez, sans limite journalière.
- **Sauvegarde Auto** : Votre progression est sauvegardée localement.

### 💬 Social & Communauté
- **Chat Global** : Discutez avec tous les joueurs du réseau en temps réel.
- **Classement Live** : Comparez vos meilleurs scores (% de victoires, série max).
- **Profil Joueur** : Statistiques détaillées de vos performances.

### 🛡️ Sécurité & Architecture
- **Anti-Triche Robuste** : Le mot secret ne quitte **jamais** le serveur. Validation stricte côté backend.
- **Authentification Forte** : Comptes sécurisés par JWT (JSON Web Tokens) et hachage de mots de passe bcrypt.
- **Rate Limiting** : Protection contre les abus (1000 requêtes/15min).

---

## 🚀 Démarrage Rapide

Le projet est conçu pour être "Zero Configuration".

### Windows (Recommandé)
Double-cliquez simplement sur **`start.bat`**.
> Le script s'occupe de tout : installation de Node.js, des dépendances, création de la base de données et génération des clés de sécurité.

### Manuel (Avancé)
```bash
# 1. Installation
npm install

# 2. Initialisation DB
npm run init-db

# 3. Démarrage
npm start
```
*Accès : http://localhost:3000 ou via l'IP locale affichée dans la console.*

---

## 🔒 Architecture de Sécurité 

Contrairement aux clones Wordle classiques qui envoient souvent le mot au client (visible dans les DevTools), EPI-Wordle utilise une architecture serveur autoritaire.

### Comment ça marche ?
1.  **Secret Serveur** : Le serveur choisit un mot et le garde en mémoire (associé à un `gameId`).
2.  **Validation Serveur** : Lorsqu'un joueur soumet un mot, le serveur calcule les couleurs (Vert/Jaune/Gris).
3.  **Réponse Sécurisée** : Le serveur ne renvoie *que* le résultat des couleurs. Le client ne reçoit le mot secret qu'en cas de victoire ou de défaite (Game Over).

### Mesures Supplémentaires
-   **JWT Secret Auto-généré** : À chaque démarrage via `start.bat`, une nouvelle clé de cryptage est générée si nécessaire.
-   **Sanitization** : Toutes les entrées (chat, pseudos) sont nettoyées pour éviter les injections XSS/SQL.

---

## 🛠️ Stack Technique

-   **Backend** : Node.js (v22+), Express
-   **Base de Données** : SQLite3 (Léger, fichier unique `database/wordle.db`)
-   **Frontend** : HTML5, CSS3 (Glassmorphism, Variables CSS), Vanilla JS (ES6+)
-   **Communication** : REST API, Long-polling (Chat)

---

## 📂 Structure du Projet

```text
EPI-Wordle/
├── start.bat              # ⚡ Lanceur tout-en-un
├── database/              # Fichiers SQLite
├── public/                # Frontend (HTML/CSS/JS)
│   ├── css/               # Styles & Animations
│   └── js/                # Logique Client (Game, Chat, API)
├── src/                   # Backend (Node.js)
│   ├── controllers/       # Logique métier
│   └── server.js          # Point d'entrée
└── scripts/               # Utilitaires (Import dico)
```

---

## ❓ Dépannage

**Port 3000 déjà utilisé ?**
Le serveur plantera. Changez le port via : `set PORT=3001 && npm start`.

**Problème de base de données ?**
Supprimez le dossier `node_modules` et le fichier `package-lock.json`, puis relancez `start.bat` pour une réparation complète.

---

## © Crédits

**EPI-Wordle** par **Brisbois Jordi**.
Développé pour l'EPI - 2026.
License MIT.
