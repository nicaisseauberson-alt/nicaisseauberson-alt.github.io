/**
 * Nicaisse Auberson - Application Engine (2026)
 * Real-time rendering, Visitor telemetry & Interactive features
 */

document.addEventListener("DOMContentLoaded", () => {
  initVisitorTelemetry();
  renderApp();
  setupEventListeners();
  setupNavbarScroll();

  // Initial cloud content sync across devices
  StorageService.syncCloudContent().then(updated => {
    if (updated) renderApp();
  });

  // Re-sync on tab focus (e.g. user added content on another device and switched back)
  window.addEventListener("focus", () => {
    StorageService.syncCloudContent().then(updated => {
      if (updated) renderApp();
    });
  });

  // Listen for real-time DB changes
  window.addEventListener("nicaisse_db_updated", () => {
    renderApp();
  });
  window.addEventListener("nicklaus_db_updated", () => {
    renderApp();
  });
});

/* -------------------------------------------------------------
 * VISITOR TELEMETRY & HARDWARE DETECTION ENGINE
 * ----------------------------------------------------------- */
async function initVisitorTelemetry() {
  const telemetry = await detectDeviceAndBrowser();

  // Unique session ID for persistent live heartbeat tracking
  let sessionId = sessionStorage.getItem("nicaisse_visitor_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem("nicaisse_visitor_session_id", sessionId);
  }

  const now = new Date();
  const connectedAtTime = now.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit" 
  });

  // Session info template
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

  // 1. Initial live presence ping
  StorageService.sendPresencePing(sessionInfo, "ping");

  // 2. Heartbeat every 20 seconds
  const presenceTimer = setInterval(() => {
    StorageService.sendPresencePing(sessionInfo, "ping");
  }, 20000);

  // 3. Send immediate "leave" beacon when user closes or leaves page
  const handleLeave = () => {
    StorageService.sendPresencePing(sessionInfo, "leave");
  };
  window.addEventListener("pagehide", handleLeave);
  window.addEventListener("beforeunload", handleLeave);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      StorageService.sendPresencePing(sessionInfo, "ping");
    }
  });

  // 4. Initial log entry in history
  const entry = StorageService.logVisitor(sessionInfo);

  // 5. Geolocation resolution via ipwho.is (fast, accurate, no key required)
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (res.ok) {
      const geo = await res.json();
      if (geo && geo.success) {
        const flag = (geo.flag && geo.flag.emoji) ? geo.flag.emoji : "📍";
        const city = geo.city ? (geo.city + ", ") : "";
        const country = geo.country || "Inconnu";
        const exactLocation = `${flag} ${city}${country}`.trim();

        sessionInfo.location = exactLocation;
        // Update live presence with exact location
        StorageService.sendPresencePing(sessionInfo, "ping");

        // Update local & cloud visitor history
        const currentData = StorageService.get();
        const target = currentData.visitors.find(v => v.id === entry.id);
        if (target) {
          target.location = exactLocation;
          StorageService.save(currentData, false);
          try {
            fetch(StorageService.TELEMETRY_HUB, {
              method: "POST",
              headers: { "Title": "Visite: " + target.device + " (" + target.browser + ")" },
              body: JSON.stringify(target)
            }).catch(() => {});
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    // Fallback to secondary geo service
    try {
      const fb = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      const fbData = await fb.json();
      if (fbData && fbData.country_name) {
        const exactLoc = `📍 ${fbData.city ? fbData.city + ', ' : ''}${fbData.country_name}`;
        sessionInfo.location = exactLoc;
        StorageService.sendPresencePing(sessionInfo, "ping");
      }
    } catch (e) {}
  }
}

async function detectDeviceAndBrowser() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouch = navigator.maxTouchPoints || 0;
  const w = window.screen.width || window.innerWidth || 360;
  const h = window.screen.height || window.innerHeight || 640;
  const dpr = window.devicePixelRatio || 1;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);

  // 1. Detect if iOS (iPhone / iPad / iPod)
  // Even if "Request Desktop Site" is active in Safari, iOS sends platform 'MacIntel' with maxTouchPoints > 1
  const isIOSPlatform = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
  const isIPhone = /iPhone/i.test(ua) || (isIOSPlatform && (minDim <= 440 || (minDim <= 480 && maxDim <= 960)));
  const isIPad = /iPad/i.test(ua) || (isIOSPlatform && !isIPhone && maxTouch > 1);

  // 2. Detect Android
  const isAndroid = /Android/i.test(ua);

  let deviceType = "Ordinateur";
  let deviceName = "PC Windows";
  let osName = "Windows";

  if (isIPhone) {
    deviceType = "Smartphone";
    // Precise iPhone Model detection by CSS Points & DPR
    // iPhone 11 strictly has 414x896 CSS points and DPR = 2 (Liquid Retina 828x1792)
    if (minDim === 414 && maxDim === 896) {
      deviceName = dpr >= 3 ? "iPhone 11 Pro Max" : "iPhone 11";
    } else if (minDim === 375 && maxDim === 812) {
      deviceName = "iPhone 11 Pro / X / 12 mini / 13 mini";
    } else if (minDim === 440 && maxDim === 956) {
      deviceName = "iPhone 16 Pro Max";
    } else if (minDim === 402 && maxDim === 874) {
      deviceName = "iPhone 16 Pro";
    } else if (minDim === 430 && maxDim === 932) {
      deviceName = "iPhone 15 Pro Max / 16 Plus";
    } else if (minDim === 393 && maxDim === 852) {
      deviceName = "iPhone 15 / 15 Pro / 14 Pro";
    } else if (minDim === 390 && maxDim === 844) {
      deviceName = "iPhone 14 / 13 / 13 Pro / 12";
    } else if (minDim === 428 && maxDim === 926) {
      deviceName = "iPhone 14 Plus / 13 Pro Max / 12 Pro Max";
    } else if (minDim === 414 && maxDim === 736) {
      deviceName = "iPhone 8 Plus / 7 Plus";
    } else if (minDim === 375 && maxDim === 667) {
      deviceName = "iPhone SE (2e/3e gén) / 8 / 7";
    } else if (minDim === 320 && maxDim === 568) {
      deviceName = "iPhone SE (1re gén)";
    } else {
      deviceName = "Apple iPhone";
    }

    // Exact iOS Version with patch number (e.g. iOS 17.5.1, iOS 18.0)
    const iosMatch = ua.match(/(?:OS|Version)[ /_](\d+([_.]\d+)+)/i);
    if (iosMatch) {
      osName = "iOS " + iosMatch[1].replace(/_/g, ".");
    } else {
      osName = "iOS (Apple)";
    }
  } else if (isIPad) {
    deviceType = "Tablette";
    deviceName = "Apple iPad";
    const ipadMatch = ua.match(/(?:OS|Version)[ /_](\d+([_.]\d+)+)/i);
    if (ipadMatch) {
      osName = "iPadOS " + ipadMatch[1].replace(/_/g, ".");
    } else {
      osName = "iPadOS";
    }
  } else if (isAndroid) {
    deviceType = minDim >= 600 ? "Tablette" : "Smartphone";
    
    // Exact Android OS Version (e.g. Android 13, Android 14, Android 12)
    const androidVerMatch = ua.match(/Android\s*([0-9]+(?:\.[0-9]+)*)/i);
    if (androidVerMatch) {
      osName = "Android " + androidVerMatch[1];
    } else {
      osName = "Android";
    }

    // Extract Android Phone Model
    let androidModel = "";
    if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
      try {
        const hints = await navigator.userAgentData.getHighEntropyValues(['model']);
        if (hints && hints.model) androidModel = hints.model;
      } catch (e) {}
    }

    if (!androidModel && /;\s*([^;]+?)\s*Build\//i.test(ua)) {
      androidModel = RegExp.$1.trim();
    }

    // Resolve Samsung Model Codes & Major Android Phones
    if (/SM-S928/i.test(androidModel)) androidModel = "Samsung Galaxy S24 Ultra";
    else if (/SM-S926/i.test(androidModel)) androidModel = "Samsung Galaxy S24+";
    else if (/SM-S921/i.test(androidModel)) androidModel = "Samsung Galaxy S24";
    else if (/SM-S918/i.test(androidModel)) androidModel = "Samsung Galaxy S23 Ultra";
    else if (/SM-S916/i.test(androidModel)) androidModel = "Samsung Galaxy S23+";
    else if (/SM-S911/i.test(androidModel)) androidModel = "Samsung Galaxy S23";
    else if (/SM-S908/i.test(androidModel)) androidModel = "Samsung Galaxy S22 Ultra";
    else if (/SM-G998/i.test(androidModel)) androidModel = "Samsung Galaxy S21 Ultra";
    else if (/SM-A546/i.test(androidModel)) androidModel = "Samsung Galaxy A54 5G";
    else if (/SM-A536/i.test(androidModel)) androidModel = "Samsung Galaxy A53 5G";
    else if (/SM-A528/i.test(androidModel)) androidModel = "Samsung Galaxy A52s 5G";
    else if (/SM-A346/i.test(androidModel)) androidModel = "Samsung Galaxy A34 5G";
    else if (/SM-A145/i.test(androidModel)) androidModel = "Samsung Galaxy A14";
    else if (/Pixel\s*([0-9a-zA-Z\s]+)/i.test(ua)) androidModel = "Google Pixel " + RegExp.$1.trim();
    else if (/Redmi/i.test(ua) || /Redmi/i.test(androidModel)) androidModel = "Xiaomi Redmi " + (androidModel || "").replace(/Redmi/i, '').trim();
    else if (/POCO/i.test(ua) || /POCO/i.test(androidModel)) androidModel = "Xiaomi POCO " + (androidModel || "").replace(/POCO/i, '').trim();
    else if (/Xiaomi/i.test(ua) || /Xiaomi/i.test(androidModel)) androidModel = "Xiaomi (" + (androidModel || "Android") + ")";
    else if (/OnePlus/i.test(ua) || /OnePlus/i.test(androidModel)) androidModel = "OnePlus (" + (androidModel || "Android") + ")";
    else if (/Huawei|Honor/i.test(ua)) androidModel = "Huawei (" + (androidModel || "Android") + ")";
    else if (/Motorola|Moto/i.test(ua)) androidModel = "Motorola (" + (androidModel || "Android") + ")";

    deviceName = androidModel ? androidModel : (deviceType === "Tablette" ? "Tablette Android" : "Smartphone Android");
  } else {
    // Desktop / Laptop
    deviceType = "Ordinateur";
    if (/Windows NT 10.0/i.test(ua)) {
      deviceName = "PC Windows 11 / 10";
      osName = "Windows 11 / 10";
    } else if (/Windows NT/i.test(ua)) {
      deviceName = "PC Windows";
      osName = "Windows";
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      deviceName = "Mac (MacBook / iMac)";
      if (/Mac OS X (\d+[._]\d+)/i.test(ua)) {
        osName = "macOS " + RegExp.$1.replace(/_/g, '.');
      } else {
        osName = "macOS";
      }
    } else if (/Linux/i.test(ua)) {
      deviceName = "Station Linux";
      osName = "Linux";
    } else {
      deviceName = "Ordinateur";
      osName = "Inconnu";
    }
  }

  // 4. PRECISE BROWSER DETECTION (Zero confusion between Safari, Brave, Chrome, etc.)
  let browserName = "Navigateur Web";

  // Check Brave (Desktop & Android Chromium)
  let isBrave = false;
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      isBrave = await navigator.brave.isBrave();
    } catch (e) {}
  }

  if (isBrave) {
    browserName = "Brave Browser";
  } else if (/EdgiOS\//i.test(ua)) {
    browserName = "Microsoft Edge (iOS)";
  } else if (/Edg\//i.test(ua)) {
    browserName = "Microsoft Edge";
  } else if (/OPiOS\//i.test(ua)) {
    browserName = "Opera Touch (iOS)";
  } else if (/OPR\//i.test(ua) || /Opera\//i.test(ua)) {
    browserName = "Opera";
  } else if (/SamsungBrowser\//i.test(ua)) {
    browserName = "Samsung Internet";
  } else if (/DuckDuckGo\//i.test(ua)) {
    browserName = "DuckDuckGo Browser";
  } else if (/CriOS\//i.test(ua)) {
    browserName = "Google Chrome (iOS)";
  } else if (/FxiOS\//i.test(ua)) {
    browserName = "Mozilla Firefox (iOS)";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    browserName = "Google Chrome";
  } else if (/Firefox\//i.test(ua)) {
    browserName = "Mozilla Firefox";
  } else if (isIOSPlatform || /Safari\//i.test(ua)) {
    browserName = isIOSPlatform ? "Safari Mobile (iOS)" : "Apple Safari (macOS)";
  }

  return {
    device: deviceName,
    deviceType: deviceType,
    os: osName,
    browser: browserName,
    screen: `${w}x${h} @${dpr}x`
  };
}

/* -------------------------------------------------------------
 * RENDER ENTIRE APP
 * ----------------------------------------------------------- */
function renderApp() {
  const data = StorageService.get();

  // Profile data
  const nameEls = document.querySelectorAll(".profile-name");
  nameEls.forEach(el => el.textContent = data.profile.name);

  const bioEl = document.getElementById("profile-bio");
  if (bioEl) bioEl.textContent = data.profile.bio;

  const taglineEl = document.getElementById("profile-tagline");
  if (taglineEl) taglineEl.textContent = data.profile.tagline;

  const availEl = document.getElementById("profile-availability");
  if (availEl) availEl.textContent = data.profile.availability;

  // Skills
  renderSkills(data.skills);

  // Tech tips
  renderTechTips(data.techTips);

  // Cinema
  renderCinema(data.cinema);

  // Projects
  renderProjects(data.projects);
}

/* -------------------------------------------------------------
 * RENDER SKILLS
 * ----------------------------------------------------------- */
function renderSkills(skills) {
  const container = document.getElementById("skills-container");
  if (!container || !skills) return;

  container.innerHTML = skills.map(s => `
    <div class="skill-row">
      <div class="skill-info">
        <span>${escapeHTML(s.name)}</span>
        <span style="color: #60a5fa">${escapeHTML(s.level)}</span>
      </div>
      <div class="skill-bar">
        <div class="skill-fill" style="width: ${escapeHTML(s.level)}"></div>
      </div>
    </div>
  `).join("");
}

/* -------------------------------------------------------------
 * RENDER TECH TIPS
 * ----------------------------------------------------------- */
function renderTechTips(tips, searchTerm = "") {
  const container = document.getElementById("tips-grid");
  if (!container) return;

  const filtered = (tips || []).filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return t.title.toLowerCase().includes(term) ||
           t.category.toLowerCase().includes(term) ||
           t.summary.toLowerCase().includes(term) ||
           t.code.toLowerCase().includes(term);
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
        <span class="badge-tag">${escapeHTML(tip.badge || tip.category)}</span>
        <span class="tip-date">${escapeHTML(tip.date || '')}</span>
      </div>
      <h3 class="tip-title">${escapeHTML(tip.title)}</h3>
      <p class="tip-summary">${escapeHTML(tip.summary)}</p>
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-lang-tag">💻 Astuce / Commande</span>
          <button class="copy-btn" onclick="copyCode(this, \`${encodeURIComponent(tip.code)}\`)" aria-label="Copier le code">📋 Copier</button>
        </div>
        <div class="code-box">
          <pre><code>${escapeHTML(tip.code)}</code></pre>
        </div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-dim); margin-top: auto;">💡 ${escapeHTML(tip.explanation || '')}</p>
    </div>
  `).join("");
}

/* -------------------------------------------------------------
 * RENDER CINEMA
 * ----------------------------------------------------------- */
function renderCinema(films) {
  const container = document.getElementById("cinema-grid");
  if (!container) return;

  container.innerHTML = (films || []).map(film => `
    <div class="film-card">
      <div class="film-poster-wrap">
        <img src="${escapeHTML(film.poster)}" alt="${escapeHTML(film.title)}" class="film-poster" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'">
        <div class="film-rating">★ ${escapeHTML(film.rating)}</div>
      </div>
      <div class="film-body">
        <div class="film-meta">
          <span>${escapeHTML(film.year)}</span> • <span>${escapeHTML(film.genre)}</span> • <span>De ${escapeHTML(film.director)}</span>
        </div>
        <h3 class="film-title">${escapeHTML(film.title)}</h3>
        <p class="film-review">« ${escapeHTML(film.review)} »</p>
        <div class="film-actions">
          ${film.link ? `<a href="${escapeHTML(film.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Site / Fiche</a>` : ''}
          ${film.trailerUrl ? `<button class="btn btn-primary btn-sm" onclick="openTrailer('${escapeHTML(film.title)}', '${escapeHTML(film.trailerUrl)}')">Bande-Annonce ▶</button>` : ''}
        </div>
      </div>
    </div>
  `).join("");
}

/* -------------------------------------------------------------
 * RENDER PROJECTS & DOWNLOADS
 * ----------------------------------------------------------- */
function renderProjects(projects) {
  const container = document.getElementById("projects-grid");
  if (!container) return;

  container.innerHTML = (projects || []).map(p => `
    <div class="project-card ${p.bgImage ? 'has-bg' : ''}">
      ${p.bgImage ? `
        <div class="project-card-banner">
          <img src="${escapeHTML(p.bgImage)}" alt="${escapeHTML(p.title)}" loading="lazy" class="project-card-bg-img" onerror="this.style.display='none'">
          <div class="project-card-banner-overlay"></div>
        </div>
      ` : ''}
      <div class="project-card-body">
        <span class="badge-tag">${escapeHTML(p.category)}</span>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin: 10px 0 8px;">${escapeHTML(p.title)}</h3>
        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-bottom: 12px;">${escapeHTML(p.description)}</p>
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
  `).join("");
}

/* -------------------------------------------------------------
 * EVENT HANDLERS & HELPERS
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
  const searchInput = document.getElementById("tips-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const data = StorageService.get();
      renderTechTips(data.techTips, e.target.value);
    });
  }

  // Mobile Drawer Navigation Setup
  setupMobileDrawer();

  // Active Section Scroll Spy
  setupScrollSpy();
}

function setupScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");
  const drawerLinks = document.querySelectorAll(".drawer-nav-link");

  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach(link => {
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
        drawerLinks.forEach(link => {
          if (link.getAttribute("href") === `#${id}`) {
            link.style.borderColor = "var(--accent-primary)";
            link.style.background = "rgba(59, 130, 246, 0.1)";
          } else {
            link.style.borderColor = "transparent";
            link.style.background = "rgba(255, 255, 255, 0.02)";
          }
        });
      }
    });
  }, { rootMargin: "-20% 0px -60% 0px" });

  sections.forEach(sec => observer.observe(sec));
}

function setupMobileDrawer() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const closeBtn = document.getElementById("drawer-close-btn");
  const backdrop = document.getElementById("drawer-backdrop");
  const sheet = document.getElementById("drawer-sheet");
  const navLinks = document.querySelectorAll(".drawer-nav-link");

  function openDrawer() {
    if (!sheet || !backdrop) return;
    backdrop.classList.add("open");
    sheet.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    sheet.setAttribute("aria-hidden", "false");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!sheet || !backdrop) return;
    backdrop.classList.remove("open");
    sheet.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    sheet.setAttribute("aria-hidden", "true");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  window.openMobileDrawer = openDrawer;
  window.closeMobileDrawer = closeDrawer;

  if (menuBtn) menuBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      closeDrawer();
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet && sheet.classList.contains("open")) {
      closeDrawer();
    }
  });
}

// Copy Code
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

// Download File
window.downloadProjectFile = function(projectId) {
  const data = StorageService.get();
  const proj = (data.projects || []).find(p => p.id === projectId);
  if (!proj || !proj.fileUrl) {
    alert("Fichier non disponible");
    return;
  }

  const link = document.createElement("a");
  link.href = proj.fileUrl;
  link.download = proj.fileName || "fichier_nicaisse_auberson.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Trailer Modal
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
