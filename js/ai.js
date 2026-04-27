// ── AI MODÜLÜ ──
// Tüm AI özellikleri bu dosyadan çalışır.
// Anthropic API'ye bağlanır, prompt gönderir, yanıtı döner.

const AI_MODEL = 'claude-sonnet-4-20250514';

// ── TEMEL ÇAĞRI FONKSİYONU ──
async function callAI(systemPrompt, userPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API hatası');
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ── JSON PARSE YARDIMCISI ──
function parseAIJson(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ── 1. ÇALIŞTAY ÖZETİ ──
async function generateWorkshopSummary(workshopId) {
  const ws = window.workshopsData?.find(w => w.id === workshopId);
  if (!ws) { toast('Çalıştay bulunamadı', 'error'); return; }
  if (!ws.notes?.trim()) { toast('Önce notları girin', 'error'); return; }

  const project = projects.find(p => p.id === ws.project_id);

  showAILoading(workshopId);

  const systemPrompt = `Sen Flormar Fusion dijitalleşme programının deneyimli bir IT proje yöneticisisin. 
Çalıştay notlarını analiz edip yapılandırılmış, özlü bir özet çıkarıyorsun.
Her zaman Türkçe yanıt veriyorsun. Yönetici düzeyinde net ve kısa yazıyorsun.`;

  const userPrompt = `Aşağıdaki çalıştay notlarını analiz et ve JSON formatında döndür.

Çalıştay: ${ws.title}
Proje: ${project?.name || '—'}
Tarih: ${ws.date || '—'}

NOTLAR:
${ws.notes}

Şu JSON formatını kullan (başka hiçbir şey yazma):
{
  "ozet": "2-3 cümlelik genel özet",
  "kararlar": ["karar 1", "karar 2"],
  "acikMaddeler": ["madde 1", "madde 2"],
  "riskler": ["risk 1", "risk 2"],
  "sonrakiAdimlar": ["adım 1", "adım 2"]
}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const result = parseAIJson(raw);

    if (ws) {
      ws.ai_summary = result;
      ws.ai_analyzed_at = new Date().toISOString();
    }

    hideAILoading(workshopId);
    renderWorkshopAISummary(workshopId, result);
    toast('AI analizi tamamlandı ✓');

  } catch (err) {
    hideAILoading(workshopId);
    toast('AI analizi başarısız: ' + err.message, 'error');
  }
}

// ── 2. YÖNETİM BRİFİNG ──
async function generateManagementBriefing() {
  const el = document.getElementById('briefing-content');
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:20px;color:var(--purple)">
      <div style="width:20px;height:20px;border:2px solid var(--purple-bg);border-top-color:var(--purple);border-radius:50%;animation:spin .7s linear infinite"></div>
      <span style="font-size:13px">AI brifing hazırlıyor...</span>
    </div>`;

  const lateActions = getLateGorevler();
  const openRisks = risks.filter(r => r.status !== 'Kapandı');
  const avgLoad = resources.length
    ? Math.round(resources.reduce((s, r) => s + r.load, 0) / resources.length)
    : 0;

  const systemPrompt = `Sen Flormar Fusion programının haftalık yönetim brifingini hazırlayan IT Program Direktörüsün.
Özlü, güven veren ama şeffaf bir dil kullanıyorsun. Her zaman Türkçe yazıyorsun.
Bullet point değil, akıcı paragraflar yazıyorsun.`;

  const userPrompt = `Bu hafta için yönetim brifingini hazırla.

PROGRAM VERİLERİ:
- Aktif projeler: ${projects.map(p => `${p.name} (${p.rag === 'green' ? 'Yolunda' : p.rag === 'amber' ? 'Dikkat' : 'Kritik'})`).join(', ')}
- Toplam iş paketi: ${isPaketleri.length}
- Toplam görev: ${gorevler.length}
- Gecikmiş görev sayısı: ${lateActions.length}
- Gecikmiş görevler: ${lateActions.slice(0, 5).map(g => g.title).join(', ') || 'Yok'}
- Açık riskler: ${openRisks.map(r => r.description).slice(0, 3).join('; ') || 'Yok'}
- IT ekibi ortalama kapasitesi: %${avgLoad}
- Hafta: ${document.querySelector('.hint')?.textContent?.trim() || 'Güncel'}

Brifing şu bölümleri içersin:
1. Genel durum (1 paragraf)
2. Bu hafta öne çıkanlar (1-2 paragraf)
3. Dikkat gerektiren konular (varsa)
4. Önümüzdeki hafta odak noktası (1 paragraf)

Ton: Yönetici düzeyine uygun, net, aksiyon odaklı.`;

  try {
    const result = await callAI(systemPrompt, userPrompt);

    el.innerHTML = `
      <div style="padding:4px 0 16px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px">
          <span class="pill pill-purple">AI Tarafından Oluşturuldu</span>
          <span style="font-size:11px;color:var(--text3)">${new Date().toLocaleString('tr-TR')}</span>
        </div>
        <div class="brief-kpis">
          <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--purple)">${projects.length}</div><div class="brief-kpi-label">Aktif Proje</div></div>
          <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--amber)">${isPaketleri.length}</div><div class="brief-kpi-label">İş Paketi</div></div>
          <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--red)">${lateActions.length}</div><div class="brief-kpi-label">Gecikmiş</div></div>
          <div class="brief-kpi"><div class="brief-kpi-val" style="color:var(--teal)">${avgLoad}%</div><div class="brief-kpi-label">Kapasite</div></div>
        </div>
        <div style="font-size:13px;line-height:1.9;color:var(--text);white-space:pre-line;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">${result}</div>
      </div>`;

    toast('Brifing hazırlandı ✓');

  } catch (err) {
    el.innerHTML = `<div style="padding:20px;color:var(--red);font-size:13px">Brifing oluşturulamadı: ${err.message}</div>`;
  }
}

// ── 3. GECİKME ANALİZİ ──
async function generateDelayAnalysis() {
  const lateActions = getLateGorevler();
  if (!lateActions.length) return null;

  const systemPrompt = `Sen bir IT program analistsin. Gecikme örüntülerini tespit edip kısa, aksiyon odaklı Türkçe analiz yazıyorsun.`;

  const actionDetails = lateActions.map(g => {
    const ip = isPaketleri.find(x => x.id === g.is_paketi_id);
    const ph = ip ? phases.find(x => x.id === ip.phase_id) : null;
    const proj = ph ? projects.find(x => x.id === ph.project_id) : null;
    return `- "${g.title}" | Proje: ${proj?.name || '?'} | Sorumlu: ${g.owner || 'Atanmamış'} | Vade: ${g.due_date || '?'}`;
  }).join('\n');

  const userPrompt = `Aşağıdaki gecikmiş görevleri analiz et.

GECİKMİŞ GÖREVLER:
${actionDetails}

JSON formatında döndür (başka hiçbir şey yazma):
{
  "ozet": "1 cümle genel durum",
  "yogunlasanProjeler": ["proje adı — neden"],
  "kokNeden": "en olası ortak neden",
  "oneri": "1-2 cümle acil öneri"
}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    return parseAIJson(raw);
  } catch (err) {
    console.error('Gecikme analizi hatası:', err);
    return null;
  }
}

// ── UI YARDIMCILARI ──
function showAILoading(id) {
  const el = document.getElementById('ws-ai-' + id);
  if (el) el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:12px;color:var(--purple);font-size:12px">
      <div style="width:16px;height:16px;border:2px solid var(--purple-bg);border-top-color:var(--purple);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0"></div>
      AI analiz ediyor...
    </div>`;
}

function hideAILoading(id) {
  const el = document.getElementById('ws-ai-' + id);
  if (el) el.innerHTML = '';
}

function renderWorkshopAISummary(id, summary) {
  const el = document.getElementById('ws-ai-' + id);
  if (!el || !summary) return;

  const section = (title, items) => {
    if (!items?.length) return '';
    return `
      <div style="margin-bottom:10px">
        <div style="font-size:11px;font-weight:600;color:var(--purple);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">${title}</div>
        ${items.map(i => `<div style="font-size:12px;color:var(--text);padding:3px 0 3px 10px;border-left:2px solid var(--purple-bg)">${i}</div>`).join('')}
      </div>`;
  };

  el.innerHTML = `
    <div style="background:var(--purple-bg);border:1px solid var(--purple-mid);border-radius:8px;padding:14px;margin-top:10px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
        <span class="pill pill-purple">AI Analiz</span>
        <span style="font-size:11px;color:var(--text3)">${new Date().toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      ${summary.ozet ? `<p style="font-size:12px;color:var(--text);line-height:1.6;margin:0 0 10px">${summary.ozet}</p>` : ''}
      ${section('Kararlar', summary.kararlar)}
      ${section('Açık Maddeler', summary.acikMaddeler)}
      ${section('Riskler', summary.riskler)}
      ${section('Sonraki Adımlar', summary.sonrakiAdimlar)}
    </div>`;
}
