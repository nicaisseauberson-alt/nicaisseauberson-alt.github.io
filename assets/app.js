/**
 * Outlook Studio — Application Engine & SPA Router (2026)
 * Powered by Auberson
 * Real-time rendering, dynamic neon/backgrounds, visitor telemetry & streaming UI
 */

document.addEventListener("DOMContentLoaded", () => {
  initVisitorTelemetry();
  initRouter();
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

  // Background auto-refresh every 15s to keep all devices live-synced
  setInterval(() => {
    StorageService.syncCloudContent().then(updated => {
      if (updated) renderApp();
    });
  }, 15000);

  // Listen for real-time DB changes
  window.addEventListener("nicaisse_db_updated", () => {
    renderApp();
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
  "#/tips": "tips",
  "#/code": "code",
  "#/gaming": "gaming",
  "#/documents": "documents",
  "#/portfolio": "portfolio",
  "#/contact": "contact"
};

function initRouter() {
  const handleRouteChange = () => {
    let hash = window.location.hash.toLowerCase().trim();
    if (hash === "#/admin") {
      if (window.adminManager) adminManager.openLoginOrDashboard();
      window.location.hash = "#/";
      return;
    }

    const routeKey = VALID_ROUTES[hash] || "home";
    switchView(routeKey);
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

  // 2. Show target view
  const targetView = document.getElementById(`view-${routeKey}`);
  if (targetView) {
    targetView.classList.add("active");
  } else {
    const homeView = document.getElementById("view-home");
    if (homeView) homeView.classList.add("active");
  }

  // 3. Update active states on nav links
  const allNavLinks = document.querySelectorAll(".nav-route-link, .drawer-nav-link, .bottom-nav-item");
  allNavLinks.forEach(link => {
    if (link.getAttribute("data-route") === routeKey) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // 4. Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 5. Close mobile drawer if open
  if (window.closeMobileDrawer) {
    window.closeMobileDrawer();
  }
}

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

  // Render individual sections
  renderCinema(data.cinema);
  renderNews(data.news);
  renderProjects(data.projects);
  renderTechTips(data.techTips);
  renderCode(data.techTips);
  renderGaming(data);
  renderDocuments(data.projects);
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
    return (f.title || "").toLowerCase().includes(term) ||
           (f.director || "").toLowerCase().includes(term) ||
           (f.genre || "").toLowerCase().includes(term) ||
           (f.year || "").toString().includes(term);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">🎬</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Catalogue Cinéma</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">
          ${searchTerm ? `Aucun film ne correspond à « ${escapeHTML(searchTerm)} ».` : "Aucun film dans le catalogue pour le moment. Vous pouvez en ajouter depuis l'espace administrateur."}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(film => {
    const ratioStyle = film.aspectRatio === 'landscape' ? 'aspect-ratio: 16/9;' : film.aspectRatio === 'square' ? 'aspect-ratio: 1/1;' : 'aspect-ratio: 2/3;';
    return `
    <div class="film-card">
      <div class="streaming-poster-wrap" style="${ratioStyle}">
        <img src="${escapeHTML(film.poster)}" alt="${escapeHTML(film.title)}" class="streaming-poster" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'">
        <div class="film-rating">★ ${escapeHTML(film.rating || '4.5')}</div>
      </div>
      <div class="film-body">
        <div class="film-meta">
          <span>${escapeHTML(film.year || '2026')}</span> • <span>${escapeHTML(film.genre || 'Cinéma')}</span> • <span>De ${escapeHTML(film.director || 'Auberson')}</span>
        </div>
        <h3 class="film-title">${escapeHTML(film.title)}</h3>
        <p class="film-review">« ${escapeHTML(film.review || 'Recommandation officielle Outlook Studio.')} »</p>
        <div class="film-actions">
          ${film.link ? `<a href="${escapeHTML(film.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Fiche / Source</a>` : ''}
          ${film.trailerUrl ? `<button class="btn btn-primary btn-sm" onclick="openTrailer('${escapeHTML(film.title)}', '${escapeHTML(film.trailerUrl)}')">Bande-Annonce ▶</button>` : ''}
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
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucune actualité publiée pour le moment. Vous pouvez en publier depuis l'espace administrateur.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = validNews.map(item => {
    const imgSrc = item.image || item.coverImage;
    const tagList = Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',') : []);
    return `
    <div class="news-card">
      ${imgSrc ? `<img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(item.title)}" class="news-card-img" onerror="this.style.display='none'">` : ''}
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
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucun projet affiché pour le moment. Vous pouvez en ajouter depuis l'espace administrateur.</p>
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
          <img src="${escapeHTML(p.bgImage)}" alt="${escapeHTML(p.title)}" loading="lazy" class="project-card-bg-img" onerror="this.style.display='none'">
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
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucune astuce publiée pour le moment. Vous pouvez en ajouter depuis l'espace administrateur.</p>
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
 * 10. RENDER CODE / PROGRAMMATION
 * ----------------------------------------------------------- */
function renderCode(tips) {
  const container = document.getElementById("code-grid");
  if (!container) return;

  const codeTips = (tips || []).filter(t => t.code && t.code.trim().length > 0);
  if (codeTips.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">💻</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Scripts & Extraits de Code</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucun extrait de code pour le moment. Ajoutez des astuces avec du code dans le panneau admin.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = codeTips.map(tip => `
    <div class="tip-card">
      <div class="tip-header">
        <span class="badge-tag">${escapeHTML(tip.category || 'Code')}</span>
        <span class="tip-date">${escapeHTML(tip.date || '')}</span>
      </div>
      <h3 class="tip-title">${escapeHTML(tip.title)}</h3>
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-lang-tag">💻 Script</span>
          <button class="copy-btn" onclick="copyCode(this, \`${encodeURIComponent(tip.code || '')}\`)">📋 Copier</button>
        </div>
        <div class="code-box">
          <pre><code>${escapeHTML(tip.code)}</code></pre>
        </div>
      </div>
    </div>
  `).join("");
}

/* -------------------------------------------------------------
 * 11. RENDER GAMING SECTION
 * ----------------------------------------------------------- */
function renderGaming(data) {
  const container = document.getElementById("gaming-content");
  if (!container) return;

  container.innerHTML = `
    <div class="bento-grid">
      <div class="bento-card col-6">
        <div class="card-icon" style="background: rgba(168, 85, 247, 0.12); color: #a855f7;">🎮</div>
        <h3 class="card-title">Moteurs 3D & Next-Gen Gaming</h3>
        <p class="card-desc">Suivi des innovations Unreal Engine 5, ray-tracing matériel et optimisation des pipelines graphiques temps réel.</p>
      </div>
      <div class="bento-card col-6">
        <div class="card-icon" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6;">⚡</div>
        <h3 class="card-title">Performance & Matériel</h3>
        <p class="card-desc">Tests de fréquence d'images, architecture GPU et architectures de streaming gaming basse latence.</p>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------
 * 12. RENDER DOCUMENTS
 * ----------------------------------------------------------- */
function renderDocuments(projects) {
  const container = document.getElementById("documents-grid");
  if (!container) return;

  const docs = (projects || []).filter(p => p.fileName);
  if (docs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">📄</div>
        <h4 style="font-weight: 700; margin-bottom: 6px; color: #fff;">Bibliothèque Numérique</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Aucun document téléchargeable disponible pour l'instant.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${docs.map(d => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 2rem;">📄</div>
            <div>
              <strong style="font-size: 1.05rem;">${escapeHTML(d.fileName)}</strong>
              <div style="font-size: 0.82rem; color: var(--text-tertiary);">${escapeHTML(d.title)} • ${escapeHTML(d.fileSize || 'PDF')}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="downloadProjectFile('${escapeHTML(d.id)}')">Télécharger le document</button>
        </div>
      `).join("")}
    </div>
  `;
}

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

// Download File Helper
window.downloadProjectFile = function(projectId) {
  const data = StorageService.get();
  const proj = (data.projects || []).find(p => p.id === projectId);
  if (!proj || !proj.fileUrl) {
    alert("Fichier non disponible");
    return;
  }

  if (proj.fileUrl.startsWith("http")) {
    window.open(proj.fileUrl, "_blank");
    return;
  }

  const link = document.createElement("a");
  link.href = proj.fileUrl;
  link.download = proj.fileName || "fichier_outlook_studio.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 760px; width: 100%; padding: 0; overflow: hidden; border-radius: var(--radius-xl);">
      <div class="modal-header" style="padding: 14px 20px;">
        <h3 style="font-weight: 700; font-size: 1.05rem;">🎬 ${escapeHTML(title)}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000;">
        <iframe src="${escapeHTML(embedUrl)}?autoplay=1" style="position: absolute; top:0; left:0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    </div>
  `;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
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
