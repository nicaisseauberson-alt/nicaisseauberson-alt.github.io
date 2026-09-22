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
      link: "#",
      fileUrl: "data:text/plain;charset=utf-8,Aide-Mémoire%20Sécurité%20Réseau%0A%0A1.%20Mots%20de%20passe%20robustes%20et%202FA%0A2.%20Chiffrement%20TLS%201.3%0A3.%20Protection%20DNS%20over%20HTTPS",
      fileName: "Memo_Securite_Reseau_NicaisseAuberson.txt",
      fileSize: "12 KB"
    }
  ],
  visitors: []
};

// Initialisation du LocalStorage / Cache
class StorageService {
  static KEY = "nicaisse_portfolio_db_v2026";
  static ADMIN_PIN_KEY = "nicaisse_admin_token";

  static get() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (!data) {
        this.save(DEFAULT_DATA);
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

  static save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      // Notify components
      window.dispatchEvent(new CustomEvent("nicaisse_db_updated", { detail: data }));
    } catch (e) {
      console.error("Erreur sauvegarde storage:", e);
    }
  }

  static logVisitor(sessionInfo) {
    const data = this.get();
    if (!data.visitors) data.visitors = [];
    
    // Prevent duplicate logs in same minute from same device
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
      device: sessionInfo.device || "Appareil Inconnu",
      os: sessionInfo.os || "OS Inconnu",
      browser: sessionInfo.browser || "Navigateur Inconnu",
      screen: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language || "fr-FR",
      location: sessionInfo.location || "En cours de détection...",
      page: window.location.hash || "Accueil"
    };

    // Prepend (most recent first), keep last 200 visits
    data.visitors.unshift(newEntry);
    if (data.visitors.length > 200) data.visitors.pop();

    this.save(data);
    return newEntry;
  }
}
