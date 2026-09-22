/**
 * Nicaisse Auberson - Secure Administration & Content Management Engine
 * Protected Dashboard: Add Tech Tips, Movies, Projects, Downloadable Files & View Visitor Logs
 */

const ADMIN_DEFAULT_PASS = "admin2026";

class AdminManager {
  constructor() {
    this.isAuthenticated = false;
    this.activeTab = "analytics"; // analytics, tips, cinema, projects, profile
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

  openLoginOrDashboard() {
    const modal = document.getElementById("admin-modal");
    if (!modal) return;

    if (!this.isAuthenticated) {
      this.showLoginForm();
    } else {
      this.showDashboard();
    }

    modal.classList.add("active");
  }

  closeModal() {
    const modal = document.getElementById("admin-modal");
    if (modal) modal.classList.remove("active");
  }

  showLoginForm() {
    const body = document.getElementById("admin-modal-body");
    const headerTitle = document.getElementById("admin-modal-title");
    const tabsContainer = document.getElementById("admin-tabs");
    
    headerTitle.textContent = "Accès Administrateur Sécurisé";
    tabsContainer.style.display = "none";

    body.innerHTML = `
      <div style="max-width: 400px; margin: 40px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔐</div>
        <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">Espace Nicaisse Auberson</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
          Entrez votre mot de passe administrateur pour gérer le contenu et consulter les statistiques de visite.
        </p>

        <form id="admin-login-form" onsubmit="adminManager.handleLogin(event)">
          <div class="form-group">
            <input type="password" id="admin-pass-input" class="form-control" placeholder="Mot de passe (par défaut: admin2026)" autofocus required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Déverrouiller l'Espace Admin</button>
        </form>
        <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 16px;">(Mot de passe initial : <code>admin2026</code>)</p>
      </div>
    `;
  }

  handleLogin(e) {
    e.preventDefault();
    const input = document.getElementById("admin-pass-input");
    if (!input) return;

    const savedPass = localStorage.getItem("nicaisse_admin_password") || localStorage.getItem("nicklaus_admin_password") || ADMIN_DEFAULT_PASS;
    if (input.value === savedPass) {
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
    this.showLoginForm();
  }

  showDashboard() {
    const headerTitle = document.getElementById("admin-modal-title");
    const tabsContainer = document.getElementById("admin-tabs");
    
    headerTitle.textContent = "Tableau de Bord Administrateur";
    tabsContainer.style.display = "flex";

    this.renderTabs();
    this.renderActiveTabContent();
  }

  renderTabs() {
    const tabs = [
      { id: "analytics", label: "📊 Visiteurs & Logs" },
      { id: "tips", label: "💡 Astuces Tech" },
      { id: "cinema", label: "🎬 Section Cinéma" },
      { id: "projects", label: "📁 Projets & Fichiers" },
      { id: "profile", label: "⚙️ Profil & Sauvegarde" }
    ];

    const tabsContainer = document.getElementById("admin-tabs");
    tabsContainer.innerHTML = tabs.map(t => `
      <button class="admin-tab-btn ${this.activeTab === t.id ? 'active' : ''}" onclick="adminManager.switchTab('${t.id}')">
        ${t.label}
      </button>
    `).join("") + `
      <button class="admin-tab-btn" style="margin-left: auto; color: #ef4444;" onclick="adminManager.logout()">
        🚪 Déconnexion
      </button>
    `;
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    this.renderTabs();
    this.renderActiveTabContent();
  }

  renderActiveTabContent() {
    const body = document.getElementById("admin-modal-body");
    const data = StorageService.get();

    if (this.activeTab === "analytics") {
      this.renderAnalyticsTab(body, data);
    } else if (this.activeTab === "tips") {
      this.renderTipsTab(body, data);
    } else if (this.activeTab === "cinema") {
      this.renderCinemaTab(body, data);
    } else if (this.activeTab === "projects") {
      this.renderProjectsTab(body, data);
    } else if (this.activeTab === "profile") {
      this.renderProfileTab(body, data);
    }
  }

  /* 1. VISITOR ANALYTICS TAB ("Qui a accédé au site et quand") */
  renderAnalyticsTab(body, data) {
    const visitors = data.visitors || [];
    const totalVisits = visitors.length;
    const mobileVisits = visitors.filter(v => /iPhone|Android|Mobile/i.test(v.device)).length;
    const desktopVisits = totalVisits - mobileVisits;

    body.innerHTML = `
      <div>
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Journal des Connexions & Visiteurs en Temps Réel</h4>
        
        <div class="analytics-summary">
          <div class="stat-box">
            <div class="stat-value">${totalVisits}</div>
            <div class="stat-label">Total Visites Enregistrées</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #10b981">${mobileVisits}</div>
            <div class="stat-label">Smartphones (iPhone/Android)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #60a5fa">${desktopVisits}</div>
            <div class="stat-label">Ordinateurs (PC / Mac)</div>
          </div>
        </div>

        <!-- Mobile Visitor Cards (< 768px) -->
        <div class="visitor-cards-list">
          ${visitors.length === 0 ? `
            <div style="text-align: center; color: var(--text-tertiary); padding: 24px;">Aucune visite enregistrée pour le moment.</div>
          ` : visitors.map(v => `
            <div class="visitor-card-item">
              <div class="visitor-card-header">
                <span style="font-weight: 700; color: #fff;">${v.date} à ${v.time}</span>
                <span class="device-badge">${this.getDeviceIcon(v.device)} ${escapeHTML(v.device)}</span>
              </div>
              <div class="visitor-card-details">
                <span>💻 ${escapeHTML(v.os)}</span>
                <span>🌐 ${escapeHTML(v.browser)}</span>
                <span>📍 ${escapeHTML(v.location)}</span>
                <span>📐 ${escapeHTML(v.screen)}</span>
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
                <th>Appareil</th>
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
                  <td><span class="device-badge">${this.getDeviceIcon(v.device)} ${escapeHTML(v.device)}</span></td>
                  <td>${escapeHTML(v.os)}</td>
                  <td>${escapeHTML(v.browser)}</td>
                  <td>📍 ${escapeHTML(v.location)}</td>
                  <td style="color: var(--text-tertiary); font-size: 0.78rem;">${escapeHTML(v.screen)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  getDeviceIcon(device) {
    if (/iPhone/i.test(device)) return "📱";
    if (/Android/i.test(device)) return "🤖";
    if (/Mac/i.test(device)) return "🍏";
    if (/Windows/i.test(device)) return "💻";
    return "🌐";
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
    this.renderTipsTab(document.getElementById("admin-modal-body"), data);
  }

  deleteTip(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette astuce ?")) return;
    const data = StorageService.get();
    data.techTips = data.techTips.filter(t => t.id !== id);
    StorageService.save(data);
    this.renderTipsTab(document.getElementById("admin-modal-body"), data);
  }

  /* 3. CINEMA TAB */
  renderCinemaTab(body, data) {
    body.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h4 style="font-size: 1.1rem; font-weight: 700;">Gérer la Section Cinéma (${(data.cinema || []).length} films)</h4>
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddFilmForm()">+ Ajouter un Film</button>
        </div>

        <div id="film-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${(data.cinema || []).map(f => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${escapeHTML(f.poster)}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'">
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
        <div class="form-group">
          <label class="form-label">Image / Affiche (URL de l'image)</label>
          <input type="url" id="new-film-poster" class="form-control" required placeholder="https://image-url...">
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

  saveNewFilm(e) {
    e.preventDefault();
    const data = StorageService.get();
    if (!data.cinema) data.cinema = [];

    const newFilm = {
      id: "film-" + Date.now(),
      title: document.getElementById("new-film-title").value,
      director: document.getElementById("new-film-director").value,
      year: document.getElementById("new-film-year").value,
      genre: document.getElementById("new-film-genre").value,
      rating: document.getElementById("new-film-rating").value || "9.0 / 10",
      poster: document.getElementById("new-film-poster").value,
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h4 style="font-size: 1.1rem; font-weight: 700;">Gérer les Projets & Téléchargements (${(data.projects || []).length})</h4>
          <button class="btn btn-primary btn-sm" onclick="adminManager.showAddProjectForm()">+ Ajouter un Projet</button>
        </div>

        <div id="proj-form-container" style="display: none; background: rgba(255,255,255,0.03); padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--border-subtle);"></div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${(data.projects || []).map(p => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
              <div>
                <strong>${escapeHTML(p.title)}</strong> (${escapeHTML(p.category)})
                ${p.fileName ? `<div style="font-size: 0.8rem; color: #10b981;">📄 Fichier téléchargeable: ${escapeHTML(p.fileName)}</div>` : ''}
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

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileName = file.name;
      fileSize = (file.size / 1024).toFixed(1) + " KB";
      fileUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
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
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px;">Informations Personnelles & Sauvegarde</h4>
        
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
          <button type="submit" class="btn btn-primary btn-sm">Enregistrer les modifications</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 32px 0;">

        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">🔐 Sécurité du mot de passe</h5>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Définissez votre mot de passe personnalisé pour que vous seul puissiez accéder au tableau de bord.
        </p>
        <form onsubmit="adminManager.changePassword(event)" style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px;">
          <div style="flex: 1; min-width: 220px;">
            <label class="form-label">Nouveau mot de passe</label>
            <input type="password" id="new-admin-pass" class="form-control" required placeholder="Votre mot de passe secret">
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Mettre à jour le mot de passe</button>
        </form>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 32px 0;">

        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Exporter / Sauvegarder toutes les données</h5>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Téléchargez une copie intégrale de votre base de données (astuces, films, projets, visiteurs) en un clic.
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
    localStorage.setItem("nicaisse_admin_password", newPass.trim());
    alert("Mot de passe mis à jour avec succès ! Vous seul pouvez désormais vous connecter.");
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
    alert("Profil mis à jour avec succès !");
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
