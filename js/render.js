let actionFilter = 'all';
let projFilterVal = 'all';

function pill(r) {
  if (r === 'green') return '<span class="pill pill-green">Yolunda</span>';
  if (r === 'amber') return '<span class="pill pill-amber">Dikkat</span>';
  return '<span class="pill pill-red">Kritik</span>';
}

function dot(r) {
  const c = r === 'green' ? '#639922' : r === 'amber' ? '#ba7517' : '#e24b4a';
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c}"></span>`;
}

function renderDashboard() {
  // Metrikler
  const late = actions.filter(a => a.status === 'late');
  const riskProj = projects.filter(p => p.rag === 'red' || p.rag === 'amber');
  document.getElementById('metric-projects').textContent = projects.length;
  document.getElementById('metric-packs').textContent = projects.reduce((s, p) => s + p.packs, 0);
  document.getElementById('metric-late').textContent = late.length;

  // Proje listesi
  const pl = document.getElementById('proj-list');
  pl.innerHTML = projects.slice(0, 6).map(p => `
    <div class="proj-item" onclick="navigate('projects',null)">
      <div class="proj-dot" style="background:${p.rag==='green'?'#639922':p.rag==='amber'?'#ba7517':'#e24b4a'}"></div>
      <div class="proj-info">
        <div class="proj-name">${p.name}</div>
        <div class="proj-meta">${p.unit} · ${p.phase}</div>
      </div>
      ${pill(p.rag)}
      <div class="proj-packs">
        <div class="proj-packs-num">${p.packs}</div>
        <div class="proj-packs-label">paket</div>
      </div>
    </div>`).join('');

  // Gecikmiş aksiyonlar
  const am = document.getElementById('action-mini');
  am.innerHTML = late.map(a => `
    <div class="action-item">
      <div class="check-box"></div>
      <div class="action-body">
        <div class="action-title">${a.title}</div>
        <div class="action-footer">
          <span class="tag">${a.project}</span>
          <span class="action-due late">⚠ ${a.due_date}</span>
          <span style="font-size:11px;color:var(--text3)">${a.owner}</span>
        </div>
      </div>
    </div>`).join('');

  // Risk mini
  const rm = document.getElementById('risk-mini');
  rm.innerHTML = risks.filter(r => r.status !== 'Kapandı').slice(0, 4).map(r => `
    <div class="action-item">
      <div style="width:20px;height:20px;border-radius:4px;background:${r.level==='red'?'var(--red-bg)':'var(--amber-bg)'};color:${r.level==='red'?'var(--red)':'var(--amber)'};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${r.level==='red'?'!':'~'}</div>
      <div class="action-body">
        <div class="action-title">${r.description}</div>
        <div class="action-footer">
          <span class="tag">${r.source}</span>
          <span style="font-size:11px;color:var(--text3)">${r.owner}</span>
        </div>
      </div>
    </div>`).join('');

  // WS mini (statik)
  document.getElementById('ws-mini').innerHTML = `
    <div class="ws-card"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">08</div></div>
      <div class="ws-info"><div class="ws-title">YÜG Vizyon Çalıştayı #1</div><div class="ws-sub">7 IT paketi · PLM + DAM + Governance</div>
      <div style="display:flex;gap:4px;margin-top:5px"><span class="pill pill-green">Tamamlandı</span><span class="pill pill-purple">AI Analiz Edildi</span></div></div>
    </div></div>
    <div class="ws-card"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">10</div></div>
      <div class="ws-info"><div class="ws-title">P2P Vizyon Çalıştayı #1</div><div class="ws-sub">5 IT paketi · SAP BP/FM + CLM kritik</div>
      <div style="display:flex;gap:4px;margin-top:5px"><span class="pill pill-green">Tamamlandı</span><span class="pill pill-purple">AI Analiz Edildi</span></div></div>
    </div></div>
    <div class="ws-card" style="border-bottom:none"><div class="ws-card-top">
      <div class="ws-date-block"><div class="ws-day">Nis</div><div class="ws-num">15</div></div>
      <div class="ws-info"><div class="ws-title">YÜG + P2P Haftalık</div><div class="ws-sub">Yarın · 10:00 ve 14:00</div>
      <div style="margin-top:5px"><span class="pill pill-amber">Yaklaşan</span></div></div>
    </div></div>`;
}

function renderAllProjects() {
  const tb = document.getElementById('all-proj-table');
  const list = projFilterVal === 'all' ? projects : projects.filter(p => p.rag === projFilterVal);
  tb.innerHTML = list.map(p => `
    <tr>
      <td>${dot(p.rag)}</td>
      <td class="td-wrap" style="font-weight:500">${p.name}</td>
      <td class="td-clip" style="color:var(--text2)">${p.unit}</td>
      <td><span class="pill pill-gray">${p.phase}</span></td>
      <td style="text-align:center;font-weight:600;color:var(--amber)">${p.packs}</td>
      <td style="color:var(--text3);font-size:11px">${p.last_workshop || '—'}</td>
      <td>${pill(p.rag)}</td>
    </tr>`).join('');
}

function projFilter(f, el) {
  projFilterVal = f;
  document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderAllProjects();
}

function renderActions() {
  const q = (document.getElementById('action-search') || {value: ''}).value.toLowerCase();
  let list = actions;
  if (actionFilter === 'late') list = list.filter(a => a.status === 'late');
  else if (actionFilter === 'open') list = list.filter(a => a.status === 'open');
  else if (actionFilter === 'done') list = list.filter(a => a.status === 'done');
  else if (actionFilter === 'ws') list = list.filter(a => a.source === 'ws');
  if (q) list = list.filter(a => a.title.toLowerCase().includes(q) || a.project.toLowerCase().includes(q));

  const el = document.getElementById('action-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-title">Aksiyon bulunamadı</div></div>`;
    return;
  }
  el.innerHTML = list.map(a => {
    const done = a.status === 'done', late = a.status === 'late';
    return `<div class="action-item">
      <div class="check-box ${done ? 'done' : ''}" onclick="toggleAction('${a.id}')">
        ${done ? '<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
      </div>
      <div class="action-body">
        <div class="action-title ${done ? 'done' : ''}">${a.title}</div>
        <div class="action-footer">
          <span class="tag">${a.project}</span>
          ${a.source === 'ws' ? '<span class="pill pill-purple" style="font-size:9px">çalıştay</span>' : ''}
          <span class="action-due ${late ? 'late' : 'ok'}">${late ? '⚠ ' : ''}${a.due_date}</span>
          <span style="font-size:11px;color:var(--text3)">${a.owner}</span>
        </div>
      </div>
      <div style="flex-shrink:0">${pill(done ? 'green' : late ? 'red' : 'amber')}</div>
    </div>`;
  }).join('');
}

function filterAction(f, el) {
  actionFilter = f;
  document.querySelectorAll('#action-filter-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderActions();
}

function renderResources() {
  document.getElementById('resource-list').innerHTML = resources.map(r => {
    const h = r.load > 85, m = r.load > 65;
    const c = h ? 'var(--red)' : m ? 'var(--amber)' : 'var(--green)';
    const bg = h ? 'var(--red-bg)' : m ? 'var(--amber-bg)' : 'var(--green-bg)';
    const ini = r.name.replace('.', ' ').split(' ').map(w => w[0]).join('');
    return `<div class="res-row">
      <div class="avatar" style="background:${bg};color:${c}">${ini}</div>
      <div style="min-width:90px">
        <div style="font-size:12px;font-weight:500">${r.name}</div>
        <div style="font-size:10px;color:var(--text3)">${r.role}</div>
      </div>
      <div class="cap-track"><div class="cap-fill" style="width:${r.load}%;background:${c}"></div></div>
      <div style="min-width:36px;text-align:right;font-size:12px;font-weight:600;color:${c}">${r.load}%</div>
      <div style="min-width:100px;text-align:right">${(r.projects || []).map(p => `<span class="tag">${p}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

function renderRisks() {
  document.getElementById('risk-table').innerHTML = risks.map(r => `
    <tr>
      <td>${pill(r.level)}</td>
      <td class="td-wrap" style="font-size:12px">${r.description}</td>
      <td><span class="tag">${r.source}</span></td>
      <td style="color:var(--text2);font-size:11px">${r.owner}</td>
      <td><span class="pill ${r.status==='Kapandı'?'pill-green':r.status==='İzleniyor'?'pill-amber':'pill-red'}">${r.status}</span></td>
    </tr>`).join('');
}

function renderRoadmap() {
  document.getElementById('roadmap-body').innerHTML = roadmapData.map((ph, i) => `
    <div class="phase-card">
      <div class="phase-header" onclick="togglePhase(${i})">
        <div class="phase-stripe" style="background:${ph.col}"></div>
        <div class="phase-meta">
          <div class="phase-title">${ph.title}</div>
          <div class="phase-timeframe">${ph.tf}</div>
        </div>
        <span class="phase-count">${ph.items.length} iş paketi</span>
        <span class="phase-chevron open" id="ph-arr-${i}">▼</span>
      </div>
      <div class="phase-body" id="ph-body-${i}">
        ${ph.items.map(it => `
          <div class="roadmap-item">
            <div class="rmap-num" style="background:${ph.col}22;color:${ph.col}">${it.n}</div>
            <div class="rmap-body">
              <div class="rmap-title">${it.t}</div>
              <div class="rmap-desc">${it.d}</div>
              <div class="rmap-tags">${it.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function togglePhase(i) {
  const b = document.getElementById('ph-body-' + i);
  const a = document.getElementById('ph-arr-' + i);
  const open = b.style.display !== 'none';
  b.style.display = open ? 'none' : 'block';
  a.style.transform = open ? 'rotate(-90deg)' : '';
}

function renderBriefing() {
  const totalPacks = projects.reduce((s, p) => s + p.packs, 0);
  const lateCount = actions.filter(a => a.status === 'late').length;
  const avgLoad = resources.length ? Math.round(resources.reduce((s, r) => s + r.load, 0) / resources.length) : 0;

  document.getElementById('briefing-content').innerHTML = `
    <div class="brief-kpis">
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--purple)">${projects.length}</div><div class="brief-kpi-label">Aktif Proje</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--amber)">${totalPacks}</div><div class="brief-kpi-label">IT İş Paketi</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--red)">${lateCount}</div><div class="brief-kpi-label">Gecikmiş</div></div>
      <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--teal)">${avgLoad}%</div><div class="brief-kpi-label">Ort. Kapasite</div></div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">Öne Çıkanlar</div>
      <div style="font-size:12px;line-height:1.8;color:var(--text)">
        YÜG ve P2P vizyon çalıştayları tamamlandı; toplam <strong>${totalPacks} IT iş paketi</strong> çıkarıldı.
        <strong>SAP BP/FM modülü eksikliği</strong> P2P bütçe kontrolünü bloke etmektedir.
        <strong>PLM aracı</strong> için 3 vendor demo bu hafta başlamalıdır.
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:600;color:var(--red);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">Eskalasyon</div>
      <div class="eskalasyon">SAP BP/FM aktivasyonu için bütçe onayı ve SAP danışman takvimi gerekiyor.</div>
      <div class="eskalasyon eskalasyon-amber">Mağaza Analitik veri kalitesi sorunu: IT + Perakende ortak aksiyon planı bekleniyor.</div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">Bu Hafta Öncelikleri</div>
      <div style="font-size:12px;line-height:2;color:var(--text)">
        · PLM vendor demo toplantısı takvimi netleştirilecek (Ahmet Y.)<br>
        · SAP BP/FM FS taslağı tamamlanacak (Can D.)<br>
        · Vibecoding governance çerçevesi taslak haline getirilecek (IT Admin)<br>
        · HR Kick-off çalıştayı IT iş paketleri platforma eklenecek<br>
        · Teams → platform entegrasyon PoC başlatılacak (Betül K.)
      </div>
    </div>`;
}

function renderWorkshops() {
  document.getElementById('ws-upcoming-grid').innerHTML = workshopsUpcoming.map(w => `
    <div class="card"><div class="card-body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span class="pill pill-amber">Yaklaşan</span>
        <span style="font-size:11px;color:var(--text3)">${w.d} · ${w.t}</span>
      </div>
      <div style="font-weight:600;font-size:13px;margin-bottom:2px">${w.n}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:12px">${w.p}</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm">Ajanda</button>
        <button class="btn btn-sm btn-primary" onclick="teamsSync()">Teams Notu Hazırla</button>
      </div>
    </div></div>`).join('');
}
