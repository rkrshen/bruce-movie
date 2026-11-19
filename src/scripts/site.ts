function initNavbar(): void {
  const header = document.getElementById('site-header');
  const toggleBtn = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!header) return;

  const COLOR_ON_SCROLL = 400;
  const syncHeaderState = () => {
    const isTransparent = window.scrollY < COLOR_ON_SCROLL;
    header.classList.toggle('navbar-transparent', isTransparent);
  };

  syncHeaderState();
  window.addEventListener('scroll', syncHeaderState, { passive: true });

  if (!toggleBtn || !menu) return;

  const setMenuOpen = (open: boolean) => {
    toggleBtn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenuOpen(false);
      toggleBtn.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (
      menu.classList.contains('is-open') &&
      event.target instanceof Node &&
      !header.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });
}

function initParallax(): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const target = document.querySelector<HTMLElement>('[data-parallax]');
  if (!target) return;

  let rafId = 0;
  const update = () => {
    rafId = 0;
    const offset = Math.min(window.scrollY, 360) / 3;
    target.style.transform = `translate3d(0, ${offset}px, 0)`;
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

        container.replaceChildren(video);
        video.play().catch(() => {
          // Playback remains operable via native controls if autoplay is blocked.
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

function initTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs-root]').forEach((root) => {
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    if (tabs.length === 0) return;

    const activate = (targetIndex: number, shouldFocus = false) => {
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
  });
}

function initCarousels(): void {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
    const stage = carousel.querySelector<HTMLElement>('[data-carousel-stage]');
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>('.work-carousel__slide'));
    const markers = Array.from(
      carousel.querySelectorAll<HTMLButtonElement>('[data-carousel-marker]'),
    );
    const prevBtn = carousel.querySelector<HTMLButtonElement>('[data-carousel-prev]');
    const nextBtn = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
    const statusEl = carousel.querySelector<HTMLElement>('[data-carousel-status]');

    const total = slides.length;
    if (!stage || total === 0) return;

    let activeIndex = 0;
    let pointerStartX: number | null = null;

    const render = (nextIndex: number, announce: boolean) => {
      activeIndex = ((nextIndex % total) + total) % total;
      const prevIndex = (activeIndex - 1 + total) % total;
      const nextIdx = (activeIndex + 1) % total;

      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === activeIndex);
        slide.classList.toggle('is-prev', idx === prevIndex);
        slide.classList.toggle('is-next', idx === nextIdx);
      });

      markers.forEach((marker, idx) => {
        if (idx === activeIndex) {
          marker.setAttribute('aria-current', 'true');
        } else {
          marker.removeAttribute('aria-current');
        }
      });

      if (announce && statusEl) {
        const slide = slides[activeIndex];
        const label = slide?.dataset.slideLabel ?? '';
        const caption = slide?.querySelector('figcaption')?.textContent?.trim() ?? '';
        statusEl.textContent = caption ? `${label}：${caption}` : label;
      }
    };

    prevBtn?.addEventListener('click', () => render(activeIndex - 1, true));
    nextBtn?.addEventListener('click', () => render(activeIndex + 1, true));

    markers.forEach((marker, idx) => {
      marker.addEventListener('click', () => render(idx, true));
    });

    slides.forEach((slide, idx) => {
      slide.addEventListener('click', () => {
        if (idx !== activeIndex) {
          render(idx, true);
        }
      });
    });

    stage.addEventListener(
      'touchstart',
      (event) => {
        pointerStartX = event.touches[0]?.clientX ?? null;
      },
      { passive: true },
    );

    stage.addEventListener(
      'touchend',
      (event) => {
        if (pointerStartX === null) return;
        const endX = event.changedTouches[0]?.clientX ?? pointerStartX;
        const delta = endX - pointerStartX;
        pointerStartX = null;
        if (Math.abs(delta) > 40) {
          render(delta < 0 ? activeIndex + 1 : activeIndex - 1, true);
        }
      },
      { passive: true },
    );

    render(0, false);
  });
}

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let isSubmitting = false;

  const setFieldError = (
    input: HTMLInputElement | HTMLTextAreaElement,
    wrap: HTMLElement | null,
    errorEl: HTMLElement,
    msg: string,
  ) => {
    const target = wrap ?? input;
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      target.classList.add('is-invalid');
      errorEl.textContent = msg;
      errorEl.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      target.classList.remove('is-invalid');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  };

  const setStatus = (type: '' | 'error' | 'success', msg: string) => {
    statusEl.classList.remove('is-error', 'is-success');
    if (type === 'error') statusEl.classList.add('is-error');
    if (type === 'success') statusEl.classList.add('is-success');
    statusEl.textContent = msg;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const messageVal = messageInput.value.trim();

    const nameErr =
      !nameVal || nameVal.length > 100 ? (form.dataset.msgName ?? '') : '';
    const emailErr = !emailVal
      ? (form.dataset.msgEmailRequired ?? '')
      : !emailRegex.test(emailVal) || emailVal.length > 254
        ? (form.dataset.msgEmailInvalid ?? '')
        : '';
    const msgErr =
      !messageVal || messageVal.length > 3000 ? (form.dataset.msgMessage ?? '') : '';

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

    const turnstileEnabled = form.dataset.turnstileEnabled === 'true';
    const tokenInput = form.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const turnstileToken = tokenInput?.value.trim() ?? '';

    if (turnstileEnabled && !turnstileToken) {
      setStatus('error', form.dataset.msgTurnstile ?? '');
      return;
    }

    const botcheckInput = form.querySelector<HTMLInputElement>('input[name="botcheck"]');

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = form.dataset.labelSending ?? 'Sending...';
    setStatus('', '');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          message: messageVal,
          botcheck: Boolean(botcheckInput?.checked),
          turnstileToken,
          locale: form.dataset.locale ?? 'zh-TW',
        }),
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
      setStatus('success', form.dataset.msgSuccess ?? '');
    } catch {
      setStatus('error', form.dataset.msgError ?? '');
    } finally {
      const win = window as Window & { turnstile?: { reset: () => void } };
      win.turnstile?.reset();
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = form.dataset.labelSubmit ?? 'Send';
    }
  });
}

initNavbar();
initParallax();
initLazyVideos();
initYouTubeFacades();
initTabs();
initCarousels();
initContactForm();
