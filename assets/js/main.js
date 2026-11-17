/* Kairos shared interactions: one consistent behaviour layer across every page. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('[data-header]');
  const topButton = $('[data-back-to-top]');
  const updateScroll = () => {
    const y = window.scrollY || 0;
    header?.classList.toggle('is-scrolled', y > 16);
    topButton?.classList.toggle('is-visible', y > 450);
  };
  window.addEventListener('scroll', updateScroll, {passive:true});
  updateScroll();
  topButton?.addEventListener('click', () => window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'}));

  // Full-screen mobile navigation with direct close-button and backdrop handlers.
  const drawer = $('[data-mobile-drawer]');
  const openButton = $('[data-menu-open]');
  const closeButton = $('[data-menu-close]');
  const backdrop = $('[data-menu-backdrop]');
  if (drawer) { drawer.inert = true; drawer.setAttribute('aria-hidden','true'); }
  const openMenu = () => {
    if (!drawer) return;
    drawer.inert = false; drawer.setAttribute('aria-hidden','false');
    body.classList.add('menu-open'); openButton?.setAttribute('aria-expanded','true');
    closeButton?.focus({preventScroll:true});
  };
  const closeMenu = (restore=true) => {
    if (!drawer) return;
    body.classList.remove('menu-open'); drawer.setAttribute('aria-hidden','true'); drawer.inert = true;
    openButton?.setAttribute('aria-expanded','false'); if (restore) openButton?.focus({preventScroll:true});
  };
  openButton?.addEventListener('click', e => {e.preventDefault();openMenu();});
  closeButton?.addEventListener('click', e => {e.preventDefault();e.stopPropagation();closeMenu();});
  backdrop?.addEventListener('click', e => {e.preventDefault();closeMenu();});
  $$('[data-drawer-link]',drawer||document).forEach(link => link.addEventListener('click',()=>closeMenu(false)));
  document.addEventListener('keydown', e => {if(e.key==='Escape'&&body.classList.contains('menu-open'))closeMenu();});

  // Homepage hero slider.
  const slides = $$('[data-hero-slider] .hero-slide');
  const dots = $$('[data-hero-dots] button');
  let active = 0, timer = 0;
  const show = n => {
    if (!slides.length) return;
    active = (n + slides.length) % slides.length;
    slides.forEach((el,i)=>el.classList.toggle('is-active',i===active));
    dots.forEach((el,i)=>el.classList.toggle('is-active',i===active));
  };
  const restart = () => {
    window.clearInterval(timer);
    if (!reducedMotion && slides.length>1) timer=window.setInterval(()=>show(active+1),6500);
  };
  $('[data-hero-prev]')?.addEventListener('click',()=>{show(active-1);restart();});
  $('[data-hero-next]')?.addEventListener('click',()=>{show(active+1);restart();});
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);restart();}));
  show(0); restart();

  // Scroll reveals and impact count-up figures.
  const reveal = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.12});
    reveal.forEach(el=>observer.observe(el));
  } else reveal.forEach(el=>el.classList.add('is-visible'));

  const animateCount = el => {
    if (el.dataset.done) return; el.dataset.done='1';
    const target=Number(el.dataset.count||0); if(!target) return;
    const duration=950, start=performance.now();
    const tick=now=>{const p=Math.min(1,(now-start)/duration);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString('en-US');if(p<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  };
  const countEls=$$('[data-count]');
  if ('IntersectionObserver' in window) {
    const countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animateCount(entry.target);countObserver.unobserve(entry.target);}}),{threshold:.45});
    countEls.forEach(el=>countObserver.observe(el));
  } else countEls.forEach(animateCount);

  // Simple, accessible category filtering for any future gallery cards.
  const filterBar=$('[data-project-filters]'); const cards=$$('[data-project-grid] [data-category]');
  if(filterBar&&cards.length){
    filterBar.addEventListener('click',e=>{
      const btn=e.target.closest('[data-filter]'); if(!btn)return;
      const value=btn.dataset.filter;
      $$('[data-filter]',filterBar).forEach(b=>{const on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
      cards.forEach(card=>card.hidden=!(value==='all'||card.dataset.category===value));
    });
  }

  // Contact forms use the known Kairos email address only.
  $('[data-enquiry-form]')?.addEventListener('submit',e=>{
    e.preventDefault(); const form=e.currentTarget; if(!form.reportValidity())return;
    const data=new FormData(form); const recipient=form.dataset.recipient||'kairosecocleaningandsanitation@gmail.com';
    const subject=`Kairos website enquiry: ${data.get('enquiry')||'General enquiry'}`;
    const message=[
      'Hello Kairos Ecocleaning and Sanitation Enterprise,','',
      `Name: ${data.get('name')||''}`,
      `Email: ${data.get('email')||''}`,
      `Phone: ${data.get('phone')||'Not provided'}`,
      `Enquiry type: ${data.get('enquiry')||''}`,'',
      'Message:',`${data.get('message')||''}`
    ].join('\n');
    window.location.href=`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  });

  // Copy bank details for donors. The button remains usable as a normal page if clipboard is unavailable.
  const copyBankButton = $('[data-copy-bank]');
  copyBankButton?.addEventListener('click', async () => {
    const details = [
      'Account Holder: IMASS INNOVATION',
      'Bank Account No.: 1050437099718',
      'Bank Name: FIDELITY BANK LTD',
      'Swift Code/BIC: FBLIGHAC',
      'Bank Branch: KASOA BRANCH'
    ].join('\n');
    const original = copyBankButton.innerHTML;
    try {
      await navigator.clipboard.writeText(details);
      copyBankButton.textContent = 'Bank details copied';
      window.setTimeout(() => { copyBankButton.innerHTML = original; }, 2200);
    } catch (error) {
      copyBankButton.textContent = 'Copy unavailable — select the details above';
      window.setTimeout(() => { copyBankButton.innerHTML = original; }, 3000);
    }
  });

  const year=$('[data-current-year]'); if(year)year.textContent=new Date().getFullYear();
})();
