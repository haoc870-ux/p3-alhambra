// Each chapter lives in its own HTML document.
const progressBar = document.querySelector('.scroll-progress span');
const navLinks = [...document.querySelectorAll('.nav a')];
const currentPage = document.body.dataset.page;
navLinks.forEach(link => {
  const active = link.dataset.page === currentPage;
  link.classList.toggle('active', active);
  if (active) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
});
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
}
window.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  });
}, {threshold:0.08});
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const heroImg = document.querySelector('[data-parallax] img');
if (heroImg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * 1.5) return;
    heroImg.style.transform = `translateY(calc(-4% + ${Math.min(window.scrollY * .055,55)}px)) scale(1.02)`;
  },{passive:true});
}
const motifTilt = document.querySelector('[data-tilt]');
if (motifTilt && window.matchMedia('(pointer:fine)').matches) {
  const image = motifTilt.querySelector('img');
  motifTilt.addEventListener('pointermove',e => {
    const r = motifTilt.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width-.5;
    const y = (e.clientY - r.top)/r.height-.5;
    image.style.transform = `rotateX(${-y*5}deg) rotateY(${x*5}deg) translate(${x*6}px,${y*6}px)`;
  });
  motifTilt.addEventListener('pointerleave',()=>image.style.transform='');
}
const rhythm = document.querySelector('[data-rhythm]');
if (rhythm) {
  for (let i=0;i<10;i++) {
    const motif = document.createElement('img');
    motif.src='assets/motif-outline.png';
    motif.alt=''; motif.loading='lazy';
    motif.setAttribute('aria-hidden','true');
    rhythm.append(motif);
  }
}

const stage = document.querySelector('[data-intro-stage]');
if (stage) {
  const btn = stage.querySelector('[data-intro-toggle]');
  const copy = stage.querySelector('[data-intro-copy]');
  const title = stage.querySelector('[data-intro-title]');
  const desktop = window.matchMedia('(min-width:901px)');
  const fine = window.matchMedia('(pointer:fine)');
  let progress=0, dragging=false, locked=false, touchX=0, touchY=0;
  const clamp = n => Math.max(0,Math.min(1,n));
  function setProgress(p) {
    progress=clamp(p);
    stage.style.setProperty('--intro-progress',progress.toFixed(3));
    stage.style.setProperty('--pendant-position',`${6+progress*62}%`);
    stage.style.setProperty('--title-x',`${progress*42}px`);
    stage.style.setProperty('--title-opacity',String(clamp(1-progress*1.9)));
    stage.style.setProperty('--copy-x',`${(1-progress)*-55}px`);
    stage.style.setProperty('--copy-opacity',String(clamp((progress-.27)*1.55)));
    const readable = progress >= .8;
    copy.dataset.visible = readable ? 'true' : 'false';
    copy.setAttribute('aria-hidden',readable ? 'false':'true');
    if (progress >= .98 && !dragging) locked=true;
    title.setAttribute('aria-hidden',progress > .55 ? 'true':'false');
    btn.querySelector('span').textContent = readable ? 'BACK TO TITLE' : 'REVEAL STORY';
    btn.setAttribute('aria-label',readable?'Return to introduction title':'Reveal the introduction text');
    btn.lastElementChild.textContent = readable ? '←':'→';
    if (readable) copy.querySelector('a')?.removeAttribute('tabindex');
    else copy.querySelector('a')?.setAttribute('tabindex','-1');
  }
  function fromPointer(e) {
    const rect=stage.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width;
    setProgress((x-.18)/.62);
  }
  setProgress(0);
  stage.addEventListener('pointerdown',e => {
    if (!desktop.matches || e.target.closest('button,a')) return;
    dragging=true; locked=false;
    touchX=e.clientX; touchY=e.clientY;
    if (e.pointerType==='mouse') { fromPointer(e); }
  });
  stage.addEventListener('pointermove',e => {
    if (!desktop.matches) return;
    if (e.pointerType==='touch') {
      if (!dragging) return;
      if (Math.abs(e.clientX-touchX)>12 && Math.abs(e.clientX-touchX)>Math.abs(e.clientY-touchY)) {
        e.preventDefault(); setProgress(progress+(e.movementX || (e.clientX-touchX))/Math.max(stage.clientWidth*.6,1));
        touchX=e.clientX; touchY=e.clientY;
      }
      return;
    }
    if (!fine.matches) return;
    if (locked && !dragging) return;
    if (!dragging && progress>.79 && e.target.closest('.intro-copy')) return;
    if (e.target.closest('button,a')) return;
    fromPointer(e);
  });
  const stopDrag=()=>{ dragging=false; if(progress>=.95)locked=true; };
  stage.addEventListener('pointerup',stopDrag);
  stage.addEventListener('pointercancel',stopDrag);
  btn.addEventListener('click',()=>{locked=false;setProgress(progress>.55?0:1);});
  stage.addEventListener('keydown',e=>{
    if (e.key==='ArrowRight') {e.preventDefault();locked=false;setProgress(progress+.2)}
    if (e.key==='ArrowLeft') {e.preventDefault();locked=false;setProgress(progress-.2)}
    if ((e.key==='Enter'||e.key===' ')&&e.target===stage) {e.preventDefault();locked=false;setProgress(progress>.55?0:1)}
  });
  const mediaSync =()=>{
    if (!desktop.matches) {
      copy.dataset.visible='true';copy.setAttribute('aria-hidden','false');
      title.setAttribute('aria-hidden','false');copy.querySelector('a')?.removeAttribute('tabindex');
    } else setProgress(progress);
  };
  desktop.addEventListener('change',mediaSync);
  mediaSync();
}

// Reveal the authorship story after the opening image and title.
const authorshipSection = document.querySelector('.authorship-section');
const authorshipToggle = document.querySelector('[data-authorship-toggle]');
const authorshipDetails = document.getElementById('authorship-details');
if (authorshipSection && authorshipToggle && authorshipDetails) {
  const detailsLabel = authorshipToggle.querySelector('[data-authorship-label]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  let scrollRequest;
  const setOpen = open => {
    authorshipSection.classList.toggle('is-open',open);
    authorshipToggle.setAttribute('aria-expanded',String(open));
    authorshipDetails.setAttribute('aria-hidden',String(!open));
    authorshipDetails.inert = !open;
    detailsLabel.textContent = open ? 'SHOW LESS' : 'CLICK FOR MORE';
    if(scrollRequest)clearTimeout(scrollRequest);
    scrollRequest = setTimeout(() => {
      if(open) authorshipDetails.scrollIntoView({behavior:prefersReducedMotion.matches?'instant':'smooth',block:'start'});
      else document.getElementById('authorship').scrollIntoView({behavior:prefersReducedMotion.matches?'instant':'smooth',block:'start'});
    }, open?300:80);
  };
  authorshipToggle.addEventListener('click',()=>setOpen(!authorshipSection.classList.contains('is-open')));
}


// Origin — enter-on-scroll type/image transitions; reduced-motion safe.
const originMotionItems = [...document.querySelectorAll('.origin-section .slide-up, .origin-section .slide-from-left, .origin-section .slide-from-right')];
if (originMotionItems.length) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) originMotionItems.forEach(el => el.classList.add('is-visible'));
  else {
    const originRevealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        originRevealObserver.unobserve(entry.target);
      }
    }, {threshold: .09,rootMargin:'0px 0px -6% 0px'});
    originMotionItems.forEach(el=>originRevealObserver.observe(el));
  }
}

// Origin — centered three-up gallery: one full-opacity image with two faded
// neighbors. Arrow buttons live beside the gallery, not beneath it.
const originCarousel = document.querySelector('[data-origin-carousel]');
if (originCarousel) {
  const slides = [...originCarousel.querySelectorAll('.origin-carousel-slide')];
  const prev = originCarousel.querySelector('[data-carousel-prev]');
  const next = originCarousel.querySelector('[data-carousel-next]');
  const markers = [...originCarousel.querySelectorAll('.origin-carousel-indicators span')];
  const title = originCarousel.querySelector('[data-carousel-title]');
  const description = originCarousel.querySelector('[data-carousel-description]');
  const items = [
    {title:'Material', description:'The frame stays familiar while gold and mother-of-pearl change the surface.'},
    {title:'Composition', description:'Different scales and materials can belong to the same visual family.'},
    {title:'Recognition', description:'Even a dark surface is identifiable by the same four-leaf silhouette.'}
  ];
  let index = 0, startX = 0, startY = 0, pointerId = null;
  const show = n => {
    index = (n + slides.length) % slides.length;
    const before=(index-1+slides.length)%slides.length, after=(index+1)%slides.length;
    slides.forEach((slide,i)=>{
      slide.classList.toggle('is-active',i===index);
      slide.classList.toggle('is-prev',i===before);
      slide.classList.toggle('is-next',i===after);
      slide.setAttribute('aria-hidden',String(i!==index));
    });
    markers.forEach((m,i)=>m.classList.toggle('is-active',i===index));
    title.textContent=items[index].title;
    description.textContent=items[index].description;
    originCarousel.querySelector('.origin-carousel-indicators').setAttribute('aria-label',`Image ${index+1} of ${slides.length}`);
  };
  prev.addEventListener('click',()=>show(index-1));
  next.addEventListener('click',()=>show(index+1));
  originCarousel.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();show(index-1)}
    if(e.key==='ArrowRight'){e.preventDefault();show(index+1)}
  });
  const stage=originCarousel.querySelector('[data-carousel-stage]');
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    pointerId=e.pointerId;startX=e.clientX;startY=e.clientY;
  });
  stage.addEventListener('pointerup',e=>{
    if(e.pointerId!==pointerId)return;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>42 && Math.abs(dx)>Math.abs(e.clientY-startY)*1.2)show(index+(dx<0?1:-1));
    pointerId=null;
  });
  stage.addEventListener('pointercancel',()=>{pointerId=null;});
  stage.addEventListener('dragstart',e=>e.preventDefault());
  let wheelAt=0;
  stage.addEventListener('wheel',e=>{
    if(Math.abs(e.deltaX)<30||Math.abs(e.deltaX)<=Math.abs(e.deltaY)*1.4)return;
    if(Date.now()-wheelAt<650)return;
    wheelAt=Date.now();show(index+(e.deltaX>0?1:-1));
  },{passive:true});
  show(0);
}


// V13 — On Introduction only, the About utility link receives its own
// active state while the About section is in view. Chapters remain separate URLs.
if (currentPage === 'introduction') {
  const about = document.getElementById('about');
  const chapterNav = document.querySelector('.nav a[data-page="introduction"]');
  const aboutNav = document.querySelector('.nav a[data-page="about"]');
  if (about && chapterNav && aboutNav) {
    const markCurrent = () => {
      const r = about.getBoundingClientRect();
      const activeAbout = r.top < window.innerHeight * .53 && r.bottom > window.innerHeight * .32;
      chapterNav.classList.toggle('active', !activeAbout);
      aboutNav.classList.toggle('active', activeAbout);
      if (activeAbout) {
        chapterNav.removeAttribute('aria-current');
        aboutNav.setAttribute('aria-current','location');
      } else {
        aboutNav.removeAttribute('aria-current');
        chapterNav.setAttribute('aria-current','page');
      }
    };
    window.addEventListener('scroll',markCurrent,{passive:true});
    window.addEventListener('resize',markCurrent);
    window.addEventListener('hashchange',markCurrent);
    markCurrent();
  }
}


// V16: scroll-driven archive study. Intro text starts left/image right; the
// image changes sides once, then remains pinned while the long article scrolls
// on the right. Only after the whole reading does the next section arrive.
(() => {
  const scenes = [...document.querySelectorAll('[data-origin-scroll-story]')];
  if (!scenes.length) return;
  for (const scene of scenes) {
  const stage = scene.querySelector('[data-story-stage]');
  const canvas = stage.querySelector('.origin-scroll-canvas');
  const intro = scene.querySelector('[data-story-intro]');
  const windowEl = scene.querySelector('[data-story-window]');
  const content = scene.querySelector('[data-story-reading]');
  const desktop = matchMedia('(min-width:901px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let layout = null;
  let pending = false;
  const clamp = (n,min=0,max=1) => Math.min(max,Math.max(min,n));
  const remap = (n,start,end) => clamp((n-start)/(end-start));
  const ease = t => t*t*(3-2*t);
  const clear = () => {
    scene.style.height='';
    scene.style.removeProperty('--archive-shift');
    canvas.style.removeProperty('--archive-shift');
    canvas.style.removeProperty('--intro-opacity');
    canvas.style.removeProperty('--reading-opacity');
    canvas.style.removeProperty('--reading-offset');
    canvas.style.removeProperty('--reading-y');
    scene.removeAttribute('data-phase');
    intro.removeAttribute('aria-hidden');
    windowEl.removeAttribute('aria-hidden');
    layout = null;
  };
  function measure(){
    if (!desktop.matches || reduced.matches){clear();return;}
    // Stage is exactly the scrollable viewport below the fixed masthead.
    const viewport = stage.getBoundingClientRect().height;
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
    const transition = Math.max(520,viewport*.82);
    const textTravel = Math.max(0,content.scrollHeight-windowEl.clientHeight+4);
    const readingScroll = Math.max(viewport*1.45,textTravel+viewport*.35);
    const finish = viewport*.23;
    const distance = transition+readingScroll+finish;
    scene.style.height=`${Math.ceil(viewport+distance)}px`;
    layout = {viewport,navHeight,transition,textTravel,readingScroll,finish,distance};
    render();
  }
  function render(){
    if(!layout) return;
    const amount = clamp(layout.navHeight-scene.getBoundingClientRect().top,0,layout.distance);
    const move = ease(clamp(amount/layout.transition));
    const show = ease(remap(move,.48,.93));
    const reading = clamp((amount-layout.transition)/layout.readingScroll);
    const textY = layout.textTravel*reading;
    canvas.style.setProperty('--archive-shift',move.toFixed(4));
    canvas.style.setProperty('--intro-opacity',Math.max(0,1-ease(remap(move,.04,.68))).toFixed(4));
    canvas.style.setProperty('--reading-opacity',show.toFixed(4));
    canvas.style.setProperty('--reading-offset',`${(1-show)*35}px`);
    canvas.style.setProperty('--reading-y',`${textY.toFixed(2)}px`);
    // Figures inside a translated reading column reveal as their position
    // crosses the visible reading window (not the browser's document viewport).
    if (scene.classList.contains('origin-architecture-scroll')) {
      const items=content.querySelectorAll('[data-pattern-reveal]');
      const visibleTop=textY;
      const visibleBottom=textY+windowEl.clientHeight;
      items.forEach(item=>{
        const top=item.offsetTop;
        if (visibleBottom>top+Math.min(75,item.offsetHeight*.28)) item.classList.add('is-in-view');
      });
    }
    scene.dataset.phase=move>.95?'reading':'transition';
    windowEl.setAttribute('aria-hidden',String(move<.48));
    intro.setAttribute('aria-hidden',String(move>.95));
  }
  function scroll(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});}
  let resizeTimer;
  window.addEventListener('scroll',scroll,{passive:true});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,75);},{passive:true});
  desktop.addEventListener('change',measure);
  reduced.addEventListener('change',measure);
  if ('ResizeObserver' in window){
    const obs=new ResizeObserver(()=>{
      if(desktop.matches && !reduced.matches){clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,50);}
    });
    obs.observe(content);
  }
  document.fonts?.ready.then(measure);
  requestAnimationFrame(measure);
  }
})();


// V17 — one consistent scroll-triggered editorial transition system for the
// five story pages. On each frame after scrolling, content is revealed
// progressively as it enters the viewport. There are no wheel traps, no
// forced page snaps, and no transformations applied to the pinned 1948 stage.
(() => {
  if (!['authorship','origin','motif','forms','making'].includes(document.body.dataset.page)) return;
  const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
  if (!scenes.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  let ticking = false;
  function clamp(n){return Math.max(0,Math.min(1,n));}
  function smoothstep(n){return n*n*(3-2*n);}
  function paint(){
    ticking=false;
    const vh=window.innerHeight;
    const begin=vh*.96;
    const finish=Math.max(140,vh*.45);
    for(const node of scenes){
      const rect=node.getBoundingClientRect();
      // Let already-read material remain perfectly clear; hide only the
      // upcoming passage before it rises into reading position.
      const p=rect.bottom<=finish ? 1 : smoothstep(clamp((begin-rect.top)/(begin-finish)));
      node.style.setProperty('--scene-progress',p.toFixed(3));
    }
  }
  function schedule(){if(!ticking){ticking=true;requestAnimationFrame(paint);}}
  paint();
  document.documentElement.classList.add('has-scroll-choreography');
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('transitionend',schedule,{passive:true});
  // An expandable section (Authorship) changes height after the click.
  const toggle=document.querySelector('[data-authorship-toggle]');
  if(toggle)toggle.addEventListener('click',()=>{schedule();setTimeout(schedule,350);setTimeout(schedule,800);});
  // Recalculate when fonts finish loading, so stage entrances are stable.
  document.fonts?.ready?.then(schedule);
})();


// V20 — the subchapter itself, not every paragraph, behaves like a sheet
// rising over the preceding page. All heights are measured because a long
// feature chapter may exceed one viewport. A tall sheet scrolls until its
// final viewport can remain pinned while the NEXT sheet covers it.
(() => {
  if (!['authorship','origin','motif','forms','making'].includes(document.body.dataset.page)) return;
  const desktop = matchMedia('(min-width: 901px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sheets = [...document.querySelectorAll('[data-story-chapter]')];
  if (!sheets.length) return;
  let frame = 0;
  let previousSig = '';

  // Siblings belong to natural editorial flow; only the next actual
  // subsection can overlap the previous one (never an individual P tag).
  sheets.forEach((sheet, i) => {
    // Keep already defined z-index layering in the Origin archive and
    // photographic essay. The CSS is authoritative for those groups.
    sheet.dataset.sheetOrder = String(i + 1);
  });

  function update() {
    frame = 0;
    const enabled = desktop.matches && !reduced.matches;
    document.documentElement.classList.toggle('has-subchapter-sheets', enabled);
    if (!enabled) {
      sheets.forEach(el => {el.style.removeProperty('--sheet-top');});
      return;
    }
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
    const viewport = Math.max(220, window.innerHeight - nav);
    // If a sheet is taller than the screen, a negative sticky top
    // lets its text move through normally. Only the final screen pins.
    for (const sheet of sheets) {
      const height = sheet.offsetHeight;
      const offset = nav + Math.min(0,viewport-height);
      sheet.style.setProperty('--sheet-top', `${Math.round(offset)}px`);
    }
  }
  function schedule() {
    if(frame) return;
    frame = requestAnimationFrame(update);
  }
  update();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  desktop.addEventListener?.('change',schedule);
  reduced.addEventListener?.('change',schedule);
  document.fonts?.ready?.then(schedule);
  const toggle=document.querySelector('[data-authorship-toggle]');
  if(toggle) toggle.addEventListener('click',()=>{
    schedule();
    setTimeout(schedule,450);
    setTimeout(schedule,900);
  });
  if ('ResizeObserver' in window) {
    const observer=new ResizeObserver(schedule);
    document.querySelectorAll('.authorship-details,.origin-photo-essay,.material-grid,.process-gallery').forEach(el=>observer.observe(el));
  }
})();


// V27 — three architectural ornament images reveal independently while
// scrolling, including in the desktop sticky/sheet environment.
(() => {
  const figures=[...document.querySelectorAll('[data-pattern-reveal]')];
  if (!figures.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    figures.forEach(el=>el.classList.add('is-in-view'));
    return;
  }
  const observer=new IntersectionObserver((entries)=>{
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      }
    }
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  figures.forEach(el=>observer.observe(el));
})();


// V30 custom — horizontally scrolling material showcase with press-and-hold
// overlays and pagination dots, based on the user's video reference.
(() => {
  const showcase = document.querySelector('[data-material-showcase]');
  if (!showcase) return;
  const track = showcase.querySelector('[data-material-track]');
  const cards = [...showcase.querySelectorAll('[data-material-card]')];
  const dotsHost = showcase.querySelector('[data-material-dots]');
  if (!track || !cards.length || !dotsHost) return;
  const progressThumb = dotsHost.querySelector('.gallery-scroll-progress-thumb');
  if (!progressThumb) return;
  let progressPending = false;

  const updateProgress = () => {
    progressPending = false;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, track.scrollLeft / maxScroll)) : 0;
    const visibleRatio = Math.min(1, track.clientWidth / Math.max(track.scrollWidth, 1));
    const thumbWidth = 100 * visibleRatio;
    const position = (100 - thumbWidth) * progress;
    dotsHost.style.setProperty('--progress-thumb-width', `${thumbWidth.toFixed(4)}%`);
    dotsHost.style.setProperty('--progress-thumb-left', `${position.toFixed(4)}%`);
    dotsHost.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  };
  const queueProgress = () => {
    if (progressPending) return;
    progressPending = true;
    requestAnimationFrame(updateProgress);
  };

  cards.forEach((card) => {
    const show = () => card.classList.add('is-held');
    const hide = () => card.classList.remove('is-held');
    card.addEventListener('pointerdown', show);
    card.addEventListener('pointerup', hide);
    card.addEventListener('pointerleave', hide);
    card.addEventListener('pointercancel', hide);
    card.addEventListener('touchend', hide, {passive:true});
    card.addEventListener('touchcancel', hide, {passive:true});
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-held');
      }
      if (e.key === 'Escape') hide();
    });
    card.addEventListener('blur', hide);
  });
  track.addEventListener('scroll', queueProgress, {passive:true});
  window.addEventListener('resize', queueProgress, {passive:true});
  requestAnimationFrame(updateProgress);
})();


// V37 — Forms: vertical scroll drives a horizontal editorial sequence for
// “One shape, many moods”. The reader finishes the rightward narrative before
// the document proceeds to the next subsection.
(() => {
  const stories = [...document.querySelectorAll('[data-horizontal-story]')];
  if (!stories.length) return;
  const desktop = matchMedia('(min-width: 901px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  for (const story of stories) {
    const stage = story.querySelector('[data-horizontal-stage]');
    const track = story.querySelector('[data-horizontal-track]');
    if (!stage || !track) continue;
    let layout = null;
    let ticking = false;
    const clamp = (n,min,max) => Math.max(min, Math.min(max, n));

    function clear(){
      story.style.height='';
      track.style.transform='';
      story.dataset.horizontalComplete='true';
      layout = null;
    }

    function measure(){
      if (!desktop.matches || reduced.matches) { clear(); return; }
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
      const viewport = Math.max(420, window.innerHeight - nav);
      const distance = Math.max(0, track.scrollWidth - story.clientWidth);
      story.style.height = `${Math.ceil(viewport + distance + 24)}px`;
      layout = {nav, viewport, distance};
      render();
    }

    function render(){
      if (!layout) return;
      const top = story.getBoundingClientRect().top;
      const amount = clamp(layout.nav - top, 0, layout.distance);
      track.style.transform = `translate3d(${-amount}px,0,0)`;
      story.dataset.horizontalComplete = amount >= layout.distance - 2 ? 'true' : 'false';
    }

    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; render(); });
    }

    let resizeTimer;
    const scheduleMeasure = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 60);
    };

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', scheduleMeasure, {passive:true});
    desktop.addEventListener?.('change', scheduleMeasure);
    reduced.addEventListener?.('change', scheduleMeasure);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(scheduleMeasure);
      ro.observe(track);
      // Never observe story itself: adjusting its height would retrigger measurement.
    }
    document.fonts?.ready?.then(scheduleMeasure);
    requestAnimationFrame(scheduleMeasure);
  }
})();


// V43 motif: vertical document scroll positions the composite figure.
// Passive scroll updates only — wheel events are deliberately never captured.
(() => {
  const story = document.querySelector('[data-motif-scroll-story]');
  if (!story) return;
  const stage = story.querySelector('[data-motif-sticky-stage]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 901px)');
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const ease = t => t * t * (3 - 2*t);
  let pending = false;
  const render = () => {
    pending = false;
    if (!wide.matches || reduced.matches) {
      stage.style.removeProperty('--motif-x');
      stage.style.removeProperty('--jewel-opacity');
      stage.style.removeProperty('--shape-opacity');
      stage.style.removeProperty('--edge-opacity');
      return;
    }
    const rect = story.getBoundingClientRect();
    const length = Math.max(1,rect.height - stage.offsetHeight);
    const p = clamp(-rect.top / length);
    const move = ease(clamp((p - 0.14) / 0.60));
    const jewel = ease(clamp((p - 0.27) / 0.32));
    const shapeCopy = 1-ease(clamp((p-0.13)/0.26));
    const edgeCopy = ease(clamp((p-0.50)/0.20));
    stage.style.setProperty('--motif-x',`${82 - move * 41}%`);
    stage.style.setProperty('--jewel-opacity',jewel.toFixed(3));
    stage.style.setProperty('--shape-opacity',shapeCopy.toFixed(3));
    stage.style.setProperty('--edge-opacity',edgeCopy.toFixed(3));
    stage.style.setProperty('--motif-bar',`${(p*100).toFixed(1)}%`);
  };
  const schedule = () => {if(!pending){pending=true;requestAnimationFrame(render);}};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  schedule();
})();


// V49 — intentional, accessible click-to-reveal for Authorship.
(() => {
  const trigger = document.querySelector('[data-authorship-jump]');
  const section = document.querySelector('.authorship-section');
  const details = document.getElementById('authorship-details');
  if (!trigger || !section || !details) return;
  const openDetails = () => {
    if (section.classList.contains('is-open')) return;
    section.classList.add('is-open');
    details.inert = false;
    details.setAttribute('aria-hidden','false');
    trigger.setAttribute('aria-expanded','true');
  };
  trigger.setAttribute('tabindex','0');
  trigger.setAttribute('role','button');
  trigger.setAttribute('aria-label','Click the four-leaf clover to reveal the story');
  trigger.setAttribute('aria-controls','authorship-details');
  trigger.setAttribute('aria-expanded','false');
  trigger.addEventListener('click',openDetails);
  trigger.addEventListener('keydown', event => {
    if(event.key === 'Enter' || event.key === ' '){event.preventDefault();openDetails();}
  });
})();


// V50 — Authorship image/text swap interaction.
(() => {
  const section = document.querySelector('body[data-page="authorship"] .authorship-section');
  const trigger = section?.querySelector('[data-authorship-toggle-view]');
  if (!section || !trigger) return;
  const setSwapped = (swapped) => {
    section.classList.toggle('is-swapped', swapped);
    trigger.setAttribute('aria-expanded', swapped ? 'true' : 'false');
    trigger.setAttribute('aria-label', swapped ? 'Click the image to switch back to the clover view' : 'Click the clover image to swap the image and text');
  };
  let swapped = false;
  trigger.addEventListener('click', () => {
    swapped = !swapped;
    setSwapped(swapped);
  });
  setSwapped(false);
})();

// V50 — Motif scroll-driven horizontal image transition.
(() => {
  const story = document.querySelector('[data-motif-slider-story]');
  const stage = story?.querySelector('[data-motif-slider-stage]');
  if (!story || !stage) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 901px)');
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const ease = t => t * t * (3 - 2 * t);
  let ticking = false;

  function render() {
    ticking = false;
    if (!wide.matches || reduced.matches) {
      story.style.setProperty('--motif-slide', '1');
      story.style.setProperty('--motif-edge-opacity', '1');
      return;
    }
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
    const raw = clamp(-rect.top / distance);
    const slide = ease(clamp((raw - 0.16) / 0.56));
    const edgeOpacity = ease(clamp((raw - 0.36) / 0.28));
    story.style.setProperty('--motif-slide', slide.toFixed(4));
    story.style.setProperty('--motif-edge-opacity', edgeOpacity.toFixed(4));
  }
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  wide.addEventListener?.('change', schedule);
  reduced.addEventListener?.('change', schedule);
  window.addEventListener('load', schedule, { once: true });
  schedule();
})();


// V51 — Motif editorial section: vertical page scroll drives a horizontal image switch.
(() => {
  const story = document.querySelector('[data-motif-editorial-story]');
  const stage = story?.querySelector('[data-motif-editorial-stage]');
  if (!story || !stage) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 981px)');
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const ease = t => t * t * (3 - 2 * t);
  let ticking = false;

  function render() {
    ticking = false;
    if (!wide.matches || reduced.matches) {
      story.style.setProperty('--motif-editorial-slide', '1');
      return;
    }
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
    const raw = clamp(-rect.top / distance);
    const slide = ease(clamp((raw - 0.18) / 0.56));
    story.style.setProperty('--motif-editorial-slide', slide.toFixed(4));
  }
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  wide.addEventListener?.('change', schedule);
  reduced.addEventListener?.('change', schedule);
  window.addEventListener('load', schedule, { once: true });
  schedule();
})();


// V52 — Motif section: keep original copy, but use vertical scrolling to drive a horizontal image slide and text swap.
(() => {
  const story = document.querySelector('[data-motif-scroll-editorial]');
  const stage = story?.querySelector('[data-motif-scroll-stage]');
  if (!story || !stage) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 981px)');
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const ease = t => t * t * (3 - 2 * t);
  let ticking = false;

  function render(){
    ticking = false;
    if (!wide.matches || reduced.matches) {
      story.style.setProperty('--motif-slide', '1');
      story.style.setProperty('--motif-phase', '1');
      return;
    }
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
    const raw = clamp(-rect.top / distance);
    const slide = ease(clamp((raw - 0.16) / 0.52));
    const phase = ease(clamp((raw - 0.36) / 0.22));
    story.style.setProperty('--motif-slide', slide.toFixed(4));
    story.style.setProperty('--motif-phase', phase.toFixed(4));
  }
  function schedule(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  wide.addEventListener?.('change', schedule);
  reduced.addEventListener?.('change', schedule);
  window.addEventListener('load', schedule, { once: true });
  schedule();
})();

// Keep the opening exchange at its original pace; reserve extra scroll for the three details.
function getMotifReadingProgress(section, stage, nav) {
  const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
  const offset = nav - section.getBoundingClientRect().top;
  const originalDistance = Math.max(1, innerHeight * 3.6 - stage.offsetHeight);
  const detailStart = originalDistance * .54;
  const clamp = value => Math.max(0, Math.min(1, value));
  return offset <= detailStart
    ? clamp(offset / originalDistance)
    : .54 + .46 * clamp((offset - detailStart) / Math.max(1, distance - detailStart));
}

// V53: vertical scrolling physically trades the positions of the full image and text column.
(() => {
  const section=document.querySelector('[data-motif-exchange]');
  const stage=section?.querySelector('[data-motif-exchange-stage]');
  const copy=section?.querySelector('[data-motif-exchange-copy]');
  const media=section?.querySelector('[data-motif-exchange-media]');
  if(!section||!stage||!copy||!media)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const wide=matchMedia('(min-width:901px)');
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>x*x*(3-2*x);
  let frame=0;
  function render(){
    frame=0;
    if(!wide.matches||reduce.matches)return;
    const sr=section.getBoundingClientRect();
    const distance=Math.max(1,section.offsetHeight-stage.offsetHeight);
    const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))||80;
    const p=getMotifReadingProgress(section,stage,nav);
    // The entire image travels from right to left; the text travels the reverse direction.
    const progress=smooth(clamp((p-.08)/.76));
    // Switch image and text content at the centre of the motion.
    const reveal=smooth(clamp((p-.38)/.20));
    const travel=media.getBoundingClientRect().width*0 + (stage.clientWidth*.53);
    stage.style.setProperty('--swap-distance',travel.toFixed(2)+'px');
    stage.style.setProperty('--swap-progress',progress.toFixed(5));
    stage.style.setProperty('--image-reveal',reveal.toFixed(5));
  }
  function queue(){if(!frame)frame=requestAnimationFrame(render);}
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  addEventListener('load',queue,{once:true});
  wide.addEventListener?.('change',queue);
  reduce.addEventListener?.('change',queue);
  queue();
})();


// V54: refine motif exchange — smaller first image and three staged information transitions after the swap.
(() => {
  const section = document.querySelector('[data-motif-exchange]');
  const stage = section?.querySelector('[data-motif-exchange-stage]');
  const media = section?.querySelector('[data-motif-exchange-media]');
  if (!section || !stage || !media) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width:901px)');
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => x * x * (3 - 2 * x);
  let frame = 0;

  function band(x, startIn, fullStart, fullEnd, endOut) {
    if (x <= startIn || x >= endOut) return 0;
    if (x >= fullStart && x <= fullEnd) return 1;
    if (x < fullStart) return smooth((x - startIn) / Math.max(0.0001, fullStart - startIn));
    return smooth(1 - ((x - fullEnd) / Math.max(0.0001, endOut - fullEnd)));
  }
  function riseAndHold(x, start, end) {
    if (x <= start) return 0;
    if (x >= end) return 1;
    return smooth((x - start) / Math.max(0.0001, end - start));
  }

  function render() {
    frame = 0;
    if (!wide.matches || reduce.matches) return;
    const sr = section.getBoundingClientRect();
    const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
    const p = getMotifReadingProgress(section, stage, nav);
    const shapeInset = innerWidth * .1136 - (stage.getBoundingClientRect().left + stage.clientWidth * .03);
    stage.style.setProperty('--shape-inset', Math.max(0, shapeInset).toFixed(2) + 'px');
    const readerWidth = section.querySelector('.motif-exchange-text--shape').offsetWidth;
    const rightColumnLeft = stage.getBoundingClientRect().left + stage.clientWidth * .56;
    const edgeInset = innerWidth - innerWidth * .1136 - readerWidth - rightColumnLeft;
    stage.style.setProperty('--edge-inset', edgeInset.toFixed(2) + 'px');
    stage.style.setProperty('--reader-width', readerWidth + 'px');

    const progress = smooth(clamp((p - 0.06) / 0.28));
    const reveal = smooth(clamp((p - 0.18) / 0.18));
    const travel = stage.clientWidth * 0.53;

    const edgeOpacity = band(p, 0.18, 0.30, 0.44, 0.56);
    const info1Opacity = band(p, 0.54, 0.62, 0.70, 0.78);
    const info2Opacity = band(p, 0.74, 0.81, 0.88, 0.95);
    const info3Opacity = riseAndHold(p, 0.90, 0.98);

    stage.style.setProperty('--swap-distance', travel.toFixed(2) + 'px');
    stage.style.setProperty('--swap-progress', progress.toFixed(5));
    stage.style.setProperty('--image-reveal', reveal.toFixed(5));
    stage.style.setProperty('--edge-opacity', edgeOpacity.toFixed(5));
    stage.style.setProperty('--info1-opacity', info1Opacity.toFixed(5));
    stage.style.setProperty('--info2-opacity', info2Opacity.toFixed(5));
    stage.style.setProperty('--info3-opacity', info3Opacity.toFixed(5));
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  addEventListener('load', queue, { once: true });
  wide.addEventListener?.('change', queue);
  reduce.addEventListener?.('change', queue);
  queue();
})();




// V57 — PRESS AND HOLD reveals the book text on the touched/pressed card.
// The sideways gallery remains independently draggable and swipeable.
(() => {
  const gallery = document.querySelector('[data-forms-material-carousel]');
  if (!gallery) return;
  const track = gallery.querySelector('[data-forms-material-track]');
  const cards = [...gallery.querySelectorAll('[data-forms-material-card]')];
  const dotsHost = gallery.querySelector('[data-forms-material-dots]');
  if (!track || !cards.length || !dotsHost) return;

  let pressing = null;
  let drag = null;
  let activationTimer = null;
  let suppressClick = false;
  const DRAG_THRESHOLD = 9;

  function clearActivationTimer() {
    if (activationTimer !== null) {
      clearTimeout(activationTimer);
      activationTimer = null;
    }
  }
  function closeAll() {
    for (const card of cards) {
      card.classList.remove('is-held');
      card.classList.remove('is-open'); // legacy V56 class must never remain active
      card.querySelector('.forms-material-carousel-overlay').setAttribute('aria-hidden', 'true');
    }
  }
  function reveal(card) {
    if (!pressing || pressing.card !== card || pressing.dragged) return;
    closeAll();
    card.classList.add('is-held');
    card.querySelector('.forms-material-carousel-overlay').setAttribute('aria-hidden', 'false');
  }
  function endPress() {
    clearActivationTimer();
    pressing = null;
    closeAll();
  }

  const progressThumb = dotsHost.querySelector('.gallery-scroll-progress-thumb');
  if (!progressThumb) return;
  let progressPending = false;

  function updateProgress() {
    progressPending = false;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, track.scrollLeft / maxScroll)) : 0;
    const visibleRatio = Math.min(1, track.clientWidth / Math.max(track.scrollWidth, 1));
    const thumbWidth = visibleRatio * 100;
    const position = (100 - thumbWidth) * progress;
    dotsHost.style.setProperty('--progress-thumb-width', `${thumbWidth.toFixed(4)}%`);
    dotsHost.style.setProperty('--progress-thumb-left', `${position.toFixed(4)}%`);
    dotsHost.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  }

  cards.forEach((card) => {
    // Keyboard hold: display during Space/Enter keydown, hide on keyup.
    card.addEventListener('keydown', event => {
      if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return;
      event.preventDefault();
      closeAll();
      card.classList.add('is-held');
      card.querySelector('.forms-material-carousel-overlay').setAttribute('aria-hidden','false');
    });
    card.addEventListener('keyup', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      closeAll();
    });
    card.addEventListener('blur', closeAll);

  });

  function queueProgress() {
    if (progressPending) return;
    progressPending = true;
    requestAnimationFrame(updateProgress);
  }
  track.addEventListener('scroll', queueProgress, {passive:true});
  window.addEventListener('resize', queueProgress, {passive:true});

  track.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const card = event.target.closest('[data-forms-material-card]');
    if (!card) return;
    // Prevent the native button focus scroll/snap from dismissing the first hold.
    // Keyboard focus remains available through Tab.
    if (event.pointerType === 'mouse') event.preventDefault();
    endPress();
    pressing = {id:event.pointerId, card, x:event.clientX, y:event.clientY, dragged:false};
    if (event.pointerType === 'mouse') {
      // On desktop, the overlay appears as soon as the mouse is held down.
      reveal(card);
      drag = {id:event.pointerId, x:event.clientX, lastX:event.clientX, left:track.scrollLeft, moved:false};
    } else {
      // On touch, avoid flashing the text when the visitor intends to swipe.
      activationTimer = setTimeout(() => {activationTimer = null; reveal(card);}, 160);
    }
  });
  track.addEventListener('pointermove', event => {
    if (pressing && event.pointerId === pressing.id) {
      const dx = event.clientX - pressing.x;
      const dy = event.clientY - pressing.y;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        pressing.dragged = true;
        clearActivationTimer();
        closeAll();
      }
    }
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    drag.lastX = event.clientX;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      drag.moved = true;
      track.classList.add('is-dragging');
      track.scrollLeft = drag.left - delta;
      event.preventDefault();
    }
  });
  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      suppressClick = true;
      const delta = drag.lastX - drag.x;
      const step = Math.max(1, Math.round(Math.abs(delta) / Math.max(1,cards[0].offsetWidth)));
      const cardSpan = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
      const initial = Math.round(drag.left / Math.max(1,cardSpan));
      const destination = Math.max(0,Math.min(cards.length-1, initial + (delta < 0 ? step : -step)));
      track.scrollTo({left:cards[destination].offsetLeft - cards[0].offsetLeft,behavior:'smooth'});
      setTimeout(() => {suppressClick=false;}, 100);
    }
    drag = null;
    track.classList.remove('is-dragging');
  }
  function finish(event) {
    if (pressing && (event.pointerId === pressing.id || event.pointerId === undefined)) endPress();
    if (drag && (event.pointerId === drag.id || event.pointerId === undefined)) endDrag();
  }
  track.addEventListener('pointerup', finish);
  track.addEventListener('pointercancel', finish);
  // Do not dismiss a legitimate press when the pointer grazes the rail edge.
  // It always ends on pointerup, pointercancel, blur, or a real drag.

  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
  window.addEventListener('blur', () => {endPress();endDrag();});
  document.addEventListener('visibilitychange', () => {if (document.hidden) {endPress();endDrag();}});
  track.addEventListener('contextmenu', event => {if (event.target.closest('[data-forms-material-card]')) event.preventDefault();});
  // Click must *never* open the text; prevent the default synthetic button action.
  track.addEventListener('click', event => {
    if (!event.target.closest('[data-forms-material-card]')) return;
    event.preventDefault();
    if (suppressClick) event.stopPropagation();
  }, true);
  updateProgress();
})();

// V61: no clock or autonomous animation. Each vertical pixel moves rows 0.35px.
(() => {
  const region = document.querySelector('[data-moods-marquees]');
  if (!region) return;
  const rows = [...region.querySelectorAll('.moods-marquee')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let distance = 0, previousY = window.scrollY, pending = false;
  rows.forEach(row => {
    const group = row.querySelector('.moods-marquee-group');
    const duplicate = group.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    duplicate.querySelectorAll('img').forEach(img => img.alt = '');
    row.querySelector('.moods-marquee-belt').append(duplicate);
  });
  function render() {
    pending = false;
    rows.forEach(row => {
      const width = row.querySelector('.moods-marquee-group').getBoundingClientRect().width;
      if (!width) return;
      const phase = reduced.matches ? 0 : distance % width;
      const x = row.dataset.direction === 'right' ? phase - width : -phase;
      row.querySelector('.moods-marquee-belt').style.transform = `translate3d(${x}px,0,0)`;
    });
  }
  window.addEventListener('scroll', () => {
    const delta = Math.abs(window.scrollY - previousY);
    previousY = window.scrollY;
    const bounds = region.getBoundingClientRect();
    if (!reduced.matches && bounds.bottom > 0 && bounds.top < innerHeight) distance += delta * 0.35;
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }, {passive: true});
  new ResizeObserver(render).observe(region);
  reduced.addEventListener('change', render);
  render();
})();

// V68: craftsmanship pictures and their matching copy enter from below on scroll.
(() => {
 if(document.body.dataset.page !== 'making' || !('IntersectionObserver' in window)) return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches) return;
 const items=[...document.querySelectorAll('[data-making-reveal]')];
 if(!items.length) return;
 document.documentElement.classList.add('has-making-reveals');
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('is-in-view');observer.unobserve(entry.target);}
  });
 },{threshold:.06,rootMargin:'0px 0px -10% 0px'});
 items.forEach(item=>observer.observe(item));
 reduced.addEventListener('change',()=>{
  if(reduced.matches){observer.disconnect();document.documentElement.classList.remove('has-making-reveals');}
 });
})();

// V73: unadorned film, final-frame overlay, and a fresh playback when revisiting from above.
(() => {
 const section=document.querySelector('[data-making-finale]');if(!section)return;
 const video=section.querySelector('[data-finale-video]'),copy=section.querySelector('[data-finale-copy]'),play=section.querySelector('[data-finale-play]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let complete=false,entered=false;
 document.documentElement.classList.add('has-making-finale');video.controls=false;video.muted=true;
 function conceal(){copy.setAttribute('aria-hidden','true');copy.inert=true;}
 function finish(){complete=true;section.classList.add('is-complete');copy.removeAttribute('aria-hidden');copy.inert=false;play.hidden=true;}
 function reset(){complete=false;entered=false;section.classList.remove('is-complete');conceal();video.pause();video.currentTime=0;play.hidden=true;}
 async function start(){if(complete)return;entered=true;try{await video.play();play.hidden=true;}catch{play.hidden=false;}}
 conceal();video.addEventListener('ended',finish);video.addEventListener('error',finish);play.addEventListener('click',start);
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){
  if(entry.intersectionRatio>=.45){if(reduced.matches)play.hidden=complete;else start();}
  else if(entry.intersectionRatio<.15){video.pause();if(entered&&entry.boundingClientRect.top>=innerHeight-2)reset();}
 }},{threshold:[0,.15,.45]});observer.observe(video);
})();

// V72: quote and body crossfade in one pinned reading window; scroll then moves the prose.
(() => {
 const video=document.querySelector('[data-system-video]');
 if(!video) return;
 const scene=video.closest('.forms-system-scene');
 const stage=scene.querySelector('.forms-system-stage');
 const reading=scene.querySelector('.forms-system-reading');
 const quote=scene.querySelector('.forms-system-quote-stage');
 const copy=scene.querySelector('[data-system-copy]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const wide=matchMedia('(min-width:901px)');
 let pending=false,active=false,layout=null;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>x*x*(3-2*x);
 video.muted=true;
 function measure(){
  if(reduced.matches||!wide.matches){scene.style.height='';layout=null;paint();return;}
  const height=stage.clientHeight;
  const transition=Math.max(520,height*.9);
  const travel=Math.max(0,copy.scrollHeight-reading.clientHeight);
  const read=Math.max(height*.9,travel+height*.35);
  layout={height,transition,travel,read,distance:transition+read+height*.2};
  scene.style.height=`${Math.ceil(height+layout.distance)}px`;
  paint();
 }
 function paint(){
  pending=false;
  if(!layout){document.documentElement.classList.remove('has-system-copy-reveal');return;}
  document.documentElement.classList.add('has-system-copy-reveal');
  const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))||72;
  const amount=Math.max(0,nav-scene.getBoundingClientRect().top);
  const blend=ease(clamp((amount/layout.transition-.12)/.76));
  const y=layout.travel*clamp((amount-layout.transition)/layout.read);
  stage.style.setProperty('--system-quote-opacity',(1-blend).toFixed(4));
  copy.style.setProperty('--system-copy-opacity',blend.toFixed(4));
  copy.style.setProperty('--system-copy-offset',`${-y}px`);
  quote.setAttribute('aria-hidden',String(blend>.98));
  copy.setAttribute('aria-hidden',String(blend<.02));
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
 function play(){if(active&&!reduced.matches)video.play().catch(()=>{});else video.pause();}
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{active=entries[0].isIntersecting;play();},{threshold:0}).observe(scene);
 video.addEventListener('loadeddata',play);
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',measure,{passive:true});
 reduced.addEventListener('change',()=>{play();measure();});wide.addEventListener('change',measure);
 document.fonts?.ready.then(measure);
 new ResizeObserver(measure).observe(copy);
 measure();
})();

// V72: small decorative films divide each chapter lead from its first section.
(() => {
 const videos=[...document.querySelectorAll('[data-divider-video]')];
 if(!videos.length||!('IntersectionObserver' in window))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 new IntersectionObserver(entries=>entries.forEach(entry=>{
  const v=entry.target;v.muted=true;
  if(entry.isIntersecting&&!reduced.matches)v.play().catch(()=>{});else v.pause();
 }),{threshold:.1}).observe(videos[0]);
})();

// V72: give static reading passages the Making entrance, leaving scroll-reading scenes alone.
(() => {
 if(document.body.dataset.page==='introduction'||!('IntersectionObserver' in window))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');if(reduced.matches)return;
 const exclude='.chapter-introduction,.chapter-cover,[data-origin-scroll-story],.motif-exchange,.forms-system-scene,[data-making-finale],[data-making-reveal],button,.material-card,[data-image-note]';
 const selectors='.reading-essay p,.reading-essay h2,.essay-body h2,.essay-body p,.authorship-headline h2,.authorship-headline p,.motif-finish p,.making-essay-lead h2,.making-essay-lead p,.origin-final-quote';
 const items=[...document.querySelectorAll(selectors)].filter(e=>!e.closest(exclude));
 document.documentElement.classList.add('has-static-text-fades');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('is-in-view');observer.unobserve(entry.target);}
 }),{threshold:.08,rootMargin:'0px 0px -9% 0px'});
 items.forEach(e=>{e.setAttribute('data-static-text-fade','');observer.observe(e);});
 reduced.addEventListener('change',()=>{if(reduced.matches){observer.disconnect();document.documentElement.classList.remove('has-static-text-fades');}});
})();

// V73: a clover expands beyond the viewport before the flowing authorship story opens.
(() => {
 const portal=document.querySelector('[data-authorship-portal]');if(!portal)return;
 const button=portal.querySelector('[data-portal-open]'),story=document.getElementById('authorship-story');let opened=false;
 button.addEventListener('click',()=>{if(opened)return;opened=true;button.setAttribute('aria-expanded','true');portal.classList.add('is-opening');
 const reveal=async()=>{const photo=story.querySelector('.authorship-panorama');if(photo)await photo.decode().catch(()=>{});story.hidden=false;portal.hidden=true;story.scrollIntoView({block:'start',behavior:'instant'});requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)reveal();else setTimeout(reveal,1250);
 });
 const notes=[...story.querySelectorAll('[data-image-note]')];
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in-view');observer.unobserve(e.target);}}),{threshold:.18,rootMargin:'0px 0px -18% 0px'});
 notes.forEach(e=>observer.observe(e));
 const stage=story.querySelector('.authorship-image-stage');let ticking=false;
 function paint(){ticking=false;if(story.hidden)return;const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))||72;
  const progress=Math.max(0,Math.min(1,(nav-story.getBoundingClientRect().top)/Math.max(1,story.offsetHeight-stage.offsetHeight)));
  story.style.setProperty('--facade-position',`${(progress*100).toFixed(3)}%`);
 }
 function schedule(){if(!ticking){ticking=true;requestAnimationFrame(paint);}}
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);schedule();
})();
// V73: normal page scrolling changes the colored panel and crossfades four stories.
(() => {
 const scene=document.querySelector('[data-heritage]');if(!scene)return;
 const stage=scene.querySelector('.intro-heritage-stage'),film=scene.querySelector('[data-heritage-film]'),video=scene.querySelector('[data-luck-film]'),play=scene.querySelector('[data-luck-play]'),panels=[...scene.querySelectorAll('[data-heritage-panel]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width: 761px)');let ticking=false;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function paint(){ticking=false;const desktop=wide.matches&&!reduced.matches;scene.classList.toggle('is-pinned',desktop);
 if(!desktop){panels.forEach(p=>{p.style.opacity='1';p.inert=false;p.removeAttribute('aria-hidden');});film.style.opacity='1';return;}
 const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))||72;
 const h=stage.offsetHeight,progress=Math.max(0,(nav-scene.getBoundingClientRect().top)/h);
 const filmOpacity=1-clamp((progress-.78)/.5);film.style.opacity=filmOpacity;film.inert=filmOpacity<.1;
 let active=Math.max(0,Math.min(3,Math.floor(progress-1.0)));
 panels.forEach((p,i)=>{const enter=clamp((progress-(i+1))/.4),leave=i===3?1:1-clamp((progress-(i+2))/.4);const opacity=Math.min(enter,leave);p.style.opacity=opacity;p.style.transform=`translateY(${(1-enter)*22}px)`;p.inert=opacity<.5;p.setAttribute('aria-hidden',String(opacity<.5));});
 scene.style.setProperty('--heritage-green',active%2?'1':'0');
 }
 function schedule(){if(!ticking){ticking=true;requestAnimationFrame(paint);}}
 async function start(){if(video.ended)return;try{await video.play();play.hidden=true;}catch{play.hidden=false;}}
 play.addEventListener('click',start);video.addEventListener('ended',()=>{play.hidden=true;});
 new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&!reduced.matches)start();else video.pause();}),{threshold:.3}).observe(film);
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);wide.addEventListener('change',schedule);reduced.addEventListener('change',schedule);schedule();
})();
