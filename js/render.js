let actionFilter = 'all';
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
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:600;color:#fff;background:${type==='success'?'#3b6d11':'#a32d2d'};box-shadow:0 4px 12px rgba(0,0,0,.15);transition:opacity .3s`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2000);
}

// ── BADGES ──
function updateBadges() {
  const late = getLateActions();
  const el = id => document.getElementById(id);
  if (el('badge-projects')) el('badge-projects').textContent = projects.length;
  if (el('badge-actions')) el('badge-actions').textContent = late.length;
  if (el('urgency-count')) el('urgency-count').textContent = late.length;
  if (el('metric-late-badge')) el('metric-late-badge').textContent = late.length + ' geç';
  if (el('metric-projects')) el('metric-projects').textContent = projects.length;
  if (el('metric-packs')) el('metric-packs').textContent = actions.length;

  const avgLoad = resources.length
    ? Math.round(resources.reduce((s, r) => s + r.load, 0) / resources.length) : 0;
  if (el('metric-load')) el('metric-load').textContent = avgLoad + '%';

  const overloaded = resources.filter(r => r.load > 85).map(r => r.name).join(' & ');
  if (el('metric-load-sub')) el('metric-load-sub').textContent = overloaded ? overloaded + ' aşırı yüklü' : 'Kapasite normal';

  const riskProj = projects.filter(p => p.rag !== 'green').length;
  if (el('metric-projects-sub')) el('metric-projects-sub').textContent =
    `${projects.length - riskProj} yolunda · ${riskProj} riskli`;
}

// ── DASHBOARD ──
function renderDashboard() {
  const late = getLateActions();

  // Proje listesi
  const pl = document.getElementById('proj-list');
  if (pl) pl.innerHTML = projects.slice(0, 6).map(p => {
    const phCount = getProjectPhases(p.id).length;
    const acCount = getProjectActions(p.id).length;
    return `<div class="proj-item" onclick="openProject('${p.id}')">
      <div class="proj-dot" style="background:${p.rag==='green'?'#639922':p.rag==='amber'?'#ba7517':'#e24b4a'}"></div>
      <div class="proj-info">
        <div class="proj-name">${p.name}</div>
        <div class="proj-meta">${phCount} faz · ${acCount} aksiyon</div>
      </div>
      ${pill(p.rag)}
      <div class="proj-packs"><div class="proj-packs-num">${phCount}</div><div class="proj-packs-label">faz</div></div>
    </div>`;
  }).join('') || '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Henüz proje yok</div></div>';

  // Gecikmiş aksiyonlar
  const am = document.getElementById('action-mini');
  if (am) am.innerHTML = late.slice(0, 4).map(a => `
    <div class="action-item" onclick="showEditActionModal('${a.id}')" style="cursor:pointer">
      <div class="action-body">
        <div class="action-title">${a.title}</div>
        <div class="action-footer">
          <span class="action-due late">⚠ ${a.due_date || '—'}</span>
         <span style="font-size:11px;color:var(--text3)">${a.owner || 'Atanmamış'}</span>
        </div>
      </div>
    </div>`).join('') || '<div style="padding:16px;font-size:12px;color:var(--text3)">Gecikmiş aksiyon yok ✓</div>';
  
  // Risk mini
  const rm = document.getElementById('risk-mini');
  if (rm) rm.innerHTML = risks.filter(r => r.status !== 'Kapandı').slice(0, 4).map(r => `
    <div class="action-item">
      <div style="width:20px;height:20px;border-radius:4px;background:${r.level==='red'?'var(--red-bg)':'var(--amber-bg)'};color:${r.level==='red'?'var(--red)':'var(--amber)'};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${r.level==='red'?'!':'~'}</div>
      <div class="action-body">
        <div class="action-title">${r.description}</div>
        <div class="action-footer"><span style="font-size:11px;color:var(--text3)">${r.owner || '—'}</span></div>
      </div>
    </div>`).join('') || '<div style="padding:16px;font-size:12px;color:var(--text3)">Açık risk yok ✓</div>';

  // WS mini
  const wm = document.getElementById('ws-mini');
  if (wm) wm.innerHTML = `
    <div class="ws-card"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">08</div></div>
      <div class="ws-info"><div class="ws-title">YÜG Vizyon Çalıştayı #1</div><div class="ws-sub">Tamamlandı · AI Analiz Edildi</div>
      <div style="display:flex;gap:4px;margin-top:5px"><span class="pill pill-green">Tamamlandı</span><span class="pill pill-purple">AI Aktif</span></div></div>
    </div></div>
    <div class="ws-card" style="border-bottom:none"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">15</div></div>
      <div class="ws-info"><div class="ws-title">YÜG + P2P Haftalık</div><div class="ws-sub">Yarın · 10:00 ve 14:00</div>
      <div style="margin-top:5px"><span class="pill pill-amber">Yaklaşan</span></div></div>
    </div></div>`;
}

// ── PROGRAM HİYERARŞİ SAYFASI ──
function renderHierarchy() {
  const el = document.getElementById('hierarchy-body');
  if (!el) return;

  const prog = programs[0];
  if (!prog) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-title">Program bulunamadı</div></div>';
    return;
  }

  const progProjects = projects.sort((a, b) => a.order_num - b.order_num);

  el.innerHTML = `
    <!-- Program Başlığı -->
    <div class="prog-header">
      <div class="prog-icon">F</div>
      <div class="prog-info">
        <div class="prog-name">${prog.name}</div>
        <div class="prog-meta">${progProjects.length} proje · ${phases.length} faz · ${actions.length} aksiyon</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="showAddProjectModal()">+ Proje Ekle</button>
    </div>

    <!-- Projeler -->
    <div id="proj-hierarchy">
      ${progProjects.length ? progProjects.map(p => renderProjectCard(p)).join('') :
        '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Henüz proje yok</div><div class="empty-text">Başlamak için proje ekleyin.</div><button class="btn btn-primary" onclick="showAddProjectModal()">+ Proje Ekle</button></div>'}
    </div>`;
}

function renderProjectCard(p) {
  const projPhases = getProjectPhases(p.id);
  const projActions = getProjectActions(p.id);
  const doneCount = projActions.filter(a => a.status === 'done').length;
  const progress = projActions.length ? Math.round((doneCount / projActions.length) * 100) : 0;

  return `
    <div class="proj-card" id="proj-card-${p.id}">
      <div class="proj-card-header" onclick="toggleProjectCard('${p.id}')">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
          <div class="proj-dot" style="width:12px;height:12px;border-radius:50%;background:${p.rag==='green'?'#639922':p.rag==='amber'?'#ba7517':'#e24b4a'};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${projPhases.length} faz · ${projActions.length} aksiyon · %${progress} tamamlandı</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          ${pill(p.rag)}
          <button class="btn btn-sm" onclick="event.stopPropagation();showAddPhaseModal('${p.id}')">+ Faz</button>
          <span class="phase-chevron open" id="proj-arr-${p.id}">▼</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div style="padding:0 16px 0;background:var(--surface)">
        <div class="progress"><div class="progress-fill" style="width:${progress}%;background:${p.rag==='green'?'var(--green)':p.rag==='amber'?'var(--amber)':'var(--red)'}"></div></div>
      </div>

      <!-- Fazlar -->
      <div class="proj-card-body" id="proj-body-${p.id}">
        ${projPhases.length ? projPhases.map(ph => renderPhaseBlock(ph, p)).join('') :
          `<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px">
            Henüz faz yok — <span style="color:var(--purple);cursor:pointer" onclick="showAddPhaseModal('${p.id}')">faz ekle</span>
          </div>`}
      </div>
    </div>`;
}

function renderPhaseBlock(ph, project) {
  const phActions = getPhaseActions(ph.id);
  const doneCount = phActions.filter(a => a.status === 'done').length;

  return `
    <div class="phase-block">
      <div class="phase-block-header" onclick="togglePhaseBlock('${ph.id}')">
        <div style="display:flex;align-items:center;gap:8px;flex:1">
          <div style="width:3px;height:20px;border-radius:2px;background:var(--purple);flex-shrink:0"></div>
          <div>
            <div style="font-size:12px;font-weight:600">${ph.name}</div>
            <div style="font-size:10px;color:var(--text3)">${ph.start_date||'?'} → ${ph.end_date||'?'} · ${phActions.length} aksiyon · ${doneCount} tamamlandı</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();showAddActionModal('${ph.id}','${project.id}')">+ Aksiyon</button>
          <span style="color:var(--text3);font-size:11px" id="ph-arr-${ph.id}">▼</span>
        </div>
      </div>

      <div class="phase-block-body" id="ph-body-${ph.id}">
        ${phActions.length ? phActions.map(a => renderActionRow(a)).join('') :
          `<div style="padding:12px 16px;font-size:11px;color:var(--text3)">
            Henüz aksiyon yok — <span style="color:var(--purple);cursor:pointer" onclick="showAddActionModal('${ph.id}','${project.id}')">aksiyon ekle</span>
          </div>`}
      </div>
    </div>`;
}

function renderActionRow(a) {
  const done = a.status === 'done', late = a.status === 'late';
  return `
    <div class="action-row" id="action-row-${a.id}">
      <div class="check-box ${done?'done':''}">
        ${done?'<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
      </div>
      <div class="action-body">
        <div class="action-title ${done?'done':''}">${a.title}</div>
        <div class="action-footer">
          ${a.priority ? priorityPill(a.priority) : ''}
          ${statusPill(a.status)}
          <span class="action-due ${late?'late':'ok'}">${late?'⚠ ':''}${a.due_date||''}</span>
          <span style="font-size:11px;color:var(--text3)">${a.owner||''}</span>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn btn-sm" onclick="showEditActionModal('${a.id}')">✏️</button>
        <button class="btn btn-sm" style="color:var(--red-mid);border-color:transparent;background:transparent" 
          onclick="deleteActionRow('${a.id}')">✕</button>
      </div>
    </div>`;
}
// ── TOGGLE FONKSİYONLARI ──
function toggleProjectCard(id) {
  const body = document.getElementById('proj-body-' + id);
  const arr = document.getElementById('proj-arr-' + id);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (arr) arr.style.transform = open ? 'rotate(-90deg)' : '';
}

function togglePhaseBlock(id) {
  const body = document.getElementById('ph-body-' + id);
  const arr = document.getElementById('ph-arr-' + id);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (arr) arr.style.transform = open ? 'rotate(-90deg)' : '';
}

// ── MODAL'LAR ──
function showModal(html) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px`;
    overlay.onclick = e => { if (e.target === overlay) closeModal(); };
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  overlay.style.display = 'flex';
}

function closeModal() {
  const o = document.getElementById('modal-overlay');
  if (o) o.style.display = 'none';
}

function showAddProjectModal() {
  showModal(`
    <div class="modal-header"><span class="modal-title">Yeni Proje Ekle</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Proje Adı *</label><input id="m-proj-name" class="form-input" placeholder="Örn: Yeni Ürün Geliştirme"></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-proj-desc" class="form-input" rows="2" placeholder="Kısa açıklama..."></textarea></div>
      <div class="form-group"><label>Durum</label>
        <select id="m-proj-rag" class="form-input">
          <option value="green">Yolunda</option>
          <option value="amber">Dikkat</option>
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
  if (!name) { toast('Proje adı zorunlu', 'error'); return; }
  const prog = programs[0];
  if (!prog) return;
  const data = {
    program_id: prog.id,
    name,
    description: document.getElementById('m-proj-desc').value,
    rag: document.getElementById('m-proj-rag').value,
    order_num: projects.length + 1
  };
  const result = await createProject(data);
  if (result) {
    toast('Proje eklendi ✓');
    closeModal();
    renderHierarchy();
  }
}

function showAddPhaseModal(projectId) {
  const project = projects.find(p => p.id === projectId);
  showModal(`
    <div class="modal-header"><span class="modal-title">Faz Ekle — ${project?.name||''}</span><span class="modal-close" onclick="closeModal()">✕</span></div>
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
  if (!name) { toast('Faz adı zorunlu', 'error'); return; }
  const existingPhases = getProjectPhases(projectId);
  const data = {
    project_id: projectId,
    name,
    description: document.getElementById('m-ph-desc').value,
    start_date: document.getElementById('m-ph-start').value || null,
    end_date: document.getElementById('m-ph-end').value || null,
    order_num: existingPhases.length + 1
  };
  const result = await createPhase(data);
  if (result) {
    toast('Faz eklendi ✓');
    closeModal();
    renderHierarchy();
  }
}

function showAddActionModal(phaseId, projectId) {
  const phase = phases.find(p => p.id === phaseId);
  showModal(`
    <div class="modal-header"><span class="modal-title">Aksiyon Ekle — ${phase?.name||''}</span><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label>Aksiyon Başlığı *</label><input id="m-ac-title" class="form-input" placeholder="Aksiyon açıklaması..."></div>
      <div class="form-group"><label>Açıklama</label><textarea id="m-ac-desc" class="form-input" rows="2"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Sorumlu</label><input id="m-ac-owner" class="form-input" placeholder="Ad Soyad"></div>
        <div class="form-group"><label>Başlangıç Tarihi</label><input id="m-ac-start" type="date" class="form-input"></div>
        <div class="form-group"><label>Bitiş / Termin Tarihi</label><input id="m-ac-due" type="date" class="form-input"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Öncelik</label>
          <select id="m-ac-priority" class="form-input">
            <option value="high">Yüksek</option>
            <option value="medium" selected>Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>
        <div class="form-group"><label>Durum</label>
          <select id="m-ac-status" class="form-input">
            <option value="open">Açık</option>
            <option value="late">Gecikmiş</option>
            <option value="done">Tamamlandı</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitAddAction('${phaseId}')">Kaydet</button>
    </div>`);
}

async function submitAddAction(phaseId) {
  const title = document.getElementById('m-ac-title').value.trim();
  if (!title) { toast('Aksiyon başlığı zorunlu', 'error'); return; }
  const data = {
    phase_id: phaseId,
    title,
    description: document.getElementById('m-ac-desc').value,
    owner: document.getElementById('m-ac-owner').value,
    start_date: document.getElementById('m-ac-start').value || null,
    due_date: document.getElementById('m-ac-due').value || null,
    priority: document.getElementById('m-ac-priority').value,
    status: document.getElementById('m-ac-status').value
  };
  const result = await createAction(data);
  if (result) {
    toast('Aksiyon eklendi ✓');
    closeModal();
    renderHierarchy();
  }
}

async function deleteActionRow(id) {
  if (!confirm('Bu aksiyonu silmek istediğinizden emin misiniz?')) return;
  const ok = await deleteItem('actions', id);
  if (ok) {
    actions = actions.filter(a => a.id !== id);
    toast('Aksiyon silindi');
    renderHierarchy();
    updateBadges();
  }
}
function showEditActionModal(id) {
  const a = actions.find(x => x.id === id);
  if (!a) return;
  showModal(`
    <div class="modal-header">
      <span class="modal-title">Aksiyonu Düzenle</span>
      <span class="modal-close" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Aksiyon Başlığı *</label>
        <input id="m-edit-title" class="form-input" value="${a.title}">
      </div>
      <div class="form-group"><label>Açıklama</label>
        <textarea id="m-edit-desc" class="form-input" rows="2">${a.description||''}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Sorumlu</label>
          <input id="m-edit-owner" class="form-input" value="${a.owner||''}">
        </div>
        <div class="form-group"><label>Öncelik</label>
          <select id="m-edit-priority" class="form-input">
            <option value="high" ${a.priority==='high'?'selected':''}>Yüksek</option>
            <option value="medium" ${a.priority==='medium'?'selected':''}>Orta</option>
            <option value="low" ${a.priority==='low'?'selected':''}>Düşük</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label>Başlangıç Tarihi</label>
          <input id="m-edit-start" type="date" class="form-input" value="${a.start_date||''}">
        </div>
        <div class="form-group"><label>Bitiş / Termin</label>
          <input id="m-edit-due" type="date" class="form-input" value="${a.due_date||''}">
        </div>
      </div>
    <div class="form-group"><label>Durum</label>
        <select id="m-edit-status" class="form-input">
          <option value="todo" ${a.status==='todo'?'selected':''}>To Do</option>
          <option value="inprogress" ${a.status==='inprogress'?'selected':''}>In Progress</option>
          <option value="done" ${a.status==='done'?'selected':''}>Done</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="submitEditAction('${id}')">Kaydet</button>
    </div>`);
}

async function submitEditAction(id) {
  const title = document.getElementById('m-edit-title').value.trim();
  if (!title) { toast('Aksiyon başlığı zorunlu', 'error'); return; }
  const data = {
    title,
    description: document.getElementById('m-edit-desc').value,
    owner: document.getElementById('m-edit-owner').value,
    priority: document.getElementById('m-edit-priority').value,
    start_date: document.getElementById('m-edit-start').value || null,
    due_date: document.getElementById('m-edit-due').value || null,
    status: document.getElementById('m-edit-status').value
  };
  const ok = await supabaseUpdate('actions', id, data);
  if (ok) {
    const a = actions.find(x => x.id === id);
    if (a) Object.assign(a, data);
    toast('Aksiyon güncellendi ✓');
    closeModal();
    renderHierarchy();
    updateBadges();
  } else {
    toast('Güncelleme başarısız', 'error');
  }
}

function openProject(projectId) {
  navigate('hierarchy', null);
}

// ── TÜM PROJELER (basit liste) ──
function renderAllProjects() {
  const tb = document.getElementById('all-proj-table');
  if (!tb) return;
  const list = projFilterVal === 'all' ? projects : projects.filter(p => p.rag === projFilterVal);
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">Proje bulunamadı</td></tr>';
    return;
  }
  tb.innerHTML = list.map(p => {
    const phCount = getProjectPhases(p.id).length;
    const acCount = getProjectActions(p.id).length;
    return `<tr onclick="navigate('hierarchy',null)" style="cursor:pointer">
      <td>${dot(p.rag)}</td>
      <td class="td-wrap" style="font-weight:500">${p.name}</td>
      <td style="color:var(--text2)">${phCount} faz</td>
      <td style="text-align:center;font-weight:600;color:var(--amber)">${acCount}</td>
      <td>${pill(p.rag)}</td>
    </tr>`;
  }).join('');
}

function projFilter(f, el) {
  projFilterVal = f;
  document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderAllProjects();
}

// ── AKSİYONLAR ──
function renderActions() {
  const q = (document.getElementById('action-search') || {value: ''}).value.toLowerCase();
  let list = [...actions];
  if (actionFilter === 'late') list = list.filter(a => a.status === 'late');
  else if (actionFilter === 'open') list = list.filter(a => a.status === 'open');
  else if (actionFilter === 'done') list = list.filter(a => a.status === 'done');
  if (q) list = list.filter(a => a.title.toLowerCase().includes(q));

  const el = document.getElementById('action-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-title">Aksiyon bulunamadı</div></div>`;
    return;
  }
  el.innerHTML = list.map(a => {
    const done = a.status === 'done', late = a.status === 'late';
    const phase = phases.find(p => p.id === a.phase_id);
    const project = phase ? projects.find(p => p.id === phase.project_id) : null;
    return `<div class="action-item">
      <div class="check-box ${done?'done':''}" onclick="toggleAction('${a.id}')">
        ${done?'<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
      </div>
      <div class="action-body">
        <div class="action-title ${done?'done':''}">${a.title}</div>
        <div class="action-footer">
          ${project ? `<span class="tag">${project.name}</span>` : ''}
          ${phase ? `<span class="tag" style="background:var(--purple-bg);color:var(--purple)">${phase.name}</span>` : ''}
          ${priorityPill(a.priority)}
          <span class="action-due ${late?'late':'ok'}">${late?'⚠ ':''}${a.due_date||''}</span>
          <span style="font-size:11px;color:var(--text3)">${a.owner||''}</span>
        </div>
      </div>
      <div style="flex-shrink:0">${pill(done?'green':late?'red':'amber')}</div>
    </div>`;
  }).join('');
}

function filterAction(f, el) {
  actionFilter = f;
  document.querySelectorAll('#action-filter-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderActions();
}

// ── KAYNAKLAR ──
function renderResources() {
  const el = document.getElementById('resource-list');
  if (!el) return;
  if (!resources.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Kaynak bulunamadı</div></div>';
    return;
  }
  el.innerHTML = resources.map(r => {
    const h = r.load > 85, m = r.load > 65;
    const c = h ? 'var(--red)' : m ? 'var(--amber)' : 'var(--green)';
    const bg = h ? 'var(--red-bg)' : m ? 'var(--amber-bg)' : 'var(--green-bg)';
    const ini = r.name.replace('.', ' ').split(' ').map(w => w[0]).join('');
    return `<div class="res-row">
      <div class="avatar" style="background:${bg};color:${c}">${ini}</div>
      <div style="min-width:90px"><div style="font-size:12px;font-weight:500">${r.name}</div><div style="font-size:10px;color:var(--text3)">${r.role}</div></div>
      <div class="cap-track"><div class="cap-fill" style="width:${r.load}%;background:${c}"></div></div>
      <div style="min-width:36px;text-align:right;font-size:12px;font-weight:600;color:${c}">${r.load}%</div>
      <div style="min-width:100px;text-align:right">${(r.projects||[]).map(p=>`<span class="tag">${p}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

// ── RİSKLER ──
function renderRisks() {
  const el = document.getElementById('risk-table');
  if (!el) return;
  if (!risks.length) {
    el.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text3)">Risk bulunamadı</td></tr>';
    return;
  }
  el.innerHTML = risks.map(r => {
    const project = projects.find(p => p.id === r.project_id);
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
  el.innerHTML = roadmapData.map((ph, i) => `
    <div class="phase-card">
      <div class="phase-header" onclick="togglePhase(${i})">
        <div class="phase-stripe" style="background:${ph.col}"></div>
        <div class="phase-meta"><div class="phase-title">${ph.title}</div><div class="phase-timeframe">${ph.tf}</div></div>
        <span class="phase-count">${ph.items.length} iş paketi</span>
        <span class="phase-chevron open" id="ph-arr-${i}">▼</span>
      </div>
      <div class="phase-body" id="ph-body-r-${i}">
        ${ph.items.map(it => `
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
  const b = document.getElementById('ph-body-r-' + i);
  const a = document.getElementById('ph-arr-' + i);
  if (!b) return;
  const open = b.style.display !== 'none';
  b.style.display = open ? 'none' : 'block';
  if (a) a.style.transform = open ? 'rotate(-90deg)' : '';
}

// ── BRİFİNG ──
function renderBriefing() {
  const el = document.getElementById('briefing-content');
  if (!el) return;
  const lateCount = getLateActions().length;
  const avgLoad = resources.length ? Math.round(resources.reduce((s,r)=>s+r.load,0)/resources.length) : 0;
  el.innerHTML = `
    <div class="brief-kpis">
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--purple)">${projects.length}</div><div class="brief-kpi-label">Aktif Proje</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--amber)">${phases.length}</div><div class="brief-kpi-label">Toplam Faz</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--red)">${lateCount}</div><div class="brief-kpi-label">Gecikmiş</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--teal)">${avgLoad}%</div><div class="brief-kpi-label">Ort. Kapasite</div></div>
    </div>
    <div style="font-size:12px;line-height:1.8;color:var(--text)">
      <strong>Flormar Fusion</strong> programı kapsamında <strong>${projects.length} aktif proje</strong>, 
      <strong>${phases.length} faz</strong> ve <strong>${actions.length} aksiyon</strong> takip edilmektedir.
      ${lateCount > 0 ? `<span style="color:var(--red)"> ${lateCount} gecikmiş aksiyon bulunmaktadır.</span>` : ' Tüm aksiyonlar zamanındadır.'}
    </div>`;
}

// ── WORKSHOPS ──
function renderWorkshops() {
  const el = document.getElementById('ws-upcoming-grid');
  if (!el) return;
  el.innerHTML = workshopsUpcoming.map(w => `
    <div class="card"><div class="card-body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span class="pill pill-amber">Yaklaşan</span>
        <span style="font-size:11px;color:var(--text3)">${w.d} · ${w.t}</span>
      </div>
      <div style="font-weight:600;font-size:13px;margin-bottom:2px">${w.n}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:12px">${w.p}</div>
      <button class="btn btn-sm btn-primary">Teams Notu Hazırla</button>
    </div></div>`).join('');
}
