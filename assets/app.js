/**
 * Nicaisse Auberson - Application Engine (2026)
 * Real-time rendering, Visitor telemetry & Interactive features
 */

document.addEventListener("DOMContentLoaded", () => {
  initVisitorTelemetry();
  renderApp();
  setupEventListeners();

  // Listen for real-time DB changes
  window.addEventListener("nicaisse_db_updated", () => {
    renderApp();
  });
  window.addEventListener("nicklaus_db_updated", () => {
    renderApp();
  });
});

/* -------------------------------------------------------------
 * VISITOR TELEMETRY ("Qui a accédé au site et quand")
 * ----------------------------------------------------------- */
async function initVisitorTelemetry() {
  const ua = navigator.userAgent;

  // Device detection
  let device = "Ordinateur de bureau";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua)) device = "Smartphone Android";
  else if (/Mobile/i.test(ua)) device = "Mobile";
  else if (/Macintosh/i.test(ua)) device = "Mac / macOS";
  else if (/Windows/i.test(ua)) device = "PC Windows";
  else if (/Linux/i.test(ua)) device = "Linux Workstation";

  // Operating System
  let os = "Inconnu";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 11 / 10";
  else if (/iPhone OS (\d+_\d+)/i.test(ua)) os = "iOS " + RegExp.$1.replace('_', '.');
  else if (/Android (\d+(\.\d+)?)/i.test(ua)) os = "Android " + RegExp.$1;
  else if (/Mac OS X (\d+[._]\d+)/i.test(ua)) os = "macOS " + RegExp.$1.replace('_', '.');

  // Browser detection (Brave, Chrome, Safari, Firefox, Edge)
  let browser = "Navigateur Web";
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    const isB = await navigator.brave.isBrave();
    if (isB) browser = "Brave Browser";
  } else if (/Edg\//i.test(ua)) {
    browser = "Microsoft Edge";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Google Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Apple Safari";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Mozilla Firefox";
  }

  // Session info
  const sessionInfo = {
    device,
    os,
    browser,
    location: "Détection réseau..."
  };

  // Log immediately
  const entry = StorageService.logVisitor(sessionInfo);

  // Asynchronously enrich with country/city if network allows (silent fallback)
  try {
    fetch("https://ipapi.co/json/", { cache: "no-store" })
      .then(r => r.json())
      .then(geo => {
        if (geo && geo.country_name) {
          const locStr = `${geo.city ? geo.city + ', ' : ''}${geo.country_name}`;
          const currentData = StorageService.get();
          const target = currentData.visitors.find(v => v.id === entry.id);
          if (target) {
            target.location = locStr;
            StorageService.save(currentData);
          }
        }
      })
      .catch(() => {
        // Fallback simple country API
        fetch("https://api.country.is/")
          .then(r => r.json())
          .then(c => {
            if (c && c.country) {
              const currentData = StorageService.get();
              const target = currentData.visitors.find(v => v.id === entry.id);
              if (target) {
                target.location = `Pays: ${c.country}`;
                StorageService.save(currentData);
              }
            }
          })
          .catch(() => {});
      });
  } catch (e) {
    // Ignore offline errors
  }
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
    <div class="project-card">
      <div>
        <span class="badge-tag">${escapeHTML(p.category)}</span>
        <h3 style="font-size: 1.3rem; font-weight: 700; margin: 12px 0 8px;">${escapeHTML(p.title)}</h3>
        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6;">${escapeHTML(p.description)}</p>
        <div class="project-tags">
          ${(p.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}
        </div>
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
  `).join("");
}

/* -------------------------------------------------------------
 * EVENT HANDLERS & HELPERS
 * ----------------------------------------------------------- */
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
