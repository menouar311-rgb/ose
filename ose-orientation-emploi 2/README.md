# OSE Orientation Emploi — version design + analyse avancée

Application MVP pour orienter un jeune dès son arrivée, analyser son niveau de préparation à l’emploi et transmettre une synthèse détaillée au bon CRE.

## Lancer en local

```bash
npm run install-all
cp server/.env.example server/.env
npm run dev
```

Puis ouvrir : http://localhost:5173

Compte admin :
- Email : `admin@ose.fr`
- Mot de passe : `admin123`

## Nouveautés de cette version

- Design plus premium : interface type SaaS moderne, glassmorphism, parcours en étapes.
- Questions plus pertinentes : clarté du projet, contraintes secteur, motivation argumentée, soft skills détaillés.
- Analyse avancée : score d’employabilité, niveau prêt/partiel/pas prêt, conseils CRE, conseils jeune, type d’entreprise conseillé.
- Email CRE enrichi : synthèse IA, points forts, vigilances, actions prioritaires, CV joint si SMTP configuré.
- Dashboard CRE amélioré : cartes jeunes avec analyse détaillée.

## Configuration email

Dans `server/.env`, renseigner :

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=votre_email
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=votre_email

SARAH_EMAIL=sarah@example.com
MORGANE_EMAIL=morgane@example.com
CAROLINE_EMAIL=caroline@example.com
MENOUAR_EMAIL=menouar@example.com
```

Sans SMTP, l’email est affiché dans le terminal pour test.
