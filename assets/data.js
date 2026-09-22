/**
 * Nicklaus Auberson - Portfolio Data & Storage Engine
 * 2026 Modern Architecture
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
  cinema: [
    {
      id: "film-1",
      title: "Interstellar",
      director: "Christopher Nolan",
      year: "2014",
      genre: "Science-Fiction / Drame",
      rating: "9.8 / 10",
      poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
      review: "Un chef-d'œuvre absolu mêlant relativité générale, amour filial et dimension temporelle. La bande-son de Hans Zimmer reste inégalée.",
      link: "https://www.warnerbros.com/movies/interstellar",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E"
    },
    {
      id: "film-2",
      title: "The Social Network",
      director: "David Fincher",
      year: "2010",
      genre: "Biopic / Drame / Tech",
      rating: "9.2 / 10",
      poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      review: "Une mise en scène chirurgicale sur la genèse d'un géant du web, le code, l'éthique et les batailles d'égo dans la tech.",
      link: "https://www.imdb.com/title/tt1285016/",
      trailerUrl: "https://www.youtube.com/watch?v=lB95KLmpLR4"
    },
    {
      id: "film-3",
      title: "Blade Runner 2049",
      director: "Denis Villeneuve",
      year: "2017",
      genre: "Cyberpunk / SF",
      rating: "9.4 / 10",
      poster: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
      review: "Une esthétique visuelle et sonore monumentale sur la nature de la conscience artificielle et de l'humanité.",
      link: "https://www.imdb.com/title/tt1856101/",
      trailerUrl: "https://www.youtube.com/watch?v=gCcx85zbxz4"
    }
  ],
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

// Initialisation du LocalStorage / Cache & Cloud Sync
class StorageService {
  static KEY = "nicaisse_portfolio_db_v2026";
  static AUTH_KEY = "nicaisse_owner_password_2026";
  static LAST_SYNC_KEY = "nicaisse_last_cloud_sync_ts";
  static DEFAULT_PASS = "nicaisse2026"; // Mot de passe initial privé (jamais affiché en clair sur l'interface)
  
  static DB_SYNC_HUB = "https://ntfy.sh/nicaisse_cloud_db_sync_2026";
  static PRESENCE_HUB = "https://ntfy.sh/nicaisse_presence_hub_2026";
  static TELEMETRY_HUB = "https://ntfy.sh/nicaisse_telemetry_hub_2026";

  static getPassword() {
    return localStorage.getItem(this.AUTH_KEY) || this.DEFAULT_PASS;
  }

  static setPassword(newPass) {
    if (!newPass || newPass.trim().length < 4) return false;
    const cleanPass = newPass.trim();
    localStorage.setItem(this.AUTH_KEY, cleanPass);
    // Broadcast snapshot immediately so all other devices receive the updated password!
    this.broadcastFullSnapshot();
    return true;
  }

  static checkPassword(inputPass) {
    const activePass = this.getPassword();
    return inputPass && inputPass.trim() === activePass;
  }

  static get() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (!data) {
        this.save(DEFAULT_DATA, false);
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
      const parsed = JSON.parse(data);
      // Merge in any missing defaults
      return { ...DEFAULT_DATA, ...parsed };
    } catch (e) {
      console.error("Erreur lecture storage:", e);
      return DEFAULT_DATA;
    }
  }

  static save(data, shouldBroadcast = true) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      // Notify local components
      window.dispatchEvent(new CustomEvent("nicaisse_db_updated", { detail: data }));
      
      // Auto-broadcast full snapshot to Cloud so phone / other devices see the update immediately
      if (shouldBroadcast) {
        this.broadcastFullSnapshot(data);
      }
    } catch (e) {
      console.error("Erreur sauvegarde storage:", e);
    }
  }

  /* Snapshot replication: Broadcast complete current state to Cloud Hub */
  static broadcastFullSnapshot(currentData = null) {
    try {
      const data = currentData || this.get();
      const snapshot = {
        type: "full_snapshot",
        version: 2026,
        timestamp: Date.now(),
        authPassword: this.getPassword(),
        payload: {
          profile: data.profile,
          skills: data.skills,
          techTips: data.techTips,
          cinema: data.cinema,
          projects: data.projects
        }
      };

      fetch(this.DB_SYNC_HUB, {
        method: "POST",
        headers: {
          "Title": "Sync: State Snapshot",
          "Priority": "high"
        },
        body: JSON.stringify(snapshot)
      }).then(() => {
        localStorage.setItem(this.LAST_SYNC_KEY, String(snapshot.timestamp));
      }).catch(() => {});
    } catch (e) {}
  }

  /* Cloud Synchronization: Fetch latest snapshot and apply */
  static async syncCloudContent() {
    try {
      const res = await fetch(`${this.DB_SYNC_HUB}/json?poll=1`, { cache: "no-store" });
      if (!res.ok) return false;
      const text = await res.text();
      if (!text || !text.trim()) return false;

      const lines = text.trim().split("\n");
      let newestSnapshot = null;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const envelope = JSON.parse(line);
          if (envelope.event !== "message" || !envelope.message) continue;
          const msg = JSON.parse(envelope.message);
          if (msg && msg.type === "full_snapshot" && msg.timestamp && msg.payload) {
            if (!newestSnapshot || msg.timestamp > newestSnapshot.timestamp) {
              newestSnapshot = msg;
            }
          }
        } catch (e) {}
      }

      if (!newestSnapshot) return false;

      const lastLocalSync = parseInt(localStorage.getItem(this.LAST_SYNC_KEY) || "0", 10);
      
      // If cloud snapshot is newer than local last sync timestamp
      if (newestSnapshot.timestamp > lastLocalSync) {
        const localData = this.get();
        const incoming = newestSnapshot.payload;

        if (incoming.profile) localData.profile = incoming.profile;
        if (Array.isArray(incoming.skills)) localData.skills = incoming.skills;
        if (Array.isArray(incoming.techTips)) localData.techTips = incoming.techTips;
        if (Array.isArray(incoming.cinema)) localData.cinema = incoming.cinema;
        if (Array.isArray(incoming.projects)) localData.projects = incoming.projects;

        // Synchronize updated password if present in snapshot
        if (newestSnapshot.authPassword) {
          localStorage.setItem(this.AUTH_KEY, newestSnapshot.authPassword);
        }

        localStorage.setItem(this.KEY, JSON.stringify(localData));
        localStorage.setItem(this.LAST_SYNC_KEY, String(newestSnapshot.timestamp));

        window.dispatchEvent(new CustomEvent("nicaisse_db_updated", { detail: localData }));
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Erreur sync Cloud:", err);
      return false;
    }
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
            // Keep most recent ping for this session
            const existing = sessionsMap.get(msg.sessionId);
            if (!existing || msg.lastSeen > existing.lastSeen) {
              sessionsMap.set(msg.sessionId, msg);
            }
          }
        } catch (e) {}
      }

      // Filter: Only visitors whose last heartbeat was within the last 60 seconds
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

      // Sort by most recently active
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

    // Prepend (most recent first), keep last 200 visits
    data.visitors.unshift(newEntry);
    if (data.visitors.length > 200) data.visitors = data.visitors.slice(0, 200);

    this.save(data, false);

    // Synchronize to telemetry hub
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
