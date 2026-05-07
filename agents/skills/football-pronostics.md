<!-- SOURCE: ~/.claude/skills/football-pronostics/SKILL.md — DO NOT EDIT THIS COPY. Edit source then run `npm run sync-skills`. -->
---
name: football-pronostics
description: >
  Analyse complète et pronostic professionnel pour tout match de football. Utilise ce skill
  dès que l'utilisateur mentionne un match, une rencontre, un pronostic foot, une prédiction,
  "qui va gagner", "analyse ce match", des noms d'équipes ou de clubs de foot, une compétition
  (Ligue 1, Premier League, Champions League, Bundesliga, Serie A, Liga, Coupe du Monde, Euro,
  Nations League, etc.), ou demande un avis/analyse sur un match à venir ou passé.
  Couvre : état de forme, effectif, blessures, confrontations directes, enjeux, contexte,
  statistiques, cotes, Paris sportifs, météo, terrain, arbitre, tactique — analyse A à Z.
---

# ⚽ Skill : Pronostics Football — Analyse Complète A à Z

## Objectif
Produire une fiche d'analyse professionnelle, structurée et exhaustive pour tout match de football, comme le ferait un analyste sportif expert. L'analyse couvre TOUS les facteurs qui influencent le résultat d'un match.

---

## WORKFLOW D'ANALYSE

### ÉTAPE 1 — Collecte d'informations

Avant toute analyse, utilise **web_search** pour rechercher les informations les plus récentes :

```
Recherches à effectuer :
1. "[Équipe A] vs [Équipe B] [compétition] [date] pronostic analyse"
2. "[Équipe A] blessures absents effectif [mois/année]"
3. "[Équipe B] blessures absents effectif [mois/année]"
4. "[Équipe A] derniers résultats forme récente"
5. "[Équipe B] derniers résultats forme récente"
6. "confrontations directes [Équipe A] [Équipe B] head to head"
7. "classement [compétition] [saison]"
8. "cotes [Équipe A] [Équipe B] bookmakers"
```

Si l'utilisateur a fourni les équipes et la compétition → recherche immédiatement.
Si infos manquantes → demander le nom des équipes + compétition + date.

---

### ÉTAPE 2 — Structure de la Fiche d'Analyse

Produis la fiche COMPLÈTE avec TOUTES les sections suivantes :

---

## 📋 FICHE D'ANALYSE MATCH

```
╔══════════════════════════════════════════════════════════════╗
║  [ÉQUIPE A]  🆚  [ÉQUIPE B]                                  ║
║  📅 Date | 🏟️ Stade | 🏆 Compétition | ⏰ Heure              ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 1. 🏆 CONTEXTE & ENJEUX

Analyse **ce qui est en jeu** pour chaque équipe :

- **Position au classement** : rang, points, écart avec les adversaires directs
- **Objectifs de saison** : titre, qualification européenne, maintien, coupe
- **Enjeu spécifique du match** : match de la dernière chance ? Finale de fait ? Derby ? 
- **Pression psychologique** : équipe sous pression ou sereine ?
- **Calendrier environnant** : match avant/après important (Champions League, derby, finale) ?
- **Historique de la compétition** : palmarès des deux clubs cette saison

> ⚡ **Impact enjeux** : [Faible / Modéré / Élevé / Décisif] — expliquer qui est le plus concerné

---

### 2. 📈 FORME RÉCENTE (5 derniers matchs)

Pour **chaque équipe**, afficher sous forme de tableau :

| # | Date | Adversaire | Comp. | Score | Résultat | Buteurs | Xg |
|---|------|-----------|-------|-------|----------|---------|-----|
| 1 | ... | ... | ... | ... | V/N/D | ... | ... |
| 2 | ... | ... | ... | ... | V/N/D | ... | ... |
| 3 | ... | ... | ... | ... | ... | ... | ... |
| 4 | ... | ... | ... | ... | ... | ... | ... |
| 5 | ... | ... | ... | ... | ... | ... | ... |

**Série actuelle** : [ex. 3 victoires consécutives / série sans défaite]
**Buts marqués (moy/match)** : X.X | **Buts encaissés (moy/match)** : X.X
**Clean sheets** : X sur 5 | **BTTS** : X sur 5
**Forme domicile/extérieur** : préciser si le match est à domicile ou à l'extérieur

> 📊 **Indice de forme** : ⭐⭐⭐⭐☆ (sur 5 étoiles) — justification courte

---

### 3. 🏥 EFFECTIF — BLESSÉS / SUSPENDUS / ABSENTS

Section critique — toujours vérifier avec web_search.

**[ÉQUIPE A] — Indisponibles :**
| Joueur | Poste | Raison | Durée estimée | Importance |
|--------|-------|--------|---------------|------------|
| Nom | P | Blessure/Suspension | X semaines | ⭐⭐⭐ |

**[ÉQUIPE B] — Indisponibles :**
| Joueur | Poste | Raison | Durée estimée | Importance |
|--------|-------|--------|---------------|------------|

**Retours potentiels** : joueurs en phase de reprise
**Incertains** : joueurs à surveiller (décision de dernière minute)

> ⚠️ **Impact blessures** : [Mineur / Significatif / Majeur] — nommer les absences les plus importantes

---

### 4. 👥 COMPOSITION PROBABLE & TACTIQUE

**[ÉQUIPE A]**
- **Schéma tactique** : ex. 4-3-3 / 4-2-3-1 / 3-5-2
- **Onze probable** : [GK — DEF — MIL — ATT] avec noms
- **Style de jeu** : possession / contre-attaque / pressing haut / bloc bas
- **Points forts** : ex. transitions rapides, jeu aérien, coups de pied arrêtés
- **Points faibles** : ex. défense haute exposée aux longs ballons

**[ÉQUIPE B]**
- Idem

> 🎯 **Duel tactique clé** : [ex. Le pressing offensif de X vs la relance courte de Y]

---

### 5. ⚔️ CONFRONTATIONS DIRECTES (Head-to-Head)

```
[ÉQUIPE A] vs [ÉQUIPE B] — Historique
```

| Saison | Compétition | Score | Domicile |
|--------|-------------|-------|----------|
| 202X   | ...         | X-X   | ...      |

**Sur les N derniers matchs :**
- Victoires [A] : X | Nuls : X | Victoires [B] : X
- Buts moyens par match : X.X
- BTTS (les deux équipes marquent) : X fois sur N
- Plus de 2.5 buts : X fois sur N
- Tendance récente : qui domine la série ?

> 🔁 **Tendance H2H** : [Favorable à A / Équilibré / Favorable à B]

---

### 6. 🌍 FACTEURS EXTERNES

**Terrain & Stade :**
- Domicile ou extérieur ? Avantage/désavantage du terrain ?
- Stade : capacité, ambiance attendue (stade plein, tifo, pression public)
- Terrain : pelouse synthétique vs naturelle, état du terrain

**Météo prévue :**
- Température, précipitations, vent → impact sur le jeu ?

**Arbitrage :**
- Arbitre désigné (si connu) : profil (cartes, pénaltys, style)
- Historique arbitre avec ces équipes

**Voyage / Fatigue :**
- Match de milieu de semaine ? Déplacement long ?
- Rotation attendue ?

**Public / Atmosphère :**
- Derby ? Rivalité historique ? Match à huis clos ?

---

### 7. 📊 STATISTIQUES AVANCÉES (saison en cours)

Pour chaque équipe si disponible :

| Stat | [ÉQUIPE A] | [ÉQUIPE B] |
|------|-----------|-----------|
| Buts marqués total | | |
| Buts encaissés total | | |
| xG (expected goals) pour | | |
| xG (expected goals) contre | | |
| Possession moy. (%) | | |
| Tirs par match | | |
| Tirs cadrés par match | | |
| Clean sheets | | |
| Matchs BTTS | | |
| Matchs +2.5 buts | | |
| Corners par match | | |
| Cartons jaunes/match | | |

---

### 8. 💰 COTES & VALEUR (Value Betting)

| Issue | Cote Moy. Bookmakers | Probabilité implicite | Notre proba estimée |
|-------|---------------------|----------------------|---------------------|
| Victoire [A] | X.XX | XX% | XX% |
| Match nul | X.XX | XX% | XX% |
| Victoire [B] | X.XX | XX% | XX% |

**Marchés secondaires (si données disponibles) :**
- Both Teams to Score : Oui/Non + cotes
- Over/Under 2.5 buts : cotes
- Mi-temps / Fin de match : tendance
- Premier buteur : profils favoris

> 💡 **Value Bet détectée ?** : [Oui — sur X / Non] — expliquer le raisonnement

---

### 9. 🧠 ANALYSE SYNTHÈSE

Rédiger **3 à 5 paragraphes d'analyse narrative** :

1. **Contexte global** : présenter l'état des deux équipes au moment du match
2. **Facteur décisif** : quel élément sera probablement déterminant ?
3. **Scénario probable** : comment le match devrait-il se dérouler ?
4. **Risques & incertitudes** : ce qui pourrait invalider notre analyse
5. **Conclusion analytique** : synthèse argumentée du pronostic

---

### 10. 🎯 PRONOSTIC FINAL

```
┌─────────────────────────────────────────────────────┐
│  PRONOSTIC PRINCIPAL                                 │
│  ➤ [Victoire A / Match nul / Victoire B]            │
│  ➤ Score exact pressenti : X - X                    │
│  ➤ Confiance : [Faible / Modérée / Bonne / Élevée]  │
├─────────────────────────────────────────────────────┤
│  PARIS CONSEILLÉS                                    │
│  1️⃣  [Pari principal] — Cote : X.XX                 │
│  2️⃣  [Pari alternatif] — Cote : X.XX                │
│  3️⃣  [Pari safe/petit] — Cote : X.XX                │
├─────────────────────────────────────────────────────┤
│  ⚠️  ATTENTION / WILDCARD                           │
│  [Élément qui pourrait tout changer]                │
└─────────────────────────────────────────────────────┘
```

**Rappel :** Les paris sportifs comportent des risques. Ces analyses sont indicatives et ne constituent pas des conseils financiers. Jouer responsablement.

---

## RÈGLES DE QUALITÉ

1. **Toujours chercher les infos récentes** via web_search avant de rédiger
2. **Si une info est incertaine**, le signaler clairement avec ⚠️
3. **Ne pas inventer** de blessures, résultats ou cotes — s'appuyer sur les données réelles
4. **Contextualiser** chaque section : une stat sans contexte n'a pas de valeur
5. **Prendre position** : l'analyse doit aboutir à un pronostic clair et argumenté
6. **Adapter la longueur** : match majeur (Champions League, finale) → analyse ultra-détaillée ; match de coupe secondaire → analyse concise mais complète

---

## LECTURES COMPLÉMENTAIRES

→ Pour les statistiques avancées détaillées : voir `references/stats-avancees.md`
→ Pour les marchés de paris et value betting : voir `references/paris-sportifs.md`
→ Pour l'analyse tactique approfondie : voir `references/tactique.md`
