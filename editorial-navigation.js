(() => {
const header=document.querySelector('.site-header');
if(!header)return;
let queued=false;
const update=()=>{queued=false;header.classList.toggle('is-scrolled',scrollY>40);};
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
addEventListener('pageshow',update);update();
})();
