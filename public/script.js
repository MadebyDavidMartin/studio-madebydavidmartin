(function(){
  // YouTube facades: load the player in place on the live site.
  // Inside a framed preview, the link simply opens YouTube in a new tab.
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  document.querySelectorAll('a.yt[data-id]').forEach(function(a){
    var img = a.querySelector('img');
    if (img) img.addEventListener('error', function(){ img.remove(); });
    a.addEventListener('click', function(ev){
      if (framed || a.classList.contains('playing')) return;
      ev.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + a.dataset.id + '?autoplay=1&rel=0';
      f.title = a.getAttribute('aria-label') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      a.classList.add('playing');
      a.appendChild(f);
    });
  });

  // Illustration lightbox
  var lb = document.getElementById('lb');
  if (lb) {
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), last = null;
    document.querySelectorAll('.gal button').forEach(function(b){
      b.addEventListener('click', function(){
        last = b;
        var i = b.querySelector('img');
        img.src = i.src; img.alt = i.alt; cap.textContent = b.dataset.cap || '';
        lb.hidden = false; lb.querySelector('.lb-close').focus();
      });
    });
    var close = function(){ lb.hidden = true; img.src = ''; if (last) last.focus(); };
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !lb.hidden) close(); });
  }

  // Copy email
  document.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var t = b.dataset.copy, done = function(){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function(){});
    });
  });
})();

// Scheduled blog release: posts appear on their release date (local time).
(function(){
  var d = new Date(), today = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  document.querySelectorAll('.bcard[data-date]').forEach(function(c){ if (c.dataset.date > today) c.hidden = true; });
  var more = document.getElementById('more');
  if (more && !more.querySelector('.bcard:not([hidden])')) more.hidden = true;
  var soon = document.getElementById('soon');
  if (soon) {
    var next = null;
    soon.querySelectorAll('li[data-date]').forEach(function(li){
      if (li.dataset.date > today && !next) next = li; else li.hidden = true;
    });
    if (!next) soon.hidden = true;
  }
  var art = document.querySelector('.article[data-date]');
  if (art && art.dataset.date > today) {
    var body = art.querySelector('.article-body'); if (body) body.hidden = true;
    var note = art.querySelector('.soon-note'); if (note) note.hidden = false;
  }
})();

// Menu (phones) and Portfolio dropdown
(function(){
  var mb = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (mb && nav) mb.addEventListener('click', function(){
    var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  document.querySelectorAll('.dd').forEach(function(dd){
    var b = dd.querySelector('.dd-btn');
    b.addEventListener('click', function(e){
      e.stopPropagation(); var o = dd.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function(){
    document.querySelectorAll('.dd.open').forEach(function(dd){ dd.classList.remove('open'); dd.querySelector('.dd-btn').setAttribute('aria-expanded','false'); });
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') document.querySelectorAll('.dd.open').forEach(function(dd){ dd.classList.remove('open'); dd.querySelector('.dd-btn').setAttribute('aria-expanded','false'); dd.querySelector('.dd-btn').focus(); });
  });
})();

// Restrained motion (Oct 2026): scroll reveals, animated stat counters, subtle banner parallax.
// All three respect prefers-reduced-motion and degrade gracefully without JS (content stays visible).
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  /* ---- Scroll reveals ---- */
  // .reveal is added here (not in the HTML), so visitors without JS see everything as normal.
  // Selector is deliberately broad (main section) so every content section is covered.
  var blocks = Array.prototype.slice.call(document.querySelectorAll('main section'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.kpis > div, .creds li, .caps > div, .guide-cards .gcard'));
  var animated = [];
  if (!reduce && canObserve) {
    animated = blocks.concat(cards);
    animated.forEach(function(el){ el.classList.add('reveal'); });
    // Gentle stagger for items inside the same grid.
    document.querySelectorAll('.kpis, .creds, .caps, .guide-cards').forEach(function(grid){
      Array.prototype.forEach.call(grid.children, function(child, i){
        if (child.classList.contains('reveal')) child.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
      });
    });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) {
          io.unobserve(en.target);
          // Two animation frames guarantee the browser has painted the hidden
          // state first. Without this, sections already in view on load get
          // .reveal and .in before the first paint and appear with no animation.
          requestAnimationFrame(function(){ requestAnimationFrame(function(){ en.target.classList.add('in'); }); });
        }
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -4% 0px'});
    animated.forEach(function(el){
      // Restore the element's own transitions after the entrance finishes (keeps hovers snappy).
      el.addEventListener('transitionend', function h(e){
        if (e.propertyName === 'opacity') {
          el.classList.remove('reveal'); el.style.transitionDelay = '';
          el.removeEventListener('transitionend', h);
        }
      });
      io.observe(el);
    });
  }

  /* ---- Animated stat counters ---- */
  var stats = [];
  document.querySelectorAll('.slate-stats dt, .kpis dt, .stk-stat b, .st-n').forEach(function(el){
    var m = el.textContent.trim().match(/^(\d[\d,]*)([\s\S]*)$/);
    if (m) stats.push({el: el, target: parseInt(m[1].replace(/,/g, ''), 10), suffix: m[2]});
  });
  function fmt(n){ return n.toLocaleString('en-US'); }
  function runCounter(c){
    var dur = 1300, t0 = null;
    function frame(ts){
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      c.el.textContent = fmt(Math.round(c.target * e)) + c.suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (stats.length && !reduce && canObserve) {
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) {
          var c = stats.filter(function(s){ return s.el === en.target; })[0];
          if (c) runCounter(c);
          cio.unobserve(en.target);
        }
      });
    }, {threshold: 0.4});
    stats.forEach(function(c){ cio.observe(c.el); });
  }

  /* ---- Subtle parallax on the header banners ---- */
  var banners = Array.prototype.slice.call(document.querySelectorAll('.band.slate.has-banner'));
  if (banners.length && !reduce && 'requestAnimationFrame' in window) {
    var ticking = false;
    function update(){
      ticking = false;
      var vh = window.innerHeight;
      banners.forEach(function(b){
        var r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var delta = (r.top + r.height / 2) - vh / 2;
        var px = Math.max(-16, Math.min(16, delta * -0.05));
        b.style.setProperty('--px', px.toFixed(1) + 'px');
      });
    }
    function requestUpdate(){ if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', requestUpdate, {passive: true});
    window.addEventListener('resize', requestUpdate);
    update();
  }
})();
