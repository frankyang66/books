(function(){
  const galleryEl = document.getElementById('gallery');
  const lightboxEl = document.getElementById('lightbox');
  const lightboxImg = lightboxEl.querySelector('.lightbox__img');
  const lightboxCaption = lightboxEl.querySelector('.lightbox__caption');
  const closeBtn = lightboxEl.querySelector('.lightbox__close');
  const chooseDirBtn = document.getElementById('chooseDirBtn');
  const dirPicker = document.getElementById('dirPicker');
  const folderInput = document.getElementById('folderInput');
  const applyFolderBtn = document.getElementById('applyFolderBtn');
  const tpl = document.getElementById('tpl-card');

  const stageEl = lightboxEl.querySelector('.lightbox__stage');
  const canvasEl = lightboxEl.querySelector('.lightbox__canvas');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');

  // 默认文件夹名
  const DEFAULT_FOLDER = '图片';

  // 静态清单作为兜底
  const fallbackImages = [
    '图片/微信图片_20250826202231_258_272.jpg',
    '图片/微信图片_20250816005329_60.jpg',
    '图片/微信图片_20250816005329_61.jpg',
    '图片/微信图片_20250816005329_62.jpg',
    '图片/微信图片_20250816005329_63.jpg',
    '图片/微信图片_20250816005329_66.jpg',
    '图片/微信图片_20250816005329_67.jpg',
    '图片/微信图片_20250816005328_64.jpg',
    '图片/微信图片_20250816005328_65.jpg',
    '图片/微信图片_20250816005328_68.jpg',
    '图片/微信图片_20250816005328_69.jpg',
    '图片/微信图片_20250816005328_70.jpg',
    '图片/微信图片_20250816005328_71.jpg',
    '图片/微信图片_20250816005328_72.jpg',
    '图片/output/ComfyUI_0001.jpg',
    '图片/output/ComfyUI_0003.jpg',
    '图片/output/ComfyUI_0004.jpg',
    '图片/output/ComfyUI_0005.jpg',
    '图片/output/ComfyUI_0006.jpg',
    '图片/output/ComfyUI_0009.jpg',
    '图片/output/ComfyUI_0010.jpg',
    '图片/output/ComfyUI_0011.jpg',
    '图片/output/ComfyUI_0013.jpg',
    '图片/output/ComfyUI_0014.jpg',
    '图片/output/ComfyUI_0015.jpg',
    '图片/output/ComfyUI_0016.jpg',
    '图片/output/ComfyUI_0017.jpg',
    '图片/output/ComfyUI_0018.jpg',
    '图片/output/ComfyUI_0019.jpg',
    '图片/output/ComfyUI_0020.jpg',
    '图片/output/ComfyUI_0021.jpg'
  ];

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

  // ---------------- 可配置图片文件夹 ----------------
  function getFolder(){ return (localStorage.getItem('galleryFolder') || DEFAULT_FOLDER).replace(/^\/+|\/+$/g, ''); }
  function setFolder(v){ const clean = (v || '').replace(/^\/+|\/+$/g, ''); localStorage.setItem('galleryFolder', clean || DEFAULT_FOLDER); }

  applyFolderBtn?.addEventListener('click', async () => {
    const val = (folderInput.value || '').trim();
    if(val){ setFolder(val); await tryRenderFromFolder(); }
  });

  // 尝试从服务器目录索引加载（需要服务器允许列目录）
  async function listImagesFromFolder(folder){
    const exts = ['jpg','jpeg','png','gif','webp'];
    const urls = [];
    try {
      // 访问目录：/folder/ 与 /folder/output/
      const entries = [folder + '/', folder + '/output/'];
      for(const dir of entries){
        const res = await fetch(dir);
        if(!res.ok) continue;
        const html = await res.text();
        const matches = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
        for(const href of matches){
          const name = decodeURIComponent(href).split('?')[0];
          const lower = name.toLowerCase();
          if(exts.some(ext => lower.endsWith('.' + ext))){
            const full = dir + href;
            urls.push(full);
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return urls;
  }

  async function tryRenderFromFolder(){
    const folder = getFolder();
    folderInput.value = folder;
    let urls = await listImagesFromFolder(folder);
    if(urls.length === 0){
      // 兜底：尝试用 fallback，但把前缀替换为用户配置的文件夹名
      urls = fallbackImages.map(u => u.replace(/^图片\b/, folder));
    }
    renderCards(urls);
  }

  // 回退：允许用户直接选择本地文件夹
  chooseDirBtn.addEventListener('click', () => dirPicker.click());
  dirPicker.addEventListener('change', () => {
    const files = Array.from(dirPicker.files || []);
    const urls = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f.name)).map(f => URL.createObjectURL(f));
    renderCards(urls);
  });

  // 初始化
  folderInput.value = getFolder();
  tryRenderFromFolder();
})();
