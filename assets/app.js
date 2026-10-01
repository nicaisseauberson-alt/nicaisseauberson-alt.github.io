/**
 * Outlook Studio — Application Engine & SPA Router (2026)
 * Powered by Auberson
 * Real-time rendering, dynamic neon/backgrounds, visitor telemetry & streaming UI
 */

// Correction bug Safari : empêche le scroll automatique et le focus inopiné dans la barre de recherche au rafraîchissement
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function preventSafariSearchAutofocus() {
  try {
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
      document.activeElement.blur();
    }
    const hxQuery = document.getElementById("hxQuery");
    if (hxQuery) {
      hxQuery.blur();
    }
    const rawHash = window.location.hash;
    if (!rawHash || rawHash === "#/" || rawHash === "#" || rawHash === "#accueil") {
      window.scrollTo(0, 0);
    }
  } catch (err) {}
}

window.addEventListener("pageshow", preventSafariSearchAutofocus);
window.addEventListener("load", preventSafariSearchAutofocus);

document.addEventListener("DOMContentLoaded", () => {
  preventSafariSearchAutofocus();
  setTimeout(preventSafariSearchAutofocus, 60);
  setTimeout(preventSafariSearchAutofocus, 180);

  // Multi-device Cache Busting & Version Verification
  const APP_VERSION = "2026.95";
  try {
    const cachedVersion = localStorage.getItem("outlook_studio_build_ver");
    if (cachedVersion && cachedVersion !== APP_VERSION) {
      localStorage.setItem("outlook_studio_build_ver", APP_VERSION);
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
      }
    } else {
      localStorage.setItem("outlook_studio_build_ver", APP_VERSION);
    }
  } catch (e) {}

  initVisitorTelemetry();
  initRouter();
  initFloatingNavbar();
  initOsNavbar();
  initHeroSearch();
  initGlobalCanvas();
  initScrollReveal();
  renderApp();
  setupEventListeners();
  setupNavbarScroll();

  // Initial cloud content sync across devices (mobile or laptop first visit)
  StorageService.syncCloudContent().then(updated => {
    if (updated) renderApp();
  });

  // Re-sync on tab focus or screen unlock
  window.addEventListener("focus", () => {
    StorageService.syncCloudContent().then(updated => {
      if (updated) renderApp();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      StorageService.syncCloudContent().then(updated => {
        if (updated) renderApp();
      });
    }
  });

  // Re-sync when reconnecting to network
  window.addEventListener("online", () => {
    StorageService.syncCloudContent().then(updated => {
      if (updated) renderApp();
    });
  });

  // Background auto-refresh every 20s to keep all devices live-synced
  setInterval(() => {
    StorageService.syncCloudContent().then(updated => {
      if (updated) renderApp();
    });
  }, 20000);

  // Listen for real-time DB changes
  window.addEventListener("nicaisse_db_updated", () => {
    renderApp();
    if (window.initScrollReveal) {
      setTimeout(() => window.initScrollReveal(), 80);
    }
  });
});

/* -------------------------------------------------------------
 * 1. SPA ROUTER & VIEW SWITCHER
 * ----------------------------------------------------------- */
const VALID_ROUTES = {
  "": "home",
  "#": "home",
  "#/": "home",
  "#/home": "home",
  "#/cinema": "cinema",
  "#/actualites": "news",
  "#/news": "news",
  "#/projets": "projects",
  "#/projects": "projects",
  "#/astuces": "tips",
  "#/astuces-tech": "tips",
  "#/tips": "tips",
  "#/code": "code",
  "#/gaming": "gaming",
  "#/documents": "documents",
  "#/portfolio": "portfolio",
  "#/contact": "contact"
};

function initRouter() {
  const handleRouteChange = () => {
    let rawHash = window.location.hash.trim();
    let queryParam = "";
    if (rawHash.includes("?")) {
      const parts = rawHash.split("?");
      rawHash = parts[0];
      try {
        const params = new URLSearchParams(parts[1]);
        queryParam = params.get("q") || "";
      } catch (e) {}
    }
    let hash = rawHash.toLowerCase().trim();
    if (hash === "#/admin") {
      if (window.adminManager) adminManager.openLoginOrDashboard();
      window.location.hash = "#/";
      return;
    }

    const routeKey = VALID_ROUTES[hash] || "home";
    switchView(routeKey);

    if (routeKey === "cinema" && queryParam) {
      setTimeout(() => {
        const cinemaInput = document.getElementById("cinema-search");
        if (cinemaInput) {
          cinemaInput.value = queryParam;
          cinemaInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, 100);
    }
  };

  window.addEventListener("hashchange", handleRouteChange);
  // Initial route on page load
  handleRouteChange();
}

function switchView(routeKey) {
  // 1. Hide all SPA views
  const views = document.querySelectorAll(".spa-view");
  views.forEach(v => {
    v.classList.remove("active");
  });

  // 2. Show target view & update body route attribute
  document.body.setAttribute("data-current-route", routeKey);
  const footerGrid = document.querySelector(".footer-grid");
  if (footerGrid) {
    footerGrid.style.display = (routeKey === "home") ? "grid" : "none";
  }

  const targetView = document.getElementById(`view-${routeKey}`);
  if (targetView) {
    targetView.classList.add("active");
  } else {
    const homeView = document.getElementById("view-home");
    if (homeView) homeView.classList.add("active");
  }

  // 3. Update active states on nav links
  const allNavLinks = document.querySelectorAll(".nav-route-link, .mobile-route-link, .drawer-nav-link, .bottom-nav-item, .nav-more-item");
  allNavLinks.forEach(link => {
    if (link.getAttribute("data-route") === routeKey) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  const navMoreBtn = document.getElementById("navMoreBtn");
  const moreRoutes = ["projects", "tips", "code", "gaming", "portfolio", "contact"];
  if (navMoreBtn) {
    if (moreRoutes.includes(routeKey)) {
      navMoreBtn.classList.add("has-active-child");
    } else {
      navMoreBtn.classList.remove("has-active-child");
    }
  }

  if (window.updateFloatingGlowPill) {
    window.updateFloatingGlowPill(true);
  }

  if (window.syncOsNavbar) {
    window.syncOsNavbar();
  }

  // 4. Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 5. Close mobile menus and unlock scrolling
  if (window.closeMobileMenu) {
    window.closeMobileMenu();
  }
  if (window.closeMobileDrawer) {
    window.closeMobileDrawer();
  }
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";

  // 6. Refresh scroll reveal for active view
  if (window.initScrollReveal) {
    setTimeout(() => {
      window.initScrollReveal();
    }, 60);
  }


}

/* -------------------------------------------------------------
 * FLOATING GLASSMORPHISM NAVBAR & GLOW PILL ENGINE
 * ----------------------------------------------------------- */
function initFloatingNavbar() {
  const navLinks = document.getElementById("navLinks");
  const glowPill = document.getElementById("glowPill");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const navMoreBtn = document.getElementById("navMoreBtn");
  const navMoreMenu = document.getElementById("navMoreMenu");

  function moveGlowTo(link, animate) {
    if (!link || !glowPill || !navLinks) return;
    if (link.classList.contains("nav-icon-only")) {
      glowPill.style.display = "none";
      return;
    }
    glowPill.style.display = "block";
    const linkRect = link.getBoundingClientRect();
    const parentRect = navLinks.getBoundingClientRect();
    const left = linkRect.left - parentRect.left + navLinks.scrollLeft;
    glowPill.style.left = left + "px";
    glowPill.style.width = linkRect.width + "px";

    // Auto-scroll the navlinks container smoothly so the active link is centered
    link.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    if (animate) {
      glowPill.classList.remove("pulse");
      void glowPill.offsetWidth; // restart animation
      glowPill.classList.add("pulse");
    }
  }

  window.updateFloatingGlowPill = function(animate = true) {
    if (!navLinks || !glowPill) return;
    const activeLink = navLinks.querySelector(".nav-route-link.active");
    if (activeLink) {
      if (activeLink.classList.contains("nav-icon-only")) {
        glowPill.style.display = "none";
      } else {
        moveGlowTo(activeLink, animate);
      }
    } else if (navMoreBtn && navMoreBtn.classList.contains("has-active-child")) {
      moveGlowTo(navMoreBtn, animate);
    } else {
      glowPill.style.display = "none";
    }
  };

  // Wire up desktop navigation links
  if (navLinks) {
    const links = navLinks.querySelectorAll(".nav-route-link");
    links.forEach(link => {
      link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
        if (navMoreBtn) navMoreBtn.classList.remove("has-active-child");
        if (link.classList.contains("nav-icon-only")) {
          if (glowPill) glowPill.style.display = "none";
        } else {
          moveGlowTo(link, true);
        }
      });
    });
  }

  // Navbar "Plus" Dropdown Logic
  if (navMoreBtn && navMoreMenu) {
    navMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = navMoreMenu.classList.toggle("open");
      navMoreBtn.classList.toggle("open", isOpen);
      navMoreBtn.setAttribute("aria-expanded", String(isOpen));
    });

    navMoreMenu.querySelectorAll("a").forEach(item => {
      item.addEventListener("click", () => {
        navMoreMenu.classList.remove("open");
        navMoreBtn.classList.remove("open");
        navMoreBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Mobile Dropdown Menu Controls
  const mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");

  function closeMobileMenu() {
    if (mobileMenu) mobileMenu.classList.remove("open");
    if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove("open");
    if (menuToggle) {
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  }
  window.closeMobileMenu = closeMobileMenu;

  function toggleMobileMenu() {
    if (!mobileMenu || !menuToggle) return;
    const isOpen = mobileMenu.classList.toggle("open");
    if (mobileMenuBackdrop) mobileMenuBackdrop.classList.toggle("open", isOpen);
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener("click", () => {
      closeMobileMenu();
    });
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        closeMobileMenu();
      });
    });
  }

  document.addEventListener("click", (e) => {
    if (mobileMenu && mobileMenu.classList.contains("open") &&
        !mobileMenu.contains(e.target) &&
        menuToggle && !menuToggle.contains(e.target)) {
      closeMobileMenu();
    }
    if (navMoreMenu && navMoreMenu.classList.contains("open") &&
        !navMoreMenu.contains(e.target) &&
        navMoreBtn && !navMoreBtn.contains(e.target)) {
      navMoreMenu.classList.remove("open");
      navMoreBtn.classList.remove("open");
      navMoreBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileMenu();
      if (navMoreMenu) {
        navMoreMenu.classList.remove("open");
        if (navMoreBtn) {
          navMoreBtn.classList.remove("open");
          navMoreBtn.setAttribute("aria-expanded", "false");
        }
      }
    }
  });

  // Initial pill placement once layout settles
  setTimeout(() => {
    window.updateFloatingGlowPill(false);
  }, 120);

  window.addEventListener("resize", () => {
    window.updateFloatingGlowPill(false);
  });
}

/* -------------------------------------------------------------
 * 1.ter DESKTOP CAPSULE NAVBAR (Exact User Specification)
 * ----------------------------------------------------------- */
function initOsNavbar() {
  const btn = document.getElementById('osMenuBtn');
  const menu = document.getElementById('osDropdown');
  const list = document.getElementById('osLinks');
  const indicator = document.getElementById('osIndicator');
  if (!btn || !menu || !list || !indicator) return;

  const allLinks = document.querySelectorAll('.os-links a, .os-dropdown a');
  const brand = document.querySelector('.os-brand');

  /* ----- Menu déroulant ----- */
  function setMenu(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(btn.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setMenu(false);
      btn.focus();
    }
  });

  /* ----- Pastille : se place derrière le lien actif de la barre ----- */
  function moveIndicator(animate) {
    const active = list.querySelector('a.active');
    if (!active) {
      indicator.classList.remove('ready');
      return;
    }
    const l = list.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.width === 0) return;
    if (!animate) indicator.classList.add('no-anim');
    indicator.style.width = a.width + 'px';
    indicator.style.transform = 'translateX(' + (a.left - l.left) + 'px)';
    indicator.classList.add('ready');
    if (!animate) {
      void indicator.offsetWidth;
      indicator.classList.remove('no-anim');
    }
  }

  /* ----- Lien actif ----- */
  function setActive(target) {
    allLinks.forEach(a => {
      const on = (a === target);
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    moveIndicator(true);
  }

  allLinks.forEach(a => {
    a.addEventListener('click', () => {
      setActive(a);
      setMenu(false);
    });
  });

  if (brand) {
    brand.addEventListener('click', () => {
      allLinks.forEach(a => {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      });
      moveIndicator(false);
      setMenu(false);
    });
  }

  // Synchronisation avec l'adresse (#/cinema, bouton Précédent, lien direct…)
  function syncFromHash() {
    let current = (location.hash || '#/').toLowerCase().trim();
    if (current === '' || current === '#') current = '#/';

    let match = Array.from(allLinks).find(a => a.getAttribute('href').toLowerCase() === current);

    if (!match) {
      if (current === '#/astuces' || current === '#/tips') {
        match = Array.from(allLinks).find(a => a.getAttribute('href') === '#/astuces-tech' || a.getAttribute('href') === '#/astuces');
      } else if (current === '#/projects') {
        match = Array.from(allLinks).find(a => a.getAttribute('href') === '#/projets');
      } else if (current === '#/news') {
        match = Array.from(allLinks).find(a => a.getAttribute('href') === '#/actualites');
      }
    }

    if (match) {
      setActive(match);
    } else {
      allLinks.forEach(a => {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      });
      moveIndicator(false);
    }
  }

  window.addEventListener('hashchange', syncFromHash);
  window.syncOsNavbar = syncFromHash;

  // Placement initial (sans animation), puis après chargement de la police, et au redimensionnement
  moveIndicator(false);
  window.addEventListener('load', () => moveIndicator(false));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => moveIndicator(false));
  }
  window.addEventListener('resize', () => moveIndicator(false));
  syncFromHash();
}

/* -------------------------------------------------------------
 * 1.bis JAVASCRIPT SCROLL REVEAL ENGINE (SMOOTH UPWARD TEXT RISE)
 * ----------------------------------------------------------- */
let scrollRevealObserver = null;

function initScrollReveal() {
  const elements = document.querySelectorAll(".scroll-reveal:not(.revealed), .category-header-clean:not(.revealed)");
  if (!elements || elements.length === 0) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("revealed"));
    return;
  }

  if (!scrollRevealObserver) {
    scrollRevealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.dataset.delay) {
            el.style.transitionDelay = el.dataset.delay;
          }
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      });
    }, {
      root: null,
      rootMargin: "0px 0px -35px 0px",
      threshold: 0.08
    });
  }

  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (el.dataset.delay) {
        el.style.transitionDelay = el.dataset.delay;
      }
      setTimeout(() => {
        el.classList.add("revealed");
      }, 40);
    } else {
      scrollRevealObserver.observe(el);
    }
  });
}
window.initScrollReveal = initScrollReveal;

/* -------------------------------------------------------------
 * 1.ter HERO QUICK SEARCH HELPER (Compatible avec #hxSearch)
 * ----------------------------------------------------------- */
function initHeroSearch() {
  const hxSearch = document.getElementById("hxSearch");
  const hxQuery = document.getElementById("hxQuery");
  if (hxSearch && hxQuery) {
    if (document.activeElement === hxQuery) {
      hxQuery.blur();
    }
    hxSearch.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = hxQuery.value.trim();
      location.hash = q ? "#/cinema?q=" + encodeURIComponent(q) : "#/cinema";
      if (q) {
        setTimeout(() => {
          const cinemaInput = document.getElementById("cinema-search");
          if (cinemaInput) {
            cinemaInput.value = q;
            cinemaInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 120);
      }
    });
  }

  const input = document.getElementById("hero-quick-search");
  const submitBtn = document.querySelector(".hero-search-submit");
  if (input) {
    function doSearch() {
      const q = input.value.trim();
      location.hash = q ? "#/cinema?q=" + encodeURIComponent(q) : "#/cinema";
      if (q) {
        setTimeout(() => {
          const cinemaInput = document.getElementById("cinema-search");
          if (cinemaInput) {
            cinemaInput.value = q;
            cinemaInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 120);
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSearch();
      }
    });

    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        doSearch();
      });
    }
  }
}
window.initHeroSearch = initHeroSearch;

/* =====================================================================
 * ARRIÈRE-PLAN GLOBAL INTERACTIF (Ultra-Fluide, Toutes les Pages)
 * Particules stellaires légères et alvéoles technologiques (HUD)
 * ===================================================================== */
function initGlobalCanvas() {
  const c = document.getElementById("globalCanvas") || document.getElementById("fx") || document.getElementById("hxCanvas");
  if (!c) return;
  const x = c.getContext("2d");
  if (!x) return;

  const R = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let P = [], W = 0, H = 0, D = 1;
  const L = 120;

  function size() {
    D = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * D;
    c.height = H * D;
    x.setTransform(D, 0, 0, D, 0, 0);

    const n = Math.min(70, Math.round((W * H) / 14000));
    while (P.length < n) {
      P.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.7,
        w: Math.random() < 0.2
      });
    }
    P.length = n;
  }

  function draw() {
    x.clearRect(0, 0, W, H);
    for (let i = 0; i < P.length; i++) {
      const a = P[i];
      if (!R) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      for (let j = i + 1; j < P.length; j++) {
        const b = P[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = dx * dx + dy * dy;
        if (d < L * L) {
          x.strokeStyle = "rgba(106,165,255," + (0.3 * (1 - Math.sqrt(d) / L)) + ")";
          x.lineWidth = 0.8;
          x.beginPath();
          x.moveTo(a.x, a.y);
          x.lineTo(b.x, b.y);
          x.stroke();
        }
      }
      x.fillStyle = a.w ? "rgba(255,255,255,.85)" : "rgba(120,170,255,.8)";
      x.beginPath();
      x.arc(a.x, a.y, a.r, 0, 6.283);
      x.fill();
    }
    if (!R) {
      window._globalCanvasRaf = requestAnimationFrame(draw);
    }
  }

  if (window._globalCanvasRaf) {
    cancelAnimationFrame(window._globalCanvasRaf);
  }

  size();
  draw();

  if (!window._hasGlobalCanvasEvents) {
    window.addEventListener("resize", () => {
      size();
      if (R) draw();
    });
    window.addEventListener("orientationchange", () => {
      setTimeout(() => { size(); if (R) draw(); }, 200);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(window._globalCanvasRaf);
      } else if (!R) {
        window._globalCanvasRaf = requestAnimationFrame(draw);
      }
    });
    window._hasGlobalCanvasEvents = true;
  }
}
window.initGlobalCanvas = initGlobalCanvas;
window.initHxCanvas = initGlobalCanvas;

/* -------------------------------------------------------------
 * 2. VISITOR TELEMETRY & PRESENCE ENGINE
 * ----------------------------------------------------------- */
async function initVisitorTelemetry() {
  const telemetry = await detectDeviceAndBrowser();

  let sessionId = sessionStorage.getItem("outlook_studio_visitor_session_id");
  if (!sessionId) {
    sessionId = "os_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem("outlook_studio_visitor_session_id", sessionId);
  }

  const now = new Date();
  const connectedAtTime = now.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit" 
  });

  const sessionInfo = {
    sessionId: sessionId,
    device: telemetry.device,
    deviceType: telemetry.deviceType,
    os: telemetry.os,
    browser: telemetry.browser,
    screen: telemetry.screen,
    location: "Détection réseau...",
    connectedAt: connectedAtTime
  };

  StorageService.sendPresencePing(sessionInfo, "ping");

  setInterval(() => {
    StorageService.sendPresencePing(sessionInfo, "ping");
  }, 20000);

  const handleLeave = () => {
    StorageService.sendPresencePing(sessionInfo, "leave");
  };
  window.addEventListener("pagehide", handleLeave);
  window.addEventListener("beforeunload", handleLeave);
}

async function detectDeviceAndBrowser() {
  const ua = navigator.userAgent;
  let deviceType = "Ordinateur";
  let osName = "Inconnu";
  let browserName = "Navigateur";

  if (/iPhone/i.test(ua)) {
    deviceType = "iPhone";
    osName = "iOS";
  } else if (/iPad/i.test(ua)) {
    deviceType = "iPad";
    osName = "iPadOS";
  } else if (/Android/i.test(ua)) {
    deviceType = "Smartphone Android";
    osName = "Android";
  } else if (/Windows/i.test(ua)) {
    deviceType = "Ordinateur PC";
    osName = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = "Ordinateur Mac";
    osName = "macOS";
  } else if (/Linux/i.test(ua)) {
    deviceType = "Ordinateur Linux";
    osName = "Linux";
  }

  if (/Brave/i.test(ua) || (navigator.brave && await navigator.brave.isBrave())) {
    browserName = "Brave";
  } else if (/Edg/i.test(ua)) {
    browserName = "Edge";
  } else if (/Chrome/i.test(ua)) {
    browserName = "Chrome";
  } else if (/Safari/i.test(ua)) {
    browserName = "Safari";
  } else if (/Firefox/i.test(ua)) {
    browserName = "Firefox";
  }

  const w = window.screen.width;
  const h = window.screen.height;
  const dpr = window.devicePixelRatio ? window.devicePixelRatio.toFixed(1) : "1.0";

  return {
    device: `${deviceType} (${browserName})`,
    deviceType: deviceType,
    os: osName,
    browser: browserName,
    screen: `${w}x${h} @${dpr}x`
  };
}

/* -------------------------------------------------------------
 * 3. RENDER ENTIRE APP & APPLY CUSTOMIZATIONS
 * ----------------------------------------------------------- */
function renderApp() {
  const data = StorageService.get();

  // Apply Theme & Neon
  applyTheme(data.theme);

  // Apply Category Backgrounds
  applyBackgrounds(data.backgrounds);

  // Taglines & text
  const taglineEl = document.getElementById("platform-tagline");
  if (taglineEl && data.platform?.shortDescription) {
    taglineEl.textContent = data.platform.shortDescription;
  }

  const bioEl = document.getElementById("portfolio-bio");
  if (bioEl && data.profile?.bio) {
    bioEl.textContent = data.profile.bio;
  }

  // Synchronize Phone, WhatsApp, Email, Platform & Creator info dynamically
  renderPlatformAndContact(data.platform, data.profile);

  // Render individual sections
  renderCinema(data.cinema);
  renderNews(data.news);
  renderProjects(data.projects);
  renderTechTips(data.techTips);
  renderCode(data.code, data.techTips);
  renderGaming(data.gaming);
  renderDocuments(data.documents, data.projects);
  renderPortfolio(data.portfolio, data.profile);

  // Refresh scroll reveal animations
  if (window.initScrollReveal) {
    setTimeout(() => window.initScrollReveal(), 60);
  }
}

/* -------------------------------------------------------------
 * 3.bis REAL-TIME PHONE, WHATSAPP & IDENTITY SYNC
 * ----------------------------------------------------------- */
function renderPlatformAndContact(platform, profile) {
  if (!platform) platform = {};
  let phone = (platform.phone !== undefined && platform.phone !== null && platform.phone !== "")
    ? platform.phone
    : (profile && profile.phone ? profile.phone : "+509 31 84 93 85");
  if (phone.includes("55 55 85 50") || phone.includes("55 55 80 50")) {
    phone = (profile && profile.phone && !profile.phone.includes("55 55")) ? profile.phone : "+509 31 84 93 85";
  }
  const whatsapp = platform.whatsapp || (profile && profile.whatsapp) || "+509 31 84 93 85";
  const email = platform.email || (profile && profile.email) || "contact@nicaisseauberson.ch";
  const creator = platform.creator || (profile && profile.name) || "Auberson";
  const platformName = platform.name || "Outlook Studio";

  // Clean numbers for tel: and wa.me links
  const phoneClean = phone.replace(/[^0-9+]/g, '');
  const waClean = whatsapp.replace(/[^0-9]/g, '');

  // 1. Hero Section
  const heroPhoneLink = document.getElementById("hero-phone-link");
  if (heroPhoneLink) {
    heroPhoneLink.href = phoneClean ? `tel:${phoneClean}` : `#/contact`;
  }
  const heroPhoneText = document.getElementById("hero-phone-text");
  if (heroPhoneText) {
    heroPhoneText.textContent = phone || "Contact direct";
  }

  const heroWaLink = document.getElementById("hero-whatsapp-link");
  if (heroWaLink) {
    heroWaLink.href = `https://wa.me/${waClean}`;
  }

  const heroEmailLink = document.getElementById("hero-email-link");
  if (heroEmailLink) {
    heroEmailLink.href = `mailto:${email}`;
  }

  // 2. Contact View Card Details & Action buttons
  const contactPhoneDetail = document.getElementById("contact-phone-detail");
  if (contactPhoneDetail) {
    contactPhoneDetail.textContent = phone;
  }
  const contactPhoneBtn = document.getElementById("contact-phone-btn");
  if (contactPhoneBtn) {
    contactPhoneBtn.href = `tel:${phoneClean}`;
  }

  const contactWaDetail = document.getElementById("contact-whatsapp-detail");
  if (contactWaDetail) {
    contactWaDetail.textContent = whatsapp;
  }
  const contactWaBtn = document.getElementById("contact-whatsapp-btn");
  if (contactWaBtn) {
    contactWaBtn.href = `https://wa.me/${waClean}`;
  }

  const contactEmailDetail = document.getElementById("contact-email-detail");
  if (contactEmailDetail) {
    contactEmailDetail.textContent = email;
  }
  const contactEmailBtn = document.getElementById("contact-email-btn");
  if (contactEmailBtn) {
    contactEmailBtn.href = `mailto:${email}`;
  }

  // 3. Footer Links & Text
  const footerPhoneText = document.getElementById("footer-phone-text");
  if (footerPhoneText) {
    footerPhoneText.textContent = phone;
  }
  const footerPhoneLink = document.getElementById("footer-phone-link");
  if (footerPhoneLink) {
    footerPhoneLink.href = `tel:${phoneClean}`;
  }

  const footerWaText = document.getElementById("footer-whatsapp-text");
  if (footerWaText) {
    footerWaText.textContent = whatsapp;
  }
  const footerWaLink = document.getElementById("footer-whatsapp-link");
  if (footerWaLink) {
    footerWaLink.href = `https://wa.me/${waClean}`;
  }

  const footerEmailText = document.getElementById("footer-email-text");
  if (footerEmailText) {
    footerEmailText.textContent = email;
  }
  const footerEmailLink = document.getElementById("footer-email-link");
  if (footerEmailLink) {
    footerEmailLink.href = `mailto:${email}`;
  }

  // 4. Platform Brand & Creator mentions
  const brandTitles = document.querySelectorAll(".brand-title");
  brandTitles.forEach(el => { el.textContent = platformName; });

  const homeNeonPill = document.getElementById("home-neon-pill");
  if (homeNeonPill) {
    homeNeonPill.textContent = `⚡ Powered by ${creator}`;
  }
  const footerCreatorPill = document.querySelector(".footer-creator-pill");
  if (footerCreatorPill) {
    footerCreatorPill.textContent = `Powered by ${creator}`;
  }
}

/* -------------------------------------------------------------
 * 4. THEME & NEON MANAGER
 * ----------------------------------------------------------- */
function applyTheme(theme) {
  if (!theme) return;
  const color = theme.primary || theme.neonColor || "#00d2ff";
  const glow = theme.glow || `0 0 20px ${color}aa, 0 0 45px ${color}55`;
  const border = theme.border || `${color}77`;
  const root = document.documentElement;

  root.style.setProperty("--neon-primary", color);
  root.style.setProperty("--neon-glow", glow);
  root.style.setProperty("--neon-border", border);

  const titleNeon = document.getElementById("home-neon-title");
  if (titleNeon) {
    titleNeon.style.color = color;
    titleNeon.style.textShadow = `0 0 20px ${color}bb, 0 0 45px ${color}66`;
  }

  const badgeNeon = document.getElementById("home-neon-badge");
  if (badgeNeon) {
    badgeNeon.style.borderColor = border;
    badgeNeon.style.boxShadow = `0 0 16px ${color}55`;
  }
}

/* -------------------------------------------------------------
 * 5. BACKGROUNDS MANAGER PER CATEGORY
 * ----------------------------------------------------------- */
function applyBackgrounds(bgs) {
  if (!bgs) return;
  const setBg = (id, url) => {
    const el = document.getElementById(id);
    if (el && url) {
      el.style.backgroundImage = `url('${url}')`;
    }
  };

  setBg("hero-banner-cinema", bgs.cinema);
  setBg("hero-banner-news", bgs.actualites || bgs.news);
  setBg("hero-banner-projects", bgs.projets || bgs.projects);
  setBg("hero-banner-tips", bgs.astuces || bgs.tips);
  setBg("hero-banner-code", bgs.code);
  setBg("hero-banner-gaming", bgs.gaming);
  setBg("hero-banner-documents", bgs.documents);
  setBg("hero-banner-portfolio", bgs.portfolio);
  setBg("hero-banner-contact", bgs.contact);
}

/* -------------------------------------------------------------
 * 6. RENDER CINEMA (STREAMING STYLE)
 * ----------------------------------------------------------- */
function renderCinema(films, searchTerm = "") {
  const container = document.getElementById("cinema-grid");
  if (!container) return;

  const validFilms = films || [];
  const filtered = validFilms.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const tagMatch = Array.isArray(f.tags) && f.tags.some(t => String(t).toLowerCase().includes(term));
    return (f.title || "").toLowerCase().includes(term) ||
           (f.director || "").toLowerCase().includes(term) ||
           (f.genre || "").toLowerCase().includes(term) ||
           (f.category || "").toLowerCase().includes(term) ||
           (f.review || "").toLowerCase().includes(term) ||
           (f.summary || "").toLowerCase().includes(term) ||
           (f.year || "").toString().includes(term) ||
           tagMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">🎬</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Catalogue Cinéma</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">
          ${searchTerm ? `Aucun film ne correspond à « ${escapeHTML(searchTerm)} ».` : "Aucun film disponible dans le catalogue pour le moment."}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((film, idx) => {
    const ratioStyle = film.aspectRatio === 'landscape' ? 'aspect-ratio: 16/9;' : film.aspectRatio === 'square' ? 'aspect-ratio: 1/1;' : 'aspect-ratio: 2/3;';
    const poster = film.poster || film.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800';
    const genre = film.genre || film.category || 'Cinéma';
    const review = film.review || film.summary || 'Recommandation officielle Outlook Studio.';
    const director = film.director || 'Auberson';
    const isAboveFold = idx < 5;
    return `
    <div class="film-card">
      <div class="streaming-poster-wrap" style="${ratioStyle}">
        <img src="${escapeHTML(poster)}" alt="${escapeHTML(film.title)}" class="streaming-poster" ${isAboveFold ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'">
        <div class="film-rating">★ ${escapeHTML(film.rating || '4.5')}</div>
      </div>
      <div class="film-body">
        <div class="film-meta">
          <span>${escapeHTML(film.year || '2026')}</span> • <span>${escapeHTML(genre)}</span> • <span>De ${escapeHTML(director)}</span>
        </div>
        <h3 class="film-title">${escapeHTML(film.title)}</h3>
        <p class="film-review">« ${escapeHTML(review)} »</p>
        <div class="film-actions">
          ${film.link ? `<a href="${escapeHTML(film.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Fiche / Source</a>` : ''}
          ${film.trailerUrl ? `<button class="btn btn-primary btn-sm btn-play-trailer" data-trailer-title="${escapeHTML(film.title)}" data-trailer-url="${escapeHTML(film.trailerUrl)}" onclick="window.playFilmTrailer(this)">Bande-Annonce ▶ (VF)</button>` : ''}
        </div>
      </div>
    </div>
  `;
  }).join("");
}

/* -------------------------------------------------------------
 * 7. RENDER NEWS (ACTUALITÉS)
 * ----------------------------------------------------------- */
function renderNews(news) {
  const container = document.getElementById("news-grid");
  if (!container) return;

  const validNews = news || [];
  if (validNews.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">📰</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Actualités Outlook Studio</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucune actualité publiée pour le moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = validNews.map(item => {
    const imgSrc = item.image || item.coverImage;
    const tagList = Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',') : []);
    return `
    <div class="news-card">
      ${imgSrc ? `<img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(item.title)}" class="news-card-img" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ''}
      <div class="news-card-content">
        <div class="news-meta">
          <span class="badge-tag">${escapeHTML(item.category || 'Général')}</span>
          <span>${escapeHTML(item.date || '')}</span>
        </div>
        <h3 class="news-title">${escapeHTML(item.title)}</h3>
        <p class="news-excerpt">${escapeHTML(item.summary || item.content || '')}</p>
        ${tagList.length > 0 ? `
          <div class="project-tags" style="margin-top: auto;">
            ${tagList.map(t => `<span class="tag">${escapeHTML(t.trim())}</span>`).join('')}
          </div>
        ` : ''}
        ${item.link ? `
          <div style="margin-top: 14px;">
            <a href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="font-size: 0.8rem; padding: 4px 12px;">Consulter la source ↗</a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  }).join("");
}

/* -------------------------------------------------------------
 * 8. RENDER PROJECTS & DOWNLOADS
 * ----------------------------------------------------------- */
function renderProjects(projects) {
  const container = document.getElementById("projects-grid");
  if (!container) return;

  const validProjects = projects || [];
  if (validProjects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">📁</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Projets & Documents</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucun projet affiché pour le moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = validProjects.map(p => {
    const bannerRatioStyle = p.aspectRatio === 'portrait' ? 'aspect-ratio: 2/3;' : p.aspectRatio === 'square' ? 'aspect-ratio: 1/1;' : '';
    return `
    <div class="project-card ${p.bgImage ? 'has-bg' : ''}">
      ${p.bgImage ? `
        <div class="project-card-banner" style="${bannerRatioStyle}">
          <img src="${escapeHTML(p.bgImage)}" alt="${escapeHTML(p.title)}" loading="lazy" decoding="async" class="project-card-bg-img" onerror="this.style.display='none'">
          <div class="project-card-banner-overlay"></div>
        </div>
      ` : ''}
      <div class="project-card-body">
        <span class="badge-tag">${escapeHTML(p.category || 'Projet')}</span>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin: 10px 0 8px;">${escapeHTML(p.title)}</h3>
        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-bottom: 12px;">${escapeHTML(p.description || '')}</p>
        <div class="project-tags">
          ${(p.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}
        </div>

        ${p.fileName ? `
          <div class="download-box">
            <div class="download-info">
              <span class="download-name">📄 ${escapeHTML(p.fileName)}</span>
              <span class="download-size">${escapeHTML(p.fileSize || 'Téléchargement disponible')}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="downloadProjectFile('${escapeHTML(p.id)}')">Télécharger</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  }).join("");
}

/* -------------------------------------------------------------
 * 9. RENDER TECH TIPS
 * ----------------------------------------------------------- */
function renderTechTips(tips, searchTerm = "") {
  const container = document.getElementById("tips-grid");
  if (!container) return;

  const validTips = tips || [];
  if (validTips.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">💡</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Astuces Tech</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucune astuce publiée pour le moment.</p>
      </div>
    `;
    return;
  }

  const filtered = validTips.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (t.title || "").toLowerCase().includes(term) ||
           (t.category || "").toLowerCase().includes(term) ||
           (t.summary || "").toLowerCase().includes(term) ||
           (t.code || "").toLowerCase().includes(term);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">
        <p>Aucune astuce trouvée pour « ${escapeHTML(searchTerm)} ».</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(tip => `
    <div class="tip-card">
      <div class="tip-header">
        <span class="badge-tag">${escapeHTML(tip.badge || tip.category || 'Tech')}</span>
        <span class="tip-date">${escapeHTML(tip.date || '')}</span>
      </div>
      <h3 class="tip-title">${escapeHTML(tip.title)}</h3>
      <p class="tip-summary">${escapeHTML(tip.summary)}</p>
      ${tip.code ? `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-lang-tag">💻 Astuce / Commande</span>
            <button class="copy-btn" onclick="copyCode(this, \`${encodeURIComponent(tip.code || '')}\`)" aria-label="Copier le code">📋 Copier</button>
          </div>
          <div class="code-box">
            <pre><code>${escapeHTML(tip.code || '')}</code></pre>
          </div>
        </div>
      ` : ''}
      ${tip.explanation ? `<p style="font-size: 0.85rem; color: var(--text-dim); margin-top: auto;">💡 ${escapeHTML(tip.explanation)}</p>` : ''}
    </div>
  `).join("");
}

/* -------------------------------------------------------------
 * 10. RENDER CODE / PROGRAMMATION (100% DYNAMIQUE CLOUD)
 * ----------------------------------------------------------- */
function renderCode(codeSnippets, techTips) {
  const container = document.getElementById("code-grid");
  if (!container) return;

  const validSnippets = [...(codeSnippets || [])];
  // Fallback aux astuces avec code si aucun snippet direct
  if (validSnippets.length === 0 && techTips) {
    techTips.filter(t => t.code && t.code.trim().length > 0).forEach(t => {
      validSnippets.push({
        id: t.id,
        title: t.title,
        language: t.category || "Script",
        category: t.category || "DevOps",
        description: t.summary || t.explanation || "",
        code: t.code,
        tags: [t.category || "Code"]
      });
    });
  }

  if (validSnippets.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">💻</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Scripts & Extraits de Code</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucun extrait de code pour le moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = validSnippets.map(item => {
    const tagList = Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(',') : []);
    return `
    <div class="tip-card code-card">
      <div class="tip-header">
        <span class="badge-tag" style="background: rgba(0, 210, 255, 0.12); color: var(--neon-primary, #00d2ff); border-color: rgba(0, 210, 255, 0.3);">
          ${escapeHTML(item.language || item.category || 'Code')}
        </span>
        <span class="tip-date">${escapeHTML(item.category || '')}</span>
      </div>
      <h3 class="tip-title">${escapeHTML(item.title)}</h3>
      ${item.description ? `<p class="tip-summary">${escapeHTML(item.description)}</p>` : ''}
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-lang-tag">⚡ ${escapeHTML(item.language || 'Terminal')}</span>
          <button class="copy-btn" onclick="copyCode(this, \`${encodeURIComponent(item.code || '')}\`)">📋 Copier</button>
        </div>
        <div class="code-box">
          <pre><code>${escapeHTML(item.code || '')}</code></pre>
        </div>
      </div>
      ${tagList.length > 0 ? `
        <div class="project-tags" style="margin-top: 14px;">
          ${tagList.map(t => `<span class="tag">${escapeHTML(t.trim())}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
  }).join("");
}

/* -------------------------------------------------------------
 * 11. RENDER GAMING & 3D (100% DYNAMIQUE CLOUD)
 * ----------------------------------------------------------- */
function renderGaming(gamingItems) {
  const container = document.getElementById("gaming-content");
  if (!container) return;

  const validItems = gamingItems || [];

  if (validItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 56px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 3rem; margin-bottom: 14px;">🎮</div>
        <h4 style="font-weight: 700; margin-bottom: 8px; color: #fff; font-size: 1.2rem;">Univers Gaming & Moteurs 3D</h4>
        <p style="color: var(--text-muted); font-size: 0.92rem; margin: 0; max-width: 500px; margin-left: auto; margin-right: auto;">
          Aucun titre disponible pour le moment dans cette section.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="gaming-grid">
      ${validItems.map(game => {
        const tagList = Array.isArray(game.tags) ? game.tags : (game.tags ? String(game.tags).split(',') : []);
        return `
        <div class="gaming-card">
          <div class="gaming-card-img-wrap">
            <img src="${escapeHTML(game.image || '')}" alt="${escapeHTML(game.title)}" class="gaming-card-img" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'">
            <div class="gaming-rating-badge">★ ${escapeHTML(game.rating || '9.5/10')}</div>
            <div class="gaming-platform-badge">${escapeHTML(game.platform || 'PC')}</div>
          </div>
          <div class="gaming-card-content">
            <div class="news-meta">
              <span class="badge-tag" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.3);">
                ${escapeHTML(game.category || 'Gaming')}
              </span>
              <span>${escapeHTML(game.platform || 'Multiplateforme')}</span>
            </div>
            <h3 class="gaming-card-title">${escapeHTML(game.title)}</h3>
            <p class="gaming-card-desc">${escapeHTML(game.summary || '')}</p>
            ${tagList.length > 0 ? `
              <div class="project-tags" style="margin-top: auto; margin-bottom: 12px;">
                ${tagList.map(t => `<span class="tag">${escapeHTML(t.trim())}</span>`).join('')}
              </div>
            ` : ''}
            ${game.trailerUrl ? `
              <div style="margin-top: auto;">
                <button class="btn btn-primary btn-sm" onclick="openTrailer('${escapeHTML(game.title)}', '${escapeHTML(game.trailerUrl)}')">
                  Bande-Annonce ▶
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

/* -------------------------------------------------------------
 * 12. RENDER DOCUMENTS (100% DYNAMIQUE CLOUD)
 * ----------------------------------------------------------- */
function renderDocuments(documents, projects) {
  const container = document.getElementById("documents-grid");
  if (!container) return;

  const validDocs = [...(documents || [])];
  // Si aucun document dédié, inclure les projets comportant un fichier téléchargeable
  if (validDocs.length === 0 && projects) {
    projects.filter(p => p.fileName).forEach(p => {
      validDocs.push({
        id: p.id,
        title: p.title,
        category: p.category || "Projet & Guide",
        description: p.description || "",
        fileName: p.fileName,
        fileSize: p.fileSize || "Document",
        fileUrl: p.fileUrl,
        tags: p.tags || []
      });
    });
  }

  if (validDocs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">📚</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Bibliothèque de Documents & Ressources</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucun document disponible pour le moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="documents-list-grid">
      ${validDocs.map(d => {
        const tagList = Array.isArray(d.tags) ? d.tags : (d.tags ? String(d.tags).split(',') : []);
        return `
        <div class="document-card">
          <div class="document-icon-badge">📕</div>
          <div class="document-info">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
              <span class="badge-tag" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">
                ${escapeHTML(d.category || 'Documentation')}
              </span>
              <span style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(d.fileSize || 'PDF')}</span>
            </div>
            <h3 class="document-title">${escapeHTML(d.title)}</h3>
            <p class="document-desc">${escapeHTML(d.description || '')}</p>
            ${tagList.length > 0 ? `
              <div class="project-tags" style="margin-top: 8px;">
                ${tagList.map(t => `<span class="tag">${escapeHTML(t.trim())}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="document-action">
            <button class="btn btn-primary btn-sm" onclick="downloadDocumentItem('${escapeHTML(d.id)}')">
              📥 Télécharger
            </button>
          </div>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

/* -------------------------------------------------------------
 * 12b. RENDER PORTFOLIO (100% DYNAMIQUE CLOUD)
 * ----------------------------------------------------------- */
function renderPortfolio(portfolioItems, profile) {
  const container = document.getElementById("portfolio-grid");
  if (!container) return;

  const validItems = portfolioItems || [];
  if (validItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle); margin-top: 24px;">
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucune réalisation supplémentaire pour le moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-top: 36px; margin-bottom: 20px;">
      <div class="section-tag">Réalisations & Systèmes</div>
      <h3 class="section-title" style="font-size: 1.5rem;">Projets Conçus & Développés par Auberson</h3>
    </div>
    <div class="portfolio-cards-grid">
      ${validItems.map(item => {
        const techs = item.technologies ? item.technologies.split(',').map(t => t.trim()) : [];
        return `
        <div class="portfolio-item-card">
          ${item.image ? `
            <div class="portfolio-card-img-wrap">
              <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" class="portfolio-card-img" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'">
            </div>
          ` : ''}
          <div class="portfolio-card-content">
            <div class="news-meta">
              <span class="badge-tag">${escapeHTML(item.category || 'Tech')}</span>
              <span style="font-size: 0.8rem; color: var(--neon-primary, #00d2ff); font-weight: 600;">${escapeHTML(item.role || 'Créateur')}</span>
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">${escapeHTML(item.title)}</h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">${escapeHTML(item.description || '')}</p>
            ${techs.length > 0 ? `
              <div class="project-tags" style="margin-top: auto; margin-bottom: 16px;">
                ${techs.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
              </div>
            ` : ''}
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto;">
              ${item.demoUrl ? `<a href="${escapeHTML(item.demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Voir en Direct ↗</a>` : ''}
              ${item.repoUrl ? `<a href="${escapeHTML(item.repoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Code Source ⌥</a>` : ''}
            </div>
          </div>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

// Helper pour télécharger un document de la bibliothèque (100% Direct & Sans Compte)
window.downloadDocumentItem = function(docId) {
  const data = StorageService.get();
  let docItem = (data.documents || []).find(d => d.id === docId);
  if (!docItem) {
    docItem = (data.projects || []).find(p => p.id === docId);
  }
  if (!docItem || (!docItem.fileUrl && !docItem.downloadUrl)) {
    alert("Fichier non disponible au téléchargement.");
    return;
  }

  const targetUrl = docItem.downloadUrl || docItem.fileUrl;
  const fileName = docItem.fileName || "document_outlook_studio.pdf";

  if (window.CloudinaryService && typeof window.CloudinaryService.triggerBrowserDownload === "function") {
    window.CloudinaryService.triggerBrowserDownload(targetUrl, fileName);
    return;
  }

  const link = document.createElement("a");
  link.href = targetUrl;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 2000);
};

/* -------------------------------------------------------------
 * 13. EVENT HANDLERS & HELPERS
 * ----------------------------------------------------------- */
function setupNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  const updateNavbar = () => {
    if (window.scrollY > 15) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();
}

function setupEventListeners() {
  // Mobile drawer
  const menuBtn = document.getElementById("mobile-menu-btn");
  const drawer = document.getElementById("drawer-sheet");
  const backdrop = document.getElementById("drawer-backdrop");
  const closeBtn = document.getElementById("drawer-close-btn");

  const openDrawer = () => {
    if (drawer && backdrop) {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      document.body.style.overflow = "hidden";
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    }
  };

  const closeDrawer = () => {
    if (drawer && backdrop) {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      document.body.style.overflow = "";
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    }
  };

  window.closeMobileDrawer = closeDrawer;

  if (menuBtn) menuBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // Search input cinema
  const cinemaSearch = document.getElementById("cinema-search");
  if (cinemaSearch) {
    cinemaSearch.addEventListener("input", (e) => {
      const data = StorageService.get();
      renderCinema(data.cinema, e.target.value.trim());
    });
  }

  // Quick filter pills for Cinema
  const cinemaPills = document.querySelectorAll(".cinema-pill-btn");
  cinemaPills.forEach(pill => {
    pill.addEventListener("click", () => {
      cinemaPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.getAttribute("data-filter") || "";
      if (cinemaSearch) cinemaSearch.value = filter;
      const data = StorageService.get();
      renderCinema(data.cinema, filter);
    });
  });

  // Search input tips
  const tipsSearch = document.getElementById("tips-search");
  if (tipsSearch) {
    tipsSearch.addEventListener("input", (e) => {
      const data = StorageService.get();
      renderTechTips(data.techTips, e.target.value.trim());
    });
  }
}

// Copy Code Helper
window.copyCode = function(btn, encodedCode) {
  const code = decodeURIComponent(encodedCode);
  navigator.clipboard.writeText(code).then(() => {
    const origText = btn.textContent;
    btn.textContent = "✓ Copié !";
    btn.style.color = "#10b981";
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.color = "";
    }, 2000);
  });
};

// Download File Helper (100% Direct & Sans Compte)
window.downloadProjectFile = function(projectId) {
  const data = StorageService.get();
  const proj = (data.projects || []).find(p => p.id === projectId);
  if (!proj || (!proj.fileUrl && !proj.downloadUrl)) {
    alert("Fichier du projet non disponible au téléchargement.");
    return;
  }

  const targetUrl = proj.downloadUrl || proj.fileUrl;
  const fileName = proj.fileName || "fichier_outlook_studio.pdf";

  if (window.CloudinaryService && typeof window.CloudinaryService.triggerBrowserDownload === "function") {
    window.CloudinaryService.triggerBrowserDownload(targetUrl, fileName);
    return;
  }

  const link = document.createElement("a");
  link.href = targetUrl;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 2000);
};

// YouTube / Video Trailer Modal
window.openTrailer = function(title, url) {
  let embedUrl = url;
  if (url.includes("watch?v=")) {
    embedUrl = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    embedUrl = url.replace("youtu.be/", "www.youtube.com/embed/");
  }

  const modal = document.createElement("div");
  modal.className = "modal-overlay active";
  modal.style.zIndex = "2000";

  const closeVideoModal = () => {
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    modal.remove();
  };

  modal.innerHTML = `
    <div class="modal-container" style="max-width: 760px; width: 100%; padding: 0; overflow: hidden; border-radius: var(--radius-xl);">
      <div class="modal-header" style="padding: 14px 20px;">
        <h3 style="font-weight: 700; font-size: 1.05rem;">🎬 ${escapeHTML(title)}</h3>
        <button class="modal-close" id="trailer-close-btn">&times;</button>
      </div>
      <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000;">
        <iframe src="${escapeHTML(embedUrl)}?autoplay=1" style="position: absolute; top:0; left:0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    </div>
  `;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeVideoModal();
  });
  const closeBtn = modal.querySelector("#trailer-close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeVideoModal);

  document.body.classList.add("modal-open");
  document.body.appendChild(modal);
};

window.playFilmTrailer = function(btn) {
  if (!btn) return;
  const title = btn.getAttribute("data-trailer-title") || "";
  const url = btn.getAttribute("data-trailer-url") || "";
  if (url) {
    window.openTrailer(title, url);
  }
};

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
