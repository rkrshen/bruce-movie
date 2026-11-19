const REDUCED_MOTION = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Top-layer <dialog> smooth exit helper + Safari closedby="any" fallback
   -------------------------------------------------------------------------- */
let cachedDisplayTransitionSupport: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedDisplayTransitionSupport !== undefined) {
    return cachedDisplayTransitionSupport;
  }
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  window.getComputedStyle(probe).display;
  probe.style.display = 'none';
  cachedDisplayTransitionSupport = window.getComputedStyle(probe).display === 'block';
  probe.remove();
  return cachedDisplayTransitionSupport;
}

function supportsTopLayerExit(): boolean {
  return Boolean(window.CSS?.supports?.('overlay', 'auto')) && canTransitionDisplay();
}

async function closeDialogSmoothly(dialog: HTMLDialogElement): Promise<void> {
  if (!dialog.open || dialog.hasAttribute('data-closing')) return;

  if (!supportsTopLayerExit() && !REDUCED_MOTION()) {
    dialog.setAttribute('data-closing', '');
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => window.setTimeout(resolve, 360)),
      ]);
    }
    if (!dialog.hasAttribute('data-closing')) return;
    dialog.removeAttribute('data-closing');
  }

  if (dialog.open) {
    dialog.close();
  }
}

function attachLightDismissFallback(
  dialog: HTMLDialogElement,
  isOutsideContent: (event: PointerEvent) => boolean,
): void {
  dialog.addEventListener('cancel', (event) => {
    if (!supportsTopLayerExit() && !REDUCED_MOTION() && event.cancelable) {
      event.preventDefault();
      void closeDialogSmoothly(dialog);
    }
  });

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (event) => {
      pressedOutside = isOutsideContent(event);
    });
    dialog.addEventListener('pointerup', (event) => {
      if (pressedOutside && isOutsideContent(event)) {
        void closeDialogSmoothly(dialog);
      }
      pressedOutside = false;
    });
  }
}

/* --------------------------------------------------------------------------
   1. Header scroll glass state + Native <dialog> Mobile Drawer
   -------------------------------------------------------------------------- */
function initNavbarAndDrawer(): void {
  const header = document.getElementById('site-header');
  const toggleBtn = document.getElementById('nav-toggle') as HTMLButtonElement | null;
  const drawer = document.getElementById('mobile-nav-drawer') as HTMLDialogElement | null;
  const closeBtn = document.getElementById('nav-drawer-close') as HTMLButtonElement | null;

  if (header) {
    const syncHeaderState = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    syncHeaderState();
    window.addEventListener('scroll', syncHeaderState, { passive: true });
  }

  if (!toggleBtn || !drawer) return;

  const panel = drawer.querySelector<HTMLElement>('.mobile-drawer__panel');

  const openDrawer = () => {
    if (drawer.open) return;
    drawer.removeAttribute('data-closing');
    drawer.showModal();
    toggleBtn.setAttribute('aria-expanded', 'true');
  };

  toggleBtn.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', () => {
    void closeDialogSmoothly(drawer);
  });

  drawer.addEventListener('close', () => {
    drawer.removeAttribute('data-closing');
    toggleBtn.setAttribute('aria-expanded', 'false');
  });

  drawer.querySelectorAll<HTMLAnchorElement>('[data-drawer-link]').forEach((link) => {
    link.addEventListener('click', () => {
      void closeDialogSmoothly(drawer);
    });
  });

  attachLightDismissFallback(drawer, (event) => {
    if (!panel) return false;
    const rect = panel.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  });
}

/* --------------------------------------------------------------------------
   2. Scroll progress fallback + Back-to-top floating control
   -------------------------------------------------------------------------- */
function initScrollChrome(): void {
  const progressEl = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top') as HTMLButtonElement | null;
  const needsProgressFallback =
    Boolean(progressEl) &&
    !CSS.supports('animation-timeline', 'scroll()') &&
    !REDUCED_MOTION();

  let rafId = 0;
  const update = () => {
    rafId = 0;
    const scrollY = window.scrollY;

    if (needsProgressFallback && progressEl) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, scrollY / scrollable)) : 0;
      progressEl.style.transform = `scaleX(${ratio})`;
    }

    if (backToTop) {
      backToTop.hidden = scrollY < 560;
    }
  };

  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    },
    { passive: true },
  );

  backToTop?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: REDUCED_MOTION() ? 'auto' : 'smooth',
    });
  });
}

/* --------------------------------------------------------------------------
   3. Scrollspy Navigation (Native scroll-target-group + IO fallback)
   -------------------------------------------------------------------------- */
function initScrollspy(): void {
  const nav = document.querySelector<HTMLElement>('[data-scrollspy-nav]');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('[data-section-link]'));
  if (links.length === 0) return;

  if (CSS.supports('scroll-target-group: auto')) {
    const syncAria = () => {
      const active = nav.querySelector<HTMLAnchorElement>('a:target-current');
      links.forEach((link) => {
        if (link === active) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    syncAria();
    let timer = 0;
    const supportsScrollEnd = 'onscrollend' in (window as unknown as Record<string, unknown>);
    if (supportsScrollEnd) {
      document.addEventListener('scrollend', syncAria, { passive: true });
    } else {
      window.addEventListener(
        'scroll',
        () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(syncAria, 120);
        },
        { passive: true },
      );
    }
    return;
  }

  const sections = links
    .map((link) => {
      const id = link.dataset.sectionLink;
      return id ? document.getElementById(id) : null;
    })
    .filter((el): el is HTMLElement => Boolean(el));

  if (sections.length === 0 || !('IntersectionObserver' in window)) return;

  const setActive = (id: string) => {
    links.forEach((link) => {
      const match = link.dataset.sectionLink === id;
      link.classList.toggle('is-current', match);
      if (match) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) {
        setActive(visible.target.id);
      }
    },
    { rootMargin: '-22% 0px -58% 0px', threshold: [0.1, 0.35, 0.6] },
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* --------------------------------------------------------------------------
   4. Hero Parallax fallback + Subtle Cinematic Ember Sparks Canvas
   -------------------------------------------------------------------------- */
function initHeroParallaxFallback(): void {
  if (
    REDUCED_MOTION() ||
    CSS.supports('(animation-timeline: view()) and (animation-range: exit)')
  ) {
    return;
  }

  const target = document.querySelector<HTMLElement>('[data-parallax]');
  if (!target) return;

  let rafId = 0;
  const update = () => {
    rafId = 0;
    const offset = Math.min(window.scrollY, 640) * 0.22;
    target.style.transform = `translate3d(0, ${offset}px, 0) scale(1.04)`;
  };

  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    },
    { passive: true },
  );
}

function initHeroEmbers(): void {
  if (REDUCED_MOTION()) return;
  const canvas = document.getElementById('hero-embers') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  interface Ember {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
    hue: number;
  }

  let width = 0;
  let height = 0;
  let rafId = 0;
  let isVisible = true;
  const count = window.innerWidth < 768 ? 18 : 30;
  const embers: Ember[] = [];

  const spawn = (randomY = false): Ember => {
    const maxLife = 160 + Math.random() * 220;
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + Math.random() * 60,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(0.35 + Math.random() * 0.85),
      size: 1.1 + Math.random() * 2.1,
      alpha: 0.25 + Math.random() * 0.6,
      life: randomY ? Math.random() * maxLife : 0,
      maxLife,
      hue: 16 + Math.random() * 26,
    };
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  for (let i = 0; i < count; i += 1) {
    embers.push(spawn(true));
  }

  const tick = () => {
    if (!isVisible || document.hidden) {
      rafId = 0;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < embers.length; i += 1) {
      const e = embers[i];
      if (!e) continue;
      e.life += 1;
      e.x += e.vx + Math.sin(e.life * 0.025 + i) * 0.22;
      e.y += e.vy;

      const progress = e.life / e.maxLife;
      const fade =
        progress < 0.15
          ? progress / 0.15
          : progress > 0.7
            ? (1 - progress) / 0.3
            : 1;

      if (e.life >= e.maxLife || e.y < -12) {
        embers[i] = spawn(false);
        continue;
      }

      const opacity = Math.max(0, e.alpha * fade);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${e.hue}, 96%, 64%, ${opacity})`;
      ctx.shadowColor = `hsla(${e.hue}, 100%, 58%, ${opacity * 0.85})`;
      ctx.shadowBlur = 8;
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    rafId = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (!rafId && isVisible && !document.hidden) {
      rafId = window.requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = Boolean(entries[0]?.isIntersecting);
        if (isVisible) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener('resize', resize, { passive: true });
  start();
}

/* --------------------------------------------------------------------------
   5. Progressive Scroll Reveal + Pointer Spotlight Glow
   -------------------------------------------------------------------------- */
function initScrollReveal(): void {
  if (REDUCED_MOTION() || !('IntersectionObserver' in window)) return;

  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (elements.length === 0) return;

  document.documentElement.classList.add('has-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      let batchIndex = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.style.transitionDelay = `${Math.min(batchIndex * 55, 220)}ms`;
        el.classList.add('is-revealed');
        observer.unobserve(el);
        batchIndex += 1;
      });
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
  );

  elements.forEach((el) => observer.observe(el));
}

function initSpotlightCards(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((card) => {
    card.addEventListener(
      'pointermove',
      (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      },
      { passive: true },
    );
  });
}

/* --------------------------------------------------------------------------
   6. Activity Card Swipeable Galleries
   -------------------------------------------------------------------------- */
function initActivityGalleries(): void {
  document.querySelectorAll<HTMLElement>('[data-card-gallery]').forEach((card) => {
    const track = card.querySelector<HTMLElement>('[data-gallery-track]');
    const dots = Array.from(card.querySelectorAll<HTMLButtonElement>('[data-gallery-dot]'));
    const counter = card.querySelector<HTMLElement>('[data-gallery-counter]');
    const total = dots.length;
    if (!track || total <= 1) return;

    let currentIndex = 0;
    let rafId = 0;

    const setActive = (index: number) => {
      const clamped = Math.max(0, Math.min(total - 1, index));
      if (clamped === currentIndex && counter?.textContent) return;
      currentIndex = clamped;
      dots.forEach((dot, idx) => {
        if (idx === clamped) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (counter) {
        counter.textContent = `${clamped + 1} / ${total}`;
      }
    };

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        const slideWidth = track.clientWidth;
        track.scrollTo({
          left: slideWidth * idx,
          behavior: REDUCED_MOTION() ? 'auto' : 'smooth',
        });
        setActive(idx);
      });
    });

    track.addEventListener(
      'scroll',
      () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          const slideWidth = track.clientWidth || 1;
          setActive(Math.round(track.scrollLeft / slideWidth));
        });
      },
      { passive: true },
    );
  });
}

/* --------------------------------------------------------------------------
   7. Native <dialog> Photo Lightbox Viewer
   -------------------------------------------------------------------------- */
function initLightbox(): void {
  const dialog = document.getElementById('media-lightbox') as HTMLDialogElement | null;
  if (!dialog) return;

  const imgEl = dialog.querySelector<HTMLImageElement>('[data-lightbox-img]');
  const captionEl = dialog.querySelector<HTMLElement>('[data-lightbox-caption]');
  const counterEl = dialog.querySelector<HTMLElement>('[data-lightbox-counter]');
  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  const prevBtn = dialog.querySelector<HTMLButtonElement>('[data-lightbox-prev]');
  const nextBtn = dialog.querySelector<HTMLButtonElement>('[data-lightbox-next]');
  const stageEl = dialog.querySelector<HTMLElement>('.lightbox__stage');

  if (!imgEl || !captionEl || !counterEl) return;

  interface LightboxItem {
    src: string;
    alt: string;
    caption: string;
  }

  const groups = new Map<string, LightboxItem[]>();
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-lightbox-trigger]'),
  );

  triggers.forEach((btn) => {
    const group = btn.dataset.lightboxGroup ?? 'default';
    const index = Number(btn.dataset.lightboxIndex ?? '0');
    const src = btn.dataset.lightboxSrc ?? '';
    const alt = btn.dataset.lightboxAlt ?? '';
    const caption = btn.dataset.lightboxCaption ?? alt;
    if (!src) return;

    const list = groups.get(group) ?? [];
    list[index] = { src, alt, caption };
    groups.set(group, list);
  });

  let currentItems: LightboxItem[] = [];
  let activeIndex = 0;

  const render = (index: number) => {
    if (currentItems.length === 0) return;
    activeIndex = ((index % currentItems.length) + currentItems.length) % currentItems.length;
    const item = currentItems[activeIndex];
    if (!item) return;

    imgEl.src = item.src;
    imgEl.alt = item.alt;
    captionEl.textContent = item.caption;
    counterEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(currentItems.length).padStart(2, '0')}`;

    const hideNav = currentItems.length <= 1;
    if (prevBtn) prevBtn.hidden = hideNav;
    if (nextBtn) nextBtn.hidden = hideNav;
  };

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.lightboxGroup ?? 'default';
      const index = Number(btn.dataset.lightboxIndex ?? '0');
      const items = (groups.get(group) ?? []).filter(Boolean);
      if (items.length === 0) return;

      currentItems = items;
      render(index);
      dialog.removeAttribute('data-closing');
      dialog.showModal();
    });
  });

  closeBtn?.addEventListener('click', () => {
    void closeDialogSmoothly(dialog);
  });

  prevBtn?.addEventListener('click', () => render(activeIndex - 1));
  nextBtn?.addEventListener('click', () => render(activeIndex + 1));

  dialog.addEventListener('keydown', (event) => {
    if (!dialog.open || currentItems.length <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      render(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      render(activeIndex + 1);
    }
  });

  // Touch swipe inside lightbox
  let swipeStartX: number | null = null;
  stageEl?.addEventListener(
    'touchstart',
    (event) => {
      swipeStartX = event.touches[0]?.clientX ?? null;
    },
    { passive: true },
  );
  stageEl?.addEventListener(
    'touchend',
    (event) => {
      if (swipeStartX === null || currentItems.length <= 1) return;
      const endX = event.changedTouches[0]?.clientX ?? swipeStartX;
      const delta = endX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(delta) > 45) {
        render(delta < 0 ? activeIndex + 1 : activeIndex - 1);
      }
    },
    { passive: true },
  );

  // Close when clicking empty area outside figure/buttons
  dialog.addEventListener('click', (event) => {
    if (
      event.target === dialog ||
      event.target === stageEl ||
      (event.target instanceof Element && event.target.classList.contains('lightbox__surface'))
    ) {
      void closeDialogSmoothly(dialog);
    }
  });

  dialog.addEventListener('close', () => {
    dialog.removeAttribute('data-closing');
  });

  attachLightDismissFallback(dialog, () => false);
}

/* --------------------------------------------------------------------------
   8. Lazy HTML5 Videos & Privacy-Enhanced YouTube Facades
   -------------------------------------------------------------------------- */
function pauseOtherVideos(current?: HTMLVideoElement): void {
  document.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
    if (video !== current && !video.paused) {
      video.pause();
    }
  });
}

function initLazyVideos(): void {
  document.querySelectorAll<HTMLElement>('[data-lazy-video]').forEach((container) => {
    const trigger = container.querySelector<HTMLButtonElement>('.lazy-video-card__preview');
    if (!trigger) return;

    trigger.addEventListener(
      'click',
      () => {
        const src = container.dataset.videoSrc;
        if (!src) return;

        const posterImg = container.querySelector('img');
        const video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.width = 960;
        video.height = 540;
        if (posterImg?.currentSrc || posterImg?.src) {
          video.poster = posterImg.currentSrc || posterImg.src;
        }

        const source = document.createElement('source');
        source.src = src;
        source.type = 'video/mp4';
        video.appendChild(source);
        video.appendChild(
          document.createTextNode(container.dataset.videoUnsupported ?? ''),
        );

        video.addEventListener('play', () => pauseOtherVideos(video));

        pauseOtherVideos();
        container.replaceChildren(video);
        video.play().catch(() => {
          // Remains operable via native controls if autoplay is blocked.
        });
      },
      { once: true },
    );
  });
}

function initYouTubeFacades(): void {
  document.querySelectorAll<HTMLElement>('[data-youtube-facade]').forEach((container) => {
    const trigger = container.querySelector<HTMLButtonElement>('.lazy-video-card__preview');
    if (!trigger) return;

    trigger.addEventListener(
      'click',
      () => {
        const embedUrl = container.dataset.embedUrl;
        if (!embedUrl) return;

        pauseOtherVideos();
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.title = container.dataset.iframeTitle ?? 'YouTube video player';
        iframe.loading = 'lazy';
        iframe.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';

        container.replaceChildren(iframe);
      },
      { once: true },
    );
  });
}

/* --------------------------------------------------------------------------
   9. Animated Segmented Tabs (WAI-ARIA Keyboard + Sliding Ember Pill)
   -------------------------------------------------------------------------- */
function initTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs-root]').forEach((root) => {
    const tablist = root.querySelector<HTMLElement>('[role="tablist"]');
    const indicator = tablist?.querySelector<HTMLElement>('[data-tab-indicator]') ?? null;
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    if (tabs.length === 0) return;

    let activeIndex = Math.max(
      0,
      tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
    );

    const syncIndicator = (animate: boolean) => {
      const activeTab = tabs[activeIndex];
      if (!tablist || !indicator || !activeTab) return;

      const x = activeTab.offsetLeft;
      const w = activeTab.offsetWidth;
      if (w === 0) return;

      indicator.style.setProperty('--indicator-x', `${x}px`);
      indicator.style.setProperty('--indicator-w', `${w}px`);
      tablist.classList.add('has-indicator');

      if (!animate) {
        indicator.classList.remove('is-ready');
        void indicator.offsetWidth;
      }
      indicator.classList.add('is-ready');
    };

    const activate = (targetIndex: number, shouldFocus = false) => {
      activeIndex = targetIndex;
      tabs.forEach((tab, idx) => {
        const active = idx === targetIndex;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        const panel = panels[idx];
        if (panel) {
          if (!active) {
            panel.querySelectorAll('video').forEach((v) => v.pause());
          }
          panel.hidden = !active;
        }
      });

      syncIndicator(true);
      tabs[targetIndex]?.scrollIntoView({
        behavior: REDUCED_MOTION() ? 'auto' : 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
      if (shouldFocus) {
        tabs[targetIndex]?.focus();
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(index, false));
      tab.addEventListener('keydown', (event) => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;

        event.preventDefault();
        activate(next, true);
      });
    });

    window.requestAnimationFrame(() => syncIndicator(false));
    if (tablist && 'ResizeObserver' in window) {
      const ro = new ResizeObserver(() => syncIndicator(false));
      ro.observe(tablist);
    }
  });
}

/* --------------------------------------------------------------------------
   10. Awards Native Scroll-Snap Carousel
   -------------------------------------------------------------------------- */
function initCarousels(): void {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>('[data-carousel-track]');
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>('.awards-slide'));
    const markers = Array.from(
      carousel.querySelectorAll<HTMLButtonElement>('[data-carousel-marker]'),
    );
    const prevBtn = carousel.querySelector<HTMLButtonElement>('[data-carousel-prev]');
    const nextBtn = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
    const statusEl = carousel.querySelector<HTMLElement>('[data-carousel-status]');
    const countEl = carousel.querySelector<HTMLElement>('[data-carousel-count]');

    const total = slides.length;
    if (!track || total === 0) return;

    let activeIndex = 0;
    let pendingTarget: number | null = null;
    let rafId = 0;
    let settleTimer = 0;

    const updateVisualState = (index: number) => {
      activeIndex = ((index % total) + total) % total;
      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-current', idx === activeIndex);
      });
      markers.forEach((marker, idx) => {
        if (idx === activeIndex) marker.setAttribute('aria-current', 'true');
        else marker.removeAttribute('aria-current');
      });
      if (countEl) {
        countEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      }
    };

    const announceActive = () => {
      if (!statusEl) return;
      const slide = slides[activeIndex];
      const label = slide?.dataset.slideLabel ?? '';
      const caption = slide?.querySelector('.awards-slide__text')?.textContent?.trim() ?? '';
      statusEl.textContent = caption ? `${label}：${caption}` : label;
    };

    const nearestSlideIndex = (): number => {
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let bestIndex = activeIndex;
      let bestDist = Number.POSITIVE_INFINITY;
      slides.forEach((slide, idx) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(slideCenter - trackCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      });
      return bestIndex;
    };

    const goTo = (index: number) => {
      const targetIndex = ((index % total) + total) % total;
      const slide = slides[targetIndex];
      if (!slide) return;

      pendingTarget = targetIndex;
      updateVisualState(targetIndex);
      const targetLeft = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: REDUCED_MOTION() ? 'auto' : 'smooth',
      });

      if (REDUCED_MOTION()) {
        pendingTarget = null;
        announceActive();
      }
    };

    const onSettled = () => {
      const settledIndex = pendingTarget ?? nearestSlideIndex();
      pendingTarget = null;
      if (settledIndex !== activeIndex) {
        updateVisualState(settledIndex);
      }
      announceActive();
    };

    prevBtn?.addEventListener('click', () => goTo(activeIndex - 1));
    nextBtn?.addEventListener('click', () => goTo(activeIndex + 1));

    markers.forEach((marker, idx) => {
      marker.addEventListener('click', () => goTo(idx));
    });

    const supportsScrollEnd = 'onscrollend' in (window as unknown as Record<string, unknown>);

    track.addEventListener(
      'scroll',
      () => {
        if (pendingTarget === null && !rafId) {
          rafId = window.requestAnimationFrame(() => {
            rafId = 0;
            const nearest = nearestSlideIndex();
            if (nearest !== activeIndex) {
              updateVisualState(nearest);
            }
          });
        }

        if (!supportsScrollEnd) {
          window.clearTimeout(settleTimer);
          settleTimer = window.setTimeout(onSettled, 150);
        }
      },
      { passive: true },
    );

    if (supportsScrollEnd) {
      track.addEventListener('scrollend', onSettled, { passive: true });
    }

    updateVisualState(0);
  });
}

/* --------------------------------------------------------------------------
   11. Interactive Chronological Project Timeline
   -------------------------------------------------------------------------- */
function initTimeline(): void {
  const root = document.querySelector<HTMLElement>('[data-timeline-root]');
  if (!root) return;

  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-timeline-jump]'));
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-timeline-year]'));
  const detailsList = Array.from(
    root.querySelectorAll<HTMLDetailsElement>('[data-timeline-details]'),
  );
  const toggleAllBtn = root.querySelector<HTMLButtonElement>('[data-timeline-toggle-all]');

  const setActiveChip = (year: string) => {
    chips.forEach((chip) => {
      const active = chip.dataset.timelineJump === year;
      chip.classList.toggle('is-active', active);
      if (active) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    });
  };

  const syncToggleAllButton = () => {
    if (!toggleAllBtn) return;
    const allOpen = detailsList.every((d) => d.open);
    toggleAllBtn.setAttribute('aria-expanded', String(allOpen));
    const labelSpan = toggleAllBtn.querySelector('span');
    if (labelSpan) {
      labelSpan.textContent = allOpen
        ? (toggleAllBtn.dataset.labelCollapse ?? '')
        : (toggleAllBtn.dataset.labelExpand ?? '');
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const year = chip.dataset.timelineJump;
      if (!year) return;
      const targetNode = document.getElementById(`timeline-year-${year}`);
      const details = targetNode?.querySelector<HTMLDetailsElement>('[data-timeline-details]');
      if (details) {
        details.open = true;
      }
      setActiveChip(year);
      syncToggleAllButton();
      targetNode?.scrollIntoView({
        behavior: REDUCED_MOTION() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });

  toggleAllBtn?.addEventListener('click', () => {
    const allOpen = detailsList.every((d) => d.open);
    detailsList.forEach((details, index) => {
      details.open = allOpen ? index < 3 : true;
    });
    syncToggleAllButton();
  });

  detailsList.forEach((details) => {
    details.addEventListener('toggle', syncToggleAllButton);
  });

  if ('IntersectionObserver' in window && nodes.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const year = (visible?.target as HTMLElement | undefined)?.dataset.timelineYear;
        if (year) {
          setActiveChip(year);
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0.05 },
    );

    nodes.forEach((node) => observer.observe(node));
  }

  syncToggleAllButton();
}

/* --------------------------------------------------------------------------
   12. Direct Email One-Tap Copy Button
   -------------------------------------------------------------------------- */
function initCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-text]').forEach((btn) => {
    let resetTimer = 0;

    btn.addEventListener('click', async () => {
      const text = btn.dataset.copyText;
      if (!text) return;

      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch {
        copied = false;
      }

      if (!copied) return;

      const labelEl = btn.querySelector<HTMLElement>('.contact-copy-btn__label');
      btn.classList.add('is-copied');
      if (labelEl && btn.dataset.labelCopied) {
        labelEl.textContent = btn.dataset.labelCopied;
      }

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        btn.classList.remove('is-copied');
        if (labelEl && btn.dataset.labelDefault) {
          labelEl.textContent = btn.dataset.labelDefault;
        }
      }, 2200);
    });
  });
}

/* --------------------------------------------------------------------------
   13. Contact Form (Accessible Validation + Guaranteed Web3Forms / Server API)
   -------------------------------------------------------------------------- */
function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  const nameInput = document.getElementById('contact-name') as HTMLInputElement;
  const emailInput = document.getElementById('contact-email') as HTMLInputElement;
  const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement;
  const nameWrap = document.getElementById('contact-name-wrap');
  const emailWrap = document.getElementById('contact-email-wrap');
  const nameError = document.getElementById('contact-name-error') as HTMLElement;
  const emailError = document.getElementById('contact-email-error') as HTMLElement;
  const messageError = document.getElementById('contact-message-error') as HTMLElement;
  const statusEl = document.getElementById('contact-status') as HTMLElement;
  const submitBtn = document.getElementById('contact-submit') as HTMLButtonElement;
  const submitLabel = submitBtn.querySelector<HTMLElement>('[data-submit-label]');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let isSubmitting = false;

  const setFieldError = (
    input: HTMLInputElement | HTMLTextAreaElement,
    wrap: HTMLElement | null,
    errorEl: HTMLElement,
    msg: string,
  ) => {
    const target = wrap ?? input;
    const errorId = input.dataset.error ?? errorEl.id;
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (errorId) input.setAttribute('aria-describedby', errorId);
      target.classList.add('is-invalid');
      errorEl.textContent = msg;
      errorEl.hidden = false;
    } else {
      input.setAttribute('aria-invalid', 'false');
      input.removeAttribute('aria-describedby');
      target.classList.remove('is-invalid');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  };

  const validateName = (): string => {
    const val = nameInput.value.trim();
    return !val || val.length > 100 ? (form.dataset.msgName ?? '') : '';
  };

  const validateEmail = (): string => {
    const val = emailInput.value.trim();
    if (!val) return form.dataset.msgEmailRequired ?? '';
    if (!emailRegex.test(val) || val.length > 254) {
      return form.dataset.msgEmailInvalid ?? '';
    }
    return '';
  };

  const validateMessage = (): string => {
    const val = messageInput.value.trim();
    return !val || val.length > 3000 ? (form.dataset.msgMessage ?? '') : '';
  };

  const setStatus = (type: '' | 'error' | 'success', msg: string) => {
    statusEl.classList.remove('is-error', 'is-success');
    if (type === 'error') statusEl.classList.add('is-error');
    if (type === 'success') statusEl.classList.add('is-success');
    statusEl.textContent = msg;
  };

  // Validate on blur after user interaction and clear errors live while fixing
  const fieldBindings: Array<{
    input: HTMLInputElement | HTMLTextAreaElement;
    wrap: HTMLElement | null;
    errorEl: HTMLElement;
    validate: () => string;
  }> = [
    { input: nameInput, wrap: nameWrap, errorEl: nameError, validate: validateName },
    { input: emailInput, wrap: emailWrap, errorEl: emailError, validate: validateEmail },
    { input: messageInput, wrap: null, errorEl: messageError, validate: validateMessage },
  ];

  fieldBindings.forEach(({ input, wrap, errorEl, validate }) => {
    let touched = false;
    input.addEventListener('blur', () => {
      if (input.value.trim().length > 0 || touched) {
        touched = true;
        setFieldError(input, wrap, errorEl, validate());
      }
    });
    input.addEventListener('input', () => {
      touched = true;
      if (input.getAttribute('aria-invalid') === 'true') {
        setFieldError(input, wrap, errorEl, validate());
      }
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nameErr = validateName();
    const emailErr = validateEmail();
    const msgErr = validateMessage();

    setFieldError(nameInput, nameWrap, nameError, nameErr);
    setFieldError(emailInput, emailWrap, emailError, emailErr);
    setFieldError(messageInput, null, messageError, msgErr);

    if (nameErr || emailErr || msgErr) {
      setStatus('error', form.dataset.msgValidation ?? '');
      if (nameErr) nameInput.focus();
      else if (emailErr) emailInput.focus();
      else messageInput.focus();
      return;
    }

    const botcheckInput = form.querySelector<HTMLInputElement>('input[name="botcheck"]');
    if (botcheckInput?.checked) {
      // Silently absorb honeypot bot submissions without hitting upstream API
      form.reset();
      setStatus('success', form.dataset.msgSuccess ?? '');
      return;
    }

    const mode = form.dataset.mode ?? 'web3forms';
    const endpoint = form.dataset.endpoint ?? 'https://api.web3forms.com/submit';
    const turnstileEnabled = form.dataset.turnstileEnabled === 'true';
    const tokenInput = form.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const turnstileToken = tokenInput?.value.trim() ?? '';

    if (mode === 'server' && turnstileEnabled && !turnstileToken) {
      setStatus('error', form.dataset.msgTurnstile ?? '');
      return;
    }

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const messageVal = messageInput.value.trim();

    isSubmitting = true;
    submitBtn.disabled = true;
    if (submitLabel) {
      submitLabel.textContent = form.dataset.labelSending ?? 'Sending...';
    }
    setStatus('', '');

    try {
      const payload =
        mode === 'server'
          ? {
              name: nameVal,
              email: emailVal,
              message: messageVal,
              botcheck: false,
              turnstileToken,
              locale: form.dataset.locale ?? 'zh-TW',
            }
          : {
              access_key: form.dataset.accessKey ?? '',
              subject: form.dataset.subject ?? '官網聯絡表單來信',
              from_name: form.dataset.fromName ?? '澤影映像官網',
              name: nameVal,
              email: emailVal,
              replyto: emailVal,
              message: messageVal,
              botcheck: false,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        code?: string;
      } | null;

      if (!res.ok || !data?.success) {
        if (data?.code === 'TURNSTILE_REQUIRED' || data?.code === 'TURNSTILE_FAILED') {
          setStatus('error', form.dataset.msgTurnstile ?? '');
        } else {
          setStatus('error', form.dataset.msgError ?? '');
        }
        return;
      }

      form.reset();
      fieldBindings.forEach(({ input, wrap, errorEl }) => {
        setFieldError(input, wrap, errorEl, '');
      });
      setStatus('success', form.dataset.msgSuccess ?? '');
    } catch {
      setStatus('error', form.dataset.msgError ?? '');
    } finally {
      const win = window as Window & { turnstile?: { reset: () => void } };
      win.turnstile?.reset();
      isSubmitting = false;
      submitBtn.disabled = false;
      if (submitLabel) {
        submitLabel.textContent = form.dataset.labelSubmit ?? 'Send';
      }
    }
  });
}

initNavbarAndDrawer();
initScrollChrome();
initScrollspy();
initHeroParallaxFallback();
initHeroEmbers();
initScrollReveal();
initSpotlightCards();
initActivityGalleries();
initLightbox();
initLazyVideos();
initYouTubeFacades();
initTabs();
initCarousels();
initTimeline();
initCopyButtons();
initContactForm();
