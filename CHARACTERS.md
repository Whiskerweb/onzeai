# Limova.ai — Character Design Specs

Specs de génération pour les **8 agents** Limova. À utiliser dans Gemini (Imagen 4, Nano Banana ou n'importe quel modèle qui sait gérer un fond chroma-key).

Chaque agent doit être livré sur **fond vert uni de chroma-key #00B140** pour détourage propre (Photoshop > Plage de couleurs, Remove.bg, ou ffmpeg `chromakey` filter).

---

## Direction artistique commune

| Item | Valeur |
|---|---|
| **Style global** | Hyperréalisme illustré stylisé — entre Pixar / Riot / portrait éditorial business (Forbes, Fast Company). Pas du photoréalisme pur, pas du cartoon plat. Caractère identifiable, lisible petit, premium. |
| **Trait** | Détails fins, subsurface scattering subtil, micro-imperfections (grain de peau, mèches qui dépassent), ombres douces sculptées |
| **Cadrage** | Plan poitrine (du milieu de la poitrine au sommet du crâne), légère contre-plongée (caméra à hauteur de menton) |
| **Pose** | 3/4 face, regard caméra (sauf Manue qui regarde un détail hors champ). Pas plat de face, pas de profil pur |
| **Format** | PNG, **2048 × 2560 px** (ratio 4:5), 300 DPI |
| **Fond** | **Vert chroma-key broadcast `#00B140`** (RGB 0, 177, 64). Uniforme, plat, sans gradient, sans grain, sans texture |
| **Ombre** | Cast shadow uniquement sur le buste. **Aucune ombre sur le fond.** Léger ground shadow flou OK |
| **Edge** | Préserver détails fins (mèches, barbe, bords vêtements). Pas de halo vert (spill suppression) |
| **Cohérence inter-agents** | Même éclairage de base (key light camera-left, fill camera-right), même focale apparente (~85mm), même rendu. On doit sentir que les 8 sont la même série |
| **Couleur signature commune** | **Orange Limova `#dc8e21`** glissé en détail subtil sur chaque agent (lacet, monture, bouton, doublure) |

### Prompt-helper systématique (boilerplate à coller)

```
[Description du perso] – chest-up portrait, slight low-angle, 3/4 facing camera,
85mm portrait lens depth-of-field, soft key light from camera-left,
illustrated hyperrealism style (mix of Pixar character render and editorial
business magazine portrait), high detail skin and clothing fabric, no logos
or trademarks visible, isolated subject on solid uniform chroma-key green
background #00B140, no gradient, no texture on background, sharp edges,
preserve fine hair detail, no green spill on subject, 2048x2560 px PNG
```

---

## 1. TOM — Téléphonie & relation client 📞

> *Le mec posé que tu veux entendre quand tu appelles à 18h59 un vendredi. Voix pro, sourire dans la voix.*

**Identité produit** · ID `tom` · Rôle : Téléphonie & relation client · Headline : *« Ne ratez plus aucun appel. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 30 ans |
| **Genre** | Masculin |
| **Origine visuelle** | Européen / Français du Sud-Ouest |
| **Peau** | Légèrement hâlée, lumineuse, ton chaud |
| **Cheveux** | Châtain clair, courts, coupe naturelle un peu désordonnée sur le dessus |
| **Visage** | Mâchoire douce, sourire facile, fossette légère côté gauche |
| **Yeux** | Vert noisette, regard chaleureux et accueillant directement caméra |
| **Pilosité** | Barbe 3 jours homogène, soignée |
| **Expression** | Sourire fermé bienveillant, comme s'il venait de dire « je vous écoute » |
| **Outfit** | Chemise oxford blanc cassé col ouvert (1 bouton défait), pull fin col rond couleur sable visible par-dessus |
| **Accessoire** | **Casque headset pro fin et discret** (style Plantronics ou Apple AirPods Max version mate sable), micro positionné élégamment |
| **Pose** | 3/4 face, épaules détendues légèrement de profil, mains hors champ |
| **Lumière** | Soft key warm (4500K) camera-left, fill chaud camera-right — vibe accueil ensoleillé |
| **Couleur signature** | **Orange Limova `#dc8e21`** sur le coussin du casque ou un fil discret du headset |

**Prompt complet à coller**
```
A 30-year-old European man (French Southwest), warm tan skin with healthy
glow, short tousled light brown hair, soft jawline, gentle 3-day even
stubble, hazel green eyes looking warmly directly at camera, friendly
closed-mouth smile with subtle dimple on left cheek. Wearing an off-white
Oxford shirt with top button undone, sand-colored fine knit crew-neck
sweater visible over the collar. Sleek matte sand-colored professional
over-ear headset (Plantronics-style or Apple AirPods Max in matte sand)
with discreet boom microphone, subtle orange (#dc8e21) accent stitching
on the headset cushion. Chest-up portrait, slight low-angle, 3/4 facing
camera with shoulders relaxed, hands out of frame. 85mm portrait lens.
Warm soft key light from camera-left (4500K), warm fill from camera-right.
Illustrated hyperrealism style, mix of Pixar character render and Forbes
editorial portrait, ultra-high detail on skin pores, fabric weave, hair
strands, no logos, no trademarks. Isolated subject on solid uniform
chroma-key green background #00B140, no gradient, no texture on
background, sharp edges, preserve fine hair detail, no green spill on
subject. 2048x2560 px PNG.
```

---

## 2. JOHN — Marketing 📣

> *Creative director qui a déjà 3 idées avant que tu finisses de parler. Calmement viral.*

**Identité produit** · ID `john` · Rôle : Marketing · Headline : *« Vos réseaux sociaux qui tournent tout seuls. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 28 ans |
| **Genre** | Masculin |
| **Origine visuelle** | Européen urbain, possible mix nord-européen |
| **Peau** | Claire, légèrement bronzée, peau nette |
| **Cheveux** | Brun foncé presque noir, mid-fade avec mèche relevée sur le dessus, undercut moderne |
| **Visage** | Traits nets, mâchoire dessinée, lèvres expressives |
| **Yeux** | Marron foncé, regard sharp et rieur |
| **Pilosité** | Barbe taillée précise, ligne propre |
| **Expression** | Sourire de coin assuré, dents partiellement visibles, "I got an idea" |
| **Outfit** | T-shirt noir uni heavyweight cotton col rond, veste oversize en lin écru déboutonnée par-dessus |
| **Accessoire** | **Lunettes design en acétate transparent ambré**, petit anneau argenté au lobe d'oreille gauche |
| **Pose** | 3/4 face, une épaule légèrement avancée, posture relax confidente |
| **Lumière** | Key cool neutre (5000K) camera-left, légère contre-jour pour kicker dans les cheveux |
| **Couleur signature** | **Orange `#dc8e21`** sur les branches des lunettes ou doublure visible de la veste |

**Prompt complet**
```
A 28-year-old urban European man, fair lightly tanned clear skin,
near-black dark brown hair in a modern mid-fade undercut with a
sweep on top, sharp jawline, neat precisely trimmed short beard with
clean defined lines, expressive lips, sharp dark brown alert and
playful eyes looking directly at camera with a confident half-smile
showing a hint of teeth. Wearing a plain heavyweight black cotton
crew-neck T-shirt under an oversized natural cream linen unstructured
jacket left unbuttoned, subtle visible orange (#dc8e21) inner lining
at lapel edge. Translucent amber acetate designer eyeglasses (chunky
frames), small silver hoop earring on left earlobe. Chest-up portrait,
slight low-angle, 3/4 facing camera with one shoulder slightly forward,
relaxed confident posture. 85mm portrait lens. Cool neutral key light
from camera-left (5000K), subtle backlight kicker on hair edges.
Illustrated hyperrealism style, mix of Pixar character render and
Fast Company editorial portrait, ultra-detailed skin, fabric weave,
hair strands, no logos, no trademarks. Isolated subject on solid
uniform chroma-key green background #00B140, flat, no gradient, sharp
edges, preserve fine hair detail, no green spill on subject. 2048x2560
px PNG.
```

---

## 3. LOU — SEO ✍️

> *La rédactrice qui a déjà mappé 47 mots-clés que tes concurrents n'ont pas vus.*

**Identité produit** · ID `lou` · Rôle : SEO · Headline : *« Un blog qui se remplit tout seul. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 26 ans |
| **Genre** | Féminin |
| **Origine visuelle** | Eurasienne (mix européen / asiatique) |
| **Peau** | Claire à mate, ton porcelaine légèrement chaud |
| **Cheveux** | Noir profond, mi-longs, **queue de cheval haute légèrement lâche** avec mèches encadrant le visage qui tombent naturellement |
| **Visage** | Pommettes hautes, traits fins, lèvres délicates en cœur |
| **Yeux** | Marron très foncé, regard concentré et curieux, intelligent |
| **Pilosité** | N/A |
| **Expression** | Sourire discret, comme si elle venait de trouver une idée. Tête très légèrement penchée |
| **Outfit** | Pull fin col roulé écru/crème en cachemire fin, blazer beige sable non structuré ouvert par-dessus |
| **Accessoire** | **Lunettes à monture ronde fine en métal doré-rose**, **crayon HB en bois glissé derrière l'oreille droite** |
| **Pose** | 3/4 face, épaules droites, légère inclinaison de tête à droite |
| **Lumière** | Key soft warm (4800K) camera-left, ambiance bibliothèque feutrée |
| **Couleur signature** | **Orange `#dc8e21`** sur le ruban élastique de l'attache cheveux, ou la gomme du crayon |

**Prompt complet**
```
A 26-year-old Eurasian woman (European-Asian mix), porcelain warm-toned
skin, deep black mid-length hair in a high loose ponytail with face-framing
strands falling naturally, high cheekbones, fine delicate features, soft
heart-shaped lips, intelligent dark brown eyes with focused curious gaze
directly at camera, subtle small smile as if she just had a thought, head
slightly tilted right. Wearing a fine cream cashmere thin turtleneck under
an open sand-beige unstructured linen blazer. Thin round rose-gold metal
eyeglass frames, a wooden HB pencil tucked behind her right ear, subtle
orange (#dc8e21) hair-tie elastic at the ponytail base. Chest-up portrait,
slight low-angle, 3/4 facing camera with shoulders square. 85mm portrait
lens. Soft warm key light from camera-left (4800K), library-warm ambient
fill. Illustrated hyperrealism style, mix of Pixar character render and
editorial fashion-business portrait, ultra-detailed skin, cashmere fabric,
fine flyaway hair strands, no logos, no trademarks. Isolated subject on
solid uniform chroma-key green background #00B140, flat, no gradient,
sharp edges, preserve fine hair detail and pencil tip definition, no green
spill on subject. 2048x2560 px PNG.
```

---

## 4. CHARLY+ — Assistante générale ⭐

> *Le pivot. Elle gère, elle dispatche, elle parle directement aux 7 autres. Iconique, lumineuse, autoritaire.*

**Identité produit** · ID `charly` · Rôle : Général / Manageuse des 8 agents · Headline : *« Votre assistante générale ultra-puissante. »*
**→ Featured agent.** Plus iconique que les autres : énergie de leader.

| Champ | Spec |
|---|---|
| **Âge apparent** | 32 ans |
| **Genre** | Féminin |
| **Origine visuelle** | Afro-européenne / métisse, peau caramel |
| **Peau** | Caramel chaud, lumineuse, glow naturel |
| **Cheveux** | Cheveux crépus naturels, **coupe courte sculptée et dégagée** (TWA tendance) ou **bantu knots élégants** — choix d'un style identifiable et distinctif |
| **Visage** | Pommettes prononcées, traits forts mais doux, lèvres pleines |
| **Yeux** | Marron chaud presque ambré, regard lumineux et autoritaire, mascara discret |
| **Pilosité** | N/A |
| **Expression** | Sourire confiant ouvert, dents partiellement visibles. Énergie « parle-moi, je gère » |
| **Outfit** | **Blazer noir cintré couture** col tailleur, dessous un haut col rond noir, **doublure intérieure du blazer visible en orange Limova `#dc8e21`** au revers |
| **Accessoire** | Petite oreillette Bluetooth pro discrète, boucles d'oreilles **créoles fines dorées**, rouge à lèvres nude-orangé subtil |
| **Pose** | 3/4 face, posture droite et autoritaire, menton légèrement relevé |
| **Lumière** | Key éditoriale chaude (4500K) camera-left, rim light dorée camera-right pour halo cinématique |
| **Couleur signature** | **Orange `#dc8e21`** prédominante : doublure blazer + rouge à lèvres tirant orange |

**Prompt complet**
```
A 32-year-old Afro-European mixed-race woman with warm caramel skin and
healthy luminous glow, natural Afro-textured hair styled in a sculpted
short TWA (teeny weeny afro) cut neatly defined, prominent strong cheekbones,
soft full lips with subtle nude-orange lipstick (slight #dc8e21 undertone),
warm amber-brown eyes with luminous authoritative gaze directly at camera,
subtle mascara, confident open smile showing a hint of teeth — energy of
a leader who commands respect. Wearing a sharply tailored fitted black
couture blazer with notched lapels, the inner lining clearly visible in
vivid Limova orange (#dc8e21) at the lapel break, plain black crew-neck
top underneath. Tiny discreet Bluetooth in-ear earpiece, thin gold hoop
earrings. Chest-up portrait, slight low-angle, 3/4 facing camera with
upright authoritative posture, chin slightly raised. 85mm portrait lens.
Warm editorial key light from camera-left (4500K), gold rim light from
camera-right creating subtle cinematic halo on hair edges. Illustrated
hyperrealism style, mix of Pixar character render and Vogue Business
editorial portrait, ultra-detailed skin texture, hair coil definition,
fabric, no logos, no trademarks. Isolated subject on solid uniform
chroma-key green background #00B140, flat, no gradient, sharp edges,
preserve fine hair coil detail and lapel orange contrast, no green spill
on subject. 2048x2560 px PNG.
```

---

## 5. ELIO — Commercial / Prospection 💼

> *Italien d'allure, charmeur, te vend une glace en plein hiver. Mais avec des KPIs.*

**Identité produit** · ID `elio` · Rôle : Commercial · Headline : *« Une prospection qui tourne pendant votre sommeil. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 30 ans |
| **Genre** | Masculin |
| **Origine visuelle** | Italo-Méditerranéen |
| **Peau** | Tan méditerranéen profond |
| **Cheveux** | Noir profond, slicked-back élégant avec brillance maîtrisée |
| **Visage** | Traits anguleux, mâchoire forte, nez romain, lèvres bien dessinées |
| **Yeux** | Marron foncé, regard charmeur et perçant, mid-blink confiant |
| **Pilosité** | Barbe courte parfaitement taillée, ligne nette pommettes et cou |
| **Expression** | Sourire de coin charmeur, légèrement amusé, "j'ai déjà ton deal en main" |
| **Outfit** | Chemise bleu ciel pâle col ouvert (2 boutons défaits), blazer bleu marine non structuré en lin |
| **Accessoire** | **Montre acier inoxydable cadran clair** au poignet visible (forme classique style Tudor/Rolex sans branding), pochette en lin blanc cassé pliée triangle |
| **Pose** | 3/4 face, buste légèrement orienté vers la caméra, main visible jouant avec la manchette de chemise |
| **Lumière** | Warm key (3800K) camera-left avec contraste marqué, golden hour méditerranéen |
| **Couleur signature** | **Orange `#dc8e21`** sur le bracelet de la montre (cuir cognac chaud) ou liseré pochette |

**Prompt complet**
```
A 30-year-old Italian-Mediterranean man with deep Mediterranean tan skin,
rich black hair slicked back with controlled subtle shine, angular sharp
features, strong jaw, Roman nose, well-defined lips, dark brown charming
piercing eyes looking directly at camera with confident charm, neat short
parfectly-trimmed beard with sharp clean lines on cheekbones and neck,
charismatic half-smile slightly amused — vibe of someone who already
closed the deal. Wearing a pale sky-blue dress shirt with top two buttons
undone, navy unstructured linen blazer over the top, off-white linen
pocket square folded in a simple triangle. Stainless steel classic watch
with light dial on visible left wrist with warm cognac orange (#dc8e21)
leather strap. Chest-up portrait, slight low-angle, 3/4 facing camera
with body slightly turned forward, one visible hand adjusting shirt cuff.
85mm portrait lens. Warm directional key light from camera-left (3800K),
strong shadow shaping on right side, Mediterranean golden-hour palette.
Illustrated hyperrealism style, mix of Pixar render and GQ editorial
portrait, ultra-detailed skin texture, linen weave, hair gloss, no logos,
no trademarks. Isolated subject on solid uniform chroma-key green
background #00B140, flat, no gradient, sharp edges, preserve fine hair
and beard detail, no green spill on subject. 2048x2560 px PNG.
```

---

## 6. MANUE — Comptable 📊

> *Précise comme une feuille Excel, mais ne fronce jamais. Calme analytique.*

**Identité produit** · ID `manue` · Rôle : Comptable · Headline : *« La gestion financière, sans friction. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 35 ans |
| **Genre** | Féminin |
| **Origine visuelle** | Européenne classique (France métropolitaine) |
| **Peau** | Claire, ton neutre frais, peau nette |
| **Cheveux** | Châtain naturel mi-long, lisse soyeux, **raie au milieu**, longueur clavicule |
| **Visage** | Ovale doux, traits réguliers, lèvres fines mais bien dessinées |
| **Yeux** | Bleu-gris, regard analytique calme, **regardant légèrement hors champ vers le bas-droite** comme si elle vérifiait un chiffre |
| **Pilosité** | N/A |
| **Expression** | Concentration paisible, lèvres closes avec sourire intérieur quasi imperceptible |
| **Outfit** | Chemisier blanc col chemise, gilet anthracite fin en maille par-dessus, fines lunettes rectangulaires monture noire |
| **Accessoire** | **Stylo plume noir laqué bouchon orange `#dc8e21`** glissé visiblement dans la poche poitrine du gilet, montre fine acier au poignet |
| **Pose** | 3/4 face plus marqué (presque profil), regard hors champ caméra-bas-droite |
| **Lumière** | Diffuse cool (5500K) type lumière de bureau parisien tamisée, pas d'ombres dures |
| **Couleur signature** | **Orange `#dc8e21`** clairement sur le bouchon du stylo plume |

**Prompt complet**
```
A 35-year-old European woman (French metropolitan), fair clear skin with
neutral cool tones, natural mid-length silky chestnut brown hair in a
clean center-part falling to collarbones, soft oval face, regular features,
fine well-defined lips, blue-grey analytical calm eyes looking slightly
off-camera toward lower-right as if verifying a figure on an invisible
ledger, peaceful concentrated expression with closed lips holding a
near-imperceptible inner smile. Wearing a white collared dress shirt
under a fine charcoal anthracite fine-knit waistcoat, thin rectangular
black-framed glasses. Black lacquered fountain pen with bright orange
(#dc8e21) cap clearly tucked in waistcoat chest pocket, slim stainless
steel watch on visible wrist. Chest-up portrait, slight low-angle, more
pronounced 3/4 angle (closer to profile), gaze off-camera lower-right.
85mm portrait lens. Soft cool diffuse key light from camera-left (5500K),
subdued Parisian office window-light atmosphere, no harsh shadows.
Illustrated hyperrealism style, mix of Pixar character render and Wall
Street Journal editorial portrait, ultra-detailed skin, fine knit wool
weave, hair strand definition, no logos, no trademarks. Isolated subject
on solid uniform chroma-key green background #00B140, flat, no gradient,
sharp edges, preserve fine hair and pen-cap orange contrast, no green
spill on subject. 2048x2560 px PNG.
```

---

## 7. JULIA — Juridique ⚖️

> *Connaît l'article 1242 par cœur. Si elle te dit « relis tes CGV », tu relis tes CGV.*

**Identité produit** · ID `julia` · Rôle : Juridique · Headline : *« Votre conseil juridique disponible à tout moment. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 38 ans |
| **Genre** | Féminin |
| **Origine visuelle** | Européenne, traits classiques français |
| **Peau** | Claire à légèrement hâlée, lumineuse, soin évident |
| **Cheveux** | Auburn (châtain rougeâtre profond), **carré court précis raie côté gauche**, finition lisse impeccable |
| **Visage** | Pommettes hautes, mâchoire fine et dessinée, lèvres bien définies rouge bordeaux discret |
| **Yeux** | Vert intense, regard sharp et autoritaire, eye-liner discret |
| **Pilosité** | N/A |
| **Expression** | Sourcil gauche imperceptiblement levé, sourire fermé pince-sans-rire, "on va clarifier ce contrat" |
| **Outfit** | Veste de tailleur noire structurée (style Saint Laurent) col tailleur revers étroits, chemisier en soie blanc cassé visible col ouvert |
| **Accessoire** | **Petite broche dorée en forme de balance de la justice** revers de blazer (très subtile, taille pin's), montre cadran rectangulaire fin (style Cartier Tank), alliance fine or jaune |
| **Pose** | Plein-face avec très subtil 3/4, posture droite, légère tilt de tête à gauche analytique |
| **Lumière** | Key éditoriale neutre (5000K) camera-left, rendu net, ombre douce sous menton |
| **Couleur signature** | **Orange `#dc8e21`** discrètement sur la doublure visible du blazer (petit éclat à l'ouverture) ou sur un fil de la broche |

**Prompt complet**
```
A 38-year-old European woman with classic French features, fair lightly
tanned luminous well-cared-for skin, deep auburn (red-tinted chestnut)
hair in a precise sharp bob with a clean left side-part and impeccable
smooth finish, high cheekbones, fine sculpted jawline, well-defined lips
with discreet burgundy lipstick, intense forest-green sharp authoritative
eyes with subtle eyeliner, looking directly at camera with imperceptibly
raised left eyebrow and a closed dry-witted smile — "let's clarify this
contract" energy. Wearing a structured black Saint-Laurent-style tailored
blazer with notched narrow lapels, off-white silk blouse visible
underneath with collar slightly open, subtle visible orange (#dc8e21)
inner blazer lining peeking at the lapel break. Tiny gold pin shaped
like the scales of justice on left lapel (subtle pin-size), thin
rectangular Cartier-Tank-style watch on wrist, slim yellow gold wedding
band. Chest-up portrait, slight low-angle, near-frontal pose with subtle
3/4 angle, upright posture, head slightly tilted left analytical.
85mm portrait lens. Editorial neutral key light from camera-left (5000K),
sharp clean rendering, soft chin shadow. Illustrated hyperrealism style,
mix of Pixar character render and Vogue editorial portrait, ultra-detailed
skin, silk and wool fabric texture, hair sheen, no logos, no trademarks.
Isolated subject on solid uniform chroma-key green background #00B140,
flat, no gradient, sharp edges, preserve fine hair and tiny pin detail,
no green spill on subject. 2048x2560 px PNG.
```

---

## 8. RONY — Recrutement 🤝

> *Le mec qui t'envoie 3 CV parfaits et te dit « regarde le n°2, il a l'énergie ». Sociable.*

**Identité produit** · ID `rony` · Rôle : Recrutement · Headline : *« Le recrutement sans effort. »*

| Champ | Spec |
|---|---|
| **Âge apparent** | 32 ans |
| **Genre** | Masculin |
| **Origine visuelle** | Afro-européen / Africain de l'Ouest mix |
| **Peau** | Brun chocolat chaud, glow lumineux |
| **Cheveux** | Noir, courts, **fade discret**, dessus court bouclé bien défini |
| **Visage** | Visage rond-ovale, traits doux et amicaux, pommettes pleines |
| **Yeux** | Marron chaud presque noisette, regard accueillant souriant directement caméra |
| **Pilosité** | Barbe courte parfaitement taillée, dégradé propre vers les pommettes |
| **Expression** | Grand sourire ouvert, dents visibles, fossettes naturelles — vraie chaleur |
| **Outfit** | **Pull col rond camel/caramel** (en harmonie avec orange Limova), chemise blanche col visible légèrement par-dessous |
| **Accessoire** | **Lunettes rondes acétate marron havane** discrètes, montre cuir marron clair |
| **Pose** | 3/4 face, épaules ouvertes, légèrement penché en avant comme s'il accueillait quelqu'un |
| **Lumière** | Key warm (4200K) camera-left, fill chaud, vibe accueil ouvert et lumineux |
| **Couleur signature** | **Orange `#dc8e21`** : le pull camel tire vers l'orange, plus accent éventuel sur la monture des lunettes |

**Prompt complet**
```
A 32-year-old Afro-European man (West African mix), warm chocolate brown
skin with luminous healthy glow, short black hair with a clean discreet
fade and tightly defined natural curls on top, soft round-oval face with
friendly features and full cheekbones, neat perfectly-trimmed short beard
with clean fade up to cheekbones, warm hazel-brown eyes with welcoming
direct gaze at camera, big open genuine smile showing teeth with natural
dimples — radiating real warmth and openness. Wearing a soft caramel-
camel crew-neck knit sweater (warm tone close to orange #dc8e21), white
shirt collar slightly visible underneath. Round havana-brown acetate
eyeglasses, light brown leather strap watch. Chest-up portrait, slight
low-angle, 3/4 facing camera with shoulders open and slightly leaning
forward as if welcoming someone. 85mm portrait lens. Warm key light
from camera-left (4200K), warm fill, open welcoming bright atmosphere.
Illustrated hyperrealism style, mix of Pixar character render and Fast
Company editorial portrait, ultra-detailed skin texture, knit fabric
weave, beard hair definition, no logos, no trademarks. Isolated subject
on solid uniform chroma-key green background #00B140, flat, no gradient,
sharp edges, preserve fine hair and beard detail, no green spill on
subject. 2048x2560 px PNG.
```

---

## Workflow recommandé

1. **Génère un set complet** des 8 persos en démarrant ta session Gemini par :
   > *"Create a set of 8 character portraits for an AI business assistant brand called Limova. They must look like part of the same series — same lighting style, same illustrated hyperrealism rendering, same chroma-key green #00B140 background. Each character has a single subtle Limova orange (#dc8e21) accent detail. Here is character 1…"* puis enchaîner les 8 fiches.

2. **Détoure** chaque PNG :
   - **Photoshop** : Sélection > Plage de couleurs > Pipette sur le vert > Tolérance ~30 > Inverser > Masque vectoriel
   - **Remove.bg** ou **Photoroom** marchent très bien
   - **CLI ffmpeg** : `ffmpeg -i tom.png -vf "chromakey=0x00B140:0.1:0.05" tom-cut.png`

3. **Range** dans `public/onze/agents/` (chemin déjà câblé dans `app/_data/agents.ts`) :
   - `tom.avif`, `john.avif`, `lou.avif`, `charly.avif`, `elio.avif`, `manue.avif`, `julia.avif`, `rony.avif`
   - Convertis le PNG détouré en `.avif` via `cwebp` ou `avif.io` (plus léger)

4. **Test détourage** : zoom 400% sur les bords cheveux/barbe — si tu vois du green spill, repasse "Decontaminate Colors" dans Photoshop ou `--erode 1` sur ffmpeg.

---

## Color sheet récapitulative

| Agent | Genre | Âge | Détail signature orange `#dc8e21` |
|---|---|---|---|
| Tom | M | 30 | Coussin / fil casque headset |
| John | M | 28 | Branches lunettes acétate ou doublure veste |
| Lou | F | 26 | Élastique queue de cheval ou gomme crayon |
| **Charly+** ⭐ | F | 32 | **Doublure blazer + rouge à lèvres orangé** (plus présent) |
| Elio | M | 30 | Bracelet montre cuir cognac orangé |
| Manue | F | 35 | Bouchon stylo plume |
| Julia | F | 38 | Doublure blazer (éclat lapel) |
| Rony | M | 32 | Pull camel-caramel chaud |

**Diversité** : 4 H / 4 F · Origines variées (Européen Sud, Urbain mixte, Eurasien, Afro-Européen ×2, Italo-Méd, Européen classique ×2) · Tranche d'âge 26-38 ans.

**Cohérence** : même style hyperréalisme illustré, même fond, même focale 85mm, même approche d'éclairage soft + rim, accent orange Limova systématique mais subtil (sauf Charly+ où il est mis en avant car elle est le pivot).
