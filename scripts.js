/* OneSide Australia — shared scripts */

/* ==============================
   NEWSLETTER SUBSCRIBE
   ============================== */

async function submitSubscribe(e) {
  e.preventDefault();
  const email = document.getElementById('subscribe-email').value.trim();
  const btn   = document.getElementById('subscribe-btn');
  const msg   = document.getElementById('subscribe-msg');

  btn.disabled = true;
  btn.textContent = 'Subscribing...';
  msg.style.color = '#7A95AA';
  msg.textContent = '';

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      btn.textContent = 'Subscribed ✓';
      btn.style.background = '#1A7A4A';
      msg.style.color = '#1A7A4A';
      msg.textContent = 'You\'re on the list. We\'ll be in touch monthly.';
      document.getElementById('subscribe-email').value = '';
    } else {
      throw new Error('Server error');
    }
  } catch {
    btn.disabled = false;
    btn.textContent = 'Subscribe →';
    msg.style.color = '#D4614E';
    msg.textContent = 'Something went wrong. Please try again.';
  }
}

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

function notifyFormHtml(sportLabel) {
  var fi = 'width:100%;box-sizing:border-box;background:white;border:1px solid #FAC775;border-radius:8px;padding:8px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;color:#0D1F35;outline:none;margin-bottom:0;';
  var stateOpts = '<option value="">State</option><option>Victoria</option><option>New South Wales</option><option>Queensland</option><option>South Australia</option><option>Western Australia</option><option>Tasmania</option><option>ACT</option><option>Northern Territory</option>';
  return '<div class="notify-form" style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<input type="text" class="nf-name" placeholder="Your name" style="flex:1;min-width:130px;' + fi + '">'
    + '<input type="text" class="nf-club" placeholder="Club name" style="flex:1;min-width:130px;' + fi + '">'
    + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<select class="nf-state" style="flex:1;min-width:130px;' + fi + '">' + stateOpts + '</select>'
    + '<input type="email" class="nf-email" placeholder="your@email.com.au" style="flex:1;min-width:130px;' + fi + '">'
    + '</div>'
    + '<div id="nf-msg-' + sportLabel.replace(/\s/g,'-') + '" style="font-size:12px;color:#854F0B;display:none;"></div>'
    + '<button onclick="notifySport(this,\'' + sportLabel + '\')" style="background:#D4614E;color:white;border:none;border-radius:8px;padding:8px 18px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:600;cursor:pointer;align-self:flex-start;">Notify me ↗</button>'
    + '</div>';
}

function renderSportResult(match, resultEl) {
  if(!match) { resultEl.style.display='none'; return; }
  resultEl.style.display='block';
  if(match.status === 'covered') {
    resultEl.innerHTML = '<div style="display:flex;align-items:center;gap:12px;background:#EAF3DE;border:1px solid #C0DD97;border-radius:10px;padding:14px 18px;"><div style="width:24px;height:24px;background:#3B6D11;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div><div><div style="font-size:14px;font-weight:600;color:#3B6D11;">' + match.label + ' is covered.</div><div style="font-size:13px;color:#3B6D11;opacity:0.85;">The Child Safety Gap Assessment is available for your sport.</div></div></div>';
  } else if(match.status === 'soon') {
    resultEl.innerHTML = '<div style="background:#FAEEDA;border:1px solid #FAC775;border-radius:10px;padding:16px 18px;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><div style="width:24px;height:24px;background:#854F0B;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><div style="font-size:14px;font-weight:600;color:#854F0B;">' + match.label + ' is coming soon.</div></div><div style="font-size:13px;color:#854F0B;opacity:0.85;margin-bottom:4px;">Sign up to be the first to know when ' + match.label + ' is available.</div>' + notifyFormHtml(match.label) + '</div>';
  } else {
    resultEl.innerHTML = '<div style="background:#FAEEDA;border:1px solid #FAC775;border-radius:10px;padding:16px 18px;"><div style="font-size:14px;font-weight:600;color:#854F0B;margin-bottom:6px;">We\'re working on more sports.</div><div style="font-size:13px;color:#854F0B;opacity:0.85;margin-bottom:4px;">Sign up and we\'ll let you know when your sport is available.</div>' + notifyFormHtml('Other') + '</div>';
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

/* ==============================
   HERO FORM
   ============================== */
async function submitHeroForm() {
  var name  = document.getElementById('hf-name').value.trim();
  var email = document.getElementById('hf-email').value.trim();
  var club  = document.getElementById('hf-club').value.trim();
  var result = document.getElementById('hf-result');
  var btn   = document.getElementById('hf-btn');

  if (!email || !email.includes('@')) {
    result.innerHTML = '<p style="color:#F4977F;font-size:13px;margin-top:8px;">Please enter a valid email address.</p>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';
  btn.style.opacity = '0.7';

  try {
    var res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formType: 'hero', name: name, club: club, email: email })
    });
    if (res.ok) {
      btn.textContent = 'Sent ✓';
      result.innerHTML = '<div style="background:rgba(92,221,154,0.12);border:1px solid rgba(92,221,154,0.25);border-radius:8px;padding:12px 14px;font-size:13px;color:#5CDD9A;margin-top:10px;line-height:1.5;">Thanks! Angela will be in touch within 1 business day.</div>';
    } else {
      btn.disabled = false;
      btn.textContent = 'Book a discovery call →';
      btn.style.opacity = '1';
      result.innerHTML = '<p style="color:#F4977F;font-size:13px;margin-top:8px;">Something went wrong — please try again or email <a href="mailto:info@onesideaustralia.com.au" style="color:#F4977F;">info@onesideaustralia.com.au</a>.</p>';
    }
  } catch(err) {
    btn.disabled = false;
    btn.textContent = 'Book a discovery call →';
    btn.style.opacity = '1';
    result.innerHTML = '<p style="color:#F4977F;font-size:13px;margin-top:8px;">Something went wrong — please try again or email <a href="mailto:info@onesideaustralia.com.au" style="color:#F4977F;">info@onesideaustralia.com.au</a>.</p>';
  }
}

/* ==============================
   CONTACT FORM
   ============================== */
async function submitContactForm() {
  var email = document.getElementById('cf-email').value.trim();
  var name  = document.getElementById('cf-name').value.trim();
  var club  = document.getElementById('cf-club').value.trim();
  var sport = document.getElementById('cf-sport').value.trim();
  var state = document.getElementById('cf-state').value;
  var msg   = document.getElementById('cf-message').value.trim();
  var result = document.getElementById('cf-result');
  var btn   = document.getElementById('cf-btn');

  if (!email || !email.includes('@')) {
    result.innerHTML = '<p style="color:#B84A39;font-size:13px;margin-top:8px;">Please enter a valid email address.</p>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    var res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formType: 'contact', name: name, club: club, email: email, sport: sport, state: state, message: msg })
    });
    if (res.ok) {
      btn.textContent = 'Sent ✓';
      btn.style.background = '#3B6D11';
      result.innerHTML = '<div style="background:#EAF3DE;border:1px solid #C0DD97;border-radius:8px;padding:14px 16px;font-size:14px;color:#3B6D11;margin-top:12px;">Thanks! Angela will be in touch within 1 business day.</div>';
    } else {
      btn.disabled = false;
      btn.textContent = 'Send enquiry ↗';
      result.innerHTML = '<p style="color:#B84A39;font-size:13px;margin-top:8px;">Something went wrong — please try again or email <a href="mailto:info@onesideaustralia.com.au" style="color:#B84A39;">info@onesideaustralia.com.au</a>.</p>';
    }
  } catch(err) {
    btn.disabled = false;
    btn.textContent = 'Send enquiry ↗';
    result.innerHTML = '<p style="color:#B84A39;font-size:13px;margin-top:8px;">Something went wrong — please try again or email <a href="mailto:info@onesideaustralia.com.au" style="color:#B84A39;">info@onesideaustralia.com.au</a>.</p>';
  }
}

/* ==============================
   SPORT WAITLIST
   ============================== */
async function notifySport(btn, sport) {
  var form    = btn.closest('.notify-form');
  var nameEl  = form ? form.querySelector('.nf-name')  : null;
  var clubEl  = form ? form.querySelector('.nf-club')  : null;
  var stateEl = form ? form.querySelector('.nf-state') : null;
  var emailEl = form ? form.querySelector('.nf-email') : null;

  var name  = nameEl  ? nameEl.value.trim()  : '';
  var club  = clubEl  ? clubEl.value.trim()  : '';
  var state = stateEl ? stateEl.value        : '';
  var email = emailEl ? emailEl.value.trim() : '';

  if (!email || !email.includes('@')) {
    if (emailEl) emailEl.style.borderColor = '#D4614E';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    var res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formType: 'waitlist', name: name, club: club, email: email, sport: sport, state: state })
    });
    if (res.ok) {
      btn.textContent = 'Noted ✓';
      if (form) form.querySelectorAll('input, select').forEach(function(el) {
        el.disabled = true; el.style.opacity = '0.5';
      });
    } else {
      btn.disabled = false;
      btn.textContent = 'Notify me ↗';
    }
  } catch(err) {
    btn.disabled = false;
    btn.textContent = 'Notify me ↗';
  }
}

/* ==============================
   SCROLL REVEAL
   ============================== */
document.addEventListener('DOMContentLoaded', function() {
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(function(el) { observer.observe(el); });
});

/* PRIVACY EXPAND/COLLAPSE */
function togglePrivacy() {
  var content = document.getElementById('privacy-content');
  var arrow = document.getElementById('privacy-arrow');
  if (!content) return;
  if (content.style.display === 'none') {
    content.style.display = 'block';
    arrow.textContent = '−';
  } else {
    content.style.display = 'none';
    arrow.textContent = '+';
  }
}

/* ==============================
   ANIMATION & INTERACTION LAYER
   ============================== */

var osReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* NAV — add shadow + full opacity once the page scrolls */
document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('nav');
  if (!nav) return;
  function onNavScroll() { nav.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();
});

/* HERO PARALLAX — subtle background drift, skipped for reduced motion */
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero-parallax');
  if (!hero || osReducedMotion) return;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.3) {
        hero.style.backgroundPositionY = 'calc(50% + ' + (y * 0.18).toFixed(1) + 'px)';
      }
      ticking = false;
    });
  }, { passive: true });
});

/* ANIMATED COUNTERS — any element with data-counter="N" counts up on scroll
   into view. Optional: data-counter-suffix="+" data-counter-delay="200" */
document.addEventListener('DOMContentLoaded', function () {
  var counters = document.querySelectorAll('[data-counter]');
  if (!counters.length || !('IntersectionObserver' in window)) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      var el = entry.target;
      var target = parseFloat(el.dataset.counter) || 0;
      var suffix = el.dataset.counterSuffix || '';
      if (osReducedMotion) { el.textContent = target + suffix; return; }
      var delay = parseInt(el.dataset.counterDelay || '0', 10);
      setTimeout(function () {
        var start = null, dur = 1400;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, delay);
    });
  }, { threshold: 0.4 });
  counters.forEach(function (el) { obs.observe(el); });
});

/* READINESS QUICK CHECK */
var quizAnswers = {};

function openQuiz() {
  var m = document.getElementById('quiz-modal');
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuiz() {
  var m = document.getElementById('quiz-modal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeQuiz();
});

function quizAnswer(btn, val) {
  var q = btn.closest('.quiz-q');
  if (!q) return;
  quizAnswers[q.dataset.q] = val;
  q.querySelectorAll('.quiz-btn').forEach(function (b) { b.classList.remove('sel-yes', 'sel-no'); });
  btn.classList.add(val === 'yes' ? 'sel-yes' : 'sel-no');

  var total = document.querySelectorAll('.quiz-q').length;
  var answered = Object.keys(quizAnswers).length;
  var prog = document.getElementById('quiz-progress');
  if (prog) prog.textContent = answered < total ? answered + ' of ' + total + ' answered' : '';
  if (answered === total) showQuizResult();
}

function showQuizResult() {
  var noCount = 0;
  for (var k in quizAnswers) { if (quizAnswers[k] === 'no') noCount++; }

  var title, body;
  if (noCount === 0) {
    title = 'Strong foundations.';
    body = 'Your club looks to be in good shape. The full assessment will confirm it against the national and sport-specific requirements, and catch anything that’s hard to see from the inside.';
  } else if (noCount <= 2) {
    title = 'There are likely gaps.';
    body = 'A couple of your answers suggest gaps the full assessment would pinpoint exactly, with practical options to close each one.';
  } else {
    title = 'Your club may be at risk.';
    body = 'Take the full assessment to find out exactly where your club stands, and get practical, achievable options to become a child safe club.';
  }

  var titleEl = document.getElementById('quiz-result-title');
  var textEl = document.getElementById('quiz-result-text');
  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = body;

  var panel = document.getElementById('quiz-result');
  if (panel) {
    panel.classList.add('show');
    if (!osReducedMotion) {
      setTimeout(function () { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350);
    }
  }
}

/* FAQ ACCORDION */
function toggleFaq(btn) {
  var item = btn.closest('.faq-item');
  if (!item) return;
  var isOpen = item.classList.contains('open');
  item.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', String(!isOpen));
}

/* ── CHAT WIDGET ────────────────────────────── */
var chatHistory = [];
var chatOpen = false;
var chatStreaming = false;

function toggleChat() {
  chatOpen = !chatOpen;
  var panel = document.getElementById('chat-panel');
  var bubble = document.getElementById('chat-bubble');
  if (!panel || !bubble) return;
  if (chatOpen) {
    panel.classList.add('open');
    bubble.querySelector('.cb-open').style.display = 'none';
    bubble.querySelector('.cb-close').style.display = 'block';
    if (chatHistory.length === 0) {
      addChatMessage('assistant', "Hi! I'm the OneSide assistant. Ask me anything about the Child Safety Gap Assessment, pricing, or how it works.");
    }
    var inp = document.getElementById('chat-input');
    if (inp) inp.focus();
  } else {
    panel.classList.remove('open');
    bubble.querySelector('.cb-open').style.display = 'block';
    bubble.querySelector('.cb-close').style.display = 'none';
  }
}

function addChatMessage(role, text) {
  var msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  var div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendChat() {
  if (chatStreaming) return;
  var input = document.getElementById('chat-input');
  var text = input ? input.value.trim() : '';
  if (!text) return;

  input.value = '';
  chatHistory.push({ role: 'user', content: text });
  addChatMessage('user', text);

  var sendBtn = document.getElementById('chat-send');
  if (sendBtn) sendBtn.disabled = true;
  chatStreaming = true;

  var assistantDiv = addChatMessage('assistant', '…');
  var accumulated = '';

  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    assistantDiv.textContent = '';

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      accumulated += decoder.decode(chunk.value, { stream: true });
      assistantDiv.textContent = accumulated;
      var msgs = document.getElementById('chat-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }

    chatHistory.push({ role: 'assistant', content: accumulated });
  } catch (err) {
    assistantDiv.textContent = 'Sorry, something went wrong. Please try again.';
  }

  chatStreaming = false;
  if (sendBtn) sendBtn.disabled = false;
  if (input) input.focus();
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
}
