// The book opening replays on every landing-page load; chapters use a quick white arrival.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('page-entering');
  const failSafe = setTimeout(() => {
    root.classList.remove('page-entering', 'landing-intro-active', 'landing-arrival');
    document.querySelector('.page-arrival')?.remove();
  }, 8500);
  const butterfly = '<img class="arrival-butterfly" src="assets/page-loader-butterfly.svg" alt=""/>';
  const flight = '<img class="arrival-flight" src="assets/landing-butterfly-flight.webp" alt=""/>';
  document.addEventListener('DOMContentLoaded', async () => {
    const hero = document.querySelector('.hero--landing h1.book-title');
    const opening = !!hero && !location.hash;
    root.classList.toggle('landing-arrival', opening);
    const overlay = document.createElement('div');
    overlay.className = 'page-arrival' + (opening ? ' page-arrival--book' : '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="arrival-ground"></div>' + (opening ? flight : butterfly);
    document.body.append(overlay);
    const finish = () => {
      clearTimeout(failSafe);
      root.classList.remove('page-entering', 'landing-intro-active', 'landing-arrival');
      overlay.remove();
    };
    // A restored history entry must remain at its previous reading position.
    addEventListener('pageshow', e => { if (e.persisted) finish(); });
    if (!opening) {
      setTimeout(() => {
        root.classList.remove('page-entering');
        overlay.classList.add('arrival-leaving');
        setTimeout(finish, reduced ? 80 : 150);
      }, reduced ? 50 : 180);
      return;
    }
    root.classList.add('landing-intro-active');
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 350))]);
    const title = hero.cloneNode(true);
    title.removeAttribute('aria-label');
    title.classList.add('arrival-title');
    const style = getComputedStyle(hero);
    const rect = hero.getBoundingClientRect();
    Object.assign(title.style, {fontSize:style.fontSize, width:rect.width+'px', height:rect.height+'px', left:((innerWidth-rect.width)/2)+'px', top:((innerHeight-rect.height)/2)+'px'});
    title.classList.add('is-centered', 'is-positioning');
    overlay.append(title);
    for (const line of title.children) {
      line.style.setProperty('--line-center', ((rect.width-line.getBoundingClientRect().width)/2)+'px');
    }
    void title.offsetWidth;
    requestAnimationFrame(() => title.classList.remove('is-positioning'));
    setTimeout(() => {
      const target = hero.getBoundingClientRect();
      root.classList.remove('page-entering');
      overlay.classList.add('arrival-leaving');
      title.classList.remove('is-centered');
      title.style.left = target.left+'px';
      title.style.top = target.top+'px';
      setTimeout(finish, reduced ? 200 : 1250);
    }, 3000);
    // Recalculate rather than leaving the moving title stranded after a resize.
    addEventListener('resize', finish, {once:true});
  }, {once:true});
})();
