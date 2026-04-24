const referents = {
  'BTP': { name: 'Sarah', email: process.env.SARAH_EMAIL },
  'Logistique': { name: 'Sarah', email: process.env.SARAH_EMAIL },
  'Industrie': { name: 'Morgane', email: process.env.MORGANE_EMAIL },
  'Restauration': { name: 'Morgane', email: process.env.MORGANE_EMAIL },
  'Administratif': { name: 'Caroline ou Menouar', email: `${process.env.CAROLINE_EMAIL || ''},${process.env.MENOUAR_EMAIL || ''}` },
  'Service à la personne': { name: 'Menouar', email: process.env.MENOUAR_EMAIL },
  'SAP': { name: 'Menouar', email: process.env.MENOUAR_EMAIL }
};

const sectorGuides = {
  'BTP': {
    qualities: ['ponctualité', 'résistance physique', 'respect des consignes', 'travail en équipe'],
    companies: 'Entreprises du bâtiment, second œuvre, gros œuvre, chantiers école, agences d’intérim BTP avec tutorat.',
    warning: 'Vérifier la mobilité chantier, l’équipement, la capacité à tenir les horaires tôt et le respect strict des consignes sécurité.'
  },
  'Logistique': {
    qualities: ['ponctualité', 'cadence', 'organisation', 'respect des procédures'],
    companies: 'Entrepôts, plateformes logistiques, préparation de commandes, drive, transport, intérim encadré.',
    warning: 'Vérifier horaires décalés, mobilité zone industrielle, port de charges et compréhension des consignes.'
  },
  'Industrie': {
    qualities: ['rigueur', 'cadence', 'sécurité', 'fiabilité'],
    companies: 'Production, conditionnement, opérateur de ligne, maintenance premier niveau, industrie avec formation interne.',
    warning: 'Vérifier appétence pour environnement répétitif, horaires postés et respect des règles qualité/sécurité.'
  },
  'Restauration': {
    qualities: ['dynamisme', 'résistance au stress', 'relation client', 'hygiène'],
    companies: 'Restauration rapide, collective, traditionnelle, commis, service, plonge, établissements acceptant profils juniors.',
    warning: 'Vérifier disponibilité soir/week-end, rythme intense, hygiène, présentation et capacité relation client.'
  },
  'Administratif': {
    qualities: ['expression écrite', 'organisation', 'maîtrise numérique', 'discrétion'],
    companies: 'Accueil, secrétariat, back-office, gestion administrative simple, structures associatives, PME avec accompagnement.',
    warning: 'Vérifier niveau bureautique, orthographe, posture téléphonique et capacité à traiter des informations confidentielles.'
  },
  'Service à la personne': {
    qualities: ['bienveillance', 'fiabilité', 'discrétion', 'autonomie'],
    companies: 'Structures SAP, aide ménagère, auxiliaire de vie, accompagnement à domicile avec formation interne possible.',
    warning: 'Vérifier mobilité, acceptation de l’intimité/hygiène, disponibilité matin/soir/week-end et maturité professionnelle.'
  }
};

export function assignReferent(mainSector = '') {
  return referents[mainSector] || { name: 'À définir', email: process.env.MENOUAR_EMAIL };
}

function yes(value) {
  return String(value || '').toLowerCase().trim() === 'oui';
}
function number(v, fallback = 0) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }
function parseArray(value) { try { return Array.isArray(value) ? value : JSON.parse(value || '[]'); } catch { return []; } }

export function analyzeYouth(body, cvFile) {
  const sector = body.main_sector || 'Non renseigné';
  const guide = sectorGuides[sector] || sectorGuides['Administratif'];
  const referent = assignReferent(sector);
  const blockers = parseArray(body.blockers).filter(b => b !== 'Aucun frein');
  const secondarySectors = parseArray(body.secondary_sectors);

  const indicators = {
    cv: yes(body.cv_updated) || !!cvFile,
    interview: yes(body.interview_done),
    pitch: yes(body.can_pitch),
    jobKnowledge: yes(body.knows_job),
    fastAvailability: yes(body.available_fast) || body.availability === 'Immédiate',
    outfit: yes(body.interview_outfit),
    experience: yes(body.experience),
    coherentProject: yes(body.project_clear),
    acceptsConstraints: yes(body.accepts_constraints),
    canExplainMotivation: yes(body.can_explain_motivation)
  };

  let score = 0;
  const strengths = [];
  const risks = [];
  const creActions = [];
  const youthActions = [];

  const add = (condition, points, positive, negative, creAction, youthAction) => {
    if (condition) { score += points; strengths.push(positive); }
    else { risks.push(negative); if (creAction) creActions.push(creAction); if (youthAction) youthActions.push(youthAction); }
  };

  add(indicators.cv, 12, 'CV disponible / déclaré à jour', 'CV absent ou à retravailler', 'Contrôler le CV et l’adapter au secteur visé', 'Mettre le CV à jour avec expériences, compétences et disponibilités');
  add(indicators.coherentProject, 10, 'Projet professionnel clair', 'Projet encore flou', 'Prévoir un entretien court de clarification du projet', 'Choisir 1 métier cible prioritaire et 1 secteur secondaire');
  add(indicators.jobKnowledge, 10, 'Bonne connaissance déclarée du métier', 'Représentation du métier à vérifier', 'Présenter les réalités métier avant positionnement', 'Se renseigner sur les missions, horaires et contraintes du métier');
  add(indicators.experience, 8, 'Expérience déclarée dans le secteur', 'Peu ou pas d’expérience déclarée', 'Favoriser entreprise avec tutorat, PMSMP ou première expérience', 'Préparer 2 exemples concrets de motivation même sans expérience');
  add(indicators.pitch, 10, 'Capacité à se présenter en entretien', 'Pitch professionnel à consolider', 'Programmer une simulation entretien de 15 minutes', 'Préparer une présentation en 45 secondes');
  add(indicators.interview, 6, 'A déjà connu une situation d’entretien', 'Peu d’expérience en entretien', 'Faire une mise en situation avant contact entreprise', 'S’entraîner sur les questions classiques');
  add(indicators.fastAvailability, 8, 'Disponibilité rapide', 'Disponibilité à préciser', 'Vérifier les contraintes de planning avant envoi entreprise', 'Clarifier les jours et horaires réellement possibles');
  add(indicators.acceptsConstraints, 8, 'Contraintes du secteur acceptées', 'Contraintes sectorielles à confirmer', 'Valider horaires, mobilité et conditions réelles du poste', 'Noter les contraintes acceptées et non acceptées');
  add(indicators.outfit, 4, 'Se dit prêt sur la présentation entretien', 'Présentation entretien à préparer', 'Rappeler les codes de présentation professionnelle', 'Préparer une tenue sobre et adaptée');
  add(indicators.canExplainMotivation, 6, 'Motivation explicable et argumentée', 'Motivation à rendre plus convaincante', 'Travailler le lien entre parcours et secteur choisi', 'Préparer 3 raisons concrètes pour ce secteur');

  const soft = {
    motivation: number(body.motivation, 3), punctuality: number(body.punctuality, 3), autonomy: number(body.autonomy, 3),
    communication: number(body.communication, 3), teamwork: number(body.teamwork, 3), stress: number(body.stress, 3), digital: number(body.digital, 3)
  };
  const softAvg = Object.values(soft).reduce((a,b)=>a+b,0) / Object.values(soft).length;
  score += Math.round(softAvg * 6);

  Object.entries(soft).forEach(([key, val]) => {
    const labels = { motivation:'motivation', punctuality:'ponctualité', autonomy:'autonomie', communication:'communication', teamwork:'travail en équipe', stress:'gestion du stress', digital:'aisance numérique' };
    if (val >= 4) strengths.push(`Bon niveau déclaré en ${labels[key]}`);
    if (val <= 2) { risks.push(`Point de vigilance : ${labels[key]}`); youthActions.push(`Travailler la ${labels[key]} avant entretien`); }
  });

  score -= blockers.length * 6;
  if (blockers.length) {
    risks.push(`Freins déclarés : ${blockers.join(', ')}`);
    creActions.push(`Vérifier les freins avant mise en relation : ${blockers.join(', ')}`);
  }

  if (body.transport === 'Aucun' && ['BTP','Logistique','Industrie','Service à la personne'].includes(sector)) {
    score -= 8;
    risks.push('Mobilité potentiellement bloquante pour ce secteur');
    creActions.push('Contrôler précisément la zone de mobilité avant positionnement');
  }

  score = Math.max(0, Math.min(100, score));
  let status = 'Pas encore prêt';
  if (score >= 78 && blockers.length <= 1) status = 'Prêt à l’emploi';
  else if (score >= 48) status = 'Partiellement prêt';

  const priority = status === 'Prêt à l’emploi' ? 'Priorité mise en relation entreprise' : status === 'Partiellement prêt' ? 'Priorité préparation ciblée' : 'Priorité accompagnement renforcé';
  const readinessReason = status === 'Prêt à l’emploi'
    ? 'Le profil présente suffisamment d’éléments favorables pour envisager une mise en relation rapide, sous réserve de validation humaine par le CRE.'
    : status === 'Partiellement prêt'
      ? 'Le projet semble exploitable, mais quelques points doivent être sécurisés avant contact entreprise.'
      : 'Le profil nécessite d’abord une phase de clarification ou de sécurisation avant d’être exposé à une entreprise.';

  const companyAdvice = `${guide.companies} ${status === 'Prêt à l’emploi' ? 'Positionnement possible rapidement sur offre ou job dating.' : 'Privilégier une structure bienveillante, tutorée ou une étape PMSMP/prépa avant recrutement.'}`;
  const youthAdvice = buildYouthAdvice(status, sector, youthActions, guide);
  const creAdvice = buildCreAdvice(status, sector, creActions, body, guide, blockers);
  const ai_summary = buildSummary({ body, sector, status, score, readinessReason, priority, strengths, risks, guide, secondarySectors });

  return {
    readiness_status: status,
    readiness_score: score,
    assigned_referent: referent.name,
    assigned_email: referent.email || '',
    ai_summary,
    strengths: unique(strengths).slice(0, 8).join(' ; ') || 'À approfondir en entretien',
    improvements: unique(risks).slice(0, 8).join(' ; ') || 'Aucun point bloquant majeur déclaré',
    recommended_companies: companyAdvice,
    youth_advice: youthAdvice,
    cre_advice: creAdvice,
    priority_actions: unique([...creActions, ...youthActions]).slice(0, 7).join(' ; ')
  };
}

function buildSummary({ body, sector, status, score, readinessReason, priority, strengths, risks, guide, secondarySectors }) {
  return `Niveau estimé : ${status} (${score}/100). Priorité : ${priority}.\n\nLecture du profil : ${body.first_name || 'Le jeune'} se positionne principalement sur ${sector}${secondarySectors.length ? `, avec un intérêt secondaire pour ${secondarySectors.join(', ')}` : ''}. ${body.desired_job ? `Métier visé : ${body.desired_job}.` : 'Métier précis à confirmer.'} ${body.experience === 'Oui' ? 'Une expérience est déclarée dans le secteur.' : 'Aucune expérience significative n’est déclarée dans le secteur.'}\n\nAnalyse : ${readinessReason}\n\nForces principales : ${unique(strengths).slice(0,5).join(', ') || 'à confirmer en entretien'}.\n\nPoints de vigilance : ${unique(risks).slice(0,5).join(', ') || 'pas de point bloquant déclaré'}.\n\nLecture secteur : pour ${sector}, les qualités importantes sont ${guide.qualities.join(', ')}. ${guide.warning}`;
}

function buildYouthAdvice(status, sector, actions, guide) {
  const intro = status === 'Prêt à l’emploi'
    ? 'Ton profil semble proche d’une mise en relation entreprise. L’objectif est maintenant de sécuriser ton discours et ton CV.'
    : status === 'Partiellement prêt'
      ? 'Ton projet peut avancer, mais quelques points doivent être travaillés pour augmenter tes chances en entretien.'
      : 'Avant de rencontrer une entreprise, il faut d’abord clarifier ton projet et lever les principaux freins.';
  return `${intro}\nConseils prioritaires : ${unique(actions).slice(0,5).join(' ; ') || 'continuer à consolider le projet et préparer l’entretien'}.\nPour le secteur ${sector}, montre surtout : ${guide.qualities.join(', ')}.`;
}

function buildCreAdvice(status, sector, actions, body, guide, blockers) {
  const recommendation = status === 'Prêt à l’emploi'
    ? 'Action CRE recommandée : vérifier rapidement le CV, faire un court entretien de validation, puis positionner sur offre ou job dating adapté.'
    : status === 'Partiellement prêt'
      ? 'Action CRE recommandée : prévoir une prépa ciblée avant mise en relation, puis revalider la disponibilité et le discours.'
      : 'Action CRE recommandée : ne pas exposer tout de suite le jeune à une entreprise ; orienter d’abord vers clarification projet, atelier CV/pitch ou levée des freins.';
  const vigilance = blockers.length ? `Freins à sécuriser : ${blockers.join(', ')}.` : 'Aucun frein majeur déclaré, à confirmer en entretien.';
  return `${recommendation}\n${vigilance}\nQuestion à poser au jeune : “Peux-tu me donner un exemple concret qui montre que tu es prêt pour le secteur ${sector} ?”\nPoint secteur : ${guide.warning}\nType d’offre à privilégier : ${body.experience === 'Oui' ? 'offre classique avec attentes opérationnelles claires' : 'offre débutant, entreprise avec tutorat, PMSMP ou session de prépa public'}.`;
}

function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
