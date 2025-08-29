(function(){
  const galleryEl = document.getElementById('gallery');
  const lightboxEl = document.getElementById('lightbox');
  const lightboxImg = lightboxEl.querySelector('.lightbox__img');
  const lightboxCaption = lightboxEl.querySelector('.lightbox__caption');
  const closeBtn = lightboxEl.querySelector('.lightbox__close');
  const tpl = document.getElementById('tpl-card');

  const stageEl = lightboxEl.querySelector('.lightbox__stage');
  const canvasEl = lightboxEl.querySelector('.lightbox__canvas');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');

  function pathToTitle(path){
    const name = path.split('/').pop();
    const noExt = name.replace(/\.[^.]+$/, '');
    return decodeURIComponent(noExt);
  }

  function renderCards(urls){
    galleryEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    urls.forEach(url => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const img = node.querySelector('.card__img');
      const caption = node.querySelector('.card__caption');
      img.src = url;
      img.alt = pathToTitle(url);
      caption.textContent = pathToTitle(url);
      node.addEventListener('click', () => openLightbox(url, caption.textContent));
      fragment.appendChild(node);
    });
    galleryEl.appendChild(fragment);
  }

  // ---------------- 缩放&拖拽 ----------------
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 8;
  const ZOOM_STEP = 1.2;

  function applyTransform(){
    canvasEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function resetTransform(){
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }

  function zoomAt(pointClientX, pointClientY, factor){
    const rect = stageEl.getBoundingClientRect();
    const pX = pointClientX - rect.left;
    const pY = pointClientY - rect.top;

    const newScale = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
    const canvasX = (pX - translateX) / scale;
    const canvasY = (pY - translateY) / scale;
    translateX = pX - newScale * canvasX;
    translateY = pY - newScale * canvasY;
    scale = newScale;
    applyTransform();
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function openLightbox(src, title){
    lightboxImg.src = src;
    lightboxCaption.textContent = title;
    lightboxEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const onLoad = () => { resetTransform(); lightboxImg.removeEventListener('load', onLoad); };
    lightboxImg.addEventListener('load', onLoad);
  }

  function closeLightbox(){
    lightboxEl.setAttribute('aria-hidden', 'true');
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightboxEl.addEventListener('click', (e) => { if(e.target === lightboxEl){ closeLightbox(); } });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape'){ closeLightbox(); } });

  zoomInBtn?.addEventListener('click', () => { const r = stageEl.getBoundingClientRect(); zoomAt(r.left + r.width/2, r.top + r.height/2, ZOOM_STEP); });
  zoomOutBtn?.addEventListener('click', () => { const r = stageEl.getBoundingClientRect(); zoomAt(r.left + r.width/2, r.top + r.height/2, 1/ZOOM_STEP); });
  zoomResetBtn?.addEventListener('click', resetTransform);
  stageEl?.addEventListener('wheel', (e) => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 1/1.1; zoomAt(e.clientX, e.clientY, f); }, { passive: false });
  stageEl?.addEventListener('dblclick', (e) => { e.preventDefault(); resetTransform(); });

  let dragging = false; let startX = 0, startY = 0; let startTX = 0, startTY = 0;
  function onPointerDown(e){ if(!e.target || !canvasEl.contains(e.target)) return; dragging = true; canvasEl.classList.add('dragging'); startX = e.clientX; startY = e.clientY; startTX = translateX; startTY = translateY; window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp, { once: true }); }
  function onPointerMove(e){ if(!dragging) return; translateX = startTX + (e.clientX - startX); translateY = startTY + (e.clientY - startY); applyTransform(); }
  function onPointerUp(){ dragging = false; canvasEl.classList.remove('dragging'); window.removeEventListener('pointermove', onPointerMove); }
  stageEl?.addEventListener('pointerdown', onPointerDown);

  // ---------------- 仅加载 images.json ----------------
  async function loadImagesJson(){
    const res = await fetch('images.json?ts=' + Date.now());
    if(!res.ok) throw new Error('images.json 加载失败');
    const data = await res.json();
    if(Array.isArray(data)) return data;
    if(data && Array.isArray(data.images)) return data.images;
    throw new Error('images.json 格式不正确');
  }

  async function init(){
    try {
      const urls = await loadImagesJson();
      renderCards(urls);
    } catch (err){
      galleryEl.innerHTML = `<div style="color:#c00;padding:16px">${(err && err.message) || '无法加载 images.json'}</div>`;
    }
  }

  init();
})();
