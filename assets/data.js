/**
 * Nicklaus Auberson - Portfolio Data & Storage Engine
 * 2026 Modern Cloud Architecture (Firebase Firestore & Auth)
 */

const DEFAULT_DATA = {
  platform: {
    name: "Outlook Studio",
    acronym: "OS",
    tagline: "A technology and resource platform",
    creator: "Auberson",
    attribution: "Powered by Auberson",
    shortDescription: "Outlook Studio rassemble des ressources, astuces technologiques, documents, programmes, actualités et contenus autour du cinéma, du gaming, du code et des innovations numériques.",
    whatsapp: "+509 31 84 93 85",
    whatsappDisplay: "+509 31 84 93 85",
    whatsappLink: "https://wa.me/50931849385",
    phone: "+509 55 55 85 50",
    phoneDisplay: "+509 55 55 85 50",
    phoneLink: "tel:+50955558550",
    email: "contact@nicaisseauberson.ch",
    emailLink: "mailto:contact@nicaisseauberson.ch"
  },
  theme: {
    neonColor: "#3b82f6", // Bleu électrique néon par défaut
    neonPreset: "blue", // blue, purple, red, green, cyan, pink, custom
    neonAnimation: "pulse"
  },
  backgrounds: {
    cinema: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80",
    projects: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80",
    tips: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80",
    code: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80",
    news: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80",
    gaming: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&q=80",
    documents: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80",
    portfolio: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1920&q=80"
  },
  categories: [
    { id: "cinema", name: "Cinéma", icon: "🎬", desc: "Recommandations, affiches et bandes-annonces" },
    { id: "news", name: "Actualités", icon: "📰", desc: "Nouveautés tech, cinéma, gaming et innovations" },
    { id: "projects", name: "Projets", icon: "📁", desc: "Laboratoires pédagogiques et réalisations" },
    { id: "tips", name: "Astuces Tech", icon: "💡", desc: "Tutoriels et optimisations avancées" },
    { id: "code", name: "Code", icon: "💻", desc: "Snippets, commandes et scripts multiplateformes" },
    { id: "gaming", name: "Gaming", icon: "🎮", desc: "Jeux vidéo, moteur graphique et actualité gaming" },
    { id: "documents", name: "Documents", icon: "📄", desc: "Fichiers, cours et programmes téléchargeables" },
    { id: "portfolio", name: "Portfolio", icon: "💼", desc: "Projets et réalisations d'Auberson" },
    { id: "contact", name: "Contact", icon: "✉️", desc: "WhatsApp, appel direct et e-mail" }
  ],
  profile: {
    name: "Auberson",
    fullName: "Auberson",
    titles: ["Informaticien", "Enseignant", "Architecte Solutions"],
    tagline: "Transformer la complexité informatique en savoir accessible et solutions performantes.",
    bio: "Spécialiste en technologies logicielles et enseignant passionné, j'accompagne les étudiants et les professionnels dans la maîtrise des outils informatiques modernes, du développement web avancé aux architectures systèmes robustes.",
    availability: "Plateforme active & Ressources ouvertes",
    location: "Genève & International",
    email: "contact@nicaisseauberson.ch",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    accentColor: "#3b82f6"
  },
  skills: [
    { name: "Architecture Logicielle", level: "95%", icon: "cpu" },
    { name: "Pédagogie & Formation", level: "98%", icon: "book-open" },
    { name: "Développement Web Moderne", level: "92%", icon: "code" },
    { name: "Systèmes & Cloud / DevOps", level: "88%", icon: "server" },
    { name: "Cybersécurité & Réseaux", level: "85%", icon: "shield" },
    { name: "Intelligence Artificielle & Outils 2026", level: "90%", icon: "sparkles" }
  ],
  news: [],
  techTips: [],
  cinema: [],
  projects: [],
  gaming: [],
  documents: [],
  code: [],
  portfolio: [],
  customCategories: [],
  visitors: []
};

// =============================================================================
// STORAGE SERVICE & SYNCHRONISATION CLOUD EN TEMPS RÉEL
// =============================================================================
class StorageService {
  static KEY = "outlook_studio_db_v2026_cloud";
  static AUTH_KEY = "nicaisse_owner_password_2026";
  static LAST_SYNC_KEY = "outlook_studio_last_cloud_sync_ts";
  static DEFAULT_PASS = "nicaisse2026";
  
  static PRESENCE_HUB = "https://ntfy.sh/nicaisse_presence_hub_2026";
  static TELEMETRY_HUB = "https://ntfy.sh/nicaisse_telemetry_hub_2026";

  static isFirebaseActive() {
    return !!(window.FirebaseBridge && window.FirebaseBridge.isConfigured);
  }

  static getPassword() {
    return localStorage.getItem(this.AUTH_KEY) || 
           localStorage.getItem("nicaisse_admin_password") || 
           localStorage.getItem("nicklaus_admin_password") || 
           this.DEFAULT_PASS;
  }

  static setPassword(newPass) {
    if (!newPass || newPass.trim().length < 4) return false;
    const cleanPass = newPass.trim();
    localStorage.setItem(this.AUTH_KEY, cleanPass);
    localStorage.setItem("nicaisse_admin_password", cleanPass);
    return true;
  }

  static checkPassword(inputPass) {
    if (!inputPass) return false;
    const clean = inputPass.trim();
    const activePass = this.getPassword();
    return clean === activePass;
  }

  static get() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (!data) {
        this.save(DEFAULT_DATA, false);
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        platform: { ...DEFAULT_DATA.platform, ...(parsed.platform || {}) },
        theme: { ...DEFAULT_DATA.theme, ...(parsed.theme || {}) },
        backgrounds: { ...DEFAULT_DATA.backgrounds, ...(parsed.backgrounds || {}) },
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_DATA.categories,
        news: Array.isArray(parsed.news) ? parsed.news : [],
        cinema: Array.isArray(parsed.cinema) ? parsed.cinema : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        techTips: Array.isArray(parsed.techTips) ? parsed.techTips : [],
        gaming: Array.isArray(parsed.gaming) ? parsed.gaming : [],
        documents: Array.isArray(parsed.documents) ? parsed.documents : [],
        code: Array.isArray(parsed.code) ? parsed.code : [],
        portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : [],
        customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
        profile: { ...DEFAULT_DATA.profile, ...(parsed.profile || {}) }
      };
    } catch (e) {
      console.error("Erreur lecture cache local:", e);
      return DEFAULT_DATA;
    }
  }

  static save(data, notifyUI = true) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      if (notifyUI) {
        window.dispatchEvent(new CustomEvent("nicaisse_db_updated", { detail: data }));
      }
    } catch (e) {
      console.error("Erreur sauvegarde storage:", e);
    }
  }

  /* Connexion au flux en temps réel Firebase Firestore */
  static initFirebaseSync() {
    if (!window.FirebaseBridge || !window.FirebaseBridge.isConfigured) return;

    window.FirebaseBridge.initRealtimeSync((collectionName, items) => {
      const current = StorageService.get();

      if (collectionName === "cinema") {
        current.cinema = Array.isArray(items) ? items : [];
      } else if (collectionName === "projects") {
        current.projects = Array.isArray(items) ? items : [];
      } else if (collectionName === "techTips") {
        current.techTips = Array.isArray(items) ? items : [];
      } else if (collectionName === "news") {
        current.news = Array.isArray(items) ? items : [];
      } else if (collectionName === "gaming") {
        current.gaming = Array.isArray(items) ? items : [];
      } else if (collectionName === "documents") {
        current.documents = Array.isArray(items) ? items : [];
      } else if (collectionName === "codeSnippets" || collectionName === "code") {
        current.code = Array.isArray(items) ? items : [];
      } else if (collectionName === "portfolioItems" || collectionName === "portfolio") {
        current.portfolio = Array.isArray(items) ? items : [];
      } else if (collectionName === "customCategories") {
        current.customCategories = Array.isArray(items) ? items : [];
      } else if (collectionName === "categories") {
        current.categories = Array.isArray(items) && items.length > 0 ? items : DEFAULT_DATA.categories;
      } else if (collectionName === "theme") {
        current.theme = { ...current.theme, ...(items || {}) };
      } else if (collectionName === "backgrounds") {
        current.backgrounds = { ...current.backgrounds, ...(items || {}) };
      } else if (collectionName === "platform") {
        current.platform = { ...current.platform, ...(items || {}) };
      } else if (collectionName === "profile") {
        current.profile = { ...current.profile, ...(items || {}) };
      }

      // Sauvegarde dans le cache local (mode offline transparent)
      localStorage.setItem(StorageService.KEY, JSON.stringify(current));
      localStorage.setItem(StorageService.LAST_SYNC_KEY, String(Date.now()));

      // Notification en direct pour mettre à jour l'affichage sur la page
      window.dispatchEvent(new CustomEvent("nicaisse_db_updated", { detail: current }));
    });

    // Optionnel : premier seed si la base est neuve
    window.FirebaseBridge.seedInitialDataIfEmpty(DEFAULT_DATA);
  }

  /* Cloud Synchronization Trigger */
  static async syncCloudContent() {
    if (this.isFirebaseActive()) {
      return true;
    }
    return false;
  }

  /* Live Presence Engine: Send heartbeat ping */
  static sendPresencePing(sessionInfo, eventType = "ping") {
    if (!sessionInfo || !sessionInfo.sessionId) return;
    try {
      const pingData = {
        event: eventType, // 'ping' or 'leave'
        sessionId: sessionInfo.sessionId,
        device: sessionInfo.device || "Appareil",
        deviceType: sessionInfo.deviceType || "Smartphone",
        os: sessionInfo.os || "OS Inconnu",
        browser: sessionInfo.browser || "Navigateur",
        location: sessionInfo.location || "En cours...",
        screen: sessionInfo.screen || "",
        connectedAt: sessionInfo.connectedAt || "",
        lastSeen: Date.now()
      };

      if (eventType === "leave" && navigator.sendBeacon) {
        navigator.sendBeacon(this.PRESENCE_HUB, JSON.stringify(pingData));
      } else {
        fetch(this.PRESENCE_HUB, {
          method: "POST",
          headers: { "Title": "Presence: " + sessionInfo.device },
          body: JSON.stringify(pingData)
        }).catch(() => {});
      }
    } catch (e) {}
  }

  /* Fetch active live visitors (connected right now within last 60s) */
  static async getActiveLiveVisitors() {
    try {
      const res = await fetch(`${this.PRESENCE_HUB}/json?poll=1`, { cache: "no-store" });
      if (!res.ok) return [];
      const text = await res.text();
      if (!text || !text.trim()) return [];

      const lines = text.trim().split("\n");
      const sessionsMap = new Map();
      const now = Date.now();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const envelope = JSON.parse(line);
          if (envelope.event !== "message" || !envelope.message) continue;
          const msg = JSON.parse(envelope.message);
          if (!msg || !msg.sessionId) continue;

          if (msg.event === "leave") {
            sessionsMap.delete(msg.sessionId);
          } else if (msg.event === "ping") {
            const existing = sessionsMap.get(msg.sessionId);
            if (!existing || msg.lastSeen > existing.lastSeen) {
              sessionsMap.set(msg.sessionId, msg);
            }
          }
        } catch (e) {}
      }

      // Filtrer : visiteurs ayant envoyé un ping dans les 65 dernières secondes
      const active = [];
      for (const [id, session] of sessionsMap.entries()) {
        const ageSeconds = Math.round((now - session.lastSeen) / 1000);
        if (ageSeconds <= 65) {
          active.push({
            ...session,
            ageSeconds: Math.max(0, ageSeconds)
          });
        }
      }

      active.sort((a, b) => b.lastSeen - a.lastSeen);
      return active;
    } catch (e) {
      console.warn("Erreur lecture présence en direct:", e);
      return [];
    }
  }

  /* Log visitor for historical record */
  static logVisitor(sessionInfo) {
    const data = this.get();
    if (!data.visitors) data.visitors = [];
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString("fr-FR", { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
    const formattedTime = now.toLocaleTimeString("fr-FR", { 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    const newEntry = {
      id: "vis-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
      date: formattedDate,
      time: formattedTime,
      device: sessionInfo.device || "Smartphone",
      deviceType: sessionInfo.deviceType || "Smartphone",
      os: sessionInfo.os || "OS Inconnu",
      browser: sessionInfo.browser || "Navigateur Inconnu",
      screen: sessionInfo.screen || `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language || "fr-FR",
      location: sessionInfo.location || "Détection...",
      page: window.location.hash || "Accueil"
    };

    data.visitors.unshift(newEntry);
    if (data.visitors.length > 200) data.visitors = data.visitors.slice(0, 200);

    this.save(data, false);

    // Synchronisation vers le hub télémétrie
    try {
      fetch(this.TELEMETRY_HUB, {
        method: "POST",
        headers: { "Title": "Visiteur: " + newEntry.device + " (" + newEntry.browser + ")" },
        body: JSON.stringify(newEntry)
      }).catch(() => {});
    } catch (e) {}

    return newEntry;
  }
}

// Initialisation de la synchronisation dès que Firebase est prêt
if (window.FirebaseBridge) {
  StorageService.initFirebaseSync();
} else {
  window.addEventListener("firebase_bridge_ready", () => {
    StorageService.initFirebaseSync();
  });
}
