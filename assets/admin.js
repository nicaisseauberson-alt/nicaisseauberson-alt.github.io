/**
 * Nicaisse Auberson - Secure Administration & Content Management Engine
 * Protected Dashboard: Add Tech Tips, Movies, Projects, Downloadable Files & View Real-Time Visitor Logs
 */

class AdminManager {
  constructor() {
    this.isAuthenticated = false;
    this.activeTab = "analytics"; // analytics, cinema, projects, tips, profile
    this.analyticsPollTimer = null;
    this.init();
  }

  init() {
    this.bindDOM();
  }

  bindDOM() {
    // Open modal button in footer
    const openBtn = document.getElementById("admin-open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", () => this.openLoginOrDashboard());
    }

    // Keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        this.openLoginOrDashboard();
      }
    });
  }

  async openLoginOrDashboard() {
    const modal = document.getElementById("admin-modal");
    if (!modal) return;

    modal.classList.add("active");

    // Silently synchronize from cloud to ensure latest password & contents are applied
    StorageService.syncCloudContent().then(updated => {
      if (updated && this.isAuthenticated) {
        this.renderActiveTabContent();
      }
    });

    if (!this.isAuthenticated) {
      this.showLoginForm();
    } else {
      this.showDashboard();
    }
  }

  closeModal() {
    const modal = document.getElementById("admin-modal");
    if (modal) modal.classList.remove("active");
    if (this.analyticsPollTimer) {
      clearInterval(this.analyticsPollTimer);
      this.analyticsPollTimer = null;
    }
  }

  showLoginForm() {
    const body = document.getElementById("admin-modal-body");
    const headerTitle = document.getElementById("admin-modal-title");
    const tabsContainer = document.getElementById("admin-tabs");
    
    headerTitle.textContent = "Espace Privé de Nicaisse Auberson";
    tabsContainer.style.display = "none";

    body.innerHTML = `
      <div style="max-width: 440px; margin: 24px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛡️</div>
        <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: #fff;">Espace Personnel Sécurisé</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 22px; line-height: 1.5;">
          Accès réservé exclusivement à Nicaisse Auberson pour administrer le portfolio et superviser les connexions en direct.
        </p>

        <form id="admin-login-form" onsubmit="adminManager.handleLogin(event)">
          <div class="form-group" style="margin-bottom: 14px;">
            <input type="password" id="admin-pass-input" class="form-control" placeholder="Entrez votre mot de passe secret" autofocus required style="text-align: center; font-size: 1rem; letter-spacing: 2px;">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; font-weight: 700; padding: 12px;">
            🔓 Déverrouiller le Tableau de Bord
          </button>
        </form>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.78rem; color: var(--text-dim);">Mot de passe changé sur votre PC ?</span>
          <button type="button" class="btn btn-outline btn-sm" onclick="adminManager.syncCloudContent(true)" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-size: 0.78rem;">
            🔄 Synchroniser depuis le Cloud
          </button>
        </div>
      </div>
    `;
  }

  handleLogin(e) {
    e.preventDefault();
    const input = document.getElementById("admin-pass-input");
    if (!input) return;

    if (StorageService.checkPassword(input.value)) {
      this.isAuthenticated = true;
      this.showDashboard();
    } else {
      alert("Mot de passe incorrect.");
      input.value = "";
      input.focus();
    }
  }

  logout() {
    this.isAuthenticated = false;
    if (this.analyticsPollTimer) {
      clearInterval(this.analyticsPollTimer);
      this.analyticsPollTimer = null;
    }
    this.showLoginForm();
  }

  showDashboard() {
    const headerTitle = document.getElementById("admin-modal-title");
    const tabsContainer = document.getElementById("admin-tabs");
    
    headerTitle.textContent = "Tableau de Bord — Nicaisse Auberson";
    tabsContainer.style.display = "flex";

    this.renderTabs();
    this.renderActiveTabContent();

    // Silently fetch fresh telemetry and content from cloud hub
    this.fetchCloudVisitors(false);
    this.syncCloudContent(false);
  }

  renderTabs() {
    const tabs = [
      { id: "analytics", label: "🟢 En Direct" },
      { id: "cinema", label: "🎬 Cinéma" },
      { id: "projects", label: "📁 Projets" },
      { id: "tips", label: "💡 Astuces Tech" },
      { id: "profile", label: "🔑 Sécurité & Profil" }
    ];

    const tabsContainer = document.getElementById("admin-tabs");
    tabsContainer.innerHTML = tabs.map(t => `
      <button class="admin-tab-btn ${this.activeTab === t.id ? 'active' : ''}" onclick="adminManager.switchTab('${t.id}')">
        ${t.label}
      </button>
    `).join("") + `
      <button class="admin-tab-btn" style="margin-left: auto; color: #ef4444;" onclick="adminManager.logout()">
        🚪 Quitter
      </button>
    `;
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    if (tabId !== "analytics" && this.analyticsPollTimer) {
      clearInterval(this.analyticsPollTimer);
      this.analyticsPollTimer = null;
    }
    this.renderTabs();
    this.renderActiveTabContent();
    if (tabId === "analytics") {
      this.fetchCloudVisitors(false);
    }
  }

  renderActiveTabContent() {
    const body = document.getElementById("admin-modal-body");
    const data = StorageService.get();

    if (this.activeTab === "analytics") {
      this.renderAnalyticsTab(body, data);
    } else if (this.activeTab === "cinema") {
      this.renderCinemaTab(body, data);
    } else if (this.activeTab === "projects") {
      this.renderProjectsTab(body, data);
    } else if (this.activeTab === "tips") {
      this.renderTipsTab(body, data);
    } else if (this.activeTab === "profile") {
      this.renderProfileTab(body, data);
    }
  }

  /* 1. VISITOR ANALYTICS TAB: REAL-TIME PRESENCE & PAST LOGS */
  async renderAnalyticsTab(body, data) {
    const activeLive = await StorageService.getActiveLiveVisitors();
    const visitors = data.visitors || [];
    const totalVisits = visitors.length;
    const mobileVisits = visitors.filter(v => v.deviceType === "Smartphone" || /iPhone|Android|Pixel|Samsung|Galaxy|Xiaomi|Redmi|OnePlus|Huawei|Mobile/i.test(v.device)).length;
    const desktopVisits = visitors.filter(v => v.deviceType === "Ordinateur" || /PC|Windows|Mac|Linux/i.test(v.device)).length;

    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <span class="live-indicator"><span class="live-dot"></span> EN DIRECT</span>
              <span>Visiteurs Actifs & Télémétrie</span>
            </h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
              Les visiteurs déconnectés disparaissent automatiquement de la liste en direct.
            </p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="adminManager.refreshAnalytics()" title="Rafraîchir les visiteurs en direct">
              🔄 Actualiser
            </button>
            <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.clearVisitorLogs()" title="Effacer l'historique">
              🗑️ Vider l'historique
            </button>
          </div>
        </div>

        <!-- 1. LIVE CONNECTED VISITORS (RIGHT NOW) -->
        <div style="background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div style="font-weight: 700; font-size: 0.95rem; color: #34d399; display: flex; align-items: center; gap: 8px;">
              <span class="live-dot"></span> Appareils connectés en ce moment (${activeLive.length})
            </div>
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">Signal heartbeat actif &lt; 65s</span>
          </div>

          ${activeLive.length === 0 ? `
            <div style="text-align: center; color: var(--text-dim); padding: 20px 12px; font-size: 0.88rem; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
              Aucun autre visiteur connecté en direct en ce moment.<br>
              <span style="font-size: 0.78rem; color: var(--text-tertiary);">(Dès qu'un appareil quitte le site, il disparaît immédiatement d'ici)</span>
            </div>
          ` : `
            <div class="visitor-cards-list">
              ${activeLive.map(v => `
                <div class="visitor-card-item" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.06);">
                  <div class="visitor-card-header">
                    <span style="font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px;">
                      <span class="live-dot"></span> Connecté à ${escapeHTML(v.connectedAt || '')}
                    </span>
                    <span class="device-badge" style="border-color: rgba(16, 185, 129, 0.5); background: rgba(16, 185, 129, 0.15); color: #34d399;">
                      ${this.getDeviceIcon(v.device, v.deviceType)} <strong>${escapeHTML(v.device || 'Inconnu')}</strong>
                    </span>
                  </div>
                  <div class="visitor-card-details">
                    <span>💻 Système: <strong>${escapeHTML(v.os || '')}</strong></span>
                    <span>${this.getBrowserIcon(v.browser)} Navigateur: <strong>${escapeHTML(v.browser || '')}</strong></span>
                    <span>📍 Localisation: <strong>${escapeHTML(v.location || 'Localisation...')}</strong></span>
                    <span>⏱️ Signal: <strong>Il y a ${v.ageSeconds || 0}s</strong></span>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- 2. HISTORICAL STATS & ARCHIVES -->
        <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: var(--text-secondary);">
          📜 Historique Récent & Télémétrie Archivée (${totalVisits})
        </h5>

        <div class="analytics-summary">
          <div class="stat-box">
            <div class="stat-value">${totalVisits}</div>
            <div class="stat-label">Total Visites Enregistrées</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #10b981">${mobileVisits}</div>
            <div class="stat-label">Smartphones (iPhone / Android)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #60a5fa">${desktopVisits}</div>
            <div class="stat-label">Ordinateurs (PC / Mac)</div>
          </div>
        </div>

        <!-- Visitor Cards List for Mobile (< 768px) -->
        <div class="visitor-cards-list">
          ${visitors.length === 0 ? `
            <div style="text-align: center; color: var(--text-tertiary); padding: 24px;">Aucune visite enregistrée pour le moment.</div>
          ` : visitors.map(v => `
            <div class="visitor-card-item">
              <div class="visitor-card-header">
                <span style="font-weight: 700; color: #fff;">${v.date} à ${v.time}</span>
                <span class="device-badge" style="${/iPhone|Smartphone|Android/i.test(v.device || v.deviceType) ? 'border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); color: #34d399;' : ''}">
                  ${this.getDeviceIcon(v.device, v.deviceType)} ${escapeHTML(v.device || 'Inconnu')}
                </span>
              </div>
              <div class="visitor-card-details">
                <span>💻 ${escapeHTML(v.os || '')}</span>
                <span>${this.getBrowserIcon(v.browser)} <strong>${escapeHTML(v.browser || '')}</strong></span>
                <span>📍 ${escapeHTML(v.location || 'Localisation...')}</span>
                <span>📐 ${escapeHTML(v.screen || '')}</span>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Desktop Visitor Table (>= 768px) -->
        <div class="visitor-table-wrap">
          <table class="visitor-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Modèle Appareil</th>
                <th>Système (OS)</th>
                <th>Navigateur</th>
                <th>Localisation</th>
                <th>Résolution</th>
              </tr>
            </thead>
            <tbody>
              ${visitors.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: 24px;">Aucune visite enregistrée pour le moment.</td></tr>
              ` : visitors.map(v => `
                <tr>
                  <td style="font-weight: 600; color: #fff;">${v.date} à ${v.time}</td>
                  <td>
                    <span class="device-badge" style="${/iPhone|Smartphone|Android/i.test(v.device || v.deviceType) ? 'border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); color: #34d399;' : ''}">
                      ${this.getDeviceIcon(v.device, v.deviceType)} <strong>${escapeHTML(v.device || 'Inconnu')}</strong>
                    </span>
                  </td>
                  <td>${escapeHTML(v.os || '')}</td>
                  <td>
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                      ${this.getBrowserIcon(v.browser)} <strong>${escapeHTML(v.browser || '')}</strong>
                    </span>
                  </td>
                  <td>📍 ${escapeHTML(v.location || '')}</td>
                  <td style="color: var(--text-tertiary); font-size: 0.78rem;">${escapeHTML(v.screen || '')}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.startAnalyticsPolling();
  }

  startAnalyticsPolling() {
    if (this.analyticsPollTimer) clearInterval(this.analyticsPollTimer);
    this.analyticsPollTimer = setInterval(async () => {
      const modal = document.getElementById("admin-modal");
      if (this.activeTab === "analytics" && modal && modal.classList.contains("active")) {
        const body = document.getElementById("admin-modal-body");
        if (body) {
          const data = StorageService.get();
          await this.renderAnalyticsTab(body, data);
        }
      } else {
        clearInterval(this.analyticsPollTimer);
        this.analyticsPollTimer = null;
      }
    }, 15000);
  }

  async refreshAnalytics() {
    await this.fetchCloudVisitors(false);
    const body = document.getElementById("admin-modal-body");
    if (body) {
      const data = StorageService.get();
      await this.renderAnalyticsTab(body, data);
    }
  }

  getDeviceIcon(device = "", type = "") {
    if (/iPhone/i.test(device)) return "📱";
    if (/iPad/i.test(device)) return "📟";
    if (/Pixel|Samsung|Galaxy|Xiaomi|Redmi|OnePlus|Huawei|Oppo|Vivo|Realme|Motorola|Sony|LG|Honor|Android/i.test(device)) return "🤖";
    if (type === "Smartphone") return "📱";
    if (type === "Tablette") return "📟";
    if (/Mac/i.test(device)) return "🍏";
    if (/Windows/i.test(device)) return "🪟";
    if (/Linux/i.test(device)) return "🐧";
    return "💻";
  }

  getBrowserIcon(browser = "") {
    if (/Safari/i.test(browser)) return "🧭";
    if (/Chrome/i.test(browser)) return "🌐";
    if (/Brave/i.test(browser)) return "🦁";
    if (/Firefox/i.test(browser)) return "🦊";
    if (/Edge/i.test(browser)) return "🌊";
    if (/Opera/i.test(browser)) return "🔴";
    if (/Samsung/i.test(browser)) return "📱";
    return "🌐";
  }

  async fetchCloudVisitors(isManual = false) {
    try {
      const res = await fetch("https://ntfy.sh/nicaisse_telemetry_hub_2026/json?poll=1");
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split("\n");
      const cloudVisitors = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          if (item.event === "message" && item.message) {
            const vis = JSON.parse(item.message);
            if (vis && (vis.device || vis.id)) {
              cloudVisitors.push(vis);
            }
          }
        } catch (err) {}
      }

      if (cloudVisitors.length > 0) {
        const data = StorageService.get();
        if (!data.visitors) data.visitors = [];
        let newCount = 0;

        for (const cv of cloudVisitors) {
          const exists = data.visitors.some(v => v.id === cv.id || (v.timestamp && v.timestamp === cv.timestamp));
          if (!exists) {
            data.visitors.push(cv);
            newCount++;
          }
        }

        if (newCount > 0) {
          data.visitors.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          if (data.visitors.length > 200) data.visitors = data.visitors.slice(0, 200);
          StorageService.save(data, false);

          if (this.activeTab === "analytics") {
            const body = document.getElementById("admin-modal-body");
            if (body) this.renderAnalyticsTab(body, data);
          }
        }

        if (isManual) {
          alert(newCount > 0 ? `${newCount} nouvelle(s) visite(s) synchronisée(s) depuis le cloud !` : "Historique à jour (aucune nouvelle visite distante).");
        }
      } else if (isManual) {
        alert("Historique à jour (aucun nouveau log dans le cloud).");
      }
    } catch (e) {
      console.warn("Sync cloud impossible:", e);
      if (isManual) alert("Impossible de joindre le serveur cloud.");
    }
  }

  clearVisitorLogs() {
    if (!confirm("Voulez-vous vraiment effacer tout l'historique des connexions ?")) return;
    const data = StorageService.get();
    data.visitors = [];
    StorageService.save(data);
    const body = document.getElementById("admin-modal-body");
    if (body) this.renderAnalyticsTab(body, data);
  }

  /* 2. TECH TIPS TAB */
  renderTipsTab(body, data) {
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h4 style="font-size: 1.1rem; font-weight: 700;">Gérer les Astuces Tech (${(data.techTips || []).length})</h4>
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddTipForm()">+ Ajouter une Astuce</button>
        </div>

        <div id="tip-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${(data.techTips || []).map(t => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
              <div>
                <span class="badge-tag" style="margin-right: 8px;">${escapeHTML(t.category)}</span>
                <strong>${escapeHTML(t.title)}</strong>
              </div>
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteTip('${t.id}')">Supprimer</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  showAddTipForm() {
    const c = document.getElementById("tip-form-container");
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Nouvelle Astuce Informatique</h5>
      <form onsubmit="adminManager.saveNewTip(event)">
        <div class="form-group">
          <label class="form-label">Titre de l'astuce</label>
          <input type="text" id="new-tip-title" class="form-control" required placeholder="Ex: Optimiser les transferts de fichiers en ligne de commande">
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Catégorie</label>
            <input type="text" id="new-tip-cat" class="form-control" required placeholder="Ex: DevOps, Web, Linux">
          </div>
          <div>
            <label class="form-label">Badge</label>
            <input type="text" id="new-tip-badge" class="form-control" placeholder="Ex: Astuce 2026">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Résumé court</label>
          <input type="text" id="new-tip-summary" class="form-control" required placeholder="Explication en 1 ou 2 phrases">
        </div>
        <div class="form-group">
          <label class="form-label">Extrait de code / Commande</label>
          <textarea id="new-tip-code" class="form-control" style="font-family: monospace;" rows="4" placeholder="// Votre code ou commande"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Explication détaillée / Conseils</label>
          <input type="text" id="new-tip-explanation" class="form-control" placeholder="Pourquoi cette astuce est utile">
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" class="btn btn-primary btn-sm">Publier sur le site</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#tip-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  saveNewTip(e) {
    e.preventDefault();
    const data = StorageService.get();
    if (!data.techTips) data.techTips = [];

    const newTip = {
      id: "tip-" + Date.now(),
      title: document.getElementById("new-tip-title").value,
      category: document.getElementById("new-tip-cat").value,
      badge: document.getElementById("new-tip-badge").value || "Nouveau",
      date: new Date().toISOString().split("T")[0],
      summary: document.getElementById("new-tip-summary").value,
      code: document.getElementById("new-tip-code").value,
      explanation: document.getElementById("new-tip-explanation").value
    };

    data.techTips.unshift(newTip);
    StorageService.save(data);
    StorageService.broadcastContentChange({ category: "techTips", action: "add", item: newTip });
    this.renderTipsTab(document.getElementById("admin-modal-body"), data);
  }

  deleteTip(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette astuce ?")) return;
    const data = StorageService.get();
    data.techTips = data.techTips.filter(t => t.id !== id);
    StorageService.save(data);
    StorageService.broadcastContentChange({ category: "techTips", action: "delete", id: id });
    this.renderTipsTab(document.getElementById("admin-modal-body"), data);
  }

  /* 3. CINEMA TAB */
  renderCinemaTab(body, data) {
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gérer la Section Cinéma (${(data.cinema || []).length} films)</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Les modifications sont synchronisées en direct sur tous les téléphones et appareils.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddFilmForm()">+ Ajouter un Film</button>
          </div>
        </div>

        <div id="film-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${(data.cinema || []).map(f => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${escapeHTML(f.poster)}" style="width: 44px; height: 56px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'">
                <div>
                  <strong>${escapeHTML(f.title)}</strong> (${escapeHTML(f.year)}) - <span style="color: var(--text-dim);">${escapeHTML(f.director)}</span>
                  <div style="font-size: 0.8rem; color: #fbbf24;">★ ${escapeHTML(f.rating)}</div>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteFilm('${f.id}')">Supprimer</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  showAddFilmForm() {
    const c = document.getElementById("film-form-container");
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter un Film ou Série</h5>
      <form onsubmit="adminManager.saveNewFilm(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Titre du film</label>
            <input type="text" id="new-film-title" class="form-control" required placeholder="Ex: Oppenheimer">
          </div>
          <div>
            <label class="form-label">Année</label>
            <input type="text" id="new-film-year" class="form-control" required placeholder="Ex: 2023">
          </div>
        </div>
        <div class="form-group form-row-3">
          <div>
            <label class="form-label">Réalisateur</label>
            <input type="text" id="new-film-director" class="form-control" required placeholder="Ex: Christopher Nolan">
          </div>
          <div>
            <label class="form-label">Genre</label>
            <input type="text" id="new-film-genre" class="form-control" required placeholder="Ex: Biopic / Drame">
          </div>
          <div>
            <label class="form-label">Note / 10</label>
            <input type="text" id="new-film-rating" class="form-control" placeholder="Ex: 9.5 / 10">
          </div>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🎬 Affiche / Image du Film (Photo depuis votre appareil ou lien web)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-film-poster-file" accept="image/*" class="form-control" style="background: transparent;" onchange="adminManager.previewImage(this, 'film-poster-preview')">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.8rem;">
              <span>ou lien URL :</span>
              <input type="url" id="new-film-poster" class="form-control" placeholder="https://image-url..." style="flex: 1;" oninput="adminManager.previewUrl(this.value, 'film-poster-preview')">
            </div>
          </div>
          <div id="film-poster-preview" style="display: none; margin-top: 10px; max-height: 160px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle); text-align: center;">
            <img src="" style="max-height: 160px; object-fit: cover; display: inline-block;">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Lien du site officiel / fiche</label>
            <input type="url" id="new-film-link" class="form-control" placeholder="https://...">
          </div>
          <div>
            <label class="form-label">Lien Bande-Annonce (YouTube)</label>
            <input type="url" id="new-film-trailer" class="form-control" placeholder="https://youtube.com/watch?v=...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Votre avis / critique personnelle</label>
          <textarea id="new-film-review" class="form-control" rows="3" placeholder="Pourquoi ce film vous a marqué..."></textarea>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" class="btn btn-primary btn-sm">Publier le Film</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#film-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewFilm(e) {
    e.preventDefault();
    const data = StorageService.get();
    if (!data.cinema) data.cinema = [];

    let posterUrl = document.getElementById("new-film-poster").value;
    const fileInput = document.getElementById("new-film-poster-file");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      // Compress uploaded image for ultra-fast cloud broadcast across phones and laptops
      posterUrl = await this.compressImage(fileInput.files[0], 1000, 1000, 0.75);
    }

    if (!posterUrl) {
      posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
    }

    const newFilm = {
      id: "film-" + Date.now(),
      title: document.getElementById("new-film-title").value,
      director: document.getElementById("new-film-director").value,
      year: document.getElementById("new-film-year").value,
      genre: document.getElementById("new-film-genre").value,
      rating: document.getElementById("new-film-rating").value || "9.0 / 10",
      poster: posterUrl,
      review: document.getElementById("new-film-review").value,
      link: document.getElementById("new-film-link").value,
      trailerUrl: document.getElementById("new-film-trailer").value
    };

    data.cinema.unshift(newFilm);
    StorageService.save(data);
    this.renderCinemaTab(document.getElementById("admin-modal-body"), data);
  }

  deleteFilm(id) {
    if (!confirm("Supprimer ce film ?")) return;
    const data = StorageService.get();
    data.cinema = data.cinema.filter(f => f.id !== id);
    StorageService.save(data);
    this.renderCinemaTab(document.getElementById("admin-modal-body"), data);
  }

  /* 4. PROJECTS & DOWNLOADABLE FILES TAB */
  renderProjectsTab(body, data) {
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gérer les Projets & Téléchargements (${(data.projects || []).length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Ajoutez une image d'arrière-plan et des fichiers téléchargeables pour chaque projet.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddProjectForm()">+ Ajouter un Projet</button>
        </div>

        <div id="proj-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${(data.projects || []).map(p => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 16px;">
                ${p.bgImage ? `<img src="${escapeHTML(p.bgImage)}" style="width: 50px; height: 38px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">` : ''}
                <div>
                  <strong>${escapeHTML(p.title)}</strong> (${escapeHTML(p.category)})
                  ${p.fileName ? `<div style="font-size: 0.8rem; color: #10b981;">📄 Fichier téléchargeable: ${escapeHTML(p.fileName)}</div>` : ''}
                </div>
              </div>
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteProject('${p.id}')">Supprimer</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  showAddProjectForm() {
    const c = document.getElementById("proj-form-container");
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Nouveau Projet & Fichier Téléchargeable</h5>
      <form onsubmit="adminManager.saveNewProject(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Nom du projet</label>
            <input type="text" id="new-proj-title" class="form-control" required placeholder="Ex: Cours d'Architecture Système 2026">
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <input type="text" id="new-proj-cat" class="form-control" required placeholder="Ex: Enseignement, Dev, Sécurité">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="new-proj-desc" class="form-control" required placeholder="Détails du projet..."></textarea>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🖼️ Image / Arrière-plan du Projet (Photo depuis votre appareil ou lien web)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-proj-bg-file" accept="image/*" class="form-control" style="background: transparent;" onchange="adminManager.previewImage(this, 'proj-bg-preview')">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.8rem;">
              <span>ou lien URL :</span>
              <input type="url" id="new-proj-bg-url" class="form-control" placeholder="https://images.unsplash.com/..." style="flex: 1;" oninput="adminManager.previewUrl(this.value, 'proj-bg-preview')">
            </div>
          </div>
          <div id="proj-bg-preview" style="display: none; margin-top: 10px; max-height: 140px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle);">
            <img src="" style="width: 100%; height: 140px; object-fit: cover;">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (séparés par des virgules)</label>
          <input type="text" id="new-proj-tags" class="form-control" placeholder="HTML, Cloud, DevOps, Sécurité">
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 16px; border-radius: var(--radius-md);">
          <label class="form-label">Joindre un fichier que les visiteurs peuvent télécharger</label>
          <input type="file" id="new-proj-file" class="form-control" style="background: transparent;">
          <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 6px;">
            Le fichier (PDF, document, archive) sera directement accessible en téléchargement pour les visiteurs.
          </p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" class="btn btn-primary btn-sm">Publier le Projet</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#proj-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewProject(e) {
    e.preventDefault();
    const data = StorageService.get();
    if (!data.projects) data.projects = [];

    const fileInput = document.getElementById("new-proj-file");
    let fileUrl = "";
    let fileName = "";
    let fileSize = "";

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileName = file.name;
      fileSize = (file.size / 1024).toFixed(1) + " KB";
      fileUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    }

    let bgImageUrl = document.getElementById("new-proj-bg-url") ? document.getElementById("new-proj-bg-url").value : "";
    const bgFileInput = document.getElementById("new-proj-bg-file");
    if (bgFileInput && bgFileInput.files && bgFileInput.files[0]) {
      // Compress project background image
      bgImageUrl = await this.compressImage(bgFileInput.files[0], 1000, 1000, 0.75);
    }

    const tags = document.getElementById("new-proj-tags").value
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newProj = {
      id: "proj-" + Date.now(),
      title: document.getElementById("new-proj-title").value,
      category: document.getElementById("new-proj-cat").value,
      description: document.getElementById("new-proj-desc").value,
      bgImage: bgImageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80",
      tags: tags.length ? tags : ["Informatique"],
      fileName,
      fileSize,
      fileUrl
    };

    data.projects.unshift(newProj);
    StorageService.save(data);
    this.renderProjectsTab(document.getElementById("admin-modal-body"), data);
  }

  deleteProject(id) {
    if (!confirm("Supprimer ce projet ?")) return;
    const data = StorageService.get();
    data.projects = data.projects.filter(p => p.id !== id);
    StorageService.save(data);
    this.renderProjectsTab(document.getElementById("admin-modal-body"), data);
  }

  /* 5. PROFILE & BACKUP TAB */
  renderProfileTab(body, data) {
    const prof = data.profile || {};
    body.innerHTML = `
      <div>
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px;">Informations Personnelles & Sécurité</h4>
        
        <form onsubmit="adminManager.saveProfileInfo(event)" style="margin-bottom: 32px;">
          <div class="form-group form-row-2">
            <div>
              <label class="form-label">Nom affiché</label>
              <input type="text" id="prof-name" class="form-control" value="${escapeHTML(prof.name || 'Nicaisse Auberson')}">
            </div>
            <div>
              <label class="form-label">Statut / Disponibilité</label>
              <input type="text" id="prof-avail" class="form-control" value="${escapeHTML(prof.availability || '')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Phrase d'accroche (Tagline)</label>
            <input type="text" id="prof-tagline" class="form-control" value="${escapeHTML(prof.tagline || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Biographie</label>
            <textarea id="prof-bio" class="form-control" rows="3">${escapeHTML(prof.bio || '')}</textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Enregistrer le profil</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 32px 0;">

        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">🔐 Sécurité & Synchronisation du Mot de Passe</h5>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Définissez votre mot de passe privé. Dès modification, ce mot de passe devient immédiatement requis sur tous vos appareils (PC, iPhone, Android).
        </p>
        <form onsubmit="adminManager.changePassword(event)" style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px;">
          <div style="flex: 1; min-width: 220px;">
            <label class="form-label">Nouveau mot de passe personnel</label>
            <input type="password" id="new-admin-pass" class="form-control" required placeholder="Votre nouveau mot de passe">
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Mettre à jour partout</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 32px 0;">

        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Exporter / Sauvegarder les données</h5>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Téléchargez une copie intégrale de votre base de données locale en JSON.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="adminManager.exportDatabase()">📥 Exporter la base (JSON)</button>
          <label class="btn btn-outline btn-sm" style="cursor: pointer;">
            📤 Importer une sauvegarde
            <input type="file" accept=".json" style="display: none;" onchange="adminManager.importDatabase(event)">
          </label>
        </div>
      </div>
    `;
  }

  changePassword(e) {
    e.preventDefault();
    const newPass = document.getElementById("new-admin-pass").value;
    if (!newPass || newPass.trim().length < 4) {
      alert("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    const cleanPass = newPass.trim();
    StorageService.setPassword(cleanPass);
    alert("✅ Mot de passe mis à jour et synchronisé avec succès sur tous vos appareils (PC, iPhone, Android) !");
    document.getElementById("new-admin-pass").value = "";
  }

  saveProfileInfo(e) {
    e.preventDefault();
    const data = StorageService.get();
    data.profile.name = document.getElementById("prof-name").value;
    data.profile.availability = document.getElementById("prof-avail").value;
    data.profile.tagline = document.getElementById("prof-tagline").value;
    data.profile.bio = document.getElementById("prof-bio").value;

    StorageService.save(data);
    alert("Profil mis à jour et synchronisé sur tous les appareils !");
  }

  previewImage(input, previewId) {
    const container = document.getElementById(previewId);
    if (!container) return;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = container.querySelector("img");
        if (img) img.src = e.target.result;
        container.style.display = "block";
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  previewUrl(url, previewId) {
    const container = document.getElementById(previewId);
    if (!container) return;
    if (url && url.trim().startsWith("http")) {
      const img = container.querySelector("img");
      if (img) img.src = url.trim();
      container.style.display = "block";
    }
  }

  compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.75) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async syncCloudContent(isManual = false) {
    const btn = document.querySelector(".btn-sync-cloud");
    const statusLabel = document.getElementById("sync-status-label");
    if (btn) btn.classList.add("spinning");
    if (statusLabel) statusLabel.textContent = "Synchronisation...";

    const updated = await StorageService.syncCloudContent();
    
    setTimeout(() => {
      if (btn) btn.classList.remove("spinning");
      const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      if (statusLabel) statusLabel.textContent = "Cloud Synchronisé (" + timeStr + ")";
    }, 600);

    if (updated) {
      if (this.isAuthenticated) this.renderActiveTabContent();
      if (isManual) alert("Contenu et mot de passe mis à jour et synchronisés avec succès depuis le Cloud !");
    } else if (isManual) {
      alert("Votre appareil est déjà parfaitement synchronisé avec le Cloud.");
    }
  }

  exportDatabase() {
    const data = StorageService.get();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_nicaisse_auberson_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importDatabase(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        StorageService.save(parsed);
        alert("Sauvegarde restaurée avec succès !");
        location.reload();
      } catch (err) {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  }
}

// Initialisation globale
window.adminManager = new AdminManager();
