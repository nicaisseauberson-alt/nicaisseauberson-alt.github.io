/**
 * Nicaisse Auberson - Secure Administration & Content Management Engine
 * 2026 Cloud Architecture (Cloud Firestore & Firebase Authentication)
 */

class AdminManager {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.activeTab = "analytics"; // analytics, cinema, projects, tips, profile
    this.analyticsPollTimer = null;
    this.init();
  }

  init() {
    this.bindDOM();
    this.initAuthBridge();
  }

  initAuthBridge() {
    const handleAuth = (user) => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
      this.updateSyncStatusBar();

      const modal = document.getElementById("admin-modal");
      if (modal && modal.classList.contains("active")) {
        if (this.isAuthenticated) {
          this.showDashboard();
        }
      }
    };

    if (window.FirebaseBridge) {
      window.FirebaseBridge.onAuthChange(handleAuth);
    } else {
      window.addEventListener("firebase_bridge_ready", () => {
        if (window.FirebaseBridge) {
          window.FirebaseBridge.onAuthChange(handleAuth);
        }
      });
    }

    // Écouter les mises à jour Firestore pour rafraîchir dynamiquement l'onglet actif si ouvert
    window.addEventListener("nicaisse_db_updated", () => {
      const modal = document.getElementById("admin-modal");
      if (modal && modal.classList.contains("active") && this.isAuthenticated) {
        if (this.activeTab !== "analytics") {
          this.renderActiveTabContent();
        }
      }
    });
  }

  bindDOM() {
    // Bouton Espace Admin dans le footer
    const openBtn = document.getElementById("admin-open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", () => this.openLoginOrDashboard());
    }

    // Raccourci clavier : Ctrl + Shift + A (ou Cmd + Shift + A)
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        this.openLoginOrDashboard();
      }
    });
  }

  updateSyncStatusBar() {
    const dot = document.querySelector(".sync-pulse-dot");
    const label = document.getElementById("sync-status-label");
    const isFb = window.FirebaseBridge && window.FirebaseBridge.isConfigured;

    if (dot) {
      if (isFb) {
        dot.style.background = "#10b981";
        dot.style.boxShadow = "0 0 10px #10b981";
      } else {
        dot.style.background = "#f59e0b";
        dot.style.boxShadow = "0 0 10px #f59e0b";
      }
    }

    if (label) {
      if (isFb) {
        const email = this.currentUser ? ` (${this.currentUser.email})` : "";
        label.textContent = `Cloud Firebase Connecté${email}`;
      } else {
        label.textContent = "Mode Local (Configuration Firebase requise)";
      }
    }
  }

  async openLoginOrDashboard() {
    const modal = document.getElementById("admin-modal");
    if (!modal) return;

    modal.classList.add("active");
    this.updateSyncStatusBar();

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
    
    headerTitle.textContent = "Outlook Studio — Administration (Auberson)";
    tabsContainer.style.display = "none";
    this.updateSyncStatusBar();

    const isFirebase = window.FirebaseBridge && window.FirebaseBridge.isConfigured;

    body.innerHTML = `
      <div style="max-width: 440px; margin: 24px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛡️</div>
        <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: #fff;">Espace Privé — Outlook Studio</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 22px; line-height: 1.5;">
          Accès réservé exclusivement à l'administrateur Auberson pour piloter Outlook Studio, publier du contenu et superviser les visiteurs en direct.
        </p>

        ${isFirebase ? `
          <!-- Connexion Firebase Cloud Auth -->
          <form id="admin-login-form" onsubmit="adminManager.handleLogin(event)">
            <div class="form-group" style="margin-bottom: 14px; text-align: left;">
              <label class="form-label">Adresse Email Administrateur</label>
              <input type="email" id="admin-email-input" class="form-control" placeholder="votre-email@domaine.com" required autofocus style="font-size: 0.95rem;">
            </div>
            <div class="form-group" style="margin-bottom: 18px; text-align: left;">
              <label class="form-label">Mot de passe secret</label>
              <input type="password" id="admin-pass-input" class="form-control" placeholder="••••••••••••" required style="font-size: 0.95rem; letter-spacing: 2px;">
            </div>
            <button type="submit" id="admin-login-btn" class="btn btn-primary" style="width: 100%; font-weight: 700; padding: 12px;">
              🔓 Se connecter à l'Espace Cloud
            </button>
            <p id="admin-login-error" style="color: #ef4444; font-size: 0.85rem; margin-top: 12px; display: none; line-height: 1.4;"></p>
          </form>
        ` : `
          <!-- Connexion Locale & Invitation Configuration Firebase -->
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px; text-align: left;">
            <strong style="color: #fbbf24; display: block; margin-bottom: 4px;">🟡 Configuration Cloud en attente</strong>
            <span style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; display: block;">
              Pour activer la synchronisation multi-appareils automatique en temps réel, connectez-vous avec votre mot de passe pour renseigner vos clés de projet Firebase.
            </span>
          </div>

          <form id="admin-login-form" onsubmit="adminManager.handleLogin(event)">
            <div class="form-group" style="margin-bottom: 16px;">
              <input type="password" id="admin-pass-input" class="form-control" placeholder="Entrez votre mot de passe secret" autofocus required style="text-align: center; font-size: 1rem; letter-spacing: 2px;">
            </div>
            <button type="submit" id="admin-login-btn" class="btn btn-primary" style="width: 100%; font-weight: 700; padding: 12px;">
              🔓 Accéder au Tableau de Bord
            </button>
            <p id="admin-login-error" style="color: #ef4444; font-size: 0.85rem; margin-top: 12px; display: none;"></p>
          </form>
        `}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.78rem; color: var(--text-dim);">Vérifier la connexion Cloud</span>
          <button type="button" class="btn btn-outline btn-sm" onclick="adminManager.syncCloudContent(true)" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-size: 0.78rem;">
            🔄 Tester le Cloud
          </button>
        </div>
      </div>
    `;
  }

  async handleLogin(e) {
    e.preventDefault();
    const errorEl = document.getElementById("admin-login-error");
    const submitBtn = document.getElementById("admin-login-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";

    if (errorEl) errorEl.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Authentification en cours...";
    }

    try {
      const isFirebase = window.FirebaseBridge && window.FirebaseBridge.isConfigured;

      if (isFirebase) {
        const emailInput = document.getElementById("admin-email-input");
        const passInput = document.getElementById("admin-pass-input");
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passInput ? passInput.value.trim() : "";

        await window.FirebaseBridge.login(email, password);
        this.isAuthenticated = true;
        this.showDashboard();
      } else {
        const passInput = document.getElementById("admin-pass-input");
        const password = passInput ? passInput.value.trim() : "";

        if (StorageService.checkPassword(password)) {
          this.isAuthenticated = true;
          this.showDashboard();
        } else {
          throw new Error("Mot de passe incorrect.");
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (errorEl) {
        let msg = err.message || "Erreur de connexion.";
        if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password") || msg.includes("auth/user-not-found")) {
          msg = "Identifiant ou mot de passe incorrect. Vérifiez votre compte dans la console Firebase.";
        } else if (msg.includes("auth/network-request-failed")) {
          msg = "Impossible de contacter les serveurs Firebase. Vérifiez votre connexion Internet.";
        }
        errorEl.textContent = "❌ " + msg;
        errorEl.style.display = "block";
      } else {
        alert("Erreur: " + err.message);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async logout() {
    try {
      if (window.FirebaseBridge) {
        await window.FirebaseBridge.logout();
      }
    } catch (e) {}

    this.isAuthenticated = false;
    this.currentUser = null;

    if (this.analyticsPollTimer) {
      clearInterval(this.analyticsPollTimer);
      this.analyticsPollTimer = null;
    }
    this.showLoginForm();
  }

  showDashboard() {
    const headerTitle = document.getElementById("admin-modal-title");
    const tabsContainer = document.getElementById("admin-tabs");
    
    headerTitle.textContent = "Tableau de Bord — Outlook Studio";
    tabsContainer.style.display = "flex";

    this.updateSyncStatusBar();
    this.renderTabs();
    this.renderActiveTabContent();
  }

  renderTabs() {
    const tabs = [
      { id: "analytics", label: "🟢 En Direct" },
      { id: "theme", label: "🎨 Personnalisation" },
      { id: "news", label: "📰 Actualités" },
      { id: "cinema", label: "🎬 Cinéma" },
      { id: "projects", label: "📁 Projets" },
      { id: "tips", label: "💡 Astuces Tech" },
      { id: "code", label: "💻 Code & Scripts" },
      { id: "gaming", label: "🎮 Gaming & 3D" },
      { id: "documents", label: "📚 Documents" },
      { id: "portfolio", label: "💼 Portfolio" },
      { id: "categories", label: "🏷️ Catégories" },
      { id: "profile", label: "🔑 Paramètres & Profil" }
    ];

    const tabsContainer = document.getElementById("admin-tabs");
    tabsContainer.innerHTML = tabs.map(t => `
      <button class="admin-tab-btn ${this.activeTab === t.id ? 'active' : ''}" onclick="adminManager.switchTab('${t.id}')">
        ${t.label}
      </button>
    `).join("") + `
      <button class="admin-tab-btn" style="margin-left: auto; color: #ef4444;" onclick="adminManager.logout()" title="Se déconnecter">
        🚪 Déconnexion
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
      this.refreshAnalytics();
    }
  }

  renderActiveTabContent() {
    const body = document.getElementById("admin-modal-body");
    const data = StorageService.get();

    if (this.activeTab === "analytics") {
      this.renderAnalyticsTab(body, data);
    } else if (this.activeTab === "theme") {
      this.renderThemeTab(body, data);
    } else if (this.activeTab === "news") {
      this.renderNewsTab(body, data);
    } else if (this.activeTab === "cinema") {
      this.renderCinemaTab(body, data);
    } else if (this.activeTab === "projects") {
      this.renderProjectsTab(body, data);
    } else if (this.activeTab === "tips") {
      this.renderTipsTab(body, data);
    } else if (this.activeTab === "code") {
      this.renderCodeTab(body, data);
    } else if (this.activeTab === "gaming") {
      this.renderGamingTab(body, data);
    } else if (this.activeTab === "documents") {
      this.renderDocumentsTab(body, data);
    } else if (this.activeTab === "portfolio") {
      this.renderPortfolioTabContent(body, data);
    } else if (this.activeTab === "categories") {
      this.renderCategoriesTab(body, data);
    } else if (this.activeTab === "profile") {
      this.renderProfileTab(body, data);
    }
  }

  /* -------------------------------------------------------------
   * 1. VISITOR ANALYTICS TAB: REAL-TIME PRESENCE & PAST LOGS
   * ----------------------------------------------------------- */
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

        <!-- APPAREILS CONNECTÉS EN CE MOMENT -->
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

        <!-- STATISTIQUES GLOBALES -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px;">
          <div class="stat-mini-card">
            <span class="stat-mini-val" style="color: #34d399;">${activeLive.length}</span>
            <span class="stat-mini-label">En Direct</span>
          </div>
          <div class="stat-mini-card">
            <span class="stat-mini-val" style="color: #60a5fa;">${totalVisits}</span>
            <span class="stat-mini-label">Visites Totales</span>
          </div>
          <div class="stat-mini-card">
            <span class="stat-mini-val" style="color: #a78bfa;">${mobileVisits}</span>
            <span class="stat-mini-label">Mobiles</span>
          </div>
          <div class="stat-mini-card">
            <span class="stat-mini-val" style="color: #38bdf8;">${desktopVisits}</span>
            <span class="stat-mini-label">Ordinateurs</span>
          </div>
        </div>

        <!-- HISTORIQUE DES VISITES RÉCENTES -->
        <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
          <span>📋 Historique des visites passées</span>
          <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-dim);">${visitors.length} enregistrements</span>
        </h5>

        ${visitors.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 30px; font-size: 0.88rem;">
            Aucun historique de visite enregistré pour l'instant.
          </div>
        ` : `
          <div class="visitor-cards-list">
            ${visitors.slice(0, 30).map(v => `
              <div class="visitor-card-item">
                <div class="visitor-card-header">
                  <span style="font-weight: 600; color: #fff;">${escapeHTML(v.date)} à ${escapeHTML(v.time)}</span>
                  <span class="device-badge">
                    ${this.getDeviceIcon(v.device, v.deviceType)} ${escapeHTML(v.device || 'Inconnu')}
                  </span>
                </div>
                <div class="visitor-card-details">
                  <span>💻 Système: <strong>${escapeHTML(v.os || '')}</strong></span>
                  <span>${this.getBrowserIcon(v.browser)} <strong>${escapeHTML(v.browser || '')}</strong></span>
                  <span>📍 Localisation: <strong>${escapeHTML(v.location || 'Suisse / International')}</strong></span>
                  <span>📱 Écran: ${escapeHTML(v.screen || '')}</span>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;

    // Auto-refresh toutes les 6 secondes dans l'onglet analytics
    if (!this.analyticsPollTimer) {
      this.analyticsPollTimer = setInterval(() => {
        if (this.activeTab === "analytics") {
          const m = document.getElementById("admin-modal");
          if (m && m.classList.contains("active")) {
            this.refreshAnalytics();
          }
        }
      }, 6000);
    }
  }

  async refreshAnalytics() {
    const body = document.getElementById("admin-modal-body");
    if (!body || this.activeTab !== "analytics") return;
    const data = StorageService.get();
    await this.renderAnalyticsTab(body, data);
  }

  clearVisitorLogs() {
    if (!confirm("Voulez-vous effacer tout l'historique des visites ?")) return;
    const data = StorageService.get();
    data.visitors = [];
    StorageService.save(data, false);
    this.refreshAnalytics();
  }

  /* -------------------------------------------------------------
   * 2. CINEMA TAB (FILMS & SÉRIES) - FIRESTORE SYNC
   * ----------------------------------------------------------- */
  renderCinemaTab(body, data) {
    const films = data.cinema || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gérer la Section Cinéma (${films.length} films)</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
              Chaque ajout ou suppression est immédiatement synchronisé en temps réel sur le Cloud et répercuté sur tous les téléphones et ordinateurs.
            </p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddFilmForm()">+ Ajouter un Film</button>
            ${films.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllFilms()" title="Supprimer tous les films du catalogue">
                🗑️ Tout effacer (${films.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="film-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${films.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">🎬</div>
            <p style="margin-bottom: 12px;">Aucun film dans le catalogue pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddFilmForm()">+ Ajouter votre premier film</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${films.map(f => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <img src="${escapeHTML(f.poster)}" style="width: 44px; height: 56px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'">
                  <div>
                    <strong>${escapeHTML(f.title)}</strong> (${escapeHTML(f.year)}) - <span style="color: var(--text-dim);">${escapeHTML(f.director)}</span>
                    <div style="font-size: 0.8rem; color: #fbbf24;">★ ${escapeHTML(f.rating)}</div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteFilm('${f.id}')">
                  Supprimer
                </button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddFilmForm() {
    const c = document.getElementById("film-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter un Film ou Série</h5>
      <form onsubmit="adminManager.saveNewFilm(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Titre du film</label>
            <input type="text" id="new-film-title" class="form-control" required placeholder="Ex: Interstellar">
          </div>
          <div>
            <label class="form-label">Année</label>
            <input type="text" id="new-film-year" class="form-control" required placeholder="Ex: 2014">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Réalisateur</label>
            <input type="text" id="new-film-director" class="form-control" required placeholder="Ex: Christopher Nolan">
          </div>
          <div>
            <label class="form-label">Genre</label>
            <input type="text" id="new-film-genre" class="form-control" required placeholder="Ex: Science-Fiction / Drame">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Format de l'affiche / Ratio</label>
            <select id="new-film-ratio" class="form-control">
              <option value="portrait" selected>Portrait (2:3 — Format Affiche Standard Streaming)</option>
              <option value="landscape">Paysage (16:9 — Bannière Vidéo)</option>
              <option value="square">Carré (1:1 — Jaquette)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Note / 10</label>
            <input type="text" id="new-film-rating" class="form-control" placeholder="Ex: 9.8 / 10">
          </div>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🎬 Affiche / Image du Film (Photo depuis votre appareil ou lien web)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-film-poster-file" accept="image/*" class="form-control" style="background: transparent;" onchange="adminManager.previewImage(this, 'film-poster-preview')">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.8rem;">
              <span>ou lien URL :</span>
              <input type="url" id="new-film-poster" class="form-control" placeholder="https://..." style="flex: 1;" oninput="adminManager.previewUrl(this.value, 'film-poster-preview')">
            </div>
          </div>
          <div id="film-poster-preview" style="display: none; margin-top: 10px; max-height: 180px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle); text-align: center;">
            <img src="" style="max-height: 180px; object-fit: cover; display: inline-block;">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Lien officiel / Fiche IMDb</label>
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
          <button type="submit" id="save-film-submit-btn" class="btn btn-primary btn-sm">Publier sur le Cloud</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#film-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewFilm(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-film-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud en cours...";
    }

    try {
      let posterUrl = document.getElementById("new-film-poster").value.trim();
      const fileInput = document.getElementById("new-film-poster-file");
      if (fileInput && fileInput.files && fileInput.files[0]) {
        posterUrl = await this.compressImage(fileInput.files[0], 640, 640, 0.65);
      }

      if (!posterUrl) {
        posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
      }

      const newFilm = {
        title: document.getElementById("new-film-title").value.trim(),
        director: document.getElementById("new-film-director").value.trim(),
        year: document.getElementById("new-film-year").value.trim(),
        genre: document.getElementById("new-film-genre").value.trim(),
        aspectRatio: document.getElementById("new-film-ratio") ? document.getElementById("new-film-ratio").value : "portrait",
        rating: document.getElementById("new-film-rating").value.trim() || "9.0 / 10",
        poster: posterUrl,
        review: document.getElementById("new-film-review").value.trim(),
        link: document.getElementById("new-film-link").value.trim(),
        trailerUrl: document.getElementById("new-film-trailer").value.trim()
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addFilm(newFilm);
      } else {
        const data = StorageService.get();
        if (!data.cinema) data.cinema = [];
        newFilm.id = "film-" + Date.now();
        data.cinema.unshift(newFilm);
        StorageService.save(data, true);
        this.renderCinemaTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Film enregistré et synchronisé avec succès sur le Cloud !\nIl apparaît immédiatement sur tous vos appareils.");
      const formContainer = document.getElementById("film-form-container");
      if (formContainer) formContainer.style.display = "none";
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteFilm(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce film définitivement du Cloud ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteFilm(id);
      } else {
        const data = StorageService.get();
        data.cinema = (data.cinema || []).filter(f => f.id !== id);
        StorageService.save(data, true);
        this.renderCinemaTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Film supprimé du Cloud et retiré de tous vos appareils !");
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  async deleteAllFilms() {
    const confirmPrompt = confirm("⚠️ Attention : Êtes-vous certain de vouloir supprimer TOUS les films de votre catalogue ?\nCette opération est irréversible et supprimera les films sur tous vos appareils.");
    if (!confirmPrompt) return;

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllFilms();
      }
      const data = StorageService.get();
      data.cinema = [];
      StorageService.save(data, true);
      this.renderCinemaTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Tous les films ont été supprimés avec succès du catalogue et de tous les appareils !");
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 3. PROJECTS TAB - FIRESTORE SYNC
   * ----------------------------------------------------------- */
  renderProjectsTab(body, data) {
    const projs = data.projects || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gérer les Projets & Téléchargements (${projs.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Ajoutez une image d'arrière-plan et des documents pédagogiques téléchargeables.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddProjectForm()">+ Ajouter un Projet</button>
            ${projs.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllProjects()" title="Supprimer tous les projets du catalogue">
                🗑️ Tout effacer (${projs.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="proj-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${projs.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">📁</div>
            <p style="margin-bottom: 12px;">Aucun projet dans le catalogue pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddProjectForm()">+ Ajouter votre premier projet</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${projs.map(p => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
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
        `}
      </div>
    `;
  }

  showAddProjectForm() {
    const c = document.getElementById("proj-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Nouveau Projet & Fichier Téléchargeable</h5>
      <form onsubmit="adminManager.saveNewProject(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Titre du projet</label>
            <input type="text" id="new-proj-title" class="form-control" required placeholder="Ex: Laboratoire Réseau Pédagogique">
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <input type="text" id="new-proj-cat" class="form-control" required placeholder="Ex: Enseignement, Cloud, Sécurité">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Format de l'image / Ratio</label>
            <select id="new-proj-ratio" class="form-control">
              <option value="landscape" selected>Paysage (16:9 — Format Standard)</option>
              <option value="portrait">Portrait (2:3 — Format Affiche)</option>
              <option value="square">Carré (1:1 — Miniature)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Mots-clés / Tags (séparés par des virgules)</label>
            <input type="text" id="new-proj-tags" class="form-control" placeholder="Python, Réseau, Linux, Docker">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description du projet</label>
          <textarea id="new-proj-desc" class="form-control" rows="3" required placeholder="Objectifs et contexte pédagogique..."></textarea>
        </div>

        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🖼️ Image de fond du projet</label>
          <input type="file" id="new-proj-bg-file" accept="image/*" class="form-control" style="background: transparent;">
          <input type="url" id="new-proj-bg-url" class="form-control" placeholder="ou URL de l'image (https://...)" style="margin-top: 8px;">
        </div>

        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">📄 Document / Fichier téléchargeable (PDF, cours, etc.)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-proj-file" class="form-control" style="background: transparent;">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.82rem;">
              <span>ou lien de partage (Google Drive, Dropbox, Web) :</span>
              <input type="url" id="new-proj-file-url" class="form-control" placeholder="https://drive.google.com/file/d/... ou https://..." style="flex: 1;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.82rem; color: var(--text-dim);">Nom du document :</span>
              <input type="text" id="new-proj-file-name" class="form-control" placeholder="programme_ETAP.pdf" style="flex: 1;">
            </div>
          </div>
          <span style="display: block; margin-top: 6px; font-size: 0.78rem; color: var(--text-tertiary);">
            💡 Pour les gros fichiers PDF (plus de 700 Ko), collez simplement un lien de partage Google Drive : 100% gratuit et sans limite de taille !
          </span>
        </div>

        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-proj-submit-btn" class="btn btn-primary btn-sm">Publier le Projet</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#proj-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewProject(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-proj-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud en cours...";
    }

    try {
      const fileInput = document.getElementById("new-proj-file");
      const urlInput = document.getElementById("new-proj-file-url");
      const customNameInput = document.getElementById("new-proj-file-name");
      
      let fileUrl = "";
      let fileName = "";
      let fileSize = "";

      if (urlInput && urlInput.value.trim()) {
        fileUrl = urlInput.value.trim();
        fileName = (customNameInput && customNameInput.value.trim()) || "document.pdf";
        fileSize = "Document Cloud (Google Drive / Web)";
      } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName = file.name;
        fileSize = (file.size / 1024).toFixed(1) + " KB";

        if (file.size > 750 * 1024) {
          throw new Error(`Le fichier « ${fileName} » fait ${fileSize}, ce qui dépasse la limite maximale par document gratuit (750 Ko).\n\n💡 Solution simple et 100% gratuite :\nDéposez votre fichier sur votre Google Drive, copiez le lien de partage et collez-le dans le champ « lien de partage (Google Drive) » juste en dessous !`);
        }

        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }

      let bgImageUrl = document.getElementById("new-proj-bg-url") ? document.getElementById("new-proj-bg-url").value.trim() : "";
      const bgFileInput = document.getElementById("new-proj-bg-file");
      if (bgFileInput && bgFileInput.files && bgFileInput.files[0]) {
        bgImageUrl = await this.compressImage(bgFileInput.files[0], 640, 640, 0.65);
      }

      const tags = document.getElementById("new-proj-tags").value
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newProj = {
        title: document.getElementById("new-proj-title").value.trim(),
        category: document.getElementById("new-proj-cat").value.trim(),
        aspectRatio: document.getElementById("new-proj-ratio") ? document.getElementById("new-proj-ratio").value : "landscape",
        description: document.getElementById("new-proj-desc").value.trim(),
        bgImage: bgImageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80",
        tags: tags.length ? tags : ["Informatique"],
        fileName,
        fileSize,
        fileUrl
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addProject(newProj);
      } else {
        const data = StorageService.get();
        if (!data.projects) data.projects = [];
        newProj.id = "proj-" + Date.now();
        data.projects.unshift(newProj);
        StorageService.save(data, true);
        this.renderProjectsTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Projet publié et synchronisé avec succès sur le Cloud !");
      const c = document.getElementById("proj-form-container");
      if (c) c.style.display = "none";
    } catch (err) {
      console.error(err);
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteProject(id) {
    if (!confirm("Supprimer ce projet définitivement ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteProject(id);
      }
      const data = StorageService.get();
      data.projects = (data.projects || []).filter(p => p.id !== id);
      StorageService.save(data, true);
      this.renderProjectsTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Projet supprimé avec succès du Cloud et de tous vos appareils !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllProjects() {
    const confirmPrompt = confirm("⚠️ Attention : Êtes-vous certain de vouloir supprimer TOUS les projets et documents ?\nCette opération est irréversible et supprimera les projets sur tous vos appareils.");
    if (!confirmPrompt) return;

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllProjects();
      }
      const data = StorageService.get();
      data.projects = [];
      StorageService.save(data, true);
      this.renderProjectsTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Tous les projets ont été supprimés avec succès du Cloud et de tous vos appareils !");
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 4. TECH TIPS TAB - FIRESTORE SYNC
   * ----------------------------------------------------------- */
  renderTipsTab(body, data) {
    const tips = data.techTips || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gérer les Astuces Tech & Code (${tips.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Partagez vos tutoriels, scripts PowerShell/Linux et astuces informatiques.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddTipForm()">+ Ajouter une Astuce</button>
            ${tips.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllTips()" title="Supprimer toutes les astuces tech">
                🗑️ Tout effacer (${tips.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="tip-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${tips.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">💡</div>
            <p style="margin-bottom: 12px;">Aucune astuce publiée pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddTipForm()">+ Ajouter votre première astuce</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${tips.map(t => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div>
                  <span class="badge-tag" style="margin-right: 8px;">${escapeHTML(t.category)}</span>
                  <strong>${escapeHTML(t.title)}</strong>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteTip('${t.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddTipForm() {
    const c = document.getElementById("tip-form-container");
    if (!c) return;
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
          <button type="submit" class="btn btn-primary btn-sm">Publier l'astuce</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#tip-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewTip(e) {
    e.preventDefault();
    try {
      const newTip = {
        title: document.getElementById("new-tip-title").value.trim(),
        category: document.getElementById("new-tip-cat").value.trim(),
        badge: document.getElementById("new-tip-badge").value.trim() || "Nouveau",
        date: new Date().toISOString().split("T")[0],
        summary: document.getElementById("new-tip-summary").value.trim(),
        code: document.getElementById("new-tip-code").value,
        explanation: document.getElementById("new-tip-explanation").value.trim()
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addTip(newTip);
      } else {
        const data = StorageService.get();
        if (!data.techTips) data.techTips = [];
        newTip.id = "tip-" + Date.now();
        data.techTips.unshift(newTip);
        StorageService.save(data, true);
        this.renderTipsTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Astuce publiée et synchronisée avec succès !");
      const c = document.getElementById("tip-form-container");
      if (c) c.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteTip(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette astuce ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteTip(id);
      }
      const data = StorageService.get();
      data.techTips = (data.techTips || []).filter(t => t.id !== id);
      StorageService.save(data, true);
      this.renderTipsTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Astuce supprimée avec succès du Cloud et de tous vos appareils !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllTips() {
    const confirmPrompt = confirm("⚠️ Attention : Êtes-vous certain de vouloir supprimer TOUTES les astuces tech & code ?\nCette opération est irréversible et supprimera les astuces sur tous vos appareils.");
    if (!confirmPrompt) return;

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllTips();
      }
      const data = StorageService.get();
      data.techTips = [];
      StorageService.save(data, true);
      this.renderTipsTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Toutes les astuces ont été supprimées avec succès du Cloud et de tous vos appareils !");
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 5. PROFILE & FIREBASE CLOUD CONFIGURATION TAB
   * ----------------------------------------------------------- */
  renderProfileTab(body, data) {
    const prof = data.profile || {};
    const isFirebase = window.FirebaseBridge && window.FirebaseBridge.isConfigured;
    const currentConfig = (window.firebaseConfig || {});

    body.innerHTML = `
      <div>
        <!-- 1. CLOUD FIREBASE STATUS & CONFIGURATION -->
        <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <h5 style="font-size: 1rem; font-weight: 700; color: #60a5fa; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>🔥</span> Infrastructure Cloud Firebase (2026)
            </h5>
            <span style="font-size: 0.78rem; padding: 4px 10px; border-radius: 999px; font-weight: 600; ${isFirebase ? 'background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);' : 'background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3);'}">
              ${isFirebase ? '🟢 Connecté en temps réel' : '🟡 Configuration requise'}
            </span>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 14px;">
            Projet Firebase actif : <strong style="color: #fff;">${escapeHTML(currentConfig.projectId || 'non configuré')}</strong>.
            Toutes les modifications d'éléments (films, projets, astuces, profil) sont automatiquement propagées en direct sur tous vos appareils via Cloud Firestore.
          </p>

          <details style="background: rgba(0,0,0,0.2); border-radius: var(--radius-md); padding: 10px 14px; border: 1px solid var(--border-subtle);">
            <summary style="font-size: 0.82rem; font-weight: 600; color: #93c5fd; cursor: pointer;">
              ⚙️ Modifier ou coller vos clés de projet Firebase
            </summary>
            <div style="margin-top: 14px;">
              <p style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 8px;">
                Collez ici l'objet <code>firebaseConfig</code> copié depuis votre console Firebase (Paramètres du projet > Vos applications > Web) :
              </p>
              <textarea id="firebase-custom-config-json" class="form-control" rows="6" style="font-family: monospace; font-size: 0.8rem;" placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "votre-projet.firebaseapp.com",\n  "projectId": "votre-projet",\n  "storageBucket": "votre-projet.appspot.com",\n  "messagingSenderId": "1234567890",\n  "appId": "1:1234567890:web:..."\n}'></textarea>
              <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                <button type="button" class="btn btn-primary btn-sm" onclick="adminManager.saveFirebaseConfigFromUI()">
                  💾 Enregistrer et activer Firebase
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="adminManager.resetFirebaseConfigFromUI()">
                  🔄 Réinitialiser
                </button>
              </div>
            </div>
          </details>
        </div>

        <!-- 2. INFORMATIONS PERSONNELLES -->
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Informations Personnelles & Biographie</h4>
        <form onsubmit="adminManager.saveProfileInfo(event)" style="margin-bottom: 28px;">
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
          <button type="submit" class="btn btn-primary btn-sm">Enregistrer le profil sur le Cloud</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 28px 0;">

        <!-- 3. MOT DE PASSE HORS-LIGNE / LOCAL -->
        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">🔐 Mot de passe de secours local</h5>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Ce mot de passe est utilisé en mode de secours ou lorsque Firebase n'est pas actif.
        </p>
        <form onsubmit="adminManager.changePassword(event)" style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 28px;">
          <div style="flex: 1; min-width: 220px;">
            <label class="form-label">Nouveau mot de passe secret</label>
            <input type="password" id="new-admin-pass" class="form-control" required placeholder="Votre nouveau mot de passe">
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Mettre à jour</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 28px 0;">

        <!-- 4. SAUVEGARDE & EXPORT -->
        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Exporter / Sauvegarder les données</h5>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Téléchargez une copie intégrale de votre portfolio en fichier JSON.
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

  saveFirebaseConfigFromUI() {
    const textarea = document.getElementById("firebase-custom-config-json");
    if (!textarea || !textarea.value.trim()) {
      alert("Veuillez coller le JSON de configuration Firebase.");
      return;
    }
    try {
      let raw = textarea.value.trim();
      // Permettre de coller soit du pur JSON, soit const firebaseConfig = { ... }
      if (raw.includes("=")) {
        raw = raw.substring(raw.indexOf("=") + 1).replace(/;$/, "").trim();
      }
      // Corriger les clés non-quotées si c'est du JS objet
      raw = raw.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/'/g, '"');
      const parsed = JSON.parse(raw);

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("L'objet de configuration doit au minimum comporter apiKey et projectId.");
      }

      if (window.FirebaseBridge) {
        window.FirebaseBridge.saveCustomConfig(parsed);
      } else {
        localStorage.setItem("nicaisse_custom_firebase_config", JSON.stringify(parsed));
        window.location.reload();
      }
    } catch (e) {
      alert("Erreur dans le format de configuration : " + e.message + "\nAssurez-vous de copier l'objet firebaseConfig complet.");
    }
  }

  resetFirebaseConfigFromUI() {
    if (!confirm("Réinitialiser la configuration Firebase ?")) return;
    if (window.FirebaseBridge) {
      window.FirebaseBridge.resetCustomConfig();
    } else {
      localStorage.removeItem("nicaisse_custom_firebase_config");
      window.location.reload();
    }
  }

  async saveProfileInfo(e) {
    e.preventDefault();
    const data = StorageService.get();
    data.profile.name = document.getElementById("prof-name").value.trim();
    data.profile.availability = document.getElementById("prof-avail").value.trim();
    data.profile.tagline = document.getElementById("prof-tagline").value.trim();
    data.profile.bio = document.getElementById("prof-bio").value.trim();

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.updateProfile(data.profile);
      }
      StorageService.save(data, true);
      alert("✅ Profil mis à jour et synchronisé sur le Cloud !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
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
    alert("✅ Mot de passe secret mis à jour avec succès !");
    document.getElementById("new-admin-pass").value = "";
  }

  /* -------------------------------------------------------------
   * 6. THEME, NEON & BACKGROUNDS CUSTOMIZATION CMS
   * ----------------------------------------------------------- */
  renderThemeTab(body, data) {
    const theme = data.theme || { primary: "#00d2ff", glow: "rgba(0, 210, 255, 0.45)", border: "rgba(0, 210, 255, 0.3)" };
    const bgs = data.backgrounds || {};
    const platform = data.platform || {
      name: "Outlook Studio",
      creator: "Auberson",
      tagline: "Plateforme technologique, cinéma & ressources",
      whatsapp: "+509 31 84 93 85",
      phone: "+509 55 55 85 50",
      email: "contact@nicaisseauberson.ch"
    };

    const colorPresets = [
      { name: "Cyan Cyberpunk (Défaut)", hex: "#00d2ff", glow: "rgba(0, 210, 255, 0.45)", border: "rgba(0, 210, 255, 0.3)" },
      { name: "Bleu Électrique", hex: "#3b82f6", glow: "rgba(59, 130, 246, 0.45)", border: "rgba(59, 130, 246, 0.3)" },
      { name: "Violet Cyber", hex: "#a855f7", glow: "rgba(168, 85, 247, 0.45)", border: "rgba(168, 85, 247, 0.3)" },
      { name: "Rouge Radiant", hex: "#ef4444", glow: "rgba(239, 68, 68, 0.45)", border: "rgba(239, 68, 68, 0.3)" },
      { name: "Vert Matrix", hex: "#10b981", glow: "rgba(16, 185, 129, 0.45)", border: "rgba(16, 185, 129, 0.3)" },
      { name: "Rose Néon", hex: "#ec4899", glow: "rgba(236, 72, 153, 0.45)", border: "rgba(236, 72, 153, 0.3)" },
      { name: "Ambre Doré", hex: "#f59e0b", glow: "rgba(245, 158, 11, 0.45)", border: "rgba(245, 158, 11, 0.3)" }
    ];

    body.innerHTML = `
      <div>
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
            <span>🎨</span> Personnalisation & Thème Néon (Temps Réel Cloud)
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
            Modifiez la couleur d'accentuation néon du site, les arrière-plans par catégorie et les coordonnées publiques d'Outlook Studio.
          </p>
        </div>

        <!-- 1. COULEUR NÉON ACCUEIL & SITE -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 24px;">
          <h5 style="font-size: 0.98rem; font-weight: 700; margin-bottom: 12px; color: #fff; display: flex; align-items: center; gap: 8px;">
            <span>💡</span> Couleur Néon de l'Accueil & Effets Lumineux
          </h5>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
            Sélectionnez une nuance néon prédéfinie ou choisissez librement votre code couleur :
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px;">
            ${colorPresets.map(p => `
              <button type="button" class="btn btn-sm" onclick="adminManager.applyNeonPreset('${p.hex}', '${p.glow}', '${p.border}')" style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; background: rgba(255,255,255,0.03); border: 1px solid ${theme.primary === p.hex ? p.hex : 'var(--border-subtle)'}; color: #fff; border-radius: 8px; padding: 8px 10px; cursor: pointer;">
                <span style="width: 14px; height: 14px; border-radius: 50%; background: ${p.hex}; box-shadow: 0 0 8px ${p.hex}; display: inline-block;"></span>
                <span style="font-size: 0.78rem; font-weight: 600;">${p.name}</span>
              </button>
            `).join("")}
          </div>

          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 12px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <label class="form-label" style="margin: 0; font-size: 0.82rem;">Couleur personnalisée :</label>
              <input type="color" id="neon-custom-color" value="${theme.primary || '#00d2ff'}" onchange="adminManager.onCustomColorPick(this.value)" style="width: 44px; height: 36px; border: none; border-radius: 6px; cursor: pointer; background: transparent;">
            </div>
            <div style="flex: 1; min-width: 180px;">
              <input type="text" id="neon-custom-hex" class="form-control form-control-sm" value="${theme.primary || '#00d2ff'}" readonly style="font-family: monospace; font-weight: 700; color: var(--neon-primary, #00d2ff);">
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="adminManager.saveThemeSettings()">
              💾 Sauvegarder la couleur sur le Cloud
            </button>
          </div>
        </div>

        <!-- 2. GESTION DES ARRIÈRE-PLANS PAR CATÉGORIE -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 24px;">
          <h5 style="font-size: 0.98rem; font-weight: 700; margin-bottom: 8px; color: #fff; display: flex; align-items: center; gap: 8px;">
            <span>🖼️</span> Arrière-plans des Vues & Rubriques
          </h5>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
            Définissez l'image de bannière d'en-tête pour chacune des rubriques indépendantes d'Outlook Studio :
          </p>

          <form onsubmit="adminManager.saveBackgroundSettings(event)">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 16px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">🎬 Cinéma & Séries</label>
                <input type="url" id="bg-cinema" class="form-control form-control-sm" value="${escapeHTML(bgs.cinema || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">📰 Actualités & Nouveautés</label>
                <input type="url" id="bg-actualites" class="form-control form-control-sm" value="${escapeHTML(bgs.actualites || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">📁 Projets & Documents</label>
                <input type="url" id="bg-projets" class="form-control form-control-sm" value="${escapeHTML(bgs.projets || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">💡 Astuces Tech</label>
                <input type="url" id="bg-astuces" class="form-control form-control-sm" value="${escapeHTML(bgs.astuces || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">💻 Programmation & Code</label>
                <input type="url" id="bg-code" class="form-control form-control-sm" value="${escapeHTML(bgs.code || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">🎮 Culture Jeux Vidéo</label>
                <input type="url" id="bg-gaming" class="form-control form-control-sm" value="${escapeHTML(bgs.gaming || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">📚 Ressources & Bibliothèque</label>
                <input type="url" id="bg-documents" class="form-control form-control-sm" value="${escapeHTML(bgs.documents || '')}" placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">📬 Page Contact Direct</label>
                <input type="url" id="bg-contact" class="form-control form-control-sm" value="${escapeHTML(bgs.contact || '')}" placeholder="https://images.unsplash.com/...">
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-sm">
              💾 Enregistrer les arrière-plans sur le Cloud
            </button>
          </form>
        </div>

        <!-- 3. COORDONNÉES & IDENTITÉ DU SITE -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px;">
          <h5 style="font-size: 0.98rem; font-weight: 700; margin-bottom: 8px; color: #fff; display: flex; align-items: center; gap: 8px;">
            <span>🌐</span> Coordonnées Directes & Identité Publique
          </h5>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
            Informations affichées sur la page Contact, dans le Header et dans le Footer :
          </p>

          <form onsubmit="adminManager.savePlatformSettings(event)">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">Nom Officiel du Site</label>
                <input type="text" id="plat-name" class="form-control" value="${escapeHTML(platform.name || 'Outlook Studio')}" required>
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">Créé & Développé par</label>
                <input type="text" id="plat-creator" class="form-control" value="${escapeHTML(platform.creator || 'Auberson')}" required>
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">WhatsApp Direct</label>
                <input type="text" id="plat-whatsapp" class="form-control" value="${escapeHTML(platform.whatsapp || '+509 31 84 93 85')}" required>
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.82rem;">Téléphone Direct</label>
                <input type="text" id="plat-phone" class="form-control" value="${escapeHTML(platform.phone || '+509 55 55 85 50')}" required>
              </div>

              <div class="form-group" style="margin: 0; grid-column: 1 / -1;">
                <label class="form-label" style="font-size: 0.82rem;">Email Officiel</label>
                <input type="email" id="plat-email" class="form-control" value="${escapeHTML(platform.email || 'contact@nicaisseauberson.ch')}" required>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-sm">
              💾 Enregistrer les coordonnées sur le Cloud
            </button>
          </form>
        </div>
      </div>
    `;
  }

  applyNeonPreset(hex, glow, border) {
    document.documentElement.style.setProperty("--neon-primary", hex);
    document.documentElement.style.setProperty("--neon-glow", glow);
    document.documentElement.style.setProperty("--neon-border", border);
    const hexInput = document.getElementById("neon-custom-hex");
    const colInput = document.getElementById("neon-custom-color");
    if (hexInput) hexInput.value = hex;
    if (colInput) colInput.value = hex;
    this._currentNeonTheme = { primary: hex, glow, border };
  }

  onCustomColorPick(hex) {
    const rgb = this.hexToRgb(hex) || { r: 0, g: 210, b: 255 };
    const glow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;
    const border = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    this.applyNeonPreset(hex, glow, border);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  async saveThemeSettings() {
    const theme = this._currentNeonTheme || {
      primary: document.getElementById("neon-custom-hex").value || "#00d2ff",
      glow: "rgba(0, 210, 255, 0.45)",
      border: "rgba(0, 210, 255, 0.3)"
    };

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.updateTheme(theme);
      }
      const data = StorageService.get();
      data.theme = theme;
      StorageService.save(data, true);
      alert("✅ Thème Néon enregistré et synchronisé avec succès sur le Cloud !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async saveBackgroundSettings(e) {
    e.preventDefault();
    const backgrounds = {
      cinema: document.getElementById("bg-cinema").value.trim(),
      actualites: document.getElementById("bg-actualites").value.trim(),
      projets: document.getElementById("bg-projets").value.trim(),
      astuces: document.getElementById("bg-astuces").value.trim(),
      code: document.getElementById("bg-code").value.trim(),
      gaming: document.getElementById("bg-gaming").value.trim(),
      documents: document.getElementById("bg-documents").value.trim(),
      contact: document.getElementById("bg-contact").value.trim()
    };

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.updateBackgrounds(backgrounds);
      }
      const data = StorageService.get();
      data.backgrounds = backgrounds;
      StorageService.save(data, true);
      alert("✅ Arrière-plans des rubriques enregistrés sur le Cloud !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async savePlatformSettings(e) {
    e.preventDefault();
    const platform = {
      name: document.getElementById("plat-name").value.trim(),
      creator: document.getElementById("plat-creator").value.trim(),
      whatsapp: document.getElementById("plat-whatsapp").value.trim(),
      phone: document.getElementById("plat-phone").value.trim(),
      email: document.getElementById("plat-email").value.trim()
    };

    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.updatePlatform(platform);
      }
      const data = StorageService.get();
      data.platform = platform;
      StorageService.save(data, true);
      alert("✅ Coordonnées et identité mises à jour sur le Cloud !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 7. NEWS CMS TAB
   * ----------------------------------------------------------- */
  renderNewsTab(body, data) {
    const news = data.news || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gestion des Actualités (${news.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Publiez des articles, nouveautés tech, annonces et veille technologique.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddNewsForm()">+ Rédiger une Actualité</button>
            ${news.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllNews()" title="Supprimer toutes les actualités">
                🗑️ Tout effacer (${news.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="news-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${news.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">📰</div>
            <p style="margin-bottom: 12px;">Aucun article d'actualité pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddNewsForm()">+ Publier la première actualité</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${news.map(n => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <img src="${escapeHTML(n.image || '')}" style="width: 50px; height: 38px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'">
                  <div>
                    <strong>${escapeHTML(n.title)}</strong> <span style="font-size: 0.8rem; color: var(--neon-primary, #00d2ff);">[${escapeHTML(n.category || 'Tech')}]</span>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(n.date || '')}</div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteNews('${n.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddNewsForm() {
    const c = document.getElementById("news-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Nouvel Article d'Actualité</h5>
      <form onsubmit="adminManager.saveNewNews(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Titre de l'article</label>
            <input type="text" id="new-news-title" class="form-control" required placeholder="Ex: Gemini 2.5 : La révolution de l'intelligence artificielle">
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <select id="new-news-cat" class="form-control">
              <option value="Tech" selected>Tech & Innovation</option>
              <option value="Intelligence Artificielle">Intelligence Artificielle</option>
              <option value="Programmation">Programmation & Code</option>
              <option value="Cinéma">Cinéma & Séries</option>
              <option value="Jeux Vidéo">Jeux Vidéo</option>
              <option value="Éducation">Éducation & Outils</option>
              <option value="Annonce">Annonce Officielle</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Résumé court (affiché sur la carte d'actualité)</label>
          <input type="text" id="new-news-summary" class="form-control" required placeholder="Une synthèse percutante en 1 ou 2 phrases...">
        </div>
        <div class="form-group">
          <label class="form-label">Contenu complet de l'article</label>
          <textarea id="new-news-content" class="form-control" rows="5" required placeholder="Rédigez l'article complet ici..."></textarea>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🖼️ Image de couverture</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-news-img-file" accept="image/*" class="form-control" style="background: transparent;" onchange="adminManager.previewImage(this, 'news-img-preview')">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.8rem;">
              <span>ou lien URL :</span>
              <input type="url" id="new-news-img-url" class="form-control" placeholder="https://..." style="flex: 1;" oninput="adminManager.previewUrl(this.value, 'news-img-preview')">
            </div>
          </div>
          <div id="news-img-preview" style="display: none; margin-top: 10px; max-height: 160px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle); text-align: center;">
            <img src="" style="max-height: 160px; object-fit: cover; display: inline-block;">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Mots-clés / Tags (séparés par virgules)</label>
            <input type="text" id="new-news-tags" class="form-control" placeholder="IA, Google, Futur, 2026">
          </div>
          <div>
            <label class="form-label">Lien externe / Source (optionnel)</label>
            <input type="url" id="new-news-link" class="form-control" placeholder="https://...">
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-news-submit-btn" class="btn btn-primary btn-sm">Publier l'Actualité</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#news-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewNews(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-news-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud...";
    }

    try {
      let imgUrl = document.getElementById("new-news-img-url") ? document.getElementById("new-news-img-url").value.trim() : "";
      const imgFileInput = document.getElementById("new-news-img-file");
      if (imgFileInput && imgFileInput.files && imgFileInput.files[0]) {
        imgUrl = await this.compressImage(imgFileInput.files[0], 720, 720, 0.7);
      }

      if (!imgUrl) {
        imgUrl = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80";
      }

      const tags = document.getElementById("new-news-tags").value
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newArticle = {
        title: document.getElementById("new-news-title").value.trim(),
        category: document.getElementById("new-news-cat").value,
        summary: document.getElementById("new-news-summary").value.trim(),
        content: document.getElementById("new-news-content").value.trim(),
        image: imgUrl,
        date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        tags: tags.length ? tags : ["Actualité"],
        link: document.getElementById("new-news-link") ? document.getElementById("new-news-link").value.trim() : ""
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addNews(newArticle);
      } else {
        const data = StorageService.get();
        if (!data.news) data.news = [];
        newArticle.id = "news-" + Date.now();
        data.news.unshift(newArticle);
        StorageService.save(data, true);
        this.renderNewsTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Actualité publiée et synchronisée avec succès sur le Cloud !");
      const formContainer = document.getElementById("news-form-container");
      if (formContainer) formContainer.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteNews(id) {
    if (!confirm("Supprimer cette actualité du Cloud ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteNews(id);
      } else {
        const data = StorageService.get();
        data.news = (data.news || []).filter(n => n.id !== id);
        StorageService.save(data, true);
        this.renderNewsTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Actualité supprimée !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllNews() {
    if (!confirm("⚠️ Supprimer TOUTES les actualités ? Cette action est irréversible.")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllNews();
      }
      const data = StorageService.get();
      data.news = [];
      StorageService.save(data, true);
      this.renderNewsTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Toutes les actualités ont été supprimées.");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 8. EXTENSIBLE CATEGORIES CMS TAB
   * ----------------------------------------------------------- */
  renderCategoriesTab(body, data) {
    const customCats = data.customCategories || [];
    const coreCats = [
      { id: "cinema", name: "Cinéma & Séries", icon: "🎬", desc: "Streaming, fiches et bandes-annonces" },
      { id: "actualites", name: "Actualités", icon: "📰", desc: "Nouveautés tech, annonces et veille" },
      { id: "projets", name: "Projets & Documents", icon: "📁", desc: "Logiciels, scripts et ressources téléchargeables" },
      { id: "astuces", name: "Astuces Tech", icon: "💡", desc: "Tips productivité, commandes et tutoriels" },
      { id: "code", name: "Programmation & Code", icon: "💻", desc: "Snippets, langages et bibliothèques" },
      { id: "gaming", name: "Culture Gaming", icon: "🎮", desc: "Moteurs 3D, actualité jeux et tech vidéoludique" },
      { id: "documents", name: "Bibliothèque de Docs", icon: "📚", desc: "Guides pédagogiques, manuels et livres" },
      { id: "contact", name: "Contact Direct", icon: "📬", desc: "WhatsApp, Téléphone et Email" }
    ];

    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Catégories & Rubriques de la Plateforme</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Gérez les sections de base et ajoutez de nouvelles catégories personnalisées.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddCategoryForm()">+ Ajouter une Catégorie</button>
        </div>

        <div id="cat-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: var(--text-secondary);">Rubriques Principales (Système)</h5>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; margin-bottom: 28px;">
          ${coreCats.map(c => `
            <div style="padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.25rem;">${c.icon}</span>
                <strong style="font-size: 0.92rem; color: #fff;">${c.name}</strong>
                <span style="font-size: 0.7rem; background: rgba(59,130,246,0.15); color: #60a5fa; padding: 2px 6px; border-radius: 4px; margin-left: auto;">Fixe</span>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-dim); margin: 0;">${c.desc}</p>
            </div>
          `).join("")}
        </div>

        <h5 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: var(--text-secondary);">Catégories Personnalisées Ajoutées (${customCats.length})</h5>
        ${customCats.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 24px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); font-size: 0.85rem;">
            Aucune catégorie personnalisée créée. Vous pouvez en créer pour enrichir Outlook Studio !
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${customCats.map(c => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.4rem;">${escapeHTML(c.icon || '📌')}</span>
                  <div>
                    <strong style="color: #fff;">${escapeHTML(c.name)}</strong> <span style="font-size: 0.78rem; color: var(--text-dim);">[#/${escapeHTML(c.slug || '')}]</span>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(c.description || '')}</div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteCategory('${c.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddCategoryForm() {
    const c = document.getElementById("cat-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter une Nouvelle Catégorie</h5>
      <form onsubmit="adminManager.saveNewCategory(event)">
        <div class="form-group form-row-3">
          <div>
            <label class="form-label">Nom de la catégorie</label>
            <input type="text" id="new-cat-name" class="form-control" required placeholder="Ex: Tutoriels Vidéo">
          </div>
          <div>
            <label class="form-label">Identifiant URL (Slug)</label>
            <input type="text" id="new-cat-slug" class="form-control" required placeholder="Ex: tutoriels-video">
          </div>
          <div>
            <label class="form-label">Icône (Emoji)</label>
            <input type="text" id="new-cat-icon" class="form-control" required placeholder="Ex: 🎥" style="text-align: center;">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description courte</label>
          <input type="text" id="new-cat-desc" class="form-control" placeholder="Objectifs et contenu de cette catégorie...">
        </div>
        <div class="form-group">
          <label class="form-label">Image d'arrière-plan de bannière (URL)</label>
          <input type="url" id="new-cat-bg" class="form-control" placeholder="https://images.unsplash.com/...">
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-cat-submit-btn" class="btn btn-primary btn-sm">Créer la Catégorie</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#cat-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewCategory(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-cat-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Création Cloud...";
    }

    try {
      const rawSlug = document.getElementById("new-cat-slug").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      const newCat = {
        name: document.getElementById("new-cat-name").value.trim(),
        slug: rawSlug || "cat-" + Date.now(),
        icon: document.getElementById("new-cat-icon").value.trim() || "📌",
        description: document.getElementById("new-cat-desc").value.trim(),
        bgImage: document.getElementById("new-cat-bg").value.trim() || ""
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addCategory(newCat);
      } else {
        const data = StorageService.get();
        if (!data.customCategories) data.customCategories = [];
        newCat.id = "cat-" + Date.now();
        data.customCategories.push(newCat);
        StorageService.save(data, true);
        this.renderCategoriesTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Catégorie créée avec succès sur le Cloud !");
      const formContainer = document.getElementById("cat-form-container");
      if (formContainer) formContainer.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteCategory(id) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteCategory(id);
      } else {
        const data = StorageService.get();
        data.customCategories = (data.customCategories || []).filter(c => c.id !== id);
        StorageService.save(data, true);
        this.renderCategoriesTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Catégorie supprimée !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 9. CODE SNIPPETS & SCRIPTS CMS TAB
   * ----------------------------------------------------------- */
  renderCodeTab(body, data) {
    const snippets = data.code || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gestion des Scripts & Snippets (${snippets.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Ajoutez des scripts, commandes PowerShell, Bash, Python ou snippets web avec coloration et bouton de copie.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddCodeForm()">+ Ajouter un Script</button>
            ${snippets.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllCode()" title="Supprimer tous les snippets">
                🗑️ Tout effacer (${snippets.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="code-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${snippets.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">💻</div>
            <p style="margin-bottom: 12px;">Aucun snippet de code publié pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddCodeForm()">+ Ajouter votre premier script</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${snippets.map(s => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-family: monospace; font-size: 0.75rem; background: rgba(0, 210, 255, 0.12); color: var(--neon-primary, #00d2ff); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(0, 210, 255, 0.25);">
                    ${escapeHTML(s.language || 'Code')}
                  </span>
                  <div>
                    <strong>${escapeHTML(s.title)}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(s.category || 'Général')} • ${(s.code || '').split('\n').length} lignes</div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteCode('${s.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddCodeForm() {
    const c = document.getElementById("code-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter un Snippet de Code / Script</h5>
      <form onsubmit="adminManager.saveNewCode(event)">
        <div class="form-group form-row-3">
          <div>
            <label class="form-label">Titre du script</label>
            <input type="text" id="new-code-title" class="form-control" required placeholder="Ex: Backup automatique PostgreSQL vers S3">
          </div>
          <div>
            <label class="form-label">Langage</label>
            <select id="new-code-lang" class="form-control">
              <option value="Bash / Shell" selected>Bash / Shell</option>
              <option value="PowerShell">PowerShell</option>
              <option value="Python">Python</option>
              <option value="JavaScript / Node">JavaScript / Node</option>
              <option value="TypeScript">TypeScript</option>
              <option value="HTML / CSS">HTML / CSS</option>
              <option value="SQL">SQL</option>
              <option value="Docker / Compose">Docker / Compose</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <input type="text" id="new-code-cat" class="form-control" placeholder="DevOps, Cloud, Scripting, Web" value="DevOps">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description / Contexte d'utilisation</label>
          <input type="text" id="new-code-desc" class="form-control" required placeholder="Ce que fait ce script et comment l'exécuter...">
        </div>
        <div class="form-group">
          <label class="form-label">Code source / Commandes</label>
          <textarea id="new-code-content" class="form-control" rows="8" required style="font-family: monospace; font-size: 0.85rem; line-height: 1.4; tab-size: 2;" placeholder="#!/bin/bash&#10;# Entrez le code ici..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tags / Mots-clés (séparés par virgules)</label>
          <input type="text" id="new-code-tags" class="form-control" placeholder="Automation, Cloud, Backup, Shell">
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-code-submit-btn" class="btn btn-primary btn-sm">Publier le Script</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#code-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewCode(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-code-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud...";
    }

    try {
      const tags = (document.getElementById("new-code-tags").value || "")
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const snippet = {
        title: document.getElementById("new-code-title").value.trim(),
        language: document.getElementById("new-code-lang").value,
        category: document.getElementById("new-code-cat").value.trim() || "DevOps",
        description: document.getElementById("new-code-desc").value.trim(),
        code: document.getElementById("new-code-content").value,
        tags: tags.length ? tags : ["Code"]
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addCodeSnippet(snippet);
      } else {
        const data = StorageService.get();
        if (!data.code) data.code = [];
        snippet.id = "code-" + Date.now();
        data.code.unshift(snippet);
        StorageService.save(data, true);
        this.renderCodeTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Script de code publié avec succès sur le Cloud !");
      const c = document.getElementById("code-form-container");
      if (c) c.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteCode(id) {
    if (!confirm("Supprimer ce snippet du Cloud ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteCodeSnippet(id);
      } else {
        const data = StorageService.get();
        data.code = (data.code || []).filter(s => s.id !== id);
        StorageService.save(data, true);
        this.renderCodeTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Script supprimé avec succès !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllCode() {
    if (!confirm("⚠️ Supprimer TOUS les snippets de code ? Cette action est irréversible.")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllCodeSnippets();
      }
      const data = StorageService.get();
      data.code = [];
      StorageService.save(data, true);
      this.renderCodeTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Tous les snippets de code ont été supprimés.");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 10. GAMING & 3D CMS TAB
   * ----------------------------------------------------------- */
  renderGamingTab(body, data) {
    const games = data.gaming || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gestion Gaming, 3D & Tech Vidéoludique (${games.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Ajoutez des jeux, analyses graphiques, moteurs 3D (Unreal/Unity) et tests matériels.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddGamingForm()">+ Ajouter un Titre / Démo</button>
            ${games.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllGaming()" title="Supprimer tous les éléments gaming">
                🗑️ Tout effacer (${games.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="gaming-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${games.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,200,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">🎮</div>
            <p style="margin-bottom: 12px;">Aucun élément gaming publié pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddGamingForm()">+ Ajouter un premier titre</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${games.map(g => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <img src="${escapeHTML(g.image || '')}" style="width: 50px; height: 38px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'">
                  <div>
                    <strong>${escapeHTML(g.title)}</strong> <span style="font-size: 0.8rem; color: #a855f7;">[${escapeHTML(g.category || 'Gaming')}]</span>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(g.platform || 'PC')} • <span style="color: #fbbf24;">★ ${escapeHTML(g.rating || '9/10')}</span></div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteGaming('${g.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddGamingForm() {
    const c = document.getElementById("gaming-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter un Jeu, Moteur 3D ou Projet Graphique</h5>
      <form onsubmit="adminManager.saveNewGaming(event)">
        <div class="form-group form-row-3">
          <div>
            <label class="form-label">Titre</label>
            <input type="text" id="new-game-title" class="form-control" required placeholder="Ex: Black Myth: Wukong (Analyse UE5)">
          </div>
          <div>
            <label class="form-label">Genre / Domaine</label>
            <select id="new-game-cat" class="form-control">
              <option value="Action / RPG" selected>Action / RPG</option>
              <option value="Moteur 3D (Unreal/Unity)">Moteur 3D (Unreal / Unity)</option>
              <option value="Simulation / Stratégie">Simulation / Stratégie</option>
              <option value="VR & Graphismes Avancés">VR & Graphismes Avancés</option>
              <option value="Hardware & Benchmarks">Hardware & Benchmarks</option>
              <option value="Rétrogaming & Emulation">Rétrogaming & Émulation</option>
            </select>
          </div>
          <div>
            <label class="form-label">Plateforme</label>
            <input type="text" id="new-game-platform" class="form-control" value="PC / Steam, PS5" placeholder="PC, PS5, Xbox, WebGL">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Note / Appréciation</label>
            <input type="text" id="new-game-rating" class="form-control" value="9.5 / 10" placeholder="Ex: 9.5 / 10 ou Chef d'oeuvre">
          </div>
          <div>
            <label class="form-label">Lien Bande-Annonce / Vidéo (YouTube)</label>
            <input type="url" id="new-game-trailer" class="form-control" placeholder="https://www.youtube.com/watch?v=...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Résumé / Analyse technique</label>
          <textarea id="new-game-summary" class="form-control" rows="3" required placeholder="Présentation, benchmarks de performance, avis technique..."></textarea>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🖼️ Image ou Affiche (Photo ou lien URL)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-game-img-file" accept="image/*" class="form-control" style="background: transparent;" onchange="adminManager.previewImage(this, 'game-img-preview')">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.8rem;">
              <span>ou lien URL :</span>
              <input type="url" id="new-game-img-url" class="form-control" placeholder="https://..." style="flex: 1;" oninput="adminManager.previewUrl(this.value, 'game-img-preview')">
            </div>
          </div>
          <div id="game-img-preview" style="display: none; margin-top: 10px; max-height: 160px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle); text-align: center;">
            <img src="" style="max-height: 160px; object-fit: cover; display: inline-block;">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tags / Mots-clés (séparés par virgules)</label>
          <input type="text" id="new-game-tags" class="form-control" placeholder="Ray Tracing, UE5, DLSS 3.5, 4K">
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-game-submit-btn" class="btn btn-primary btn-sm">Publier le Titre</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#gaming-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewGaming(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-game-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud...";
    }

    try {
      let imgUrl = document.getElementById("new-game-img-url") ? document.getElementById("new-game-img-url").value.trim() : "";
      const imgFileInput = document.getElementById("new-game-img-file");
      if (imgFileInput && imgFileInput.files && imgFileInput.files[0]) {
        imgUrl = await this.compressImage(imgFileInput.files[0], 720, 720, 0.7);
      }
      if (!imgUrl) {
        imgUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80";
      }

      const tags = (document.getElementById("new-game-tags").value || "")
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const gameItem = {
        title: document.getElementById("new-game-title").value.trim(),
        category: document.getElementById("new-game-cat").value,
        platform: document.getElementById("new-game-platform").value.trim(),
        rating: document.getElementById("new-game-rating").value.trim(),
        trailerUrl: document.getElementById("new-game-trailer").value.trim(),
        summary: document.getElementById("new-game-summary").value.trim(),
        image: imgUrl,
        tags: tags.length ? tags : ["Gaming"]
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addGaming(gameItem);
      } else {
        const data = StorageService.get();
        if (!data.gaming) data.gaming = [];
        gameItem.id = "game-" + Date.now();
        data.gaming.unshift(gameItem);
        StorageService.save(data, true);
        this.renderGamingTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Titre Gaming publié avec succès sur le Cloud !");
      const c = document.getElementById("gaming-form-container");
      if (c) c.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteGaming(id) {
    if (!confirm("Supprimer cet élément Gaming ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteGaming(id);
      } else {
        const data = StorageService.get();
        data.gaming = (data.gaming || []).filter(g => g.id !== id);
        StorageService.save(data, true);
        this.renderGamingTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Élément supprimé !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllGaming() {
    if (!confirm("⚠️ Supprimer TOUS les éléments Gaming ? Cette action est irréversible.")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllGaming();
      }
      const data = StorageService.get();
      data.gaming = [];
      StorageService.save(data, true);
      this.renderGamingTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Tous les éléments Gaming ont été supprimés.");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 11. DOCUMENTS & RESSOURCES CMS TAB
   * ----------------------------------------------------------- */
  renderDocumentsTab(body, data) {
    const docs = data.documents || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Bibliothèque de Documents & Ressources (${docs.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Partagez des guides complets, livres blancs, manuels pédagogiques et cours avec téléchargement direct ou lien Google Drive.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddDocumentForm()">+ Déposer un Document</button>
            ${docs.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllDocuments()" title="Supprimer tous les documents">
                🗑️ Tout effacer (${docs.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="doc-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${docs.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">📚</div>
            <p style="margin-bottom: 12px;">Aucun document dans la bibliothèque pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddDocumentForm()">+ Ajouter un premier document</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${docs.map(d => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="font-size: 1.8rem;">📕</span>
                  <div>
                    <strong>${escapeHTML(d.title)}</strong> <span style="font-size: 0.8rem; color: #10b981;">[${escapeHTML(d.category || 'Documentation')}]</span>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(d.fileName || 'Fichier')} • ${escapeHTML(d.fileSize || 'PDF')}</div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deleteDocument('${d.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddDocumentForm() {
    const c = document.getElementById("doc-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter un Document ou Guide Téléchargeable</h5>
      <form onsubmit="adminManager.saveNewDocument(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Titre du document</label>
            <input type="text" id="new-doc-title" class="form-control" required placeholder="Ex: Manuel Complet Administration Windows Server 2026">
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <select id="new-doc-cat" class="form-control">
              <option value="Guide Pédagogique" selected>Guide Pédagogique</option>
              <option value="Manuel Technique">Manuel Technique</option>
              <option value="Livre Blanc">Livre Blanc</option>
              <option value="Fiche Pratique & Synthèse">Fiche Pratique & Synthèse</option>
              <option value="Cours & Support">Cours & Support</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description du contenu</label>
          <textarea id="new-doc-desc" class="form-control" rows="3" required placeholder="Présentation synthétique du document, public visé et prérequis..."></textarea>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">📄 Fichier du Document (Upload direct ou lien Google Drive / Cloud)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-doc-file-input" class="form-control" style="background: transparent;">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.82rem;">
              <span>ou lien de partage (Google Drive / Web) :</span>
              <input type="url" id="new-doc-file-url" class="form-control" placeholder="https://drive.google.com/file/d/... ou https://..." style="flex: 1;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.82rem; color: var(--text-dim);">Nom du document :</span>
              <input type="text" id="new-doc-file-name" class="form-control" placeholder="guide_server_2026.pdf" style="flex: 1;">
            </div>
          </div>
          <span style="display: block; margin-top: 6px; font-size: 0.78rem; color: var(--text-tertiary);">
            💡 Pour les volumineux PDF, préférez le lien Google Drive : 100% gratuit et sans limitation de taille de stockage !
          </span>
        </div>
        <div class="form-group">
          <label class="form-label">Tags / Mots-clés (séparés par virgules)</label>
          <input type="text" id="new-doc-tags" class="form-control" placeholder="PDF, Linux, Serveur, Éducation">
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-doc-submit-btn" class="btn btn-primary btn-sm">Publier le Document</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#doc-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewDocument(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-doc-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud...";
    }

    try {
      const fileInput = document.getElementById("new-doc-file-input");
      const urlInput = document.getElementById("new-doc-file-url");
      const customNameInput = document.getElementById("new-doc-file-name");

      let fileUrl = "";
      let fileName = "";
      let fileSize = "";

      if (urlInput && urlInput.value.trim()) {
        fileUrl = urlInput.value.trim();
        fileName = (customNameInput && customNameInput.value.trim()) || "document.pdf";
        fileSize = "Document Cloud (Google Drive / Web)";
      } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName = file.name;
        fileSize = (file.size / 1024).toFixed(1) + " KB";

        if (file.size > 750 * 1024) {
          throw new Error(`Le fichier « ${fileName} » fait ${fileSize}, ce qui dépasse la limite maximale par document gratuit (750 Ko).\n\n💡 Solution simple et 100% gratuite :\nDéposez votre fichier sur Google Drive, copiez le lien de partage et collez-le dans le champ « lien de partage (Google Drive) » !`);
        }

        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }

      const tags = (document.getElementById("new-doc-tags").value || "")
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const docItem = {
        title: document.getElementById("new-doc-title").value.trim(),
        category: document.getElementById("new-doc-cat").value,
        description: document.getElementById("new-doc-desc").value.trim(),
        fileName: fileName || "document.pdf",
        fileSize: fileSize || "PDF",
        fileUrl: fileUrl || "#",
        tags: tags.length ? tags : ["Ressource"]
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addDocument(docItem);
      } else {
        const data = StorageService.get();
        if (!data.documents) data.documents = [];
        docItem.id = "doc-" + Date.now();
        data.documents.unshift(docItem);
        StorageService.save(data, true);
        this.renderDocumentsTab(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Document ajouté avec succès sur le Cloud !");
      const c = document.getElementById("doc-form-container");
      if (c) c.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deleteDocument(id) {
    if (!confirm("Supprimer ce document du Cloud ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteDocument(id);
      } else {
        const data = StorageService.get();
        data.documents = (data.documents || []).filter(d => d.id !== id);
        StorageService.save(data, true);
        this.renderDocumentsTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Document supprimé avec succès !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllDocuments() {
    if (!confirm("⚠️ Supprimer TOUS les documents de la bibliothèque ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllDocuments();
      }
      const data = StorageService.get();
      data.documents = [];
      StorageService.save(data, true);
      this.renderDocumentsTab(document.getElementById("admin-modal-body"), data);
      alert("✅ Tous les documents ont été supprimés.");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 12. PORTFOLIO CMS TAB
   * ----------------------------------------------------------- */
  renderPortfolioTabContent(body, data) {
    const portfolio = data.portfolio || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Gestion des Réalisations du Portfolio (${portfolio.length})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Ajoutez vos créations, logiciels, architectures d'infrastructure et réalisations personnelles.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddPortfolioForm()">+ Ajouter une Réalisation</button>
            ${portfolio.length > 0 ? `
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="adminManager.deleteAllPortfolioItems()" title="Supprimer tout le portfolio">
                🗑️ Tout effacer (${portfolio.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div id="portfolio-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        ${portfolio.length === 0 ? `
          <div style="text-align: center; color: var(--text-dim); padding: 40px 20px; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">💼</div>
            <p style="margin-bottom: 12px;">Aucun élément de portfolio publié pour le moment.</p>
            <button class="btn btn-primary btn-sm" onclick="adminManager.showAddPortfolioForm()">+ Ajouter une première réalisation</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${portfolio.map(p => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <img src="${escapeHTML(p.image || '')}" style="width: 50px; height: 38px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'">
                  <div>
                    <strong>${escapeHTML(p.title)}</strong> <span style="font-size: 0.8rem; color: var(--neon-primary, #00d2ff);">[${escapeHTML(p.category || 'Tech')}]</span>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(p.role || 'Créateur')} • ${escapeHTML(p.technologies || '')}</div>
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="adminManager.deletePortfolioItem('${p.id}')">Supprimer</button>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }

  showAddPortfolioForm() {
    const c = document.getElementById("portfolio-form-container");
    if (!c) return;
    c.style.display = "block";
    c.innerHTML = `
      <h5 style="margin-bottom: 16px; font-weight: 700;">Ajouter une Réalisation au Portfolio</h5>
      <form onsubmit="adminManager.saveNewPortfolioItem(event)">
        <div class="form-group form-row-2 split-2-1">
          <div>
            <label class="form-label">Titre du projet / Réalisation</label>
            <input type="text" id="new-port-title" class="form-control" required placeholder="Ex: Plateforme Cloud Outlook Studio">
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <select id="new-port-cat" class="form-control">
              <option value="Développement Web & Cloud" selected>Développement Web & Cloud</option>
              <option value="Architecture Réseau & Systèmes">Architecture Réseau & Systèmes</option>
              <option value="Scripting & Automatisation">Scripting & Automatisation</option>
              <option value="Intelligence Artificielle">Intelligence Artificielle</option>
              <option value="Design & UX">Design & UX</option>
            </select>
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Votre rôle</label>
            <input type="text" id="new-port-role" class="form-control" value="Concepteur & Développeur" placeholder="Ex: Architecte Cloud, Développeur Lead">
          </div>
          <div>
            <label class="form-label">Technologies utilisées</label>
            <input type="text" id="new-port-techs" class="form-control" placeholder="Ex: Firebase, JavaScript, HTML5, CSS Grid">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description du projet</label>
          <textarea id="new-port-desc" class="form-control" rows="3" required placeholder="Contexte, défis techniques surmontés et valeur ajoutée..."></textarea>
        </div>
        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🖼️ Image ou Capture d'écran (Photo ou lien URL)</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="new-port-img-file" accept="image/*" class="form-control" style="background: transparent;" onchange="adminManager.previewImage(this, 'port-img-preview')">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.8rem;">
              <span>ou lien URL :</span>
              <input type="url" id="new-port-img-url" class="form-control" placeholder="https://..." style="flex: 1;" oninput="adminManager.previewUrl(this.value, 'port-img-preview')">
            </div>
          </div>
          <div id="port-img-preview" style="display: none; margin-top: 10px; max-height: 160px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle); text-align: center;">
            <img src="" style="max-height: 160px; object-fit: cover; display: inline-block;">
          </div>
        </div>
        <div class="form-group form-row-2">
          <div>
            <label class="form-label">Lien Démo / En direct (optionnel)</label>
            <input type="url" id="new-port-demo" class="form-control" placeholder="https://...">
          </div>
          <div>
            <label class="form-label">Lien Dépôt GitHub (optionnel)</label>
            <input type="url" id="new-port-repo" class="form-control" placeholder="https://github.com/...">
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="save-port-submit-btn" class="btn btn-primary btn-sm">Ajouter au Portfolio</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('#portfolio-form-container').style.display='none'">Annuler</button>
        </div>
      </form>
    `;
  }

  async saveNewPortfolioItem(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("save-port-submit-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Publication Cloud...";
    }

    try {
      let imgUrl = document.getElementById("new-port-img-url") ? document.getElementById("new-port-img-url").value.trim() : "";
      const imgFileInput = document.getElementById("new-port-img-file");
      if (imgFileInput && imgFileInput.files && imgFileInput.files[0]) {
        imgUrl = await this.compressImage(imgFileInput.files[0], 720, 720, 0.7);
      }
      if (!imgUrl) {
        imgUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80";
      }

      const item = {
        title: document.getElementById("new-port-title").value.trim(),
        category: document.getElementById("new-port-cat").value,
        role: document.getElementById("new-port-role").value.trim(),
        technologies: document.getElementById("new-port-techs").value.trim(),
        description: document.getElementById("new-port-desc").value.trim(),
        image: imgUrl,
        demoUrl: document.getElementById("new-port-demo").value.trim(),
        repoUrl: document.getElementById("new-port-repo").value.trim()
      };

      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.addPortfolioItem(item);
      } else {
        const data = StorageService.get();
        if (!data.portfolio) data.portfolio = [];
        item.id = "port-" + Date.now();
        data.portfolio.unshift(item);
        StorageService.save(data, true);
        this.renderPortfolioTabContent(document.getElementById("admin-modal-body"), data);
      }

      alert("✅ Réalisation ajoutée avec succès au Portfolio Cloud !");
      const c = document.getElementById("portfolio-form-container");
      if (c) c.style.display = "none";
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  async deletePortfolioItem(id) {
    if (!confirm("Supprimer cette réalisation ?")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deletePortfolioItem(id);
      } else {
        const data = StorageService.get();
        data.portfolio = (data.portfolio || []).filter(p => p.id !== id);
        StorageService.save(data, true);
        this.renderPortfolioTabContent(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Réalisation supprimée avec succès !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async deleteAllPortfolioItems() {
    if (!confirm("⚠️ Supprimer TOUT le portfolio ? Cette action est irréversible.")) return;
    try {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        await window.FirebaseBridge.deleteAllPortfolioItems();
      }
      const data = StorageService.get();
      data.portfolio = [];
      StorageService.save(data, true);
      this.renderPortfolioTabContent(document.getElementById("admin-modal-body"), data);
      alert("✅ Toutes les réalisations du portfolio ont été supprimées.");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * HELPERS & UTILITIES
   * ----------------------------------------------------------- */
  getDeviceIcon(deviceName, deviceType) {
    if (deviceType === "Tablette" || /iPad|Tablette/i.test(deviceName)) return "📱";
    if (/iPhone|Android|Smartphone|Pixel|Galaxy|Redmi/i.test(deviceName)) return "📱";
    if (/Mac|MacBook|iMac/i.test(deviceName)) return "💻";
    if (/PC|Windows|Linux/i.test(deviceName)) return "🖥️";
    return "💻";
  }

  getBrowserIcon(browserName) {
    if (/Brave/i.test(browserName)) return "🦁";
    if (/Safari/i.test(browserName)) return "🧭";
    if (/Chrome/i.test(browserName)) return "🌐";
    if (/Firefox/i.test(browserName)) return "🦊";
    if (/Edge/i.test(browserName)) return "🌀";
    if (/Opera/i.test(browserName)) return "⭕";
    return "🌐";
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

  compressImage(file, maxWidth = 640, maxHeight = 640, quality = 0.65) {
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
    if (statusLabel) statusLabel.textContent = "Vérification Cloud...";

    const updated = await StorageService.syncCloudContent();
    
    setTimeout(() => {
      if (btn) btn.classList.remove("spinning");
      this.updateSyncStatusBar();
    }, 600);

    if (isManual) {
      if (window.FirebaseBridge && window.FirebaseBridge.isConfigured) {
        alert("✅ Connexion Cloud Firestore active !\nVos données sont synchronisées en direct sur tous vos appareils.");
      } else {
        alert("🟡 Configuration Firebase en attente.\nRenseignez vos identifiants Firebase dans l'onglet 'Sécurité & Profil' pour activer la synchronisation Cloud.");
      }
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
