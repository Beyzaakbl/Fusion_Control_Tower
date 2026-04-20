// Uygulama state'i
let projects = [];
let actions = [];
let risks = [];
let resources = [];

// Tüm verileri Supabase'den çek
async function loadAllData() {
  try {
    showLoading(true);
    const [p, a, r, res] = await Promise.all([
      supabaseFetch('projects'),
      supabaseFetch('actions'),
      supabaseFetch('risks'),
      supabaseFetch('resources')
    ]);
    projects = p;
    actions = a;
    risks = r;
    resources = res;
    showLoading(false);
    renderDashboard();
  } catch (err) {
    console.error('Veri yüklenemedi:', err);
    showLoading(false);
  }
}

function showLoading(show) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(255,255,255,.8);
      display:flex;align-items:center;justify-content:center;
      z-index:999;font-size:13px;color:#534ab7;font-weight:500;
    `;
    el.innerHTML = '⟳ Veriler yükleniyor...';
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

// Aksiyon durumunu güncelle (Supabase'e yaz)
async function toggleAction(id) {
  const a = actions.find(x => x.id === id);
  if (!a) return;
  const newStatus = a.status === 'done' ? 'open' : 'done';
  const ok = await supabaseUpdate('actions', id, { status: newStatus });
  if (ok) {
    a.status = newStatus;
    renderActions();
  }
}

// Roadmap verisi (statik kalabilir)
const roadmapData = [
  {title:"Phase 1 — Vizyon & Temel Altyapı", tf:"Nisan – Mayıs 2026", col:"var(--red)", items:[
    {n:1, t:"PLM Aracı Değerlendirme & Seçim", d:"YÜG sürecinin omurgası. RFI hazırla, 3 vendor demo.", tags:["YÜG","Altyapı","10g"]},
    {n:2, t:"SAP BP/FM Modülü Aktivasyonu", d:"P2P bütçe kontrolünün ön
