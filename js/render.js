let gorevFilter = 'all';
let projFilterVal = 'all';

// ── YARDIMCI ──
function pill(r) {
  if (r === 'green') return '<span class="pill pill-green">Yolunda</span>';
  if (r === 'amber') return '<span class="pill pill-amber">Dikkat</span>';
  return '<span class="pill pill-red">Kritik</span>';
}
function dot(r) {
  const c = r === 'green' ? '#639922' : r === 'amber' ? '#ba7517' : '#e24b4a';
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c}"></span>`;
}
function priorityPill(p) {
  if (p === 'high') return '<span class="pill pill-red">Yüksek</span>';
  if (p === 'low') return '<span class="pill pill-gray">Düşük</span>';
  return '<span class="pill pill-amber">Orta</span>';
}
function statusPill(s) {
  if (s === 'done') return '<span class="pill pill-green">Done</span>';
  if (s === 'inprogress') return '<span class="pill pill-blue">In Progress</span>';
  return '<span class="pill pill-gray">To Do</span>';
}
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:600;color:#fff;background:${type==='success'?'#3b6d11':'#a32d2d'};box-shadow:0 4px 12px rgba(0,0,0,.15);transition:opacity .3s`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2000);
}
function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('tr-TR', {day:'2-digit',month:'short',year:'numeric'});
}

// ── BADGES ──
function updateBadges() {
  const late = getLateGorevler();
  const el = id => document.getElementById(id);
  if (el('badge-projects')) el('badge-projects').textContent = projects.length;
  if (el('badge-actions')) el('badge-actions').textContent = late.length;
  if (el('urgency-count')) el('urgency-count').textContent = late.length;
  if (el('metric-late-badge')) el('metric-late-badge').textContent = late.length + ' geç';
  if (el('metric-projects')) el('metric-projects').textContent = projects.length;
  if (el('metric-packs')) el('metric-packs').textContent = isPaketleri.length;
  const avgLoad = resources.length ? Math.round(resources.reduce((s,r)=>s+r.load,0)/resources.length) : 0;
  if (el('metric-load')) el('metric-load').textContent = avgLoad + '%';
  if (el('metric-load-sub')) el('metric-load-sub').textContent =
    resources.filter(r=>r.load>85).map(r=>r.name).join(' & ') || 'Kapasite normal';
  const riskProj = projects.filter(p=>p.rag!=='green').length;
  if (el('metric-projects-sub')) el('metric-projects-sub').textContent =
    `${projects.length-riskProj} yolunda · ${riskProj} riskli`;
}

// ── DASHBOARD ──
function renderDashboard() {
  const late = getLateGorevler();
  const pl = document.getElementById('proj-list');
  if (pl) pl.innerHTML = projects.slice(0,6).map(p => {
    const ipCount = getProjectIsPaketleri(p.id).length;
    const gvCount = getProjectGorevler(p.id).length;
    return `<div class="proj-item" onclick="navigate('hierarchy',null)" style="cursor:pointer">
      <div class="proj-dot" style="background:${p.rag==='green'?'#639922':p.rag==='amber'?'#ba7517':'#e24b4a'}"></div>
      <div class="proj-info">
        <div class="proj-name">${p.name}</div>
        <div class="proj-meta">${ipCount} iş paketi · ${gvCount} görev</div>
      </div>
      ${pill(p.rag)}
      <div class="proj-packs"><div class="proj-packs-num">${ipCount}</div><div class="proj-packs-label">paket</div></div>
    </div>`;
  }).join('') || '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Henüz proje yok</div></div>';

  const am = document.getElementById('action-mini');
  if (am) am.innerHTML = late.slice(0,4).map(g => `
    <div class="action-item" onclick="showEditGorevModal('${g.id}')" style="cursor:pointer">
      <div class="action-body">
        <div class="action-title">${g.title}</div>
        <div class="action-footer">
          <span class="action-due late">⚠ ${formatDate(g.due_date)||'—'}</span>
          <span style="font-size:11px;color:var(--text3)">${g.owner||'Atanmamış'}</span>
        </div>
      </div>
    </div>`).join('') || '<div style="padding:16px;font-size:12px;color:var(--text3)">Gecikmiş görev yok ✓</div>';

  const rm = document.getElementById('risk-mini');
  if (rm) rm.innerHTML = risks.filter(r=>r.status!=='Kapandı').slice(0,4).map(r => `
    <div class="action-item">
      <div style="width:20px;height:20px;border-radius:4px;background:${r.level==='red'?'var(--red-bg)':'var(--amber-bg)'};color:${r.level==='red'?'var(--red)':'var(--amber)'};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${r.level==='red'?'!':'~'}</div>
      <div class="action-body">
        <div class="action-title">${r.description}</div>
        <div class="action-footer"><span style="font-size:11px;color:var(--text3)">${r.owner||'—'}</span></div>
      </div>
    </div>`).join('') || '<div style="padding:16px;font-size:12px;color:var(--text3)">Açık risk yok ✓</div>';

  renderDashboard();

  const wm = document.getElementById('ws-mini');
  if (wm) wm.innerHTML = `
    <div class="ws-card"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">08</div></div>
      <div class="ws-info"><div class="ws-title">YÜG Vizyon Çalıştayı #1</div>
      <div class="ws-sub">08 Nis 2026 · Tamamlandı · AI Analiz Edildi</div>
      <div style="display:flex;gap:4px;margin-top:5px"><span class="pill pill-green">Tamamlandı</span><span class="pill pill-purple">AI Aktif</span></div></div>
    </div></div>
    <div class="ws-card" style="border-bottom:none"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">15</div></div>
      <div class="ws-info"><div class="ws-title">YÜG + P2P Haftalık</div>
      <div class="ws-sub">15 Nis 2026 · 10:00 – 14:00</div>
      <div style="margin-top:5px"><span class="pill pill-amber">Yaklaşan</span></div></div>
    </div></div>`;
}

// ── PROGRAM HİYERARŞİSİ ──
function renderHierarchy() {
  const el = document.getElementById('hierarchy-body');
  if (!el) return;
  const prog = programs[0];
  if (!prog) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-title">Program bulunamadı</div></div>';
    return;
  }
  const progProjects = [...projects].sort((a,b)=>a.order_num-b.order_num);
  el.innerHTML = `
    <div class="prog-header">
      <div class="prog-icon">F</div>
      <div class="prog-info">
        <div class="prog-name">${prog.name}</div>
        <div class="prog-meta">${progProjects.length} proje · ${phases.length} faz · ${isPaketleri.length} iş paketi · ${gorevler.length} görev</div>
      </div>
      <button class="btn btn-sm" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3)" onclick="showAddProjectModal()">+ Proje Ekle</button>
    </div>
    <div id="proj-hierarchy">
      ${progProjects.length ? progProjects.map(p=>renderProjectCard(p)).join('') :
        `<div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">Henüz proje yok</div>
          <button class="btn btn-primary" onclick="showAddProjectModal()">+ Proje Ekle</button>
        </div>`}
    </div>`;
}

function renderProjectCard(p) {
  const projPhases = getProjectPhases(p.id);
  const projIsPaketleri = getProjectIsPaketleri(p.id);
  const projGorevler = getProjectGorevler(p.id);
  const doneCount = projGorevler.filter(g=>g.status==='done').length;
  const progress = projGorevler.length ? Math.round((doneCount/projGorevler.length)*100) : 0;
  const ragColor = p.rag==='green'?'#639922':p.rag==='amber'?'#ba7517':'#e24b4a';
  return `
    <div class="h-project-card">
      <div class="h-project-header" onclick="toggleProjectCard('${p.id}')">
        <div class="h-row-left">
          <div class="h-project-dot" style="background:${ragColor}"></div>
          <div>
            <div class="h-project-title">${p.name}</div>
            <div class="h-project-meta">
              ${projPhases.length} faz · ${projIsPaketleri.length} iş paketi · 
              ${projGorevler.length} görev · %${progress} tamamlandı
              ${p.start_date ? `· ${formatDate(p.start_date)} → ${formatDate(p.end_date)||'?'}` : ''}
            </div>
          </div>
        </div>
        <div class="h-row-right">
          ${pill(p.rag)}
          <button class="btn btn-sm" onclick="event.stopPropagation();showEditProjectModal('${p.id}')">✏️</button>
          <button class="btn btn-sm" onclick="event.stopPropagation();showAddPhaseModal('${p.id}')">+ Faz</button>
          <span class="h-chevron" id="proj-arr-${p.id}">▼</span>
        </div>
      </div>
      <div class="h-progress-wrap">
        <div class="progress"><div class="progress-fill" style="width:${progress}%;background:${ragColor}"></div></div>
      </div>
      <div class="h-project-body" id="proj-body-${p.id}">
        ${projPhases.length ? projPhases.map(ph=>renderPhaseBlock(ph,p)).join('') :
          `<div class="h-empty-hint">Henüz faz yok — <span class="h-link" onclick="showAddPhaseModal('${p.id}')">faz ekle</span></div>`}
      </div>
    </div>`;
}

function renderPhaseBlock(ph, project) {
  const phIsPaketleri = getPhaseIsPaketleri(ph.id);
  const phGorevler = phIsPaketleri.flatMap(ip=>getIsPaketiGorevler(ip.id));
  const doneCount = phGorevler.filter(g=>g.status==='done').length;
  return `
    <div class="h-phase-block">
      <div class="h-phase-header" onclick="togglePhaseBlock('${ph.id}')">
        <div class="h-row-left">
          <div class="h-phase-stripe"></div>
          <div>
            <div class="h-phase-title">${ph.name}</div>
            <div class="h-phase-meta">
              ${formatDate(ph.start_date)||'?'} → ${formatDate(ph.end_date)||'?'} · 
              ${phIsPaketleri.length} iş paketi · ${phGorevler.length} görev · ${doneCount} tamamlandı
            </div>
          </div>
        </div>
        <div class="h-row-right">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();showAddIsPaketiModal('${ph.id}','${project.id}')">+ İş Paketi</button>
          <span class="h-chevron" id="ph-arr-${ph.id}">▼</span>
        </div>
      </div>
      <div class="h-phase-body" id="ph-body-${ph.id}">
        ${phIsPaketleri.length ? phIsPaketleri.map(ip=>renderIsPaketiBlock(ip)).join('') :
          `<div class="h-empty-hint" style="padding-left:32px">
            Henüz iş paketi yok — <span class="h-link" onclick="showAddIsPaketiModal('${ph.id}','${project.id}')">iş paketi ekle</span>
          </div>`}
      </div>
    </div>`;
}

function renderIsPaketiBlock(ip) {
  const ipGorevler = getIsPaketiGorevler(ip.id);
  const doneCount = ipGorevler.filter(g=>g.status==='done').length;
  const progress = ipGorevler.length ? Math.round((doneCount/ipGorevler.length)*100) : 0;
  return `
    <div class="h-ip-block">
      <div class="h-ip-header" onclick="toggleIsPaketiBlock('${ip.id}')">
        <div class="h-row-left">
          <div class="h-ip-icon">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <path d="M3 6h6M3 4h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="h-ip-title">${ip.title}</div>
            <div class="h-ip-meta">
              ${ip.owner?`<span>${ip.owner}</span>`:'<span style="color:var(--text3);font-style:italic">Atanmamış</span>'}
              ${ip.due_date?`· <span>⏱ ${formatDate(ip.due_date)}</span>`:''}
              · <span>${ipGorevler.length} görev · %${progress} tamamlandı</span>
            </div>
          </div>
        </div>
        <div class="h-row-right">
          ${statusPill(ip.status)}
          ${priorityPill(ip.priority)}
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();showAddGorevModal('${ip.id}')">+ Görev</button>
          <div class="h-actions">
            <button class="h-action-btn" onclick="event.stopPropagation();showEditIsPaketiModal('${ip.id}')" title="Düzenle">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            </button>
            <button class="h-action-btn h-action-delete" onclick="event.stopPropagation();deleteIsPaketi('${ip.id}')" title="Sil">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <span class="h-chevron" id="ip-arr-${ip.id}">▼</span>
        </div>
      </div>
      <div class="h-ip-body" id="ip-body-${ip.id}">
        ${ipGorevler.length ? ipGorevler.map(g=>renderGorevRow(g)).join('') :
          `<div class="h-empty-hint" style="padding-left:56px">
            Henüz görev yok — <span class="h-link" onclick="showAddGorevModal('${ip.id}')">görev ekle</span>
          </div>`}
      </div>
    </div>`;
}

function renderGorevRow(g) {
  const done = g.status==='done';
  const late = g.status!=='done' && g.due_date && new Date(g.due_date)<new Date();
  return `
    <div class="h-gorev-row ${done?'h-gorev-done':''}" id="gorev-row-${g.id}">
      <div class="h-row-left">
        <div class="h-gorev-indent"></div>
        <div class="check-box ${done?'done':''}" onclick="toggleGorev('${g.id}')">
          ${done?'<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
        </div>
        <div>
          <div class="h-gorev-title ${done?'done':''}">${g.title}</div>
          <div class="h-gorev-meta">
            ${statusPill(g.status)}
            ${priorityPill(g.priority)}
            ${g.due_date?`<span class="action-due ${late?'late':'ok'}">${late?'⚠ ':''}${formatDate(g.due_date)}</span>`:''}
            <span style="font-size:11px;color:var(--text3)">${g.owner||'Atanmamış'}</span>
          </div>
        </div>
      </div>
      <div class="h-actions">
        <button class="h-action-btn" onclick="showEditGorevModal('${g.id}')" title="Düzenle">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
        </button>
        <button class="h-action-btn h-action-delete" onclick="deleteGorevRow('${g.id}')" title="Sil">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>`;
}

// ── DASHBOARD  ──
function renderDashboard() {
  const el = document.getElementById('-dashboard');
  if (!el) return;

  const projs = projects.filter(p => p.start_date && p.end_date)
                        .sort((a,b) => new Date(a.start_date) - new Date(b.start_date));

  // Bugün pill
  const todayPillEl = document.getElementById('-today-pill');
  const todayLabel = new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'});
  if (todayPillEl) todayPillEl.textContent = '📅 ' + todayLabel;

  if (!projs.length) {
    el.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--text3);font-size:12px">
       için projelere başlangıç ve bitiş tarihi ekleyin —
      <span class="h-link" onclick="navigate('hierarchy',null)" style="color:var(--flormar);cursor:pointer">Hiyerarşiye git →</span>
    </div>`;
    return;
  }

  // ── Sabit 12 ay: Ocak–Aralık (mevcut yıl) ──
  const today    = new Date(); today.setHours(0,0,0,0);
  const year     = today.getFullYear();
  const minDate  = new Date(year, 0, 1);   // 1 Ocak
  const maxDate  = new Date(year, 11, 31); // 31 Aralık
  const totalMs  = maxDate - minDate;

  // 12 ay listesi
  const months = Array.from({length:12}, (_,i) => new Date(year, i, 1));

  const pct = d => Math.max(0, Math.min(100, ((new Date(d) - minDate) / totalMs) * 100));

  // ── Flormar renk paleti — her projeye sırayla ──
  const flormarColors = [
    { bar:'#D94F7A', progress:'rgba(255,255,255,0.28)', dot:'#D94F7A' }, // koyu pembe
    { bar:'#E8738A', progress:'rgba(255,255,255,0.28)', dot:'#E8738A' }, // pembe
    { bar:'#F0987A', progress:'rgba(255,255,255,0.28)', dot:'#F0987A' }, // mercan
    { bar:'#C73B6B', progress:'rgba(255,255,255,0.28)', dot:'#C73B6B' }, // magenta
    { bar:'#F5B8A0', progress:'rgba(255,255,255,0.28)', dot:'#F5B8A0' }, // şeftali
    { bar:'#E05C7F', progress:'rgba(255,255,255,0.28)', dot:'#E05C7F' }, // orta pembe
  ];

  const todayPct  = pct(today);
  const showToday = true; // sabit 12 ay içinde her zaman göster

  const TR_MONTHS = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];

  el.innerHTML = `
    <div class="gd-wrap">

      <!-- AY BAŞLIKLARI -->
      <div class="gd-header">
        <div class="gd-label-col"></div>
        <div class="gd-timeline">
          ${months.map(m => {
            const left  = (m.getMonth() / 12 * 100).toFixed(3);
            const width = (100 / 12).toFixed(3);
            const label = TR_MONTHS[m.getMonth()];
            const isCurrentMonth = m.getMonth() === today.getMonth();
            return `<div class="gd-month ${isCurrentMonth?'gd-month-current':''}" style="left:${left}%;width:${width}%">${label}</div>`;
          }).join('')}
          <div class="gd-today-head" style="left:${todayPct.toFixed(2)}%">Bugün</div>
        </div>
      </div>

      <!-- PROJE SATIRLARI -->
      <div class="gd-rows">
        ${projs.map((p, idx) => {
          const projGorevler = getProjectGorevler(p.id);
          const done         = projGorevler.filter(g=>g.status==='done').length;
          const completePct  = projGorevler.length ? Math.round(done/projGorevler.length*100) : 0;
          const clr          = flormarColors[idx % flormarColors.length];
          const barLeft      = pct(p.start_date);
          const barRight     = pct(p.end_date);
          const barWidth     = Math.max(0.5, barRight - barLeft);
          const labelInside  = barWidth > 10;

          return `
          <div class="gd-row">
            <div class="gd-label-col">
              <div class="gd-proj-dot" style="background:${clr.dot}"></div>
              <div class="gd-proj-name" title="${p.name}">${p.name}</div>
            </div>
            <div class="gd-timeline">
              ${months.map(m => {
                const left = (m.getMonth() / 12 * 100).toFixed(3);
                const isCurrentMonth = m.getMonth() === today.getMonth();
                return `<div class="gd-grid-line ${isCurrentMonth?'gd-grid-current':''}" style="left:${left}%"></div>`;
              }).join('')}
              <div class="gd-today-line" style="left:${todayPct.toFixed(2)}%"><div class="gd-today-dot"></div></div>
              <div class="gd-bar-wrap" style="left:${barLeft.toFixed(2)}%;width:${barWidth.toFixed(2)}%">
                <div class="gd-bar" style="background:${clr.bar}" title="${p.name}&#10;${formatDate(p.start_date)} → ${formatDate(p.end_date)}&#10;%${completePct} tamamlandı">
                  <div class="gd-bar-progress" style="width:${completePct}%;background:${clr.progress}"></div>
                  ${labelInside ? `<span class="gd-bar-label inside">${p.name} · %${completePct}</span>` : ''}
                </div>
              </div>
              ${!labelInside ? `<div class="gd-bar-label-out" style="left:${(barRight+0.5).toFixed(2)}%">${p.name} · %${completePct}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>

    </div>`;
}

// ──  (ayrı sayfa) ──
function render() {
  const el = document.getElementById('-body');
  if (!el) return;

  const projs = projects.filter(p => p.start_date && p.end_date);
  if (!projs.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📅</div>
      <div class="empty-title"> için proje tarihleri gerekli</div>
      <div class="empty-text">Program Hiyerarşisi sayfasından projelere başlangıç ve bitiş tarihi ekleyin.</div>
      <button class="btn btn-primary" onclick="navigate('hierarchy',null)">Hiyerarşiye Git →</button>
    </div>`;
    return;
  }

  // Zaman aralığını hesapla
  const allStarts = projs.map(p => new Date(p.start_date));
  const allEnds   = projs.map(p => new Date(p.end_date));
  const minDate   = new Date(Math.min(...allStarts));
  const maxDate   = new Date(Math.max(...allEnds));
  minDate.setDate(1); // ayın başına al

  const today = new Date();
  today.setHours(0,0,0,0);

  const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1;

  // Ay başlıklarını oluştur
  const months = [];
  let cur = new Date(minDate);
  while (cur <= maxDate) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  // Bugünün pozisyonu
  const todayOffset = Math.floor((today - minDate) / 86400000);
  const todayPct    = (todayOffset / totalDays) * 100;
  const showToday   = todayOffset >= 0 && todayOffset <= totalDays;

  const ragColor = r => r==='green'?'#639922':r==='amber'?'#ba7517':'#e24b4a';

  el.innerHTML = `
    <div class="-wrap">
      <!-- Ay başlıkları -->
      <div class="-header">
        <div class="-label-col"></div>
        <div class="-timeline" style="position:relative">
          ${months.map(m => {
            const mStart  = new Date(m.getFullYear(), m.getMonth(), 1);
            const mEnd    = new Date(m.getFullYear(), m.getMonth()+1, 0);
            const left    = Math.max(0, (mStart - minDate)/86400000/totalDays*100);
            const width   = Math.min(100-left, (Math.min(mEnd,maxDate)-Math.max(mStart,minDate))/86400000/totalDays*100);
            return `<div class="-month" style="left:${left}%;width:${width}%">
              ${m.toLocaleDateString('tr-TR',{month:'short',year:'2-digit'})}
            </div>`;
          }).join('')}
          ${showToday ? `<div class="-today-header" style="left:${todayPct}%">Bugün</div>` : ''}
        </div>
      </div>

      <!-- Proje satırları -->
      <div class="-rows">
        ${projs.map(p => {
          const s    = new Date(p.start_date);
          const e    = new Date(p.end_date);
          const left = ((s - minDate)/86400000/totalDays*100).toFixed(2);
          const w    = ((e - s)/86400000/totalDays*100).toFixed(2);
          const projGorevler = getProjectGorevler(p.id);
          const done = projGorevler.filter(g=>g.status==='done').length;
          const pct  = projGorevler.length ? Math.round(done/projGorevler.length*100) : 0;
          const color = ragColor(p.rag);

          return `
            <div class="-row">
              <div class="-label-col">
                <div class="-proj-dot" style="background:${color}"></div>
                <div class="-proj-name">${p.name}</div>
              </div>
              <div class="-timeline" style="position:relative">
                ${showToday ? `<div class="-today-line" style="left:${todayPct}%"></div>` : ''}
                <div class="-bar-wrap" style="left:${left}%;width:${w}%">
                  <div class="-bar" style="background:${color}" title="${p.name}: ${formatDate(p.start_date)} → ${formatDate(p.end_date)}">
                    <div class="-bar-fill" style="width:${pct}%;background:rgba(255,255,255,.35)"></div>
                    <span class="-bar-label">${p.name} · %${pct}</span>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>

      <!-- Bugün etiketi -->
      ${showToday ? `<div class="-today-badge" style="left:calc(200px + ${todayPct}% * (100% - 200px) / 100)">
        📅 ${today.toLocaleDateString('tr-TR',{day:'2-digit',month:'short',year:'numeric'})}
      </div>` : ''}
    </div>`;
}

// ── TOGGLE ──
function toggleProjectCard(id) {
  const body = document.getElementById('proj-body-'+id);
  const arr  = document.getElementById('proj-arr-'+id);
  if (!body) return;
  const open = body.style.display!=='none';
  body.style.display = open?'none':'block';
  if (arr) arr.style.transform = open?'rotate(-90deg)':'';
}
function togglePhaseBlock(id) {
  const body = document.getElementById('ph-body-'+id);
  const arr  = document.getElementById('ph-arr-'+id);
  if (!body) return;
  const open = body.style.display!=='none';
  body.style.display = open?'none':'block';
  if (arr) arr.style.transform = open?'rotate(-90deg)':'';
}
function toggleIsPaketiBlock(id) {
  const body = document.getElementById('ip-body-'+id);
  const arr  = document.getElementById('ip-arr-'+id);
  if (!body) return;
  const open = body.style.display!=='none';
  body.style.display = open?'none':'block';
  if (arr) arr.style.transform = open?'rotate(-90deg)':'';
}

// ── MODAL ──
function showModal(html) {
  let ov = document.getElementById('modal-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'modal-overlay';
    ov.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px`;
    ov.onclick = e => { if (e.target===ov) closeModal(); };
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="modal-box">${html}</div>`;
  ov.style.display = 'flex';
}
function closeModal() {
  const o = document.getElementById('modal-overlay');
  if (o) o.style.display='none';
}

// ── PROJE MODAL ──
function showAddProjectModal() {
  showModal(`
    <div class="modal-header"><span class="modal-title">Yeni Proje</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Proje Adı *</label><input id="m-proj-name" class="form-input" placeholder="Örn: Yeni Ürün Geliştirme"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-proj-desc" class="form-input" rows="2"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-proj-start" type="date" class="form-input"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-proj-end" type="date" class="form-input"></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="m-proj-rag" class="form-input">
          <option value="green">Yolunda</option>
          <option value="amber" selected>Dikkat</option>
          <option value="red">Kritik</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitAddProject()">Kaydet</button>
    </div>`);
}
async function submitAddProject() {
  const name = document.getElementById('m-proj-name').value.trim();
  if (!name) { toast('Proje adı zorunlu','error'); return; }
  const result = await createProject({
    program_id: programs[0]?.id,
    name,
    description: document.getElementById('m-proj-desc').value,
    rag: document.getElementById('m-proj-rag').value,
    start_date: document.getElementById('m-proj-start').value || null,
    end_date: document.getElementById('m-proj-end').value || null,
    order_num: projects.length+1
  });
  if (result) { toast('Proje eklendi ✓'); closeModal(); renderHierarchy(); }
}

function showEditProjectModal(id) {
  const p = projects.find(x=>x.id===id);
  if (!p) return;
  showModal(`
    <div class="modal-header"><span class="modal-title">Projeyi Düzenle</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Proje Adı *</label><input id="m-edit-proj-name" class="form-input" value="${p.name}"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-edit-proj-desc" class="form-input" rows="2">${p.description||''}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-edit-proj-start" type="date" class="form-input" value="${p.start_date||''}"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-edit-proj-end" type="date" class="form-input" value="${p.end_date||''}"></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="m-edit-proj-rag" class="form-input">
          <option value="green" ${p.rag==='green'?'selected':''}>Yolunda</option>
          <option value="amber" ${p.rag==='amber'?'selected':''}>Dikkat</option>
          <option value="red" ${p.rag==='red'?'selected':''}>Kritik</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitEditProject('${id}')">Kaydet</button>
    </div>`);
}
async function submitEditProject(id) {
  const name = document.getElementById('m-edit-proj-name').value.trim();
  if (!name) { toast('Proje adı zorunlu','error'); return; }
  const data = {
    name,
    description: document.getElementById('m-edit-proj-desc').value,
    rag: document.getElementById('m-edit-proj-rag').value,
    start_date: document.getElementById('m-edit-proj-start').value || null,
    end_date: document.getElementById('m-edit-proj-end').value || null,
  };
  const ok = await supabaseUpdate('projects', id, data);
  if (ok) {
    const p = projects.find(x=>x.id===id);
    if (p) Object.assign(p, data);
    toast('Proje güncellendi ✓');
    closeModal();
    renderHierarchy();
    render();
    renderDashboard();
  }
}

// ── FAZ MODAL ──
function showAddPhaseModal(projectId) {
  const p = projects.find(x=>x.id===projectId);
  showModal(`
    <div class="modal-header"><span class="modal-title">Faz Ekle — ${p?.name||''}</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Faz Adı *</label><input id="m-ph-name" class="form-input" placeholder="Örn: Faz 1 — Vizyon & Temel Altyapı"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-ph-desc" class="form-input" rows="2"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-ph-start" type="date" class="form-input"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-ph-end" type="date" class="form-input"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitAddPhase('${projectId}')">Kaydet</button>
    </div>`);
}
async function submitAddPhase(projectId) {
  const name = document.getElementById('m-ph-name').value.trim();
  if (!name) { toast('Faz adı zorunlu','error'); return; }
  const result = await createPhase({
    project_id: projectId,
    name,
    description: document.getElementById('m-ph-desc').value,
    start_date: document.getElementById('m-ph-start').value || null,
    end_date: document.getElementById('m-ph-end').value || null,
    order_num: getProjectPhases(projectId).length+1
  });
  if (result) { toast('Faz eklendi ✓'); closeModal(); renderHierarchy(); }
}

// ── İŞ PAKETİ MODAL ──
function showAddIsPaketiModal(phaseId, projectId) {
  const ph = phases.find(x=>x.id===phaseId);
  showModal(`
    <div class="modal-header"><span class="modal-title">İş Paketi Ekle — ${ph?.name||''}</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>İş Paketi Adı *</label><input id="m-ip-title" class="form-input" placeholder="Örn: PLM Aracı Değerlendirme"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-ip-desc" class="form-input" rows="2"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Sorumlu Ekip</label>
  <select id="m-ip-owner" class="form-input">
    <option value="">— Seç —</option>
    ${resources.map(r => `<option value="${r.team}">${r.team} · ${r.name}</option>`).join('')}
  </select>
</div>
        <div class="form-group"><label>Öncelik</label>
          <select id="m-ip-priority" class="form-input">
            <option value="high">Yüksek</option>
            <option value="medium" selected>Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-ip-start" type="date" class="form-input"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-ip-due" type="date" class="form-input"></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="m-ip-status" class="form-input">
          <option value="todo" selected>To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitAddIsPaketi('${phaseId}')">Kaydet</button>
    </div>`);
}
async function submitAddIsPaketi(phaseId) {
  const title = document.getElementById('m-ip-title').value.trim();
  if (!title) { toast('İş paketi adı zorunlu','error'); return; }
  const result = await createIsPaketi({
    phase_id: phaseId,
    title,
    description: document.getElementById('m-ip-desc').value,
    owner: document.getElementById('m-ip-owner').value,
    priority: document.getElementById('m-ip-priority').value,
    start_date: document.getElementById('m-ip-start').value || null,
    due_date: document.getElementById('m-ip-due').value || null,
    status: document.getElementById('m-ip-status').value
  });
  if (result) { toast('İş paketi eklendi ✓'); closeModal(); renderHierarchy(); }
}

function showEditIsPaketiModal(id) {
  const ip = isPaketleri.find(x=>x.id===id);
  if (!ip) return;
  showModal(`
    <div class="modal-header"><span class="modal-title">İş Paketi Düzenle</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>İş Paketi Adı *</label><input id="m-edit-ip-title" class="form-input" value="${ip.title}"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-edit-ip-desc" class="form-input" rows="2">${ip.description||''}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Sorumlu Ekip</label>
  <select id="m-edit-ip-owner" class="form-input">
    <option value="">— Seç —</option>
    ${resources.map(r => `<option value="${r.team}" ${ip.owner===r.team?'selected':''}>${r.team} · ${r.name}</option>`).join('')}
  </select>
</div>
        <div class="form-group"><label>Öncelik</label>
          <select id="m-edit-ip-priority" class="form-input">
            <option value="high" ${ip.priority==='high'?'selected':''}>Yüksek</option>
            <option value="medium" ${ip.priority==='medium'?'selected':''}>Orta</option>
            <option value="low" ${ip.priority==='low'?'selected':''}>Düşük</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-edit-ip-start" type="date" class="form-input" value="${ip.start_date||''}"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-edit-ip-due" type="date" class="form-input" value="${ip.due_date||''}"></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="m-edit-ip-status" class="form-input">
          <option value="todo" ${ip.status==='todo'?'selected':''}>To Do</option>
          <option value="inprogress" ${ip.status==='inprogress'?'selected':''}>In Progress</option>
          <option value="done" ${ip.status==='done'?'selected':''}>Done</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitEditIsPaketi('${id}')">Kaydet</button>
    </div>`);
}
async function submitEditIsPaketi(id) {
  const title = document.getElementById('m-edit-ip-title').value.trim();
  if (!title) { toast('İş paketi adı zorunlu','error'); return; }
  const data = {
    title,
    description: document.getElementById('m-edit-ip-desc').value,
    owner: document.getElementById('m-edit-ip-owner').value,
    priority: document.getElementById('m-edit-ip-priority').value,
    start_date: document.getElementById('m-edit-ip-start').value || null,
    due_date: document.getElementById('m-edit-ip-due').value || null,
    status: document.getElementById('m-edit-ip-status').value
  };
  const ok = await supabaseUpdate('is_paketleri', id, data);
  if (ok) {
    const ip = isPaketleri.find(x=>x.id===id);
    if (ip) Object.assign(ip, data);
    toast('İş paketi güncellendi ✓');
    closeModal();
    renderHierarchy();
  }
}
async function deleteIsPaketi(id) {
  if (!confirm('Bu iş paketini silmek istediğinizden emin misiniz? İçindeki görevler de silinecek.')) return;
  const ok = await deleteItem('is_paketleri', id);
  if (ok) {
    isPaketleri = isPaketleri.filter(x=>x.id!==id);
    gorevler = gorevler.filter(g=>g.is_paketi_id!==id);
    toast('İş paketi silindi');
    renderHierarchy();
    updateBadges();
  }
}

// ── GÖREV MODAL ──
function showAddGorevModal(isPaketiId) {
  const ip = isPaketleri.find(x=>x.id===isPaketiId);
  showModal(`
    <div class="modal-header"><span class="modal-title">Görev Ekle — ${ip?.title||''}</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Görev Adı *</label><input id="m-gv-title" class="form-input" placeholder="Görev açıklaması..."></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-gv-desc" class="form-input" rows="2"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Sorumlu</label><input id="m-gv-owner" class="form-input" placeholder="Ad Soyad"></div>
        <div class="form-group"><label>Öncelik</label>
          <select id="m-gv-priority" class="form-input">
            <option value="high">Yüksek</option>
            <option value="medium" selected>Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-gv-start" type="date" class="form-input"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-gv-due" type="date" class="form-input"></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="m-gv-status" class="form-input">
          <option value="todo" selected>To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitAddGorev('${isPaketiId}')">Kaydet</button>
    </div>`);
}
async function submitAddGorev(isPaketiId) {
  const title = document.getElementById('m-gv-title').value.trim();
  if (!title) { toast('Görev adı zorunlu','error'); return; }
  const result = await createGorev({
    is_paketi_id: isPaketiId,
    title,
    description: document.getElementById('m-gv-desc').value,
    owner: document.getElementById('m-gv-owner').value,
    priority: document.getElementById('m-gv-priority').value,
    start_date: document.getElementById('m-gv-start').value || null,
    due_date: document.getElementById('m-gv-due').value || null,
    status: document.getElementById('m-gv-status').value
  });
  if (result) { toast('Görev eklendi ✓'); closeModal(); renderHierarchy(); }
}

function showEditGorevModal(id) {
  const g = gorevler.find(x=>x.id===id);
  if (!g) return;
  showModal(`
    <div class="modal-header"><span class="modal-title">Görevi Düzenle</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Görev Adı *</label><input id="m-edit-gv-title" class="form-input" value="${g.title}"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-edit-gv-desc" class="form-input" rows="2">${g.description||''}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Sorumlu</label><input id="m-edit-gv-owner" class="form-input" value="${g.owner||''}"></div>
        <div class="form-group"><label>Öncelik</label>
          <select id="m-edit-gv-priority" class="form-input">
            <option value="high" ${g.priority==='high'?'selected':''}>Yüksek</option>
            <option value="medium" ${g.priority==='medium'?'selected':''}>Orta</option>
            <option value="low" ${g.priority==='low'?'selected':''}>Düşük</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç</label><input id="m-edit-gv-start" type="date" class="form-input" value="${g.start_date||''}"></div>
        <div class="form-group"><label>Bitiş</label><input id="m-edit-gv-due" type="date" class="form-input" value="${g.due_date||''}"></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="m-edit-gv-status" class="form-input">
          <option value="todo" ${g.status==='todo'?'selected':''}>To Do</option>
          <option value="inprogress" ${g.status==='inprogress'?'selected':''}>In Progress</option>
          <option value="done" ${g.status==='done'?'selected':''}>Done</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitEditGorev('${id}')">Kaydet</button>
    </div>`);
}
async function submitEditGorev(id) {
  const title = document.getElementById('m-edit-gv-title').value.trim();
  if (!title) { toast('Görev adı zorunlu','error'); return; }
  const data = {
    title,
    description: document.getElementById('m-edit-gv-desc').value,
    owner: document.getElementById('m-edit-gv-owner').value,
    priority: document.getElementById('m-edit-gv-priority').value,
    start_date: document.getElementById('m-edit-gv-start').value || null,
    due_date: document.getElementById('m-edit-gv-due').value || null,
    status: document.getElementById('m-edit-gv-status').value
  };
  const ok = await supabaseUpdate('gorevler', id, data);
  if (ok) {
    const g = gorevler.find(x=>x.id===id);
    if (g) Object.assign(g, data);
    toast('Görev güncellendi ✓');
    closeModal();
    renderHierarchy();
    updateBadges();
  }
}
async function deleteGorevRow(id) {
  if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
  const ok = await deleteItem('gorevler', id);
  if (ok) {
    gorevler = gorevler.filter(g=>g.id!==id);
    toast('Görev silindi');
    renderHierarchy();
    updateBadges();
  }
}

// ── TÜM GÖREVLER ──
function renderActions() {
  const q = (document.getElementById('action-search')||{value:''}).value.toLowerCase();
  let list = [...gorevler];
  if (gorevFilter==='late') list = getLateGorevler();
  else if (gorevFilter==='inprogress') list = list.filter(g=>g.status==='inprogress');
  else if (gorevFilter==='todo') list = list.filter(g=>g.status==='todo');
  else if (gorevFilter==='done') list = list.filter(g=>g.status==='done');
  if (q) list = list.filter(g=>g.title.toLowerCase().includes(q));

  const el = document.getElementById('action-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-title">Görev bulunamadı</div></div>`;
    return;
  }
  el.innerHTML = list.map(g => {
    const done = g.status==='done';
    const late = g.status!=='done' && g.due_date && new Date(g.due_date)<new Date();
    const ip   = isPaketleri.find(x=>x.id===g.is_paketi_id);
    const ph   = ip ? phases.find(x=>x.id===ip.phase_id) : null;
    const proj = ph ? projects.find(x=>x.id===ph.project_id) : null;
    return `<div class="action-item">
      <div class="action-body">
        <div class="action-title ${done?'done':''}">${g.title}</div>
        <div class="action-footer">
          ${proj?`<span class="tag">${proj.name}</span>`:''}
          ${ip?`<span class="tag" style="background:var(--purple-bg);color:var(--purple)">${ip.title}</span>`:''}
          ${statusPill(g.status)}
          ${priorityPill(g.priority)}
          ${g.due_date?`<span class="action-due ${late?'late':'ok'}">${late?'⚠ ':''}${formatDate(g.due_date)}</span>`:''}
          <span style="font-size:11px;color:var(--text3)">${g.owner||'Atanmamış'}</span>
        </div>
      </div>
      <button class="h-action-btn" onclick="showEditGorevModal('${g.id}')">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      </button>
    </div>`;
  }).join('');
}
function filterAction(f, el) {
  gorevFilter = f;
  document.querySelectorAll('#action-filter-chips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderActions();
}

// ── KAYNAKLAR ──
// ── KAYNAKLAR & GANTT ──
function renderResources() {
  const teamFilter = document.getElementById('gantt-filter-team')?.value || 'all';
  const projectFilter = document.getElementById('gantt-filter-project')?.value || 'all';

  // Filtreleri doldur
  const teamSelect = document.getElementById('gantt-filter-team');
  const projectSelect = document.getElementById('gantt-filter-project');
  if (teamSelect && teamSelect.options.length <= 1) {
    const teams = [...new Set(resources.map(r => r.team).filter(Boolean))];
    teams.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t;
      teamSelect.appendChild(o);
    });
  }
  if (projectSelect && projectSelect.options.length <= 1) {
    projects.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      projectSelect.appendChild(o);
    });
  }

  // Kapasite listesi
  const el = document.getElementById('resource-list');
  if (el) {
    let filteredRes = resources;
    if (teamFilter !== 'all') filteredRes = resources.filter(r => r.team === teamFilter);
    if (!filteredRes.length) {
      el.innerHTML = '<div style="padding:16px;font-size:12px;color:var(--text3)">Ekip bulunamadı</div>';
    } else {
      el.innerHTML = filteredRes.map(r => {
        const h = r.load > 85, m = r.load > 65;
        const c = h ? 'var(--red)' : m ? 'var(--amber)' : 'var(--green)';
        const bg = h ? 'var(--red-bg)' : m ? 'var(--amber-bg)' : 'var(--green-bg)';
        const ini = r.name.replace('.', ' ').split(' ').map(w => w[0]).join('');
        return `<div class="res-row">
          <div class="avatar" style="background:${bg};color:${c}">${ini}</div>
          <div style="min-width:200px">
            <div style="font-size:12px;font-weight:500">${r.team || r.name}</div>
            <div style="font-size:10px;color:var(--text3)">${r.name} · ${r.role}</div>
          </div>
          <div class="cap-track"><div class="cap-fill" style="width:${r.load}%;background:${c}"></div></div>
          <div style="min-width:36px;text-align:right;font-size:12px;font-weight:600;color:${c}">${r.load}%</div>
        </div>`;
      }).join('');
    }
  }

  // Gantt
  renderGantt(teamFilter, projectFilter);
}

function renderGantt(teamFilter, projectFilter) {
  const el = document.getElementById('resource-gantt');
  if (!el) return;

  // Tarih aralığını hesapla
  const allDates = isPaketleri
    .filter(ip => ip.start_date && ip.due_date)
    .flatMap(ip => [new Date(ip.start_date), new Date(ip.due_date)]);

  if (!allDates.length) {
    el.innerHTML = '<div style="padding:16px;font-size:12px;color:var(--text3)">Tarihi olan iş paketi bulunamadı</div>';
    return;
  }

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  minDate.setDate(1);
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setDate(1);

  const totalDays = Math.ceil((maxDate - minDate) / 86400000);

  // Ayları hesapla
  const months = [];
  const cursor = new Date(minDate);
  while (cursor < maxDate) {
    months.push({
      label: cursor.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
      days: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate(),
      offset: Math.ceil((cursor - minDate) / 86400000)
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Ekipleri filtrele
  let filteredResources = resources.filter(r => r.team);
  if (teamFilter !== 'all') filteredResources = filteredResources.filter(r => r.team === teamFilter);

  // İş paketlerini hazırla
  const getPackages = (team) => {
    return isPaketleri.filter(ip => {
      if (ip.owner !== team) return false;
      if (!ip.start_date || !ip.due_date) return false;
      if (projectFilter !== 'all') {
        const ph = phases.find(x => x.id === ip.phase_id);
        if (!ph || ph.project_id !== projectFilter) return false;
      }
      return true;
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = Math.ceil((today - minDate) / 86400000);

  const LABEL_W = 160;
  const ROW_H = 36;
  const HEADER_H = 32;

  let html = `<div style="min-width:700px">`;

  // Header — aylar
  html += `<div style="display:flex;margin-left:${LABEL_W}px;border-bottom:1px solid var(--border)">`;
  months.forEach(m => {
    const w = (m.days / totalDays) * 100;
    html += `<div style="flex:${m.days};text-align:center;font-size:11px;font-weight:600;color:var(--text2);padding:6px 0;border-right:1px solid var(--border)">${m.label}</div>`;
  });
  html += `</div>`;

  // Bugün çizgisi pozisyonu
  const todayPct = todayOffset >= 0 ? (todayOffset / totalDays * 100).toFixed(2) : null;

  // Ekip satırları
  filteredResources.forEach(r => {
    const packages = getPackages(r.team);

    html += `
      <div style="display:flex;align-items:stretch;border-bottom:1px solid var(--border);min-height:${ROW_H}px">
        <div style="width:${LABEL_W}px;flex-shrink:0;padding:8px 12px;border-right:1px solid var(--border);display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${r.team}</div>
          <div style="font-size:10px;color:var(--text3)">${r.name}</div>
        </div>
        <div style="flex:1;position:relative;min-height:${Math.max(ROW_H, packages.length * 28 + 8)}px">`;

    // Bugün çizgisi
    if (todayPct && todayOffset >= 0 && todayOffset <= totalDays) {
      html += `<div style="position:absolute;left:${todayPct}%;top:0;bottom:0;width:1px;background:var(--red);opacity:0.5;z-index:1"></div>`;
    }

    // Ay grid çizgileri
    months.forEach(m => {
      const pct = (m.offset / totalDays * 100).toFixed(2);
      html += `<div style="position:absolute;left:${pct}%;top:0;bottom:0;width:1px;background:var(--border);opacity:0.5"></div>`;
    });

    // İş paketi barları
    packages.forEach((ip, i) => {
      const start = new Date(ip.start_date);
      const end = new Date(ip.due_date);
      const startOffset = Math.ceil((start - minDate) / 86400000);
      const duration = Math.ceil((end - start) / 86400000) + 1;
      const leftPct = (startOffset / totalDays * 100).toFixed(2);
      const widthPct = (duration / totalDays * 100).toFixed(2);

      const proj = (() => {
        const ph = phases.find(x => x.id === ip.phase_id);
        return ph ? projects.find(x => x.id === ph.project_id) : null;
      })();

      const isLate = ip.status !== 'done' && new Date(ip.due_date) < today;
      const isDone = ip.status === 'done';
      const barColor = isDone ? 'var(--green)' : isLate ? 'var(--red)' : 'var(--purple)';

      const top = 6 + i * 28;

      html += `
        <div title="${ip.title} · ${proj?.name || ''} · ${ip.start_date} → ${ip.due_date}"
          style="position:absolute;left:${leftPct}%;width:${widthPct}%;top:${top}px;height:20px;
                 background:${barColor};opacity:0.85;border-radius:4px;
                 display:flex;align-items:center;padding:0 6px;box-sizing:border-box;
                 cursor:default;overflow:hidden;z-index:2">
          <span style="font-size:10px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${ip.title}${proj ? ' · ' + proj.name : ''}
          </span>
        </div>`;
    });

    if (!packages.length) {
      html += `<div style="padding:10px 12px;font-size:11px;color:var(--text3)">Bu ekibe atanmış iş paketi yok</div>`;
    }

    html += `</div></div>`;
  });

  // Lejant
  html += `
    <div style="display:flex;gap:16px;padding:10px 12px;border-top:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:var(--purple)"></div><span style="font-size:11px;color:var(--text3)">Devam ediyor</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:var(--green)"></div><span style="font-size:11px;color:var(--text3)">Tamamlandı</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:var(--red)"></div><span style="font-size:11px;color:var(--text3)">Gecikmiş</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:1px;height:12px;background:var(--red)"></div><span style="font-size:11px;color:var(--text3)">Bugün</span></div>
    </div>`;

  html += `</div>`;
  el.innerHTML = html;
}

// ── RİSKLER ──
function renderRisks() {
  const el = document.getElementById('risk-table');
  if (!el) return;
  if (!risks.length) {
    el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">Risk bulunamadı</td></tr>';
    return;
  }
  el.innerHTML = risks.map(r => {
    const project = projects.find(p=>p.id===r.project_id);
    return `<tr>
      <td>${pill(r.level)}</td>
      <td class="td-wrap" style="font-size:12px">${r.description}</td>
      <td><span class="tag">${project?.name||'—'}</span></td>
      <td style="color:var(--text2);font-size:11px">${r.owner||'—'}</td>
      <td><span class="pill ${r.status==='Kapandı'?'pill-green':r.status==='İzleniyor'?'pill-amber':'pill-red'}">${r.status}</span></td>
    </tr>`;
  }).join('');
}

// ── ROADMAP ──
function renderRoadmap() {
  const el = document.getElementById('roadmap-body');
  if (!el) return;
  el.innerHTML = roadmapData.map((ph,i) => `
    <div class="phase-card">
      <div class="phase-header" onclick="togglePhase(${i})">
        <div class="phase-stripe" style="background:${ph.col}"></div>
        <div class="phase-meta"><div class="phase-title">${ph.title}</div><div class="phase-timeframe">${ph.tf}</div></div>
        <span class="phase-count">${ph.items.length} iş paketi</span>
        <span class="phase-chevron open" id="rm-arr-${i}">▼</span>
      </div>
      <div class="phase-body" id="ph-body-r-${i}">
        ${ph.items.map(it=>`
          <div class="roadmap-item">
            <div class="rmap-num" style="background:${ph.col}22;color:${ph.col}">${it.n}</div>
            <div class="rmap-body">
              <div class="rmap-title">${it.t}</div>
              <div class="rmap-desc">${it.d}</div>
              <div class="rmap-tags">${it.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}
function togglePhase(i) {
  const b=document.getElementById('ph-body-r-'+i);
  const a=document.getElementById('rm-arr-'+i);
  if (!b) return;
  const open=b.style.display!=='none';
  b.style.display=open?'none':'block';
  if (a) a.style.transform=open?'rotate(-90deg)':'';
}

// ── BRİFİNG ──
function renderBriefing() {
  const el = document.getElementById('briefing-content');
  if (!el) return;
  const lateCount = getLateGorevler().length;
  const avgLoad = resources.length?Math.round(resources.reduce((s,r)=>s+r.load,0)/resources.length):0;
  el.innerHTML = `
    <div class="brief-kpis">
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--purple)">${projects.length}</div><div class="brief-kpi-label">Aktif Proje</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--amber)">${isPaketleri.length}</div><div class="brief-kpi-label">İş Paketi</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--red)">${lateCount}</div><div class="brief-kpi-label">Gecikmiş Görev</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--teal)">${avgLoad}%</div><div class="brief-kpi-label">Ort. Kapasite</div></div>
    </div>
    <div style="font-size:12px;line-height:1.8;color:var(--text)">
      <strong>Flormar Fusion</strong> programı kapsamında <strong>${projects.length} aktif proje</strong>, 
      <strong>${isPaketleri.length} iş paketi</strong> ve <strong>${gorevler.length} görev</strong> takip edilmektedir.
      ${lateCount>0?`<span style="color:var(--red)"> ${lateCount} gecikmiş görev bulunmaktadır.</span>`:'Tüm görevler zamanındadır.'}
    </div>`;
}

// ── WORKSHOPS ──
// ── WORKSHOPS ──
function renderWorkshops() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const past = workshops.filter(w => {
    if (!w.end_time) return false;
    return new Date(w.end_time) < now;
  });
  const today = workshops.filter(w => {
    if (!w.start_time) return false;
    return w.start_time.slice(0, 10) === todayStr;
  });
  const upcoming = workshops.filter(w => {
    if (!w.start_time) return false;
    return new Date(w.start_time) > now && w.start_time.slice(0, 10) !== todayStr;
  });

  const tabs = document.getElementById('ws-tabs');
  const body = document.getElementById('ws-body');
  if (!tabs || !body) return;

  let activeTab = tabs.querySelector('.tab.active')?.dataset?.tab || 'upcoming';

  tabs.innerHTML = `
    <div class="tab ${activeTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming" onclick="wsTab('upcoming',this)">
      Yaklaşan <span class="nav-badge" style="margin-left:4px">${upcoming.length}</span>
    </div>
    <div class="tab ${activeTab === 'today' ? 'active' : ''}" data-tab="today" onclick="wsTab('today',this)">
      Bugün <span class="nav-badge" style="margin-left:4px">${today.length}</span>
    </div>
    <div class="tab ${activeTab === 'past' ? 'active' : ''}" data-tab="past" onclick="wsTab('past',this)">
      Geçmiş <span class="nav-badge" style="margin-left:4px">${past.length}</span>
    </div>`;

  const listMap = { upcoming, today, past };
  renderWsTab(listMap[activeTab] || [], body);
}

function wsTab(tab, el) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  document.querySelectorAll('#ws-tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  el.dataset.tab = tab;

  const past = workshops.filter(w => w.end_time && new Date(w.end_time) < now);
  const today = workshops.filter(w => w.start_time && w.start_time.slice(0, 10) === todayStr);
  const upcoming = workshops.filter(w => w.start_time && new Date(w.start_time) > now && w.start_time.slice(0, 10) !== todayStr);

  const listMap = { upcoming, today, past };
  renderWsTab(listMap[tab] || [], document.getElementById('ws-body'));
}

function renderWsTab(list, el) {
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">Bu kategoride çalıştay yok</div></div>`;
    return;
  }
  el.innerHTML = list.map(w => wsCard(w)).join('');
}

function wsCard(w) {
  const project = projects.find(p => p.id === w.project_id);
  const start = w.start_time ? new Date(w.start_time) : null;
  const dateStr = start ? start.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const timeStr = start ? start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
  const monthStr = start ? start.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase() : '—';
  const dayStr = start ? start.getDate() : '—';

  const hasNotes = w.notes_raw?.trim();
  const hasSummary = w.summary?.trim();

  const decisionsArr = Array.isArray(w.decisions) ? w.decisions : [];
  const questionsArr = Array.isArray(w.open_questions) ? w.open_questions : [];
  const tasksArr = Array.isArray(w.tasks) ? w.tasks : [];

  const section = (title, items, color) => {
    if (!items?.length) return '';
    return `
      <div style="margin-bottom:10px">
        <div style="font-size:11px;font-weight:600;color:${color};margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">${title}</div>
        ${items.map(i => `<div style="font-size:12px;color:var(--text);padding:3px 0 3px 10px;border-left:2px solid ${color}20">${i}</div>`).join('')}
      </div>`;
  };

  return `
    <div class="card" style="margin-bottom:10px">
      <div class="ws-card">
        <div class="ws-card-top">
          <div class="ws-date-block">
            <div class="ws-day">${monthStr}</div>
            <div class="ws-num">${dayStr}</div>
          </div>
          <div class="ws-info" style="flex:1">
            <div class="ws-title">${w.title}</div>
            <div class="ws-sub">${timeStr}${w.organizer ? ' · ' + w.organizer : ''}${project ? ' · ' + project.name : ''}</div>
            <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
              ${project ? `<span class="tag">${project.name}</span>` : ''}
              ${hasSummary ? '<span class="pill pill-purple">AI Analiz Edildi</span>' : ''}
              ${hasNotes && !hasSummary ? '<span class="pill pill-amber">Not Var</span>' : ''}
            </div>
          </div>
        </div>

        ${hasSummary ? `
          <div style="background:var(--purple-bg);border:1px solid var(--purple-mid);border-radius:8px;padding:14px;margin-top:12px">
            <p style="font-size:12px;color:var(--text);line-height:1.6;margin:0 0 10px">${w.summary}</p>
            ${section('Kararlar', decisionsArr, 'var(--purple)')}
            ${section('Açık Sorular', questionsArr, 'var(--amber)')}
            ${section('Görevler', tasksArr, 'var(--teal)')}
          </div>` : ''}

        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
          <div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:6px">Toplantı Notu</div>
          <textarea
            id="ws-note-${w.id}"
            class="form-input"
            rows="3"
            placeholder="Toplantı notlarını buraya girin veya Copilot özetini yapıştırın..."
            style="width:100%;font-size:12px;box-sizing:border-box"
          >${w.notes_raw || ''}</textarea>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-sm" onclick="saveWorkshopNote('${w.id}')">Kaydet</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function saveWorkshopNote(id) {
  const el = document.getElementById('ws-note-' + id);
  if (!el) return;
  const notes = el.value.trim();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/workshops?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ notes_raw: notes, updated_at: new Date().toISOString() })
  });

  if (res.ok) {
    const w = workshops.find(x => x.id === id);
    if (w) w.notes_raw = notes;
    toast('Not kaydedildi ✓');
  } else {
    toast('Kayıt başarısız', 'error');
  }
}

