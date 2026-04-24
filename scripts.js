/* OneSide Australia — shared scripts */

/* ==============================
   UPDATES FILTER
   ============================== */
var activeRegion = 'all';
var activeSport = 'all';

function filterUpdates(region) {
  activeRegion = region;
  applyFilters();
}

function filterSport(sport) {
  activeSport = sport;
  applyFilters();
}

function applyFilters() {
  var cards = document.querySelectorAll('#updates-list .update-card');
  var visible = 0;
  cards.forEach(function(card) {
    var regionMatch = activeRegion === 'all' || card.dataset.region === activeRegion || card.dataset.region === 'national';
    var sportMatch = activeSport === 'all' || card.dataset.sport === activeSport || card.dataset.sport === 'all';
    var show = regionMatch && sportMatch;
    card.style.display = show ? 'block' : 'none';
    if(show) visible++;
  });
  var countEl = document.getElementById('updates-count');
  if(countEl) countEl.textContent = 'Showing ' + visible + ' update' + (visible !== 1 ? 's' : '');
}

/* ==============================
   SPORT SEARCH
   ============================== */
var sportsCovered = {
  'afl':'AFL','australian football':'AFL','football':'AFL',
  'netball':'Netball','cricket':'Cricket','soccer':'Soccer',
  'football (soccer)':'Soccer','rugby league':'Rugby League',
  'rugby union':'Rugby Union','rugby':'Rugby Union',
  'basketball':'Basketball','tennis':'Tennis','golf':'Golf'
};
var sportsSoon = {
  'touch football':'Touch Football','touch':'Touch Football',
  'swimming':'Swimming','gymnastics':'Gymnastics',
  'hockey':'Hockey','volleyball':'Volleyball','athletics':'Athletics',
  'baseball':'Baseball','softball':'Softball',
  'lacrosse':'Lacrosse','water polo':'Water Polo'
};

function matchSport(val) {
  var v = val.trim().toLowerCase();
  if(!v || v.length < 2) return null;
  for(var key in sportsCovered) {
    if(key.startsWith(v) || v === key) return {status:'covered', label:sportsCovered[key]};
  }
  for(var key in sportsSoon) {
    if(key.startsWith(v) || v === key) return {status:'soon', label:sportsSoon[key]};
  }
  if(v.length >= 3) return {status:'none', label:val};
  return null;
}

function renderSportResult(match, resultEl) {
  if(!match) { resultEl.style.display='none'; return; }
  resultEl.style.display='block';
  if(match.status === 'covered') {
    resultEl.innerHTML = '<div style="display:flex;align-items:center;gap:12px;background:#EAF3DE;border:1px solid #C0DD97;border-radius:10px;padding:14px 18px;"><div style="width:24px;height:24px;background:#3B6D11;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div><div><div style="font-size:14px;font-weight:600;color:#3B6D11;">' + match.label + ' is covered.</div><div style="font-size:13px;color:#3B6D11;opacity:0.85;">The Child Safety Gap Assessment is available for your sport.</div></div></div>';
  } else if(match.status === 'soon') {
    resultEl.innerHTML = '<div style="background:#FAEEDA;border:1px solid #FAC775;border-radius:10px;padding:16px 18px;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><div style="width:24px;height:24px;background:#854F0B;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><div style="font-size:14px;font-weight:600;color:#854F0B;">' + match.label + ' is coming soon.</div></div><div style="font-size:13px;color:#854F0B;opacity:0.85;margin-bottom:12px;">Sign up to be the first to know when ' + match.label + ' is available.</div><div style="display:flex;gap:8px;flex-wrap:wrap;"><input type="email" placeholder="your@email.com.au" style="flex:1;min-width:180px;background:white;border:1px solid #FAC775;border-radius:8px;padding:8px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;color:#0D1F35;outline:none;"><button style="background:#D4614E;color:white;border:none;border-radius:8px;padding:8px 16px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">Notify me ↗</button></div></div>';
  } else {
    resultEl.innerHTML = '<div style="background:#FAEEDA;border:1px solid #FAC775;border-radius:10px;padding:16px 18px;"><div style="font-size:14px;font-weight:600;color:#854F0B;margin-bottom:6px;">We\'re working on more sports.</div><div style="font-size:13px;color:#854F0B;opacity:0.85;margin-bottom:12px;">Sign up and we\'ll let you know when your sport is available.</div><div style="display:flex;gap:8px;flex-wrap:wrap;"><input type="email" placeholder="your@email.com.au" style="flex:1;min-width:180px;background:white;border:1px solid #FAC775;border-radius:8px;padding:8px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;color:#0D1F35;outline:none;"><button style="background:#D4614E;color:white;border:none;border-radius:8px;padding:8px 16px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">Notify me ↗</button></div></div>';
  }
}

function checkSportHome(val) {
  var r = document.getElementById('home-sport-result');
  if(r) renderSportResult(matchSport(val), r);
}

function checkSportPrepare(val) {
  var r = document.getElementById('prepare-sport-result');
  if(r) renderSportResult(matchSport(val), r);
}

/* ==============================
   NAV ACTIVE STATE
   ============================== */
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname.replace('/', '').replace('.html', '') || 'home';
  var navLink = document.querySelector('.nav-links a[href="/' + path + '"]');
  if(navLink) navLink.classList.add('active');
});

/* MOBILE NAV TOGGLE */
function toggleMobileNav() {
  var nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('open');
}

// Close mobile nav when a link is clicked
document.addEventListener('DOMContentLoaded', function() {
  var mobileLinks = document.querySelectorAll('.mobile-nav a');
  mobileLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      document.getElementById('mobileNav').classList.remove('open');
    });
  });
});
