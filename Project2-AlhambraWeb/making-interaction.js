// Making chapter: crossfade images as their matching paragraphs enter view.
// All scrolling remains native; no wheel, touchmove or body-position interception.
(() => {
  const section=document.querySelector('[data-making-process]');
  if (!section) return;
  const steps=[...section.querySelectorAll('[data-making-step]')];
  const photos=[...section.querySelectorAll('[data-making-photo]')];
  const caption=section.querySelector('[data-making-caption]');
  const captions=[
    'Polishing · the beaded contour',
    'Setting · material and mount',
    'Back finish · the unseen side',
    'Assembly · motifs and chain'
  ];
  const setStep=i=>{
    if (!steps[i]) return;
    steps.forEach((s,j)=>s.classList.toggle('is-current',i===j));
    photos.forEach((p,j)=>p.classList.toggle('is-active',i===j));
    if (caption) caption.textContent=captions[i]||captions[0];
  };
  setStep(0);
  const update=()=>{
    if (window.matchMedia('(max-width:900px)').matches) return;
    const target=window.innerHeight*.51;
    let nearest=0, distance=Infinity;
    steps.forEach((step,i)=>{
      const box=step.getBoundingClientRect();
      const center=(box.top+box.bottom)/2;
      const delta=Math.abs(center-target);
      if(delta<distance){nearest=i;distance=delta;}
    });
    setStep(nearest);
  };
  let scheduled=false;
  const onScroll=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;update();});
  };
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});
  update();
})();
