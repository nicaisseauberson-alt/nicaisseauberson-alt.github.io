/**
 * Nicklaus Auberson - Portfolio Data & Storage Engine
 * 2026 Modern Cloud Architecture (Firebase Firestore & Auth)
 */

const DEFAULT_DATA = {
  profile: {
    name: "Nicaisse Auberson",
    titles: ["Informaticien", "Enseignant", "Architecte Solutions"],
    tagline: "Transformer la complexité informatique en savoir accessible et solutions performantes.",
    bio: "Spécialiste en technologies logicielles et enseignant passionné, j'accompagne les étudiants et les professionnels dans la maîtrise des outils informatiques modernes, du développement web avancé aux architectures systèmes robustes.",
    availability: "Disponible pour conférences, formations & projets",
    location: "Genève / Suisse & International",
    email: "contact@nicaisseauberson.ch",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    accentColor: "#3b82f6" // Electric blue accent
  },
  skills: [
    { name: "Architecture Logicielle", level: "95%", icon: "cpu" },
    { name: "Pédagogie & Formation", level: "98%", icon: "book-open" },
    { name: "Développement Web Moderne", level: "92%", icon: "code" },
    { name: "Systèmes & Cloud / DevOps", level: "88%", icon: "server" },
    { name: "Cybersécurité & Réseaux", level: "85%", icon: "shield" },
    { name: "Intelligence Artificielle & Outils 2026", level: "90%", icon: "sparkles" }
  ],
  techTips: [
    {
      id: "tip-1",
      title: "Optimiser les requêtes HTTP avec l'API Fetch Priority (2026)",
      category: "Web Performance",
      badge: "Performance",
      date: "2026-09-18",
      summary: "Comment booster le Largest Contentful Paint (LCP) de 40% sur mobile en priorisant les ressources critiques.",
      code: `// Charger immédiatement l'image du Hero sans bloquer les scripts
const heroImg = document.createElement('img');
heroImg.src = '/assets/hero.webp';
heroImg.fetchPriority = 'high'; // Priorité maximale pour le navigateur
document.body.appendChild(heroImg);`,
      explanation: "L'attribut fetchpriority='high' signale au moteur du navigateur (Chrome, Brave, Safari) de télécharger cet asset avant les scripts secondaires non bloquants."
    },
    {
      id: "tip-2",
      title: "Navigation privée & Respect de la vie privée sur Brave / Chromium",
      category: "Cybersécurité",
      badge: "Sécurité",
      date: "2026-09-12",
      summary: "Comprendre le blocage des trackers et les empreintes numériques de nouvelle génération (Canvas Fingerprinting).",
      code: `// Tester si le navigateur isole les données tierces
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(({quota, usage}) => {
    console.log(\`Stockage alloué: \${(quota / 1024 / 1024).toFixed(0)} MB\`);
  });
}`,
      explanation: "Les navigateurs comme Brave intègrent des mécanismes de 'farbling' pour randomiser les canvas 2D/3D et empêcher le pistage publicitaire sans briser l'affichage."
    },
    {
      id: "tip-3",
      title: "Automatisation PowerShell & Linux : Scripts universels",
      category: "Système",
      badge: "DevOps",
      date: "2026-09-05",
      summary: "Écrire des pipelines de déploiement multiplateformes compatibles Windows Terminal et zsh/bash.",
      code: `# Détection d'environnement et exécution conditionnelle
$isWin = $env:OS -match "Windows"
if ($isWin) {
    Write-Host "Environnement Windows détecté" -ForegroundColor Cyan
} else {
    Write-Host "Système Unix/Linux détecté" -ForegroundColor Green
}`,
      explanation: "Une bonne pratique en enseignement comme en production : ne jamais supposer un système unique. Penser portabilité dès le premier script."
    }
  ],
  cinema: [], // Initialement vide : les films sont gérés exclusivement via Cloud Firestore
  projects: [
    {
      id: "proj-1",
      title: "Plateforme Pédagogique Interactive",
      category: "Enseignement",
      description: "Plateforme web moderne d'apprentissage de l'algorithmique et du code pour étudiants du secondaire et supérieur.",
      tags: ["JavaScript", "HTML5", "Pédagogie", "Bento UI"],
      bgImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80",
      link: "#",
      fileUrl: "data:text/plain;charset=utf-8,Guide%20Pédagogique%20-%20Nicaisse%20Auberson%0A%0ACe%20document%20résume%20les%20bonnes%20pratiques%20d'apprentissage%20du%20code%20en%202026.",
      fileName: "Guide_Pedagogique_Informatique_2026.txt",
      fileSize: "18 KB"
    },
    {
      id: "proj-2",
      title: "Framework d'Audit de Sécurité Réseau",
      category: "Informatique",
      description: "Suite d'outils légers pour la sensibilisation des étudiants aux failles de sécurité courantes et à la protection des données.",
      tags: ["Cybersécurité", "Python", "Réseau", "OpenSource"],
      bgImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80",
      link: "#",
      fileUrl: "data:text/plain;charset=utf-8,Aide-Mémoire%20Sécurité%20Réseau%0A%0A1.%20Mots%20de%20passe%20robustes%20et%202FA%0A2.%20Chiffrement%20TLS%201.3%0A3.%20Protection%20DNS%20over%20HTTPS",
      fileName: "Memo_Securite_Reseau_NicaisseAuberson.txt",
      fileSize: "12 KB"
    }
  ],
  visitors: []
};

// =============================================================================
// STORAGE SERVICE & SYNCHRONISATION CLOUD EN TEMPS RÉEL
// =============================================================================
class StorageService {
  static KEY = "nicaisse_portfolio_db_v2026";
  static AUTH_KEY = "nicaisse_owner_password_2026";
  static LAST_SYNC_KEY = "nicaisse_last_cloud_sync_ts";
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
    // Seul le mot de passe défini par l'administrateur est autorisé (aucun passe-droit comme 'admin')
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
        cinema: Array.isArray(parsed.cinema) ? parsed.cinema : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_DATA.projects,
        techTips: Array.isArray(parsed.techTips) ? parsed.techTips : DEFAULT_DATA.techTips,
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
      } else if (collectionName === "profile") {
        current.profile = { ...current.profile, ...items };
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
