import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, CheckCircle2, Download, FileText, Gauge, LogOut, Mail, Search, ShieldCheck, Sparkles, Upload, UserRound } from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const sectors = ['BTP', 'Logistique', 'Industrie', 'Restauration', 'Administratif', 'Service à la personne'];
const blockersList = ['Mobilité', 'Garde d’enfant', 'Santé', 'Logement', 'Disponibilité', 'Langue', 'Administratif', 'Manque de confiance', 'Aucun frein'];

const initialForm = {
  punctuality: 3, motivation: 3, autonomy: 3, communication: 3, teamwork: 3, stress: 3, digital: 3,
  blockers: [], secondary_sectors: []
};

function App() {
  const [view, setView] = useState('form');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  return <div className="appShell">
    <nav className="nav glass">
      <div className="brand"><div className="logo">O</div><div><b>OSE Orientation</b><small>IA emploi & dispatch CRE</small></div></div>
      <div className="navActions">
        <button onClick={() => setView('form')} className={view === 'form' ? 'active' : ''}>Questionnaire</button>
        <button onClick={() => setView(token ? 'dashboard' : 'login')} className={view !== 'form' ? 'active' : ''}>Espace CRE</button>
        {token && <button onClick={() => { localStorage.removeItem('token'); setToken(''); setView('login'); }}><LogOut size={16}/> Quitter</button>}
      </div>
    </nav>
    {view === 'form' && <YouthForm />}
    {view === 'login' && <Login setToken={setToken} setView={setView}/>} 
    {view === 'dashboard' && token && <Dashboard token={token}/>} 
  </div>;
}

function YouthForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [cv, setCv] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const steps = ['Identité', 'Projet', 'Prêt à l’emploi', 'Freins & CV'];

  const completion = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggle = (key, value) => setForm(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(x => x !== value) : [...prev[key], value] }));

  async function submit(e) {
    e.preventDefault(); setLoading(true); setResult(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
    if (cv) fd.append('cv', cv);
    const res = await fetch(`${API}/api/youths`, { method: 'POST', body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert(data.error || 'Erreur');
    setResult(data.analysis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return <main className="container">
    <section className="hero heroGrid">
      <div className="heroText">
        <span className="eyebrow"><Sparkles size={15}/> Parcours intelligent</span>
        <h1>Le bon référent, le bon secteur, au bon moment.</h1>
        <p>Un questionnaire plus précis pour analyser le projet du jeune, mesurer sa préparation à l’emploi et envoyer une synthèse exploitable au CRE.</p>
        <div className="heroBadges"><span><ShieldCheck/> Dispatch automatique</span><span><Gauge/> Score emploi</span><span><Mail/> Retour CRE détaillé</span></div>
      </div>
      <div className="heroPanel glass">
        <b>Répartition automatique</b>
        <div className="assign"><span>Sarah</span><em>BTP · Logistique</em></div>
        <div className="assign"><span>Morgane</span><em>Industrie · Restauration</em></div>
        <div className="assign"><span>Caroline</span><em>Administratif</em></div>
        <div className="assign"><span>Menouar</span><em>SAP · Administratif</em></div>
      </div>
    </section>

    {result && <ResultCard result={result}/>} 

    <form onSubmit={submit} className="wizard glass">
      <div className="wizardHeader">
        <div><small>Étape {step + 1}/4</small><h2>{steps[step]}</h2></div>
        <div className="progressRing"><span>{completion}%</span></div>
      </div>
      <div className="progress"><i style={{ width: `${completion}%` }}/></div>

      {step === 0 && <StepCard icon={<UserRound/>} title="Informations générales" subtitle="On identifie le jeune et ses contraintes de base.">
        <Grid><Input label="Prénom" required value={form.first_name || ''} onChange={v=>set('first_name',v)}/><Input label="Nom" required value={form.last_name || ''} onChange={v=>set('last_name',v)}/><Input label="Âge" type="number" value={form.age || ''} onChange={v=>set('age',v)}/><Input label="Téléphone" value={form.phone || ''} onChange={v=>set('phone',v)}/><Input label="Email" type="email" value={form.email || ''} onChange={v=>set('email',v)}/><Input label="Ville" value={form.city || ''} onChange={v=>set('city',v)}/></Grid>
        <Grid><Select label="Moyen de transport" value={form.transport || ''} onChange={v=>set('transport',v)} opts={['Bus/métro/tram','Voiture','Vélo','À pied','Aucun']}/><Input label="Mobilité maximum" placeholder="Ex : Roubaix + 30 min" value={form.mobility || ''} onChange={v=>set('mobility',v)}/><Select label="Disponibilité" value={form.availability || ''} onChange={v=>set('availability',v)} opts={['Immédiate','Sous 2 semaines','Sous 1 mois','À définir']}/></Grid>
      </StepCard>}

      {step === 1 && <StepCard icon={<BriefcaseBusiness/>} title="Projet professionnel" subtitle="On teste la cohérence entre secteur, métier, expérience et contraintes.">
        <Grid><Select label="Secteur principal" required value={form.main_sector || ''} onChange={v=>set('main_sector',v)} opts={sectors}/><Input label="Métier souhaité" value={form.desired_job || ''} placeholder="Ex : agent logistique, aide à domicile..." onChange={v=>set('desired_job',v)}/><Select label="Expérience dans ce secteur" value={form.experience || ''} onChange={v=>set('experience',v)} opts={['Oui','Non']}/><Input label="Diplôme / formation" value={form.diploma || ''} onChange={v=>set('diploma',v)}/><Select label="Type de contrat recherché" value={form.contract_type || ''} onChange={v=>set('contract_type',v)} opts={['Emploi','Alternance','Stage','PMSMP','Formation']}/><Select label="Temps recherché" value={form.working_time || ''} onChange={v=>set('working_time',v)} opts={['Temps plein','Temps partiel','Peu importe']}/></Grid>
        <Grid><Select label="Projet clair dans sa tête ?" value={form.project_clear || ''} onChange={v=>set('project_clear',v)} opts={['Oui','Non']}/><Select label="Accepte les contraintes du secteur ?" value={form.accepts_constraints || ''} onChange={v=>set('accepts_constraints',v)} opts={['Oui','Non']}/><Select label="Sait expliquer sa motivation ?" value={form.can_explain_motivation || ''} onChange={v=>set('can_explain_motivation',v)} opts={['Oui','Non']}/></Grid>
        <Input label="Horaires acceptés" placeholder="Journée, matin, soir, nuit, week-end..." value={form.accepted_hours || ''} onChange={v=>set('accepted_hours',v)}/>
        <p className="miniTitle">Secteurs secondaires éventuels</p><div className="chips">{sectors.map(s => <button type="button" className={form.secondary_sectors.includes(s) ? 'chip selected' : 'chip'} onClick={() => toggle('secondary_sectors', s)} key={s}>{s}</button>)}</div>
      </StepCard>}

      {step === 2 && <StepCard icon={<BarChart3/>} title="Niveau de préparation à l’emploi" subtitle="Ces questions alimentent le score IA et les conseils CRE.">
        <Grid>{['cv_updated:CV à jour','interview_done:A déjà passé un entretien','can_pitch:Sait se présenter en 1 minute','knows_job:Connaît les attentes du métier','available_fast:Disponible rapidement','interview_outfit:Tenue adaptée entretien'].map(x => { const [key,label]=x.split(':'); return <Select key={key} label={label} value={form[key] || ''} onChange={v=>set(key,v)} opts={['Oui','Non']}/>; })}</Grid>
        <Grid><Range label="Ponctualité" val={form.punctuality} onChange={v=>set('punctuality',v)}/><Range label="Motivation" val={form.motivation} onChange={v=>set('motivation',v)}/><Range label="Autonomie" val={form.autonomy} onChange={v=>set('autonomy',v)}/><Range label="Communication" val={form.communication} onChange={v=>set('communication',v)}/><Range label="Travail en équipe" val={form.teamwork} onChange={v=>set('teamwork',v)}/><Range label="Gestion du stress" val={form.stress} onChange={v=>set('stress',v)}/><Range label="Aisance numérique" val={form.digital} onChange={v=>set('digital',v)}/></Grid>
      </StepCard>}

      {step === 3 && <StepCard icon={<Upload/>} title="Freins éventuels et CV" subtitle="Le CV et les freins permettent d’éviter un mauvais positionnement entreprise.">
        <p className="miniTitle">Freins à prendre en compte</p><div className="chips">{blockersList.map(b => <button type="button" className={form.blockers.includes(b) ? 'chip selected' : 'chip'} onClick={() => toggle('blockers', b)} key={b}>{b}</button>)}</div>
        <label className="uploadZone"><Upload/> <span>{cv ? cv.name : 'Déposer le CV en PDF, Word ou DOCX'}</span><input type="file" accept=".pdf,.doc,.docx" onChange={e=>setCv(e.target.files[0])}/></label>
      </StepCard>}

      <div className="wizardActions">
        <button type="button" className="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft size={16}/> Retour</button>
        {step < 3 ? <button type="button" className="primary" onClick={() => setStep(s => Math.min(3, s + 1))}>Continuer <ArrowRight size={16}/></button> : <button className="primary" disabled={loading}>{loading ? 'Analyse en cours...' : 'Envoyer et analyser'}</button>}
      </div>
    </form>
  </main>;
}

function ResultCard({ result }) {
  return <section className="result glass">
    <div className="resultTop"><div><span className="eyebrow"><CheckCircle2 size={15}/> Questionnaire envoyé</span><h2>{result.readiness_status}</h2><p>Score estimé : <b>{result.readiness_score}/100</b> · Référent : <b>{result.assigned_referent}</b></p></div><div className={`bigBadge ${result.readiness_status?.startsWith('Prêt')?'green':result.readiness_status?.startsWith('Partiellement')?'yellow':'red'}`}>{result.readiness_score}</div></div>
    <div className="adviceGrid"><Advice title="Conseil pour le jeune" text={result.youth_advice}/><Advice title="Conseil pour le CRE" text={result.cre_advice}/><Advice title="Entreprise conseillée" text={result.recommended_companies}/></div>
  </section>;
}

function Login({ setToken, setView }) {
  const [email, setEmail] = useState('admin@ose.fr'); const [password, setPassword] = useState('admin123');
  async function login(e){ e.preventDefault(); const res = await fetch(`${API}/api/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) }); const data = await res.json(); if(!res.ok) return alert(data.error); localStorage.setItem('token', data.token); setToken(data.token); setView('dashboard'); }
  return <main className="container narrow"><form onSubmit={login} className="loginCard glass"><span className="eyebrow"><ShieldCheck size={15}/> Espace sécurisé</span><h1>Connexion CRE</h1><p>Accède aux fiches jeunes, aux analyses et aux conseils IA.</p><Input label="Email" value={email} onChange={setEmail}/><Input label="Mot de passe" type="password" value={password} onChange={setPassword}/><button className="primary full">Se connecter</button></form></main>;
}

function Dashboard({ token }) {
  const [stats, setStats] = useState(null); const [rows, setRows] = useState([]); const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const headers = { Authorization: `Bearer ${token}` };
  async function load(){ const s=await fetch(`${API}/api/stats`,{headers}).then(r=>r.json()); setStats(s); const url=new URL(`${API}/api/youths`); if(q) url.searchParams.set('search',q); if(status) url.searchParams.set('status',status); const y=await fetch(url,{headers}).then(r=>r.json()); setRows(y); }
  useEffect(()=>{load()},[q,status]);
  return <main className="container"><section className="hero dashHero"><div><span className="eyebrow"><BarChart3 size={15}/> Pilotage CRE</span><h1>Dashboard orientation emploi</h1><p>Analyse des jeunes, niveaux de préparation, dispatch référents et conseils opérationnels.</p></div><button className="export" onClick={() => fetch(`${API}/api/export.csv`,{headers}).then(r=>r.blob()).then(b=>{const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='jeunes_ose_orientation.csv'; a.click();})}><Download size={17}/> Export CSV</button></section>
    {stats && <div className="stats"><Stat title="Jeunes" value={stats.total}/>{stats.byStatus.map(x => <Stat key={x.label} title={x.label || 'Non classé'} value={x.count}/>)}</div>}
    <div className="filters glass"><div><Search size={18}/><input placeholder="Rechercher un jeune..." value={q} onChange={e=>setQ(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tous les statuts</option><option>Prêt à l’emploi</option><option>Partiellement prêt</option><option>Pas encore prêt</option></select></div>
    <div className="cardsList">{rows.map(r => <YouthCard key={r.id} row={r}/>)}</div>
  </main>;
}

function YouthCard({ row }) {
  const badgeClass = row.readiness_status?.startsWith('Prêt') ? 'green' : row.readiness_status?.startsWith('Partiellement') ? 'yellow' : 'red';
  return <article className="youthCard glass"><div className="youthHead"><div><h3>{row.first_name} {row.last_name}</h3><p>{row.email || 'Email non renseigné'} · {row.phone || 'Téléphone non renseigné'}</p></div><span className={`badge ${badgeClass}`}>{row.readiness_status} · {row.readiness_score}/100</span></div>
    <div className="meta"><span>{row.main_sector}</span><span>{row.assigned_referent}</span><span>{new Date(row.created_at).toLocaleDateString('fr-FR')}</span></div>
    <details><summary><FileText size={16}/> Voir analyse détaillée</summary><div className="detailGrid"><Advice title="Synthèse IA" text={row.ai_summary}/><Advice title="Conseil CRE" text={row.cre_advice}/><Advice title="Conseil jeune" text={row.youth_advice}/><Advice title="Points forts" text={row.strengths}/><Advice title="Vigilances" text={row.improvements}/><Advice title="Entreprise conseillée" text={row.recommended_companies}/></div>{row.cv_filename && <a className="cvLink" href={`${API}/uploads/${row.cv_filename}`} target="_blank">Ouvrir le CV</a>}</details>
  </article>;
}

function StepCard({ icon, title, subtitle, children }) { return <section className="stepCard"><div className="stepTitle"><div className="stepIcon">{icon}</div><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</section>; }
function Advice({ title, text }) { return <div className="advice"><b>{title}</b><p>{String(text || 'Non renseigné').split('\n').map((line,i)=><React.Fragment key={i}>{line}<br/></React.Fragment>)}</p></div>; }
function Grid({ children }) { return <div className="grid">{children}</div>; }
function Input({ label, onChange, type='text', required=false, value='', placeholder }) { return <label className="field"><span>{label}</span><input value={value} required={required} type={type} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>; }
function Select({ label, onChange, opts, required=false, value='' }) { return <label className="field"><span>{label}</span><select value={value} required={required} onChange={e=>onChange(e.target.value)}><option value="">Sélectionner</option>{opts.map(o => <option key={o}>{o}</option>)}</select></label>; }
function Range({ label, val, onChange }) { return <label className="rangeField"><span>{label}<b>{val}/5</b></span><input type="range" min="1" max="5" value={val} onChange={e=>onChange(e.target.value)}/></label>; }
function Stat({ title, value }) { return <div className="stat glass"><span>{title}</span><b>{value}</b></div>; }

createRoot(document.getElementById('root')).render(<App />);
