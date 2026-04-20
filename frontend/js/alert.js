// ===================== SKYSAFE DASHBOARD JS =====================

// ── CANVAS BACKGROUND ──
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() { 
  canvas.width = window.innerWidth; 
  canvas.height = window.innerHeight; 
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const pts = Array.from({length:60}, () => ({
  x: Math.random() * window.innerWidth, 
  y: Math.random() * window.innerHeight,
  vx: (Math.random() - 0.5) * 0.25, 
  vy: (Math.random() - 0.5) * 0.25,
  r: Math.random() * 1 + 0.3, 
  alpha: Math.random() * 0.3 + 0.05
}));

(function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let i = 0; i < pts.length; i++){
    for(let j = i + 1; j < pts.length; j++){
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if(d < 130){
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(255,34,68,${0.04 * (1 - d/130)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  pts.forEach(p => {
    p.x += p.vx; 
    p.y += p.vy;
    if(p.x < 0) p.x = canvas.width;
    if(p.x > canvas.width) p.x = 0;
    if(p.y < 0) p.y = canvas.height;
    if(p.y > canvas.height) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,60,60,${p.alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(draw);
})();

// ── LIVE CLOCK ──
function updateClock(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const el = document.getElementById('navClock');
  if(el) el.textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateClock, 1000);
updateClock();

// ══════════════════════════════════
// VIEW SWITCHING
// ══════════════════════════════════
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view-container').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show selected view
  document.getElementById(viewName + 'View').classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById('btn' + viewName.charAt(0).toUpperCase() + viewName.slice(1));
  if(activeBtn) activeBtn.classList.add('active');
  
  // Initialize map if switching to map view
  if(viewName === 'map' && typeof initMap === 'function' && !window.mapInitialized) {
    setTimeout(() => {
      initMap();
      window.mapInitialized = true;
    }, 100);
  }
  
  showToast(`Switched to ${viewName === 'dashboard' ? 'Dashboard' : 'Command Map'}`, 'blue');
}

// ══════════════════════════════════
// NASA EONET API CONFIGURATION
// ══════════════════════════════════
const EONET_BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3';
let DISASTERS = [];

const EONET_CATEGORY_MAP = {
  'severeStorms': { icon: '⛈', type: 'storm', name: 'Severe Storm' },
  'wildfires': { icon: '🔥', type: 'fire', name: 'Wildfire' },
  'floods': { icon: '🌊', type: 'flood', name: 'Flood' },
  'earthquakes': { icon: '🌋', type: 'earthquake', name: 'Earthquake' },
  'volcanoes': { icon: '🌋', type: 'volcano', name: 'Volcano' },
  'landslides': { icon: '🏔', type: 'landslide', name: 'Landslide' },
  'drought': { icon: '🏜', type: 'drought', name: 'Drought' },
  'dustHaze': { icon: '🌫', type: 'dust', name: 'Dust/Haze' },
  'snow': { icon: '❄️', type: 'snow', name: 'Snow/Ice' },
  'extremeTemperature': { icon: '🌡', type: 'temperature', name: 'Extreme Temp' },
  'manmade': { icon: '⚠️', type: 'manmade', name: 'Manmade Event' },
  'waterColor': { icon: '💧', type: 'water', name: 'Water Color' },
  'icebergs': { icon: '🧊', type: 'iceberg', name: 'Iceberg' }
};

function determineSeverity(event) {
  const title = (event.title || '').toLowerCase();
  const magnitude = event.geometry?.[0]?.magnitudeValue;
  
  if(magnitude) {
    if(magnitude >= 7) return 'extreme';
    if(magnitude >= 5) return 'severe';
    if(magnitude >= 3) return 'moderate';
  }
  
  if(title.includes('major') || title.includes('severe') || title.includes('catastrophic')) return 'extreme';
  if(title.includes('strong') || title.includes('heavy') || title.includes('large')) return 'severe';
  if(title.includes('moderate') || title.includes('medium')) return 'moderate';
  
  return 'moderate';
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if(diffMins < 60) return `${diffMins}m ago`;
  if(diffHours < 24) return `${diffHours}h ago`;
  if(diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Fetch disasters from NASA EONET API
async function fetchNASADisasters() {
  try {
    showToast('🛰️ Fetching live disaster data from NASA...', 'blue');
    
    const response = await fetch(`${EONET_BASE_URL}/events?status=open&limit=20`);
    if(!response.ok) throw new Error('Failed to fetch NASA data');
    
    const data = await response.json();
    
    DISASTERS = data.events.map((event, index) => {
      const category = event.categories?.[0]?.id || 'unknown';
      const categoryInfo = EONET_CATEGORY_MAP[category] || { icon: '📍', type: 'unknown', name: 'Event' };
      const severity = determineSeverity(event);
      const location = event.geometry?.[0] || {};
      const coords = location.coordinates || [0, 0];
      
      return {
        id: event.id || index + 1,
        icon: categoryInfo.icon,
        name: event.title || 'Unknown Event',
        location: `${coords[1]?.toFixed(2) || 'Unknown'}°N, ${Math.abs(coords[0])?.toFixed(2) || 'Unknown'}°${coords[0] < 0 ? 'W' : 'E'}`,
        severity: severity,
        type: categoryInfo.type,
        affected: 'Unknown',
        time: timeAgo(location.date || new Date()),
        nasaLink: event.link,
        nasaId: event.id,
        description: event.description || '',
        date: location.date || new Date().toISOString(),
        coordinates: coords
      };
    });
    
    showToast(`✅ Loaded ${DISASTERS.length} active disasters from NASA`, 'green');
    renderDisasters();
    updateStatsFromNASA();
    
  } catch(error) {
    console.error('NASA API Error:', error);
    showToast('❌ Failed to load NASA data', 'red');
    DISASTERS = [];
    renderDisasters();
  }
}

function updateStatsFromNASA() {
  const statActive = document.getElementById('statActive');
  if(statActive) statActive.textContent = DISASTERS.length;
}

function refreshDisasters() {
  fetchNASADisasters();
}

// ══════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════
function renderDisasters(filter = 'all'){
  const list = document.getElementById('disasterList');
  if(!list) return;
  
  const data = filter === 'all' ? DISASTERS : DISASTERS.filter(d => d.type === filter);
  
  if(!data.length){
    list.innerHTML = `<div style="text-align:center;padding:32px;color:#334455;font-family:Orbitron,monospace;font-size:0.75rem;letter-spacing:2px;">NO ACTIVE DISASTERS FOR THIS FILTER</div>`;
    return;
  }
  
  list.innerHTML = data.map(d => `
    <div class="disaster-item" onclick="showDisasterDetails('${d.nasaId}')">
      <div class="disaster-stripe ${d.severity}"></div>
      <div class="disaster-body">
        <div class="disaster-icon ${d.severity}">${d.icon}</div>
        <div class="disaster-meta">
          <div class="disaster-name">${d.name}</div>
          <div class="disaster-loc"><i class="fas fa-location-dot" style="font-size:.6rem;margin-right:4px"></i>${d.location}</div>
        </div>
        <div class="disaster-right">
          <div class="disaster-sev ${d.severity}">${d.severity.toUpperCase()}</div>
          <div class="disaster-affected">🛰️ NASA EONET</div>
          <div class="disaster-time">${d.time}</div>
        </div>
      </div>
    </div>`).join('');
}

function showDisasterDetails(nasaId) {
  const disaster = DISASTERS.find(d => d.nasaId === nasaId);
  if(disaster && disaster.nasaLink) {
    window.open(disaster.nasaLink, '_blank');
  }
}

function filterDisasters(){
  const filter = document.getElementById('disasterFilter').value;
  renderDisasters(filter);
}

const TIMELINE = [
  { color:'red',   icon:'fas fa-siren-on',       title:'Cyclone Warning Issued',         desc:'IMD issued red alert for Odisha coast. Evacuation of 500K initiated.',  time:'02:14 IST' },
  { color:'orange',icon:'fas fa-truck-fast',      title:'NDRF Teams Deployed',            desc:'14 NDRF teams dispatched to Bhubaneswar, Paradip, Puri.',               time:'03:45 IST' },
  { color:'blue',  icon:'fas fa-helicopter',      title:'Air Rescue Operations Begin',    desc:'IAF helicopters deployed over flooded Assam districts.',                time:'06:20 IST' },
  { color:'green', icon:'fas fa-house-chimney',   title:'Relief Camps Operational',       desc:'143 relief camps housing 2.1L displaced persons across 6 districts.',   time:'08:00 IST' },
  { color:'orange',icon:'fas fa-bolt',            title:'Power Grid Disruption',          desc:'14 districts without power. Restoration teams working on priority.',    time:'09:30 IST' },
  { color:'green', icon:'fas fa-kit-medical',     title:'Medical Units Deployed',         desc:'82 medical teams with 1,200 paramedics deployed across flood zones.',   time:'11:15 IST' },
];

const RESOURCES = [
  { icon:'🚁', name:'Helicopters',  val:38,  total:50,  color:'#00c8ff', sub:'12 standby' },
  { icon:'🚤', name:'Boats',        val:284, total:350, color:'#00c8ff', sub:'66 en-route' },
  { icon:'🚑', name:'Ambulances',   val:156, total:200, color:'#00ff88', sub:'44 standby'  },
  { icon:'⛺', name:'Relief Camps', val:143, total:160, color:'#ffcc00', sub:'17 pending'  },
  { icon:'💊', name:'Med Kits',     val:8200,total:10000,color:'#ff8800',sub:'1800 needed' },
  { icon:'🍱', name:'Food Packs',   val:95,  total:100, color:'#00ff88', sub:'Units: 50K'  },
];

const CONTACTS = [
  { icon:'🛡', name:'NDRF Director',          role:'National Disaster Response Force', color:'#00c8ff' },
  { icon:'🏥', name:'National Health Mission', role:'Medical Emergency Coordinator',    color:'#00ff88' },
  { icon:'✈️', name:'IAF Emergency Wing',      role:'Air Rescue Operations',            color:'#ffcc00' },
  { icon:'🌊', name:'Coast Guard HQ',          role:'Maritime & Coastal Rescue',        color:'#ff8800' },
  { icon:'🔌', name:'POSOCO Grid Centre',      role:'Power Restoration Authority',      color:'#00c8ff' },
];

const QUICK_ACTIONS = [
  { icon:'fas fa-broadcast-tower',  label:'Broadcast',    color:'#ff8800', fn:'showToast("📡 Emergency broadcast sent to all units","orange")' },
  { icon:'fas fa-map-location-dot', label:'Track Teams',  color:'#00c8ff', fn:'switchView(\'map\')' },
  { icon:'fas fa-box-open',         label:'Supply Drop',  color:'#00ff88', fn:'showToast("📦 Supply drop request filed","green")' },
  { icon:'fas fa-hospital',         label:'Hospitals',    color:'#ff4466', fn:'showToast("🏥 Hospital network notified","red")' },
  { icon:'fas fa-shield-halved',    label:'Evacuate',     color:'#ffcc00', fn:'showToast("🚨 Evacuation order issued","orange")' },
  { icon:'fas fa-satellite',        label:'Satellite',    color:'#00c8ff', fn:'showToast("🛰️ Satellite imagery updated","blue")' },
];

const WEATHER_IMPACT = [
  { emoji:'🌀', name:'Cyclone Landfall',     desc:'Category 4 • 180 km/h winds',     risk:'high'   },
  { emoji:'🌧', name:'Extreme Rainfall',     desc:'+400mm in 24hrs • Flood risk',     risk:'high'   },
  { emoji:'🌊', name:'Storm Surge 3–4m',     desc:'Coastal inundation likely',        risk:'high'   },
  { emoji:'⛈', name:'Lightning Storm',      desc:'10,000+ strikes/hr forecast',      risk:'medium' },
  { emoji:'💨', name:'Strong Wind Gusts',    desc:'90–120 km/h inland spread',        risk:'medium' },
  { emoji:'🌫', name:'Reduced Visibility',   desc:'Dense fog post-storm, 50m vis',    risk:'low'    },
];

const THREAT_BARS = [
  { label:'Cyclone Risk',   val:92, color:'#ff2244' },
  { label:'Flood Risk',     val:78, color:'#ff8800' },
  { label:'Seismic Risk',   val:34, color:'#ffcc00' },
  { label:'Wildfire Risk',  val:61, color:'#ff6600' },
  { label:'Heat Risk',      val:48, color:'#ff9900' },
];

function renderTimeline(){
  const el = document.getElementById('timelineWrap');
  if(!el) return;
  
  el.innerHTML = TIMELINE.map(t => `
    <div class="tl-item">
      <div class="tl-icon ${t.color}"><i class="${t.icon}"></i></div>
      <div class="tl-content">
        <div class="tl-title">${t.title}</div>
        <div class="tl-desc">${t.desc}</div>
        <div class="tl-time">${t.time}</div>
      </div>
    </div>`).join('');
}

function renderResources(){
  const el = document.getElementById('resourceGrid');
  if(!el) return;
  
  el.innerHTML = RESOURCES.map(r => {
    const pct = Math.round((r.val/r.total)*100);
    return `
      <div class="resource-card">
        <div class="resource-icon">${r.icon}</div>
        <div class="resource-name">${r.name}</div>
        <div class="resource-val">${r.val}</div>
        <div class="resource-bar-wrap">
          <div class="resource-bar-fill" style="width:${pct}%;background:${r.color};box-shadow:0 0 6px ${r.color}40"></div>
        </div>
        <div class="resource-sub">${r.sub}</div>
      </div>`;
  }).join('');
}

function renderThreatBars(){
  const el = document.getElementById('threatBars');
  if(!el) return;
  
  el.innerHTML = THREAT_BARS.map(b => `
    <div class="tb-row">
      <div class="tb-label">${b.label}</div>
      <div class="tb-track"><div class="tb-fill" style="width:${b.val}%;background:${b.color};box-shadow:0 0 4px ${b.color}60"></div></div>
      <div class="tb-val" style="color:${b.color}">${b.val}</div>
    </div>`).join('');
}

function renderContacts(){
  const el = document.getElementById('contactsList');
  if(!el) return;
  
  el.innerHTML = CONTACTS.map(c => `
    <div class="contact-item">
      <div class="contact-avatar" style="background:${c.color}15;border-color:${c.color}30;color:${c.color}">${c.icon}</div>
      <div class="contact-info">
        <div class="contact-name">${c.name}</div>
        <div class="contact-role">${c.role}</div>
      </div>
      <div class="contact-call" onclick="showToast('📞 Calling ${c.name}...','green')">
        <i class="fas fa-phone"></i>
      </div>
    </div>`).join('');
}

function renderQuickActions(){
  const el = document.getElementById('quickGrid');
  if(!el) return;
  
  el.innerHTML = QUICK_ACTIONS.map(q => `
    <button class="quick-btn" onclick="${q.fn}" style="border-color:${q.color}18">
      <i class="${q.icon}" style="color:${q.color}"></i>
      <span>${q.label}</span>
    </button>`).join('');
}

function renderWeatherImpact(){
  const el = document.getElementById('weatherImpact');
  if(!el) return;
  
  el.innerHTML = WEATHER_IMPACT.map(w => `
    <div class="wi-item">
      <div class="wi-emoji">${w.emoji}</div>
      <div class="wi-info">
        <div class="wi-name">${w.name}</div>
        <div class="wi-desc">${w.desc}</div>
      </div>
      <div class="wi-badge ${w.risk}">${w.risk.toUpperCase()}</div>
    </div>`).join('');
}

// ══════════════════════════════════
// SOS
// ══════════════════════════════════
let sosTimer = null;
let sosCount = 3;

function triggerSOS(){
  const modal = document.getElementById('sosModal');
  if(!modal) return;
  
  modal.classList.add('open');
  sosCount = 3;
  const countdownEl = document.getElementById('sosCountdown');
  if(countdownEl) countdownEl.textContent = `Connecting in ${sosCount}...`;
  
  sosTimer = setInterval(() => {
    sosCount--;
    if(sosCount <= 0){
      clearInterval(sosTimer);
      if(countdownEl) countdownEl.textContent = '🔴 BROADCAST ACTIVE — Authorities Notified';
      showToast('🚨 SOS Broadcast Active — Emergency teams alerted', 'red');
    } else {
      if(countdownEl) countdownEl.textContent = `Connecting in ${sosCount}...`;
    }
  }, 1000);
}

function closeSOS(){
  clearInterval(sosTimer);
  const modal = document.getElementById('sosModal');
  if(modal) modal.classList.remove('open');
  showToast('SOS cancelled', 'orange');
}

// ══════════════════════════════════
// REPORT MODAL
// ══════════════════════════════════
function openReportModal(){ 
  const modal = document.getElementById('reportModal');
  if(modal) modal.classList.add('open'); 
}

function closeReportModal(){
  const modal = document.getElementById('reportModal');
  const msg = document.getElementById('reportMsg');
  const form = document.getElementById('reportForm');
  
  if(modal) modal.classList.remove('open');
  if(msg) msg.textContent = '';
  if(form) form.reset();
}

function submitReport(e){
  e.preventDefault();
  const loc = document.getElementById('rLocation').value.trim();
  const rep = document.getElementById('rReporter').value.trim();
  const msg = document.getElementById('reportMsg');
  
  if(!loc){ 
    if(msg) { msg.style.color = '#ff4466'; msg.textContent = '⚠ Please enter a location.'; }
    return; 
  }
  if(!rep){ 
    if(msg) { msg.style.color = '#ff4466'; msg.textContent = '⚠ Please enter reporter name.'; }
    return; 
  }
  
  if(msg) {
    msg.style.color = '#00ff88';
    msg.textContent = '✓ Report submitted successfully. Assigned ID: INC-' + Math.floor(Math.random()*90000+10000);
  }
  
  setTimeout(closeReportModal, 2000);
  showToast('📋 Incident report filed successfully', 'green');
}

// Severity button toggle
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

// ══════════════════════════════════
// RESOURCE MODAL
// ══════════════════════════════════
function openResourceModal(){ 
  const modal = document.getElementById('resourceModal');
  if(modal) modal.classList.add('open'); 
}

function closeResourceModal(){
  const modal = document.getElementById('resourceModal');
  const msg = document.getElementById('resourceMsg');
  
  if(modal) modal.classList.remove('open');
  if(msg) msg.textContent = '';
}

function submitResource(e){
  e.preventDefault();
  const dest = document.getElementById('resDest').value.trim();
  const units = document.getElementById('resUnits').value;
  const msg = document.getElementById('resourceMsg');
  
  if(!dest){ 
    if(msg) { msg.style.color = '#ff4466'; msg.textContent = '⚠ Please enter destination.'; }
    return; 
  }
  if(!units){ 
    if(msg) { msg.style.color = '#ff4466'; msg.textContent = '⚠ Please enter number of units.'; }
    return; 
  }
  
  if(msg) {
    msg.style.color = '#00ff88';
    msg.textContent = `✓ ${units} unit(s) deploying to ${dest}`;
  }
  
  setTimeout(closeResourceModal, 2000);
  showToast(`🚁 ${units} units deployed to ${dest}`, 'green');
}

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if(e.target === overlay){
        overlay.classList.remove('open');
        clearInterval(sosTimer);
      }
    });
  });
});

// ══════════════════════════════════
// TOAST
// ══════════════════════════════════
function showToast(msg, color = 'blue'){
  const stack = document.getElementById('toastStack');
  if(!stack) return;
  
  const t = document.createElement('div');
  t.className = `toast-item ${color}`;
  const icons = { red:'🚨', orange:'⚠️', green:'✅', blue:'ℹ️' };
  t.innerHTML = `
    <div class="toast-icon">${icons[color] || 'ℹ️'}</div>
    <div>
      <div class="toast-msg">${msg}</div>
      <div class="toast-lbl">SkySafe Disaster Management</div>
    </div>`;
  stack.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

// ══════════════════════════════════
// LIVE COUNTER ANIMATION
// ══════════════════════════════════
function animateCounters(){
  const targets = [
    {id:'statActive',   end: DISASTERS.length || 7, suffix:''},
    {id:'statTeams',    end:143,    suffix:''},
    {id:'statRescued',  end:18430,  suffix:''},
  ];
  
  targets.forEach(t => {
    const el = document.getElementById(t.id);
    if(!el) return;
    
    let start = 0; 
    const duration = 1500; 
    const step = 16;
    const inc = t.end / (duration / step);
    
    const timer = setInterval(() => {
      start = Math.min(start + inc, t.end);
      el.textContent = Math.floor(start).toLocaleString() + t.suffix;
      if(start >= t.end) clearInterval(timer);
    }, step);
  });
}

// ══════════════════════════════════
// WEATHER-BASED DISASTER MANAGEMENT
// ══════════════════════════════════
const WBD_API_KEY = '85e24fbc730d141f1608cd28e13d5c71';
const WBD_BASE = 'https://api.openweathermap.org/data/2.5';

function wbdQuick(city) {
  const input = document.getElementById('wbdCityInput');
  if(input) input.value = city;
  loadWeatherRisk();
}

async function loadWeatherRisk() {
  const cityInput = document.getElementById('wbdCityInput');
  const city = cityInput ? cityInput.value.trim() : '';
  
  if(!city) { 
    showToast('Please enter a city name', 'orange'); 
    return; 
  }

  const loadingEl = document.getElementById('wbdLoading');
  const resultsEl = document.getElementById('wbdResults');
  const loadingCityEl = document.getElementById('wbdLoadingCity');
  
  if(loadingEl) loadingEl.style.display = 'flex';
  if(resultsEl) resultsEl.style.display = 'none';
  if(loadingCityEl) loadingCityEl.textContent = `Analysing ${city}...`;

  try {
    const [curRes, fcRes] = await Promise.all([
      fetch(`${WBD_BASE}/weather?q=${encodeURIComponent(city)}&appid=${WBD_API_KEY}&units=metric`),
      fetch(`${WBD_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${WBD_API_KEY}&units=metric`)
    ]);

    if(!curRes.ok) throw new Error('City not found');

    const cur = await curRes.json();
    const fc = await fcRes.json();

    if(loadingEl) loadingEl.style.display = 'none';
    if(resultsEl) resultsEl.style.display = 'block';

    renderWBD(cur, fc);
    showToast(`✅ Risk analysis complete for ${cur.name}`, 'green');

  } catch(err) {
    if(loadingEl) loadingEl.style.display = 'none';
    showToast(`❌ ${err.message || 'Failed to fetch weather data'}`, 'red');
  }
}

function calcRisks(w, fc) {
  const windKmh = (w.wind?.speed || 0) * 3.6;
  const humidity = w.main?.humidity || 0;
  const temp = w.main?.temp || 20;
  const feelsLike = w.main?.feels_like || 20;
  const visibility = (w.visibility || 10000) / 1000;
  const pressure = w.main?.pressure || 1013;
  const rain1h = w.rain?.['1h'] || 0;
  const snow1h = w.snow?.['1h'] || 0;
  const wMain = w.weather?.[0]?.main || '';
  const fcRainMax = fc ? Math.max(...fc.list.slice(0, 8).map(i => i.rain?.['3h'] || 0)) : 0;
  const totalRain = rain1h + fcRainMax;

  let flood = 0;
  if(totalRain > 50) flood += 40; 
  else if(totalRain > 20) flood += 25; 
  else if(totalRain > 10) flood += 12;
  if(humidity > 90) flood += 20; 
  else if(humidity > 80) flood += 10;
  if(pressure < 990) flood += 20; 
  else if(pressure < 1000) flood += 10;
  flood = Math.min(100, flood);

  let cyclone = 0;
  if(windKmh > 120) cyclone += 60; 
  else if(windKmh > 88) cyclone += 45; 
  else if(windKmh > 62) cyclone += 30; 
  else if(windKmh > 40) cyclone += 15;
  if(pressure < 970) cyclone += 30; 
  else if(pressure < 990) cyclone += 15;
  if(humidity > 85) cyclone += 10;
  cyclone = Math.min(100, cyclone);

  let heat = 0;
  if(feelsLike > 48) heat = 80; 
  else if(feelsLike > 44) heat = 60; 
  else if(feelsLike > 40) heat = 42; 
  else if(feelsLike > 36) heat = 25; 
  else if(feelsLike > 32) heat = 10;
  if(humidity < 30 && temp > 38) heat = Math.min(100, heat + 15);
  heat = Math.min(100, heat);

  let cold = 0;
  if(feelsLike < -10) cold = 75; 
  else if(feelsLike < 0) cold = 55; 
  else if(feelsLike < 5) cold = 32; 
  else if(feelsLike < 10) cold = 14;
  if(snow1h > 10) cold = Math.min(100, cold + 20);
  cold = Math.min(100, cold);

  let thunder = 0;
  if(wMain === 'Thunderstorm') thunder = 75;
  if(humidity > 85 && windKmh > 30) thunder = Math.min(100, thunder + 20);
  if(pressure < 995) thunder = Math.min(100, thunder + 15);
  thunder = Math.min(100, thunder);

  let fog = 0;
  if(visibility < 0.2) fog = 90; 
  else if(visibility < 0.5) fog = 70; 
  else if(visibility < 1) fog = 50; 
  else if(visibility < 3) fog = 25; 
  else if(visibility < 5) fog = 10;
  if(humidity > 95) fog = Math.min(100, fog + 15);

  let fire = 0;
  if(temp > 40 && humidity < 20 && windKmh > 30) fire = 80;
  else if(temp > 36 && humidity < 30) fire = 55;
  else if(temp > 32 && humidity < 40 && windKmh > 20) fire = 35;
  else if(temp > 30 && humidity < 40) fire = 15;
  fire = Math.min(100, fire);

  let landslide = 0;
  if(totalRain > 100) landslide = 75; 
  else if(totalRain > 60) landslide = 55; 
  else if(totalRain > 30) landslide = 30;
  landslide = Math.min(100, landslide);

  const scores = [flood, cyclone, heat, cold, thunder, fog, fire, landslide];
  const overall = Math.round(Math.max(...scores) * 0.55 + scores.reduce((a,b) => a+b, 0)/8 * 0.45);

  return {
    overall,
    metrics: { windKmh, humidity, temp, feelsLike, visibility, pressure, totalRain, snow1h },
    risks: [
      { name:'Flood',          icon:'🌊', score:flood,     reason:`Rain ${totalRain.toFixed(1)}mm · Humidity ${humidity}% · Pressure ${pressure} hPa` },
      { name:'Cyclone/Storm',  icon:'🌀', score:cyclone,   reason:`Wind ${windKmh.toFixed(0)} km/h · Pressure ${pressure} hPa` },
      { name:'Heat Wave',      icon:'🔥', score:heat,      reason:`Feels like ${feelsLike.toFixed(1)}°C · Humidity ${humidity}%` },
      { name:'Cold Wave',      icon:'❄️', score:cold,      reason:`Feels like ${feelsLike.toFixed(1)}°C · Snow ${snow1h} mm/h` },
      { name:'Thunderstorm',   icon:'⛈', score:thunder,   reason:`Condition: ${wMain} · Pressure ${pressure} hPa` },
      { name:'Dense Fog',      icon:'🌫', score:fog,       reason:`Visibility ${visibility.toFixed(1)} km · Humidity ${humidity}%` },
      { name:'Wildfire',       icon:'🔥', score:fire,      reason:`Temp ${temp.toFixed(1)}°C · Humidity ${humidity}% · Wind ${windKmh.toFixed(0)} km/h` },
      { name:'Landslide',      icon:'🏔', score:landslide, reason:`Total rain ${totalRain.toFixed(1)} mm` },
    ]
  };
}

function scoreToSev(s) {
  if(s >= 70) return 'extreme';
  if(s >= 50) return 'high';
  if(s >= 25) return 'medium';
  if(s >= 10) return 'low';
  return 'none';
}

function scoreToColor(s) {
  if(s >= 70) return { bar:'#ff2244', stripe:'linear-gradient(90deg,#cc0000,#ff2244)' };
  if(s >= 50) return { bar:'#ff8800', stripe:'linear-gradient(90deg,#cc5500,#ff8800)' };
  if(s >= 25) return { bar:'#ffcc00', stripe:'linear-gradient(90deg,#aa8800,#ffcc00)' };
  if(s >= 10) return { bar:'#00c8ff', stripe:'linear-gradient(90deg,#006688,#00c8ff)' };
  return { bar:'#00ff88', stripe:'linear-gradient(90deg,#003322,#00ff88)' };
}

function overallInfo(s) {
  if(s >= 70) return { level:'EXTREME', cls:'extreme', color:'#ff2244' };
  if(s >= 50) return { level:'HIGH',    cls:'high',    color:'#ff8800' };
  if(s >= 25) return { level:'MEDIUM',  cls:'medium',  color:'#ffcc00' };
  if(s >= 10) return { level:'LOW',     cls:'low',     color:'#00ff88' };
  return { level:'MINIMAL', cls:'low', color:'#00ff88' };
}

function buildRecos(risks, metrics) {
  const recos = [];
  const sorted = [...risks].sort((a,b) => b.score - a.score);
  
  sorted.forEach(r => {
    if(r.score < 10) return;
    const sev = scoreToSev(r.score);
    const pri = sev === 'extreme' ? 'critical' : sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low';

    if(r.name === 'Flood' && r.score >= 10)
      recos.push({ icon:'fas fa-water', color: pri==='critical'?'red':'orange', title:'Flood Preparedness', pri,
        desc: r.score >= 70 ? 'IMMEDIATE evacuation from low-lying areas. Deploy NDRF teams. Issue red alert.' : 'Monitor river levels. Pre-position rescue boats. Alert riverside communities.' });

    if(r.name === 'Cyclone/Storm' && r.score >= 10)
      recos.push({ icon:'fas fa-wind', color:'red', title:'Storm Response Protocol', pri,
        desc: r.score >= 70 ? 'Activate cyclone shelters. Restrict coastal movement. Secure critical infrastructure.' : 'Issue storm watch. Advise fishermen to return. Monitor pressure systems.' });

    if(r.name === 'Heat Wave' && r.score >= 10)
      recos.push({ icon:'fas fa-temperature-arrow-up', color:'orange', title:'Heat Wave Advisory', pri,
        desc: `Open cooling centres. ${r.score >= 50 ? 'Issue health emergency.' : 'Issue advisory.'} Restrict outdoor work 11AM–4PM. Distribute ORS.` });

    if(r.name === 'Cold Wave' && r.score >= 10)
      recos.push({ icon:'fas fa-snowflake', color:'blue', title:'Cold Wave Response', pri,
        desc: `Open warming shelters. Distribute blankets. ${r.score >= 50 ? 'Issue health emergency.' : 'Issue advisory.'} Protect exposed pipelines.` });

    if(r.name === 'Thunderstorm' && r.score >= 25)
      recos.push({ icon:'fas fa-bolt', color:'yellow', title:'Thunderstorm Safety', pri,
        desc: 'Issue lightning advisories. Avoid open grounds and tall trees. Fishermen return to shore immediately.' });

    if(r.name === 'Dense Fog' && r.score >= 25)
      recos.push({ icon:'fas fa-smog', color:'blue', title:'Visibility Hazard', pri,
        desc: `${r.score >= 50 ? 'Close highway sections.' : 'Reduce speed limits.'} Issue travel advisory. Use fog lights. Divert flights if needed.` });

    if(r.name === 'Wildfire' && r.score >= 25)
      recos.push({ icon:'fas fa-fire', color:'red', title:'Wildfire Prevention', pri,
        desc: 'Restrict open burning near forests. Deploy forest fire brigades. Alert communities in high-risk zones.' });

    if(r.name === 'Landslide' && r.score >= 25)
      recos.push({ icon:'fas fa-mountain', color:'orange', title:'Landslide Warning', pri,
        desc: `Evacuate vulnerable hill slopes. Close mountain roads. ${r.score >= 70 ? 'Pre-deploy NDRF.' : 'Activate emergency contacts.'}` });
  });

  if(!recos.length)
    recos.push({ icon:'fas fa-check-circle', color:'green', title:'All Clear', pri:'low',
      desc: 'Current weather conditions pose minimal disaster risk. Continue standard monitoring protocols.' });

  return recos;
}

function buildAlerts(risks) {
  return risks.filter(r => r.score >= 25).map(r => ({
    icon:r.icon, name:r.name + ' Alert',
    desc:r.reason, sev:scoreToSev(r.score)
  }));
}

function buildChecklist(risks) {
  const top = [...risks].sort((a,b) => b.score - a.score)[0];
  const base = [
    'Charge all communication devices',
    'Keep emergency kit ready (water, food, meds)',
    'Know your nearest evacuation route',
    'Save local emergency numbers',
  ];
  const extra = {
    'Flood':          ['Move valuables to higher floors', 'Avoid walking in floodwater'],
    'Cyclone/Storm':  ['Board up windows and doors',     'Stay away from coastlines'],
    'Heat Wave':      ['Stay hydrated — drink water every hour', 'Avoid outdoor exposure 11AM–4PM'],
    'Cold Wave':      ['Wear layered warm clothing',     'Check on elderly neighbours'],
    'Thunderstorm':   ['Avoid trees and open fields',    'Unplug electronic appliances'],
    'Dense Fog':      ['Reduce driving speed significantly', 'Use fog lights and hazard lights'],
    'Wildfire':       ['Keep firebreaks around property', 'Prepare for possible evacuation'],
    'Landslide':      ['Avoid hillside roads',           'Listen for rumbling sounds'],
  };
  return [...base, ...(extra[top?.name] || [])];
}

const WBD_EMOJI = {
  Thunderstorm:'⛈', Drizzle:'🌦', Rain:'🌧', Snow:'❄️',
  Mist:'🌫', Smoke:'💨', Haze:'😶‍🌫️', Dust:'🌪',
  Fog:'🌫', Sand:'🏜', Ash:'🌋', Squall:'💨',
  Tornado:'🌪', Clear:'☀️', Clouds:'☁️'
};

function renderWBD(w, fc) {
  const analysis = calcRisks(w, fc);
  const info = overallInfo(analysis.overall);
  const emoji = WBD_EMOJI[w.weather?.[0]?.main] || '🌤';
  const m = analysis.metrics;

  // City banner
  const wcbCity = document.getElementById('wcbCity');
  const wcbCoords = document.getElementById('wcbCoords');
  const wcbEmoji = document.getElementById('wcbEmoji');
  const wcbTemp = document.getElementById('wcbTemp');
  const wcbDesc = document.getElementById('wcbDesc');
  
  if(wcbCity) wcbCity.textContent = `${w.name}, ${w.sys.country}`;
  if(wcbCoords) wcbCoords.textContent = `${w.coord.lat.toFixed(2)}°N · ${w.coord.lon.toFixed(2)}°E`;
  if(wcbEmoji) wcbEmoji.textContent = emoji;
  if(wcbTemp) wcbTemp.textContent = `${Math.round(w.main.temp)}°C`;
  if(wcbDesc) wcbDesc.textContent = w.weather[0].description;

  // Inline stats
  const wcbStats = document.getElementById('wcbStats');
  if(wcbStats) {
    wcbStats.innerHTML = [
      { val:`${m.windKmh.toFixed(0)} km/h`, lbl:'Wind' },
      { val:`${m.humidity}%`, lbl:'Humidity' },
      { val:`${m.pressure} hPa`, lbl:'Pressure' },
      { val:`${m.visibility.toFixed(1)} km`, lbl:'Visibility' },
    ].map(s => `<div class="wcb-stat"><div class="wcb-stat-val">${s.val}</div><div class="wcb-stat-lbl">${s.lbl}</div></div>`).join('');
  }

  // Risk badge
  const badge = document.getElementById('wcbRiskBadge');
  if(badge) {
    badge.className = `wcb-risk-badge ${info.cls}`;
    const wcbRiskVal = document.getElementById('wcbRiskVal');
    const wcbRiskScore = document.getElementById('wcbRiskScore');
    if(wcbRiskVal) wcbRiskVal.textContent = info.level;
    if(wcbRiskScore) wcbRiskScore.textContent = `Score: ${analysis.overall}/100`;
  }

  renderWBDGauge(analysis.overall, info, analysis.risks);
  renderWBDRiskGrid(analysis.risks);
  renderWBDRecos(buildRecos(analysis.risks, m));
  renderWBDAlerts(buildAlerts(analysis.risks));
  renderWBDChecklist(buildChecklist(analysis.risks));
}

function renderWBDGauge(score, info, risks) {
  const dashOffset = 251 - (score / 100) * 251;
  const gaugeArc = document.getElementById('wbdGaugeArc');
  const gaugeNeedle = document.getElementById('wbdGaugeNeedle');
  const wbdGclScore = document.getElementById('wbdGclScore');
  const wbdGaugeLevel = document.getElementById('wbdGaugeLevel');
  const wbdMiniBars = document.getElementById('wbdMiniBars');
  
  if(gaugeArc) gaugeArc.setAttribute('stroke-dashoffset', dashOffset);
  
  const angle = -90 + (score / 100) * 180;
  if(gaugeNeedle) {
    gaugeNeedle.setAttribute('transform', `rotate(${angle} 100 110)`);
    gaugeNeedle.setAttribute('stroke', info.color);
  }
  
  if(wbdGclScore) wbdGclScore.textContent = score;
  if(wbdGaugeLevel) {
    wbdGaugeLevel.textContent = info.level;
    wbdGaugeLevel.style.color = info.color;
  }

  const top4 = [...risks].sort((a,b) => b.score - a.score).slice(0, 5);
  if(wbdMiniBars) {
    wbdMiniBars.innerHTML = top4.map(r => {
      const c = scoreToColor(r.score);
      return `<div class="wbd-mb-row">
        <div class="wbd-mb-lbl">${r.name.split('/')[0]}</div>
        <div class="wbd-mb-track"><div class="wbd-mb-fill" style="width:${r.score}%;background:${c.bar}"></div></div>
        <div class="wbd-mb-val" style="color:${c.bar}">${r.score}</div>
      </div>`;
    }).join('');
  }
}

function renderWBDRiskGrid(risks) {
  const el = document.getElementById('wbdRiskGrid');
  if(!el) return;
  
  el.innerHTML = risks.map(r => {
    const sev = scoreToSev(r.score);
    const c = scoreToColor(r.score);
    return `<div class="wbd-ra-card">
      <div class="wbd-ra-stripe" style="background:${c.stripe}"></div>
      <div class="wbd-ra-body">
        <div class="wbd-ra-top">
          <span class="wbd-ra-icon">${r.icon}</span>
          <span class="wbd-ra-name">${r.name}</span>
          <span class="wbd-ra-sev ${sev}">${sev.toUpperCase()}</span>
        </div>
        <div class="wbd-ra-bar-wrap">
          <div class="wbd-ra-bar-fill" style="width:${r.score}%;background:${c.bar};box-shadow:0 0 4px ${c.bar}60"></div>
        </div>
        <div class="wbd-ra-reason">${r.reason}</div>
        <div class="wbd-ra-score">Risk Score: ${r.score}/100</div>
      </div>
    </div>`;
  }).join('');
}

function renderWBDRecos(recos) {
  const el = document.getElementById('wbdRecoList');
  if(!el) return;
  
  el.innerHTML = recos.map(r => `
    <div class="wbd-reco-item">
      <div class="wbd-reco-icon ${r.color}"><i class="${r.icon}"></i></div>
      <div class="wbd-reco-text">
        <div class="wbd-reco-title">${r.title}</div>
        <div class="wbd-reco-desc">${r.desc}</div>
      </div>
      <div class="wbd-reco-pri ${r.pri}">${r.pri.toUpperCase()}</div>
    </div>`).join('');
}

function renderWBDAlerts(alerts) {
  const wrap = document.getElementById('wbdAlertsList');
  if(!wrap) return;
  
  if(!alerts.length) {
    wrap.innerHTML = `<div class="wbd-no-alert">✅ No active weather alerts</div>`;
    return;
  }
  
  wrap.innerHTML = alerts.map(a => `
    <div class="wbd-alert-row">
      <div class="wbd-alert-icon">${a.icon}</div>
      <div class="wbd-alert-info">
        <div class="wbd-alert-name">${a.name}</div>
        <div class="wbd-alert-desc">${a.desc}</div>
      </div>
      <div class="wbd-alert-sev ${a.sev}">${a.sev.toUpperCase()}</div>
    </div>`).join('');
}

function renderWBDChecklist(items) {
  const wrap = document.getElementById('wbdChecklist');
  if(!wrap) return;
  
  wrap.innerHTML = items.map((item, i) => `
    <div class="wbd-cl-item" id="wbdCl${i}" onclick="toggleWBDCheck(${i},${items.length})">
      <div class="wbd-cl-box" id="wbdClBox${i}"></div>
      <div class="wbd-cl-text">${item}</div>
    </div>`).join('');
  
  updateWBDProgress(0, items.length);
}

function toggleWBDCheck(i, total) {
  const item = document.getElementById(`wbdCl${i}`);
  if(!item) return;
  
  item.classList.toggle('done');
  const done = document.querySelectorAll('.wbd-cl-item.done').length;
  
  const box = document.getElementById(`wbdClBox${i}`);
  if(box) box.textContent = item.classList.contains('done') ? '✓' : '';
  
  updateWBDProgress(done, total);
}

function updateWBDProgress(done, total) {
  const prog = document.getElementById('wbdCheckProg');
  if(prog) prog.textContent = `${done} / ${total}`;
}

// Enter key support for weather search
document.addEventListener('DOMContentLoaded', () => {
  const wbdInput = document.getElementById('wbdCityInput');
  if(wbdInput) {
    wbdInput.addEventListener('keydown', e => {
      if(e.key === 'Enter') loadWeatherRisk();
    });
  }
});

// ══════════════════════════════════
// INIT
// ══════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  fetchNASADisasters().then(() => {
    renderDisasters();
    renderTimeline();
    renderResources();
    renderThreatBars();
    renderContacts();
    renderQuickActions();
    renderWeatherImpact();
    animateCounters();
  });

  setTimeout(() => showToast('🛰️ NASA EONET Feed Connected', 'blue'), 2500);
  setTimeout(() => showToast('🌍 Real-time disaster monitoring active', 'green'), 5000);
  setTimeout(() => showToast('⚠️ Click any disaster for NASA details', 'orange'), 8000);
});