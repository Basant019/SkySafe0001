// ═══════════════════════════════════════════════
//  CANVAS BACKGROUND
// ═══════════════════════════════════════════════
const CV = document.getElementById('bgCanvas');
const CX = CV.getContext('2d');
function rsz() { CV.width = innerWidth; CV.height = innerHeight; }
rsz(); addEventListener('resize', rsz);
const PTS = Array.from({ length: 70 }, () => ({
  x: Math.random() * innerWidth, y: Math.random() * innerHeight,
  vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
  r: Math.random() * .9 + .2, a: Math.random() * .25 + .05
}));
(function loop() {
  CX.clearRect(0, 0, CV.width, CV.height);
  for (let i = 0; i < PTS.length; i++) for (let j = i + 1; j < PTS.length; j++) {
    const d = Math.hypot(PTS[i].x - PTS[j].x, PTS[i].y - PTS[j].y);
    if (d < 140) {
      CX.beginPath(); CX.moveTo(PTS[i].x, PTS[i].y); CX.lineTo(PTS[j].x, PTS[j].y);
      CX.strokeStyle = `rgba(0,180,255,${.025 * (1 - d / 140)})`; CX.lineWidth = .5; CX.stroke();
    }
  }
  PTS.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = CV.width; if (p.x > CV.width) p.x = 0;
    if (p.y < 0) p.y = CV.height; if (p.y > CV.height) p.y = 0;
    CX.beginPath(); CX.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    CX.fillStyle = `rgba(0,180,255,${p.a * .35})`; CX.fill();
  });
  requestAnimationFrame(loop);
})();

// ═══════════════════════════════════════════════
//  CLOCK
// ═══════════════════════════════════════════════
function tickClock() {
  const n = new Date(), el = document.getElementById('navClock');
  if (el) el.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
}
setInterval(tickClock, 1000); tickClock();

// ═══════════════════════════════════════════════
//  INIT DATE
// ═══════════════════════════════════════════════
(() => {
  const d = document.getElementById('travelDate');
  if (!d) return;
  const t = new Date(); t.setDate(t.getDate() + 3);
  d.value = t.toISOString().split('T')[0];
  d.min = new Date().toISOString().split('T')[0];
})();

// ═══════════════════════════════════════════════
//  CHIPS
// ═══════════════════════════════════════════════
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));

// ═══════════════════════════════════════════════
//  DESTINATION CATEGORY SELECTION
// ═══════════════════════════════════════════════
let selectedCategory = 'mountains';
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('on'));
    card.classList.add('on');
    selectedCategory = card.dataset.cat;
  });
});

// ═══════════════════════════════════════════════
//  PEOPLE COUNT
// ═══════════════════════════════════════════════
let peopleCount = 2;
function changePeople(delta) {
  peopleCount = Math.max(1, Math.min(20, peopleCount + delta));
  document.getElementById('peopleVal').textContent = peopleCount;
  document.getElementById('peopleCount').value = peopleCount;
  // Auto-set traveller type
  const typeEl = document.getElementById('travellerType');
  if (peopleCount === 1) typeEl.value = 'solo';
  else if (peopleCount === 2) typeEl.value = 'couple';
  else if (peopleCount <= 5) typeEl.value = 'family';
  else typeEl.value = 'group';
}

// ═══════════════════════════════════════════════
//  WEATHER ICONS + SCORING
// ═══════════════════════════════════════════════
const W_EMOJI = { Thunderstorm: '⛈', Drizzle: '🌦', Rain: '🌧', Snow: '❄️', Mist: '🌫', Fog: '🌫', Haze: '😶‍🌫️', Dust: '🌪', Smoke: '💨', Tornado: '🌪', Clear: '☀️', Clouds: '☁️' };

function weatherScore(w) {
  if (!w) return { score: 50, label: 'Unknown', color: '#5a7a99' };
  let s = 100, m = w.condition || w.weather?.[0]?.main || 'Clear', t = w.temperature ?? w.main?.temp ?? 25, wd = w.windSpeed || (w.wind?.speed || 0) * 3.6;
  if (m === 'Thunderstorm') s -= 55; else if (m === 'Rain') s -= 30; else if (m === 'Drizzle') s -= 15; else if (m === 'Snow') s -= 20; else if (m === 'Fog' || m === 'Mist') s -= 10;
  if (t > 40) s -= 28; else if (t > 36) s -= 12; else if (t < 5) s -= 22; else if (t < 10) s -= 10;
  if (wd > 15) s -= 16; else if (wd > 10) s -= 6;
  s = Math.max(10, Math.min(100, s));
  let label, color;
  if (s >= 80) { label = 'Excellent ✨'; color = '#00e87a'; }
  else if (s >= 60) { label = 'Good 👍'; color = '#00b8ff'; }
  else if (s >= 40) { label = 'Fair — plan indoors ⚠'; color = '#ffc800'; }
  else { label = 'Challenging 🌪'; color = '#ff7b00'; }
  return { score: s, label, color };
}

// ═══════════════════════════════════════════════
//  AUTOCOMPLETE
// ═══════════════════════════════════════════════
let autoT = null;
function setupAC(inId, sugId, onPick) {
  const inp = document.getElementById(inId), box = document.getElementById(sugId);
  inp.addEventListener('input', () => {
    clearTimeout(autoT);
    const q = inp.value.trim();
    if (q.length < 3) { box.classList.remove('open'); return; }
    autoT = setTimeout(() => fetchSuggestions(q, box, inp, onPick), 380);
  });
  inp.addEventListener('blur', () => setTimeout(() => box.classList.remove('open'), 220));
}
async function fetchSuggestions(q, box, inp, onPick) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`);
    const d = await r.json();
    if (!d.length) { box.classList.remove('open'); return; }
    box.innerHTML = d.map(x => {
      const n = x.display_name.split(',').slice(0, 3).join(', ');
      return `<div class="sug-item" data-lat="${x.lat}" data-lon="${x.lon}" data-name="${n}"><i class="fas fa-location-dot"></i>${n}</div>`;
    }).join('');
    box.classList.add('open');
    box.querySelectorAll('.sug-item').forEach(el => el.addEventListener('mousedown', () => {
      inp.value = el.dataset.name; inp.dataset.lat = el.dataset.lat; inp.dataset.lon = el.dataset.lon;
      box.classList.remove('open');
      if (onPick) onPick(el.dataset.lat, el.dataset.lon);
    }));
  } catch { box.classList.remove('open'); }
}
setupAC('fromInput', 'fromSug', null);
setupAC('toInput', 'toSug', null);

// ═══════════════════════════════════════════════
//  DETECT LOCATION
// ═══════════════════════════════════════════════
function detectLocation() {
  if (!navigator.geolocation) { toast('Geolocation not supported', 'red'); return; }
  toast('📍 Detecting location...', 'blue');
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: la, longitude: lo } = pos.coords;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${lo}`);
      const d = await r.json();
      const name = [d.address?.city || d.address?.town || d.address?.village, d.address?.state, d.address?.country].filter(Boolean).join(', ');
      const inp = document.getElementById('fromInput');
      inp.value = name; inp.dataset.lat = la; inp.dataset.lon = lo;
      toast('✅ Location set: ' + name, 'green');
    } catch { toast('Could not reverse geocode', 'red'); }
  }, () => toast('Location access denied', 'red'));
}

// ═══════════════════════════════════════════════
//  GEOCODE
// ═══════════════════════════════════════════════
async function geocode(q) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
    const d = await r.json();
    if (!d.length) return null;
    return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: d[0].display_name.split(',').slice(0, 2).join(', ') };
  } catch { return null; }
}

// ═══════════════════════════════════════════════
//  PIPELINE
// ═══════════════════════════════════════════════
function pipelineSet(id, state) {
  const el = document.getElementById('ps-' + id);
  if (!el) return;
  el.classList.remove('ps-active', 'ps-done');
  if (state === 'active') el.classList.add('ps-active');
  if (state === 'done') el.classList.add('ps-done');
  const st = el.querySelector('.ps-status');
  if (st) { if (state === 'active') st.textContent = 'Running...'; else if (state === 'done') st.textContent = '✓ Complete'; else st.textContent = 'Waiting...'; }
}
function pipelineAll(state) { ['research', 'weather', 'budget', 'itinerary', 'recommend'].forEach(id => pipelineSet(id, state)); }
function addLog(msg, type = 'info') {
  const box = document.getElementById('logStream');
  if (!box) return;
  const line = document.createElement('span');
  line.className = `log-line ${type}`; line.textContent = '> ' + msg;
  box.appendChild(line); box.appendChild(document.createElement('br'));
  box.scrollTop = box.scrollHeight;
}
function clearLog() { const box = document.getElementById('logStream'); if (box) box.innerHTML = ''; }
function setSub(t) { const el = document.getElementById('loadingSub'); if (el) el.textContent = t; }

// ═══════════════════════════════════════════════
//  MAIN AGENT RUNNER — calls backend /api/trips/generate
// ═══════════════════════════════════════════════
const API_BASE = 'http://localhost:5000';

async function runAgents() {
  const from = document.getElementById('fromInput').value.trim();
  const to = document.getElementById('toInput').value.trim();
  const date = document.getElementById('travelDate').value;
  const days = parseInt(document.getElementById('travelDays').value) || 3;
  const people = parseInt(document.getElementById('peopleCount').value) || 2;
  const travellerType = document.getElementById('travellerType').value;
  const budget = document.getElementById('budget').value;
  const interests = [...document.querySelectorAll('.chip.on')].map(c => c.dataset.val).join(', ');
  const category = selectedCategory;
  const errEl = document.getElementById('fErr');
  errEl.textContent = '';

  if (!to) { errEl.textContent = '⚠ Enter a destination city.'; return; }
  if (!date) { errEl.textContent = '⚠ Pick a travel date.'; return; }
  if (days < 1 || days > 14) { errEl.textContent = '⚠ Duration must be 1–14 days.'; return; }

  document.getElementById('formWrap').style.display = 'none';
  document.getElementById('results').style.display = 'none';
  document.getElementById('loadingWrap').style.display = 'block';
  clearLog(); pipelineAll('idle');

  try {
    // Phase 1: Research
    setSub('Destination Intelligence: loading real place database...');
    pipelineSet('research', 'active');
    addLog('Destination Intel Agent activated', 'agent');
    addLog(`Loading verified attraction database for: ${to}`, 'info');

    // Geocode for map
    const fromInp = document.getElementById('fromInput');
    const toInp = document.getElementById('toInput');
    const fromC = fromInp.dataset.lat ? { lat: parseFloat(fromInp.dataset.lat), lon: parseFloat(fromInp.dataset.lon), name: from } : await geocode(from || to);
    const toC = toInp.dataset.lat ? { lat: parseFloat(toInp.dataset.lat), lon: parseFloat(toInp.dataset.lon), name: to } : await geocode(to);

    addLog(`Destination resolved: ${to}`, 'ok');
    pipelineSet('research', 'done');

    // Phase 2: Weather
    setSub('Weather Agent: fetching live conditions at destination...');
    pipelineSet('weather', 'active');
    addLog('Weather Agent: fetching live data for ' + to, 'agent');

    // Phase 3: Generate
    setSub('AI orchestrator generating real city-specific itinerary...');
    pipelineSet('budget', 'active'); pipelineSet('itinerary', 'active'); pipelineSet('recommend', 'active');
    addLog('Budget Agent activated', 'agent');
    addLog('Itinerary Agent activated — real-place mode', 'agent');
    addLog('Recommendation Agent activated', 'agent');
    addLog(`Sending to backend: ${to}, ${days} days, ${people} people, ${budget} budget, ${category}`, 'info');

    // Call backend endpoint
    const resp = await fetch(`${API_BASE}/api/trips/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, destination: to, category, days, people, budget, interests, travelDate: date, travellerType })
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.message || `Server error (${resp.status})`);
    }

    const result = await resp.json();
    if (!result.success) throw new Error(result.message || 'Generation failed');

    const { itinerary, weather, destinationInfo } = result;

    addLog('Weather data received: ' + (weather ? `${weather.description} ${weather.temperature}°C` : 'N/A'), 'ok');
    pipelineSet('weather', 'done');
    addLog('Real itinerary generated with verified places', 'ok');
    addLog('Budget breakdown complete', 'ok');
    addLog('Recommendations and packing list ready', 'ok');
    pipelineSet('budget', 'done'); pipelineSet('itinerary', 'done'); pipelineSet('recommend', 'done');

    await new Promise(r => setTimeout(r, 400));

    document.getElementById('loadingWrap').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    renderAll(itinerary, weather, destinationInfo, fromC, toC, { from, to, days, date, people, travellerType, budget, category });
    toast('✅ Real trip plan generated!', 'green');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-save to DB if logged in
    autoSaveTripToDB({ itinerary, from, to, days, date, people, budget, category, travellerType, interests });

  } catch (e) {
    document.getElementById('loadingWrap').style.display = 'none';
    document.getElementById('formWrap').style.display = 'block';
    document.getElementById('fErr').textContent = '❌ ' + (e.message || 'Something went wrong. Is the backend running?');
    toast('❌ ' + e.message, 'red');
    pipelineAll('idle');
  }
}


// ═══════════════════════════════════════════════
//  RENDER ALL
// ═══════════════════════════════════════════════
let tripMap = null;

function renderAll(data, weather, destInfo, fromC, toC, meta) {
  // Banner
  document.getElementById('tbRoute').textContent = `${(meta.from || 'Your Location').split(',')[0]} → ${meta.to.split(',')[0]}`;
  document.getElementById('tbMeta').textContent = `${meta.days} Day${meta.days > 1 ? 's' : ''} · ${meta.people} Person${meta.people > 1 ? 's' : ''} · ${cap(meta.travellerType)} · ${cap(meta.budget)} Budget · ${fmtDate(meta.date)}`;
  document.getElementById('tbStats').innerHTML = [
    { v: meta.days, l: 'Days' },
    { v: meta.people + ' Pax', l: 'Travellers' },
    { v: cap(meta.category), l: 'Trip Type' },
    { v: data.bestTimeToVisit || 'Year Round', l: 'Best Time' }
  ].map(s => `<div class="tb-stat"><div class="tb-stat-val">${s.v}</div><div class="tb-stat-lbl">${s.l}</div></div>`).join('');

  // Alert banner
  if (weather) {
    const sc = weatherScore(weather);
    const ab = document.getElementById('alertBanner');
    let cls = 'good';
    if (sc.score < 40) cls = 'danger'; else if (sc.score < 65) cls = 'warn';
    ab.className = `alert-banner ${cls}`;
    ab.style.display = 'flex';
    const icons = { good: '☀️', warn: '⛅', danger: '⛈' };
    ab.innerHTML = `<span class="alert-icon">${icons[cls]}</span><div><strong>Weather Intelligence Active:</strong> ${data.weatherAdaptation || 'Itinerary adapted to current conditions.'}</div>`;
  }

  // Destination highlights
  renderDestHighlight(data, destInfo, weather);

  renderMap(fromC, toC, data.days);
  renderItinerary(data.days);
  renderHotels(data.hotels || []);
  renderBudget(data.budget || {}, meta);
  renderWeather(weather);
  renderRecommendations(data.recommendations || {});
  renderSafety(data.safetyAdvisory || []);
  renderPacking(data.packingList || []);
  renderEmergency(data.emergencyContacts || []);
}

// ─── DESTINATION HIGHLIGHT ───
function renderDestHighlight(data, destInfo, weather) {
  const el = document.getElementById('destHighlight');
  if (!el) return;
  const items = [
    { l: '📍 Destination Overview', v: data.destinationHighlight || destInfo?.description || '—' },
    { l: '📅 Best Time to Visit', v: data.bestTimeToVisit || destInfo?.bestMonths || 'October – March' },
    { l: '✈️ Nearest Airport', v: destInfo?.nearbyAirport || 'Check local airport' },
    { l: '🌤 Current Conditions', v: weather ? `${weather.description}, ${weather.temperature}°C` : 'Weather: check locally' },
    { l: '💡 Did You Know?', v: data.summary?.split('.')[0] + '.' || '—' },
    { l: '🏷 Trip Category', v: (destInfo?.categories || []).join(' · ') || '—' }
  ];
  el.innerHTML = items.map(i => `<div class="dh-card"><div class="dh-label">${i.l}</div><div class="dh-val">${i.v}</div></div>`).join('');
}

// ─── MAP ───
const TC = { monument: '#ffc800', nature: '#00e87a', beach: '#00b8ff', food: '#ff7b00', activity: '#ff1f3d', shopping: '#a855f7', spiritual: '#ffaa44', indoor: '#60a5fa', museum: '#a8aaff', cafe: '#f9a8d4', wildlife: '#84cc16', adventure: '#f97316' };

function renderMap(from, to, days) {
  if (tripMap) { tripMap.remove(); tripMap = null; }
  const el = document.getElementById('tripMap');
  if (!el) return;
  const center = to ? [to.lat, to.lon] : [20.5937, 78.9629];
  tripMap = L.map('tripMap', { zoomControl: true, attributionControl: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(tripMap);

  const bounds = [];
  const mkIcon = (color, size) => L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 ${size}px ${color}80"></div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2]
  });

  if (from) {
    L.marker([from.lat, from.lon], { icon: mkIcon('#00e87a', 15) })
      .bindPopup(`<div class="pop-title">🏠 START</div><div class="pop-body">${from.name}</div>`).addTo(tripMap);
    bounds.push([from.lat, from.lon]);
  }
  if (to) {
    L.marker([to.lat, to.lon], { icon: mkIcon('#ff1f3d', 17) })
      .bindPopup(`<div class="pop-title">🏁 DESTINATION</div><div class="pop-body">${to.name}</div>`).addTo(tripMap);
    bounds.push([to.lat, to.lon]);
    if (from) L.polyline([[from.lat, from.lon], [to.lat, to.lon]], { color: '#00b8ff', weight: 2, dashArray: '7,9', opacity: .7 }).addTo(tripMap);
  }

  if (bounds.length >= 2) tripMap.fitBounds(bounds, { padding: [32, 32] });
  else if (to) tripMap.setView([to.lat, to.lon], 13);

  document.getElementById('mapLegend').innerHTML = `
    <div class="ml-item"><div class="ml-dot" style="background:#00e87a"></div>Start</div>
    <div class="ml-item"><div class="ml-dot" style="background:#ff1f3d"></div>Destination</div>
    <div class="ml-item"><div class="ml-dot" style="background:#00b8ff"></div>Attractions</div>`;

  // Pin real places from itinerary
  if (to && days) {
    const allP = [];
    (days || []).forEach((d, di) => {
      const slots = d.slots || {};
      ['morning', 'afternoon', 'evening'].forEach(slot => {
        (slots[slot]?.places || d.places || []).slice(0, 1).forEach(p => allP.push({ ...p, dn: di + 1, slot }));
      });
    });
    const toName = document.getElementById('toInput').value;
    (async () => {
      for (const p of allP.slice(0, 10)) {
        if (!tripMap) break;
        try {
          const c = await geocode(p.name + ', ' + toName);
          if (!c) continue;
          const col = TC[p.type] || '#00b8ff';
          L.marker([c.lat, c.lon], { icon: mkIcon(col, 10) })
            .bindPopup(`<div class="pop-title">Day ${p.dn} · ${p.slot?.toUpperCase()} · ${p.name.toUpperCase()}</div><div class="pop-body">${(p.description || '').slice(0, 100)}...</div><span class="pop-tag" style="background:${col}20;color:${col};border:1px solid ${col}40">${(p.type || '').toUpperCase()}</span>`)
            .addTo(tripMap);
        } catch { }
        await new Promise(r => setTimeout(r, 500));
      }
    })();
  }
}

// ─── ITINERARY (TIME SLOTS) ───
function renderItinerary(days) {
  const tabs = document.getElementById('dayTabs');
  const body = document.getElementById('itineraryBody');
  if (!tabs || !body) return;
  tabs.innerHTML = days.map((d, i) => `<button class="day-tab${i === 0 ? ' on' : ''}" onclick="switchDay(${i})">Day ${i + 1}</button>`).join('');
  body.innerHTML = days.map((day, i) => {
    const slots = day.slots || {};
    // Support legacy flat places array as fallback
    const hasSlotsData = slots.morning || slots.afternoon || slots.evening;
    let slotsHtml = '';
    if (hasSlotsData) {
      // NEW: Time-slot based rendering
      slotsHtml = renderSlots(slots);
    } else {
      // LEGACY fallback: flat places list
      slotsHtml = (day.places || []).map((p, pi) => renderPlaceCard(p, pi)).join('');
    }
    return `
    <div class="day-panel${i === 0 ? ' on' : ''}" id="dp-${i}">
      <div class="day-hdr">
        <div class="day-num-big">0${i + 1}</div>
        <div>
          <div class="day-title">${day.title || 'Day ' + (i + 1)}</div>
          <div class="day-sub">${day.subtitle || ''} ${day.accommodation ? '· Stay: ' + day.accommodation : ''}</div>
          ${day.weatherNote ? `<div class="weather-note-badge"><i class="fas fa-cloud-sun" style="font-size:11px"></i>${day.weatherNote}</div>` : ''}
        </div>
      </div>
      ${slotsHtml}
      ${day.dayTip ? `<div class="day-tip-box"><i class="fas fa-lightbulb"></i>${day.dayTip}</div>` : ''}
    </div>`;
  }).join('');
}

function renderSlots(slots) {
  const slotDefs = [
    { key: 'morning', icon: '🌅', label: 'MORNING', cls: 'morning' },
    { key: 'afternoon', icon: '☀️', label: 'AFTERNOON', cls: 'afternoon' },
    { key: 'evening', icon: '🌆', label: 'EVENING', cls: 'evening' }
  ];
  return slotDefs.map(s => {
    const slot = slots[s.key];
    if (!slot) return '';
    const places = slot.places || [];
    if (!places.length) return '';
    return `
    <div class="time-slot">
      <div class="ts-header ${s.cls}">
        <span class="ts-icon">${s.icon}</span>
        <span class="ts-label">${s.label}</span>
        ${slot.time ? `<span class="ts-time">${slot.time}</span>` : ''}
      </div>
      ${places.map((p, pi) => renderPlaceCard(p, pi)).join('')}
    </div>`;
  }).join('');
}

function renderPlaceCard(p, pi) {
  const costBadge = p.estimatedCost ? `<div class="cost-badge">💰 ₹${Number(p.estimatedCost).toLocaleString('en-IN')} est.</div>` : '';
  return `
  <div class="place-card">
    <div class="place-num">${pi + 1}</div>
    <div class="place-info">
      <div class="place-name">${p.name}</div>
      <div class="place-desc">${p.description || ''}</div>
      <div class="place-tags">
        ${p.type ? `<span class="ptag">${cap(p.type)}</span>` : ''}
        ${p.duration ? `<span class="ptag o">⏱ ${p.duration}</span>` : ''}
        ${p.bestTime ? `<span class="ptag g">🕐 ${cap(p.bestTime)}</span>` : ''}
        ${p.weatherSuitable === false ? `<span class="ptag y">⚠ Weather caution</span>` : ''}
        ${p.tip ? `<span class="ptag p">💡 ${p.tip}</span>` : ''}
      </div>
      ${costBadge}
    </div>
  </div>`;
}

function switchDay(i) {
  document.querySelectorAll('.day-tab').forEach((t, j) => t.classList.toggle('on', i === j));
  document.querySelectorAll('.day-panel').forEach((p, j) => p.classList.toggle('on', i === j));
}

// ─── HOTELS ───
function renderHotels(hotels) {
  const el = document.getElementById('hotelsBody');
  if (!el) return;
  if (!hotels.length) { el.innerHTML = '<div style="color:var(--text-mid);font-size:.82rem">No hotel data available.</div>'; return; }
  el.innerHTML = hotels.map(h => `
    <div class="hotel-card">
      <div class="hotel-name">${h.name}</div>
      <div class="hotel-meta">
        <span class="hotel-stars">${'★'.repeat(Math.round(h.stars || 3))}</span>
        <span class="hotel-price">₹${(h.pricePerNight || 0).toLocaleString('en-IN')}/night</span>
        <span class="hotel-loc">📍 ${h.location || ''}</span>
      </div>
      <div class="hotel-desc">${h.description || ''}</div>
      <div class="amenity-tags">${(h.amenities || []).map(a => `<span class="amenity">${a}</span>`).join('')}</div>
    </div>`).join('');
}

// ─── BUDGET ───
function renderBudget(b, meta) {
  const el = document.getElementById('budgetBody');
  if (!el) return;
  const total = b.total || Object.values({ transport: b.transport || 0, accommodation: b.accommodation || 0, food: b.food || 0, activities: b.activities || 0, misc: b.misc || 0 }).reduce((a, c) => a + c, 0);
  const perPerson = b.perPerson || (total > 0 ? Math.round(total / (meta.people || 1)) : 0);
  const cats = [
    { k: 'transport', l: 'Transport', icon: '🚗' },
    { k: 'accommodation', l: 'Stay', icon: '🏨' },
    { k: 'food', l: 'Food & Dining', icon: '🍽' },
    { k: 'activities', l: 'Activities & Entry', icon: '🎯' },
    { k: 'misc', l: 'Miscellaneous', icon: '🛍' }
  ];
  el.innerHTML = `
    <div class="budget-grid">
      ${cats.map(c => {
        const v = b[c.k] || 0;
        const pct = total > 0 ? Math.round(v / total * 100) : 0;
        return `<div class="b-cat"><div class="b-cat-name">${c.icon} ${c.l}</div><div class="b-cat-val">₹${v.toLocaleString('en-IN')}</div><div class="b-cat-pct">${pct}% of total</div></div>`;
      }).join('')}
    </div>
    <div class="budget-bar"><div class="budget-bar-fill" style="width:${total > 0 ? 85 : 50}%"></div></div>
    <div class="budget-total">
      <div>
        <div class="bt-label">ESTIMATED TOTAL · ${meta.days} DAYS · ${meta.people} PEOPLE</div>
        <div class="bt-pp">₹${perPerson.toLocaleString('en-IN')} per person</div>
      </div>
      <span class="bt-val">₹${total.toLocaleString('en-IN')}</span>
    </div>
    ${b.savingTip ? `<div class="saving-tip">💡 ${b.savingTip}</div>` : ''}`;
}

// ─── WEATHER ───
function renderWeather(w) {
  const el = document.getElementById('weatherBody');
  if (!el) return;
  if (!w) { el.innerHTML = `<div style="color:var(--text-mid);font-size:.82rem;padding:16px;text-align:center">Weather data unavailable</div>`; return; }
  const emoji = W_EMOJI[w.condition] || '🌤';
  const sc = weatherScore(w);
  el.innerHTML = `
    <div class="weather-hero">
      <div class="w-emoji">${emoji}</div>
      <div>
        <div class="w-temp">${w.temperature || '?'}°C</div>
        <div class="w-desc">${w.description || ''}</div>
      </div>
    </div>
    <div class="w-stats">
      <div class="wstat"><div class="wstat-val">${w.feelsLike || '?'}°C</div><div class="wstat-lbl">Feels Like</div></div>
      <div class="wstat"><div class="wstat-val">${w.humidity || '?'}%</div><div class="wstat-lbl">Humidity</div></div>
      <div class="wstat"><div class="wstat-val">${w.windSpeed || '?'} km/h</div><div class="wstat-lbl">Wind Speed</div></div>
      <div class="wstat"><div class="wstat-val">${w.tempMax || '?'}°/${w.tempMin || '?'}°</div><div class="wstat-lbl">High/Low</div></div>
    </div>
    <div class="w-score">
      <div class="ws-lbl">TRAVEL SUITABILITY SCORE</div>
      <div class="ws-bar"><div class="ws-fill" style="width:${sc.score}%;background:${sc.color}"></div></div>
      <div class="ws-txt" style="color:${sc.color}">${sc.score}/100 · ${sc.label}</div>
    </div>`;
}

// ─── RECOMMENDATIONS ───
function renderRecommendations(recs) {
  const el = document.getElementById('recsBody');
  if (!el) return;
  const mustTry = recs.mustTry || [];
  const hidden = recs.hiddenGems || [];
  const dining = recs.dining || [];
  el.innerHTML = `
    ${mustTry.length ? `<div class="rec-section">
      <div class="rec-section-title">⭐ Must Try</div>
      ${mustTry.map(r => `<div class="rec-item"><div class="rec-icon">${r.icon || '⭐'}</div><div><div class="rec-name">${r.name}</div><div class="rec-desc">${r.description || ''}</div></div></div>`).join('')}
    </div>` : ''}
    ${hidden.length ? `<div class="rec-section">
      <div class="rec-section-title">💎 Hidden Gems</div>
      ${hidden.map(r => `<div class="rec-item"><div class="rec-icon">${r.icon || '💎'}</div><div><div class="rec-name">${r.name}</div><div class="rec-desc">${r.description || ''}</div></div></div>`).join('')}
    </div>` : ''}
    ${dining.length ? `<div class="rec-section">
      <div class="rec-section-title">🍽 Where to Eat</div>
      ${dining.map(r => `<div class="rec-item"><div class="rec-icon">${r.icon || '🍽'}</div><div><div class="rec-name">${r.name}</div><div class="rec-desc">${r.cuisine || ''}</div>${r.mustOrderDish ? `<div class="must-dish">👉 Order: ${r.mustOrderDish}</div>` : ''}<span class="rec-badge">${r.priceRange || '₹₹'}</span></div></div>`).join('')}
    </div>` : ''}`;
}

// ─── SAFETY ───
function renderSafety(items) {
  const el = document.getElementById('safetyBody');
  if (!el) return;
  if (!items.length) { el.innerHTML = `<div class="safety-item low"><div class="s-icon">✅</div><div><div class="s-title">ALL CLEAR</div><div class="s-desc">No major advisories for this trip.</div></div></div>`; return; }
  el.innerHTML = items.map(s => `<div class="safety-item ${s.level}"><div class="s-icon">${s.icon || '⚠️'}</div><div><div class="s-title">${s.title}</div><div class="s-desc">${s.description}</div></div></div>`).join('');
}

// ─── PACKING ───
function renderPacking(items) {
  const el = document.getElementById('packingBody');
  const prog = document.getElementById('packProg');
  if (!el) return;
  if (!items.length) { el.innerHTML = '<div style="color:var(--text-mid);font-size:.82rem">No items generated.</div>'; return; }
  el.innerHTML = items.map((item, i) => `<div class="pack-item" id="pi-${i}" onclick="togglePack(${i},${items.length})"><div class="pack-check" id="pc-${i}"></div>${item}</div>`).join('');
  if (prog) prog.textContent = `0 / ${items.length}`;
}
function togglePack(i, total) {
  const item = document.getElementById('pi-' + i);
  const chk = document.getElementById('pc-' + i);
  if (!item) return;
  item.classList.toggle('done');
  chk.textContent = item.classList.contains('done') ? '✓' : '';
  const done = document.querySelectorAll('.pack-item.done').length;
  const prog = document.getElementById('packProg');
  if (prog) prog.textContent = `${done} / ${total}`;
}

// ─── EMERGENCY ───
function renderEmergency(contacts) {
  const el = document.getElementById('emergencyBody');
  if (!el) return;
  const defaults = [{ name: 'Police', number: '100', icon: '🚔' }, { name: 'Ambulance', number: '108', icon: '🚑' }, { name: 'Fire Brigade', number: '101', icon: '🚒' }, { name: 'Tourist Helpline', number: '1800-111-363', icon: 'ℹ️' }];
  const list = contacts.length ? contacts : defaults;
  el.innerHTML = list.map(c => `<div class="ec-item"><div class="ec-icon">${c.icon || '📞'}</div><div><div class="ec-name">${c.name}</div><div class="ec-num">${c.number}</div></div></div>`).join('');
}

// ─── RESET ───
function resetAll() {
  document.getElementById('results').style.display = 'none';
  const ab = document.getElementById('alertBanner');
  if (ab) ab.style.display = 'none';
  document.getElementById('formWrap').style.display = 'block';
  if (tripMap) { tripMap.remove(); tripMap = null; }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Ready for a new trip! 🗺', 'blue');
}

// ─── HELPERS ───
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDate(s) { if (!s) return ''; const d = new Date(s); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

// ─── TOAST ───
function toast(msg, color = 'blue') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const icons = { red: '🚨', orange: '⚠️', green: '✅', blue: 'ℹ️', purple: '🤖' };
  const t = document.createElement('div');
  t.className = `toast ${color}`;
  t.innerHTML = `<div class="t-icon">${icons[color] || 'ℹ️'}</div><div><div class="t-msg">${msg}</div><div class="t-lbl">SkySafe AI · Real-Place Intelligence</div></div>`;
  stack.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

// ════════════════════════════════════════════════
//  AUTO-SAVE TRIP TO DATABASE
// ════════════════════════════════════════════════
async function autoSaveTripToDB({ itinerary, from, to, days, date, people, budget, category, travellerType, interests }) {
  try {
    // Get logged-in user from localStorage
    const userRaw = localStorage.getItem('skysafe_user');
    if (!userRaw) return; // Not logged in — skip silently

    const user = JSON.parse(userRaw);
    if (!user || !user.id) return;

    // Calculate end date from start + days
    const startDate = new Date(date);
    const endDate   = new Date(startDate);
    endDate.setDate(endDate.getDate() + (parseInt(days) - 1));
    const endDateStr = endDate.toISOString().split('T')[0];

    const tripName  = itinerary?.tripTitle || `${parseInt(days)}-Day Trip to ${to}`;
    const travellerT = travellerType || (people === 1 ? 'solo' : people === 2 ? 'couple' : 'group');
    const budgetLevel = budget || 'medium';

    const payload = {
      user_id:               user.id,
      trip_name:             tripName,
      source_location:       from || 'India',
      destination_location:  to,
      destination_category:  category || 'general',
      start_date:            date,
      end_date:              endDateStr,
      traveller_count:       parseInt(people) || 1,
      traveller_type:        travellerT,
      travel_mode:           'car',
      budget_level:          budgetLevel,
      interests:             interests || ''
    };

    const res = await fetch('http://localhost:5000/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      toast('💾 Trip saved to your dashboard!', 'green');

      // Also save the generated itinerary JSON
      if (data.trip_id && itinerary) {
        await fetch('http://localhost:5000/api/trips/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, user_id: user.id })
        }).catch(() => {}); // Fire and forget
      }

      // Inject "View in Dashboard" button near results top
      const btnContainer = document.getElementById('tbStats');
      if (btnContainer && !document.getElementById('dashboardTripBtn')) {
        const btn = document.createElement('a');
        btn.id        = 'dashboardTripBtn';
        btn.href      = 'dashboard.html';
        btn.className = 'tb-stat';
        btn.style.cssText = 'cursor:pointer;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:10px;text-decoration:none;';
        btn.innerHTML = `<div class="tb-stat-val" style="color:#10b981">📋</div><div class="tb-stat-lbl" style="color:#10b981">View in Dashboard</div>`;
        btnContainer.appendChild(btn);
      }
    }
  } catch (err) {
    // Silent fail — saving to DB is non-critical
    console.warn('Trip DB save skipped:', err.message);
  }
}