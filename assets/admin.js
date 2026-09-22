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
    
    headerTitle.textContent = "Espace Privé de Nicaisse Auberson";
    tabsContainer.style.display = "none";
    this.updateSyncStatusBar();

    const isFirebase = window.FirebaseBridge && window.FirebaseBridge.isConfigured;

    body.innerHTML = `
      <div style="max-width: 440px; margin: 24px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛡️</div>
        <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: #fff;">Espace Personnel Sécurisé</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 22px; line-height: 1.5;">
          Accès réservé exclusivement à Nicaisse Auberson pour administrer le portfolio et superviser les visiteurs en direct.
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
    
    headerTitle.textContent = "Tableau de Bord — Nicaisse Auberson";
    tabsContainer.style.display = "flex";

    this.updateSyncStatusBar();
    this.renderTabs();
    this.renderActiveTabContent();
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
        <div class="form-group form-row-3">
          <div>
            <label class="form-label">Réalisateur</label>
            <input type="text" id="new-film-director" class="form-control" required placeholder="Ex: Christopher Nolan">
          </div>
          <div>
            <label class="form-label">Genre</label>
            <input type="text" id="new-film-genre" class="form-control" required placeholder="Ex: Science-Fiction / Drame">
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
          <div id="film-poster-preview" style="display: none; margin-top: 10px; max-height: 160px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle); text-align: center;">
            <img src="" style="max-height: 160px; object-fit: cover; display: inline-block;">
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
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddProjectForm()">+ Ajouter un Projet</button>
        </div>

        <div id="proj-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

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
        <div class="form-group">
          <label class="form-label">Description du projet</label>
          <textarea id="new-proj-desc" class="form-control" rows="3" required placeholder="Objectifs et contexte pédagogique..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Mots-clés / Tags (séparés par des virgules)</label>
          <input type="text" id="new-proj-tags" class="form-control" placeholder="Python, Réseau, Linux, Docker">
        </div>

        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">🖼️ Image de fond du projet</label>
          <input type="file" id="new-proj-bg-file" accept="image/*" class="form-control" style="background: transparent;">
          <input type="url" id="new-proj-bg-url" class="form-control" placeholder="ou URL de l'image (https://...)" style="margin-top: 8px;">
        </div>

        <div class="form-group" style="border: 1px dashed var(--border-subtle); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <label class="form-label">📄 Document / Fichier téléchargeable pour les visiteurs</label>
          <input type="file" id="new-proj-file" class="form-control" style="background: transparent;">
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
      let fileUrl = "";
      let fileName = "";
      let fileSize = "";

      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName = file.name;
        fileSize = (file.size / 1024).toFixed(1) + " KB";

        let uploadedViaStorage = false;
        if (window.FirebaseBridge && window.FirebaseBridge.isConfigured && window.FirebaseBridge.storage) {
          try {
            if (submitBtn) submitBtn.textContent = `⏳ Envoi de ${fileName} (${fileSize}) vers le Cloud Storage...`;
            fileUrl = await window.FirebaseBridge.uploadFile(file, "projects");
            uploadedViaStorage = true;
          } catch (storageErr) {
            console.warn("⚠️ [Storage] Échec direct, vérification taille:", storageErr.message);
          }
        }

        if (!uploadedViaStorage) {
          if (file.size > 750 * 1024) {
            throw new Error(`Le document « ${fileName} » fait ${fileSize}, ce qui dépasse la limite maximale par document (750 Ko).\n\nPour héberger des fichiers sans limite de taille, activez "Storage" dans votre console Firebase (menu Databases & Storage > Storage > Commencer).`);
          }
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
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
      } else {
        const data = StorageService.get();
        data.projects = (data.projects || []).filter(p => p.id !== id);
        StorageService.save(data, true);
        this.renderProjectsTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Projet supprimé avec succès !");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  /* -------------------------------------------------------------
   * 4. TECH TIPS TAB - FIRESTORE SYNC
   * ----------------------------------------------------------- */
  renderTipsTab(body, data) {
    const tips = data.techTips || [];
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h4 style="font-size: 1.1rem; font-weight: 700;">Gérer les Astuces Tech (${tips.length})</h4>
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddTipForm()">+ Ajouter une Astuce</button>
        </div>

        <div id="tip-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

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
      } else {
        const data = StorageService.get();
        data.techTips = (data.techTips || []).filter(t => t.id !== id);
        StorageService.save(data, true);
        this.renderTipsTab(document.getElementById("admin-modal-body"), data);
      }
      alert("✅ Astuce supprimée avec succès !");
    } catch (err) {
      alert("Erreur: " + err.message);
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
