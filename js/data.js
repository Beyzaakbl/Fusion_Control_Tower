// ── STATE ──
let programs = [];
let projects = [];
let phases = [];
let actions = [];
let risks = [];
let resources = [];

// ── VERİ YÜKLE ──
async function loadAllData() {
  try {
    showLoading(true);
    const [pg, pr, ph, ac, ri, re] = await Promise.all([
      supabaseFetch('programs'),
      supabaseFetch('projects'),
      supabaseFetch('phases'),
      supabaseFetch('actions'),
      supabaseFetch('risks'),
      supabaseFetch('resources')
    ]);
    programs = pg;
    projects = pr;
    phases = ph;
    actions = ac;
    risks = ri;
    resources = re;
    showLoading(false);
    renderDashboard();
    updateBadges();
  } catch (err) {
    console.error('Veri yüklenemedi:', err);
    showLoading(false);
  }
}

// ── YARDIMCI FONKSİYONLAR ──
function getProjectPhases(projectId) {
  return phases.filter(p => p.project_id === projectId)
               .sort((a, b) => a.order_num - b.order_num);
}

function getPhaseActions(phaseId) {
  return actions.filter(a => a.phase_id === phaseId);
}

function getProjectActions(projectId) {
  const phaseIds = getProjectPhases(projectId).map(p => p.id);
  return actions.filter(a => phaseIds.includes(a.phase_id));
}

function getProjectRisks(projectId) {
  return risks.filter(r => r.project_id === projectId);
}

function getLateActions() {
  const today = new Date();
  today.setHours(0,0,0,0);
  return actions.filter(a => {
    if (a.status === 'done') return false;
    if (!a.due_date) return false;
    return new Date(a.due_date) < today;
  });
}

function getActionCount() {
  return actions.length;
}

// ── CRUD FONKSİYONLARI ──
async function createProject(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result[0]) {
    projects.push(result[0]);
    updateBadges();
  }
  return result[0];
}

async function createPhase(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/phases`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result[0]) phases.push(result[0]);
  return result[0];
}

async function createAction(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/actions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result[0]) {
    actions.push(result[0]);
    updateBadges();
  }
  return result[0];
}

async function toggleAction(id) {
  const a = actions.find(x => x.id === id);
  if (!a) return;
  const newStatus = a.status === 'done' ? 'open' : 'done';
  const ok = await supabaseUpdate('actions', id, { status: newStatus });
  if (ok) {
    a.status = newStatus;
    renderActions();
    updateBadges();
  }
}

async function deleteItem(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  return res.ok;
}

// ── LOADING ──
function showLoading(show) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(255,255,255,.85);
      display:flex;align-items:center;justify-content:center;
      z-index:999;font-size:13px;color:var(--purple);font-weight:600;
      flex-direction:column;gap:10px;
    `;
    el.innerHTML = `
      <div style="width:32px;height:32px;border:3px solid var(--purple-bg);border-top-color:var(--purple);border-radius:50%;animation:spin .7s linear infinite"></div>
      <span>Veriler yükleniyor...</span>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

// ── ROADMAP (statik) ──
const roadmapData = [
  {title:"Phase 1 — Vizyon & Temel Altyapı", tf:"Nisan – Mayıs 2026", col:"var(--red)", items:[
    {n:1, t:"PLM Aracı Değerlendirme & Seçim", d:"YÜG sürecinin omurgası. RFI hazırla, 3 vendor demo.", tags:["YÜG","Altyapı","10g"]},
    {n:2, t:"SAP BP/FM Modülü Aktivasyonu", d:"P2P bütçe kontrolünün ön koşulu.", tags:["P2P","SAP Core","12g"]},
    {n:3, t:"CLM Platform RFI & Demo", d:"Doxagone yetersiz. Yeni CLM için RFI hazırla.", tags:["P2P","Tedarik","8g"]},
    {n:4, t:"Vibecoding Governance Çerçevesi", d:"Veri güvenliği ve erişim kontrolü tanımlanmalı.", tags:["Fusion","Güvenlik","5g"]},
    {n:5, t:"Fusion Control Tower MVP", d:"Proje takibi, çalıştay özeti, IT iş paketi yönetimi.", tags:["Fusion","Geliştirme","15g"]},
  ]},
  {title:"Phase 2 — Dijitalleşme & Entegrasyon", tf:"Haziran – Temmuz 2026", col:"var(--amber)", items:[
    {n:6, t:"SAP Fiori SAT Ekranı UX Tasarımı", d:"Bütçe doğrulayan, konsolidasyon öneren Fiori UI.", tags:["P2P","SAP UX","10g"]},
    {n:7, t:"EBA–SAP–QDMS Entegrasyon Mimarisi", d:"5 sistemin bağlanması için API katmanı.", tags:["P2P","Entegrasyon","8g"]},
    {n:8, t:"YÜG Stage-Gate Dijital İş Akışı", d:"4 gate kriterinin platforma entegrasyonu.", tags:["YÜG","Geliştirme","7g"]},
    {n:9, t:"Teams → Platform Otomatik Entegrasyonu", d:"Toplantı notlarının platforma otomatik akması.", tags:["Fusion","AI","6g"]},
    {n:10, t:"Tedarikçi Portalı Gereksinim Analizi", d:"Self-servis onboarding için gereksinim analizi.", tags:["P2P","Analiz","6g"]},
  ]},
  {title:"Phase 3 — AI & İleri Otomasyon", tf:"Ağustos – Ekim 2026", col:"var(--blue)", items:[
    {n:11, t:"15 AI Agent Teknik Fizibilite", d:"Maliyet analizi ve önceliklendirme raporu.", tags:["YÜG","AI","8g"]},
    {n:12, t:"DAM Kurulumu", d:"Dijital içerik yönetim platformu.", tags:["YÜG","Altyapı","7g"]},
    {n:13, t:"P2P AI Agent Pilotları", d:"Akıllı SAT, Fatura Eşleştirme ve Bütçe Kontrol ajanları.", tags:["P2P","AI","10g"]},
    {n:14, t:"Fusion Kurumsal Hafıza", d:"Tüm çalıştay özetleri üzerinde doğal dil sorgulama.", tags:["Fusion","AI","8g"]},
  ]},
];

const workshopsUpcoming = [
  {d:"15 Nis", day:"Pzt", n:"YÜG Haftalık Çalıştay #2", p:"YÜG", t:"10:00"},
  {d:"15 Nis", day:"Pzt", n:"P2P Tasarım Çalıştayı #2", p:"P2P", t:"14:00"},
  {d:"16 Nis", day:"Sal", n:"HR Dijitalleşme Kick-off", p:"HR", t:"09:30"},
];
