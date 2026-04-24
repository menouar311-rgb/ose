import nodemailer from 'nodemailer';

export async function sendReferentMail(youth, analysis, cvPath) {
  const subject = `Nouveau jeune orienté – ${youth.main_sector} – ${analysis.readiness_status}`;
  const body = `Bonjour,

Un nouveau jeune vient de compléter le questionnaire d’orientation emploi.

IDENTITÉ
Nom : ${youth.last_name || ''}
Prénom : ${youth.first_name || ''}
Téléphone : ${youth.phone || ''}
Email : ${youth.email || ''}
Ville : ${youth.city || ''}

ORIENTATION
Secteur principal : ${youth.main_sector || ''}
Métier souhaité : ${youth.desired_job || 'à préciser'}
Référent attribué : ${analysis.assigned_referent}
Niveau estimé : ${analysis.readiness_status} (${analysis.readiness_score}/100)

SYNTHÈSE IA
${analysis.ai_summary}

CONSEILS POUR LE CRE
${analysis.cre_advice}

CONSEILS À TRANSMETTRE AU JEUNE
${analysis.youth_advice}

POINTS FORTS
${analysis.strengths}

POINTS DE VIGILANCE
${analysis.improvements}

TYPE D’ENTREPRISE CONSEILLÉ
${analysis.recommended_companies}

ACTIONS PRIORITAIRES
${analysis.priority_actions || 'À définir après échange CRE.'}

CV : ${cvPath ? 'joint au mail' : 'non déposé'}

Bien cordialement,
OSE Orientation Emploi`;

  const to = analysis.assigned_email;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- EMAIL NON ENVOYÉ : SMTP NON CONFIGURÉ ---');
    console.log('À :', to);
    console.log('Objet :', subject);
    console.log(body);
    return { sent: false, preview: body };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: body,
    attachments: cvPath ? [{ path: cvPath }] : []
  });

  return { sent: true };
}
