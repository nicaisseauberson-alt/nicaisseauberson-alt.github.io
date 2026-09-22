/**
 * Nicaisse Auberson - Firebase Cloud Infrastructure (2026)
 * Real-time Cloud Firestore Database & Secure Firebase Authentication
 * 
 * Instructions pour l'administrateur :
 * Vous pouvez soit renseigner vos identifiants dans l'objet 'firebaseConfig' ci-dessous,
 * soit les coller directement dans l'Espace Admin > Sécurité & Profil > Configuration Firebase.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  getDoc,
  getDocs,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// =============================================================================
// 1. CONFIGURATION DU PROJET FIREBASE
// =============================================================================
let defaultFirebaseConfig = {
  apiKey: "AIzaSy_NICAISSE_REPLACE_WITH_YOUR_KEY",
  authDomain: "nicaisse-portfolio.firebaseapp.com",
  projectId: "nicaisse-portfolio",
  storageBucket: "nicaisse-portfolio.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Permet également à l'administrateur de coller sa config depuis l'interface sans devoir recompiler
try {
  const savedCustomConfig = localStorage.getItem("nicaisse_custom_firebase_config");
  if (savedCustomConfig) {
    const parsed = JSON.parse(savedCustomConfig);
    if (parsed && parsed.apiKey && !parsed.apiKey.includes("REPLACE_WITH_YOUR_KEY")) {
      defaultFirebaseConfig = { ...defaultFirebaseConfig, ...parsed };
    }
  }
} catch (e) {}

export const firebaseConfig = defaultFirebaseConfig;

// Détecte si une vraie clé API a été fournie
export const isConfigured = !!(
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes("REPLACE_WITH_YOUR_KEY") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("REPLACE")
);

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Persistance locale pour rester connecté sur mobile et ordinateur
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("⚠️ [Auth] Persistence warning:", err);
    });

    console.log("🔥 [Firebase] Initialisé avec succès pour le projet :", firebaseConfig.projectId);
  } catch (err) {
    console.error("❌ [Firebase] Erreur lors de l'initialisation :", err);
  }
} else {
  console.info("ℹ️ [Firebase] En attente de clés API valides. Rendez-vous dans l'Espace Admin pour renseigner firebaseConfig.");
}

// =============================================================================
// 2. PASSERELLE GLOBALE FIREBASE BRIDGE
// =============================================================================
class FirebaseBridgeService {
  constructor() {
    this.app = app;
    this.auth = auth;
    this.db = db;
    this.isConfigured = isConfigured;
    this.currentUser = null;
    this.unsubscribers = [];
    this.authSubscribers = [];

    if (this.auth) {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.authSubscribers.forEach(cb => {
          try { cb(user); } catch (err) { console.error(err); }
        });
      });
    }
  }

  // --- AUTHENTIFICATION ---
  async login(email, password) {
    if (!this.isConfigured || !this.auth) {
      throw new Error("Firebase n'est pas configuré. Veuillez renseigner vos clés Firebase dans l'espace Admin.");
    }
    const cleanEmail = (email || "").trim();
    const cleanPass = (password || "").trim();
    if (!cleanEmail || !cleanPass) {
      throw new Error("Veuillez renseigner votre adresse email et votre mot de passe.");
    }
    const cred = await signInWithEmailAndPassword(this.auth, cleanEmail, cleanPass);
    this.currentUser = cred.user;
    return cred.user;
  }

  async logout() {
    if (!this.auth) return;
    await signOut(this.auth);
    this.currentUser = null;
  }

  onAuthChange(callback) {
    if (typeof callback !== "function") return () => {};
    this.authSubscribers.push(callback);
    // Notification immédiate de l'état actuel
    callback(this.currentUser || (this.auth ? this.auth.currentUser : null));
    return () => {
      this.authSubscribers = this.authSubscribers.filter(cb => cb !== callback);
    };
  }

  getCurrentUser() {
    return this.currentUser || (this.auth ? this.auth.currentUser : null);
  }

  // Permet de sauvegarder une configuration Firebase depuis l'interface d'administration
  saveCustomConfig(newConfig) {
    if (!newConfig || !newConfig.apiKey || !newConfig.projectId) {
      throw new Error("Configuration Firebase invalide (apiKey et projectId requis).");
    }
    localStorage.setItem("nicaisse_custom_firebase_config", JSON.stringify(newConfig));
    // Recharge la page pour réinitialiser les modules avec la nouvelle configuration
    window.location.reload();
  }

  resetCustomConfig() {
    localStorage.removeItem("nicaisse_custom_firebase_config");
    window.location.reload();
  }

  // --- SYNCHRONISATION EN TEMPS RÉEL (FIRESTORE) ---
  initRealtimeSync(onDataUpdated) {
    if (!this.isConfigured || !this.db || typeof onDataUpdated !== "function") return;

    // Nettoyage d'anciens écouteurs si appel répété
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    this.unsubscribers = [];

    // 1. Écouteur en direct sur la collection Cinéma
    try {
      const cinemaCol = collection(this.db, "cinema");
      const unsubCinema = onSnapshot(cinemaCol, (snapshot) => {
        const films = [];
        snapshot.forEach((docSnap) => {
          films.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Tri par date de création ou année décroissante
        films.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("cinema", films);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener cinema:", error.message);
      });
      this.unsubscribers.push(unsubCinema);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup cinema listener:", e);
    }

    // 2. Écouteur en direct sur la collection Projets
    try {
      const projsCol = collection(this.db, "projects");
      const unsubProjs = onSnapshot(projsCol, (snapshot) => {
        const projs = [];
        snapshot.forEach((docSnap) => {
          projs.push({ id: docSnap.id, ...docSnap.data() });
        });
        projs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("projects", projs);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener projects:", error.message);
      });
      this.unsubscribers.push(unsubProjs);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup projects listener:", e);
    }

    // 3. Écouteur en direct sur la collection Astuces Tech
    try {
      const tipsCol = collection(this.db, "techTips");
      const unsubTips = onSnapshot(tipsCol, (snapshot) => {
        const tips = [];
        snapshot.forEach((docSnap) => {
          tips.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (tips.length > 0) {
          tips.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          onDataUpdated("techTips", tips);
        }
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener techTips:", error.message);
      });
      this.unsubscribers.push(unsubTips);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup techTips listener:", e);
    }

    // 4. Écouteur en direct sur le Profil / Paramètres
    try {
      const profileDocRef = doc(this.db, "settings", "profile");
      const unsubProfile = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          onDataUpdated("profile", docSnap.data());
        }
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener profile:", error.message);
      });
      this.unsubscribers.push(unsubProfile);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup profile listener:", e);
    }
  }

  // --- CRUD CINÉMA ---
  async addFilm(filmData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas encore configuré.");
    const cleanData = {
      ...filmData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "cinema"), cleanData);
  }

  async updateFilm(id, filmData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "cinema", id);
    return await updateDoc(docRef, {
      ...filmData,
      updatedAt: serverTimestamp()
    });
  }

  async deleteFilm(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "cinema", id);
    return await deleteDoc(docRef);
  }

  async deleteAllFilms() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "cinema"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "cinema", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
  }

  // --- CRUD PROJETS ---
  async addProject(projectData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "projects"), cleanData);
  }

  async updateProject(id, projectData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "projects", id);
    return await updateDoc(docRef, {
      ...projectData,
      updatedAt: serverTimestamp()
    });
  }

  async deleteProject(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "projects", id));
  }

  // --- CRUD ASTUCES TECH ---
  async addTip(tipData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...tipData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "techTips"), cleanData);
  }

  async updateTip(id, tipData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "techTips", id);
    return await updateDoc(docRef, {
      ...tipData,
      updatedAt: serverTimestamp()
    });
  }

  async deleteTip(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "techTips", id));
  }

  // --- CRUD PROFIL ---
  async updateProfile(profileData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "settings", "profile");
    return await setDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // --- SEED INITIAL SÉCURISÉ (UNE SEULE FOIS, JAMAIS SI DÉJÀ INITIALISÉ) ---
  async seedInitialDataIfEmpty(defaultData) {
    if (!this.isConfigured || !this.db) return;
    try {
      const metaDocRef = doc(this.db, "settings", "meta");
      const metaSnap = await getDoc(metaDocRef);
      
      // Si la base a déjà été initialisée, on ne réinjecte JAMAIS les données supprimées par l'utilisateur
      if (metaSnap.exists() && metaSnap.data().isInitialized) {
        return;
      }

      // Marquer comme initialisé pour empêcher toute réinjection ultérieure
      await setDoc(metaDocRef, {
        isInitialized: true,
        initializedAt: serverTimestamp()
      }, { merge: true });

      // N'injecter les projets initiaux que si la collection est vide
      const projSnap = await getDocs(collection(this.db, "projects"));
      if (projSnap.empty && defaultData.projects && defaultData.projects.length > 0) {
        for (const proj of defaultData.projects) {
          const { id, ...pData } = proj;
          await addDoc(collection(this.db, "projects"), {
            ...pData,
            createdAt: serverTimestamp()
          });
        }
      }

      // N'injecter les astuces que si la collection est vide
      const tipSnap = await getDocs(collection(this.db, "techTips"));
      if (tipSnap.empty && defaultData.techTips && defaultData.techTips.length > 0) {
        for (const tip of defaultData.techTips) {
          const { id, ...tData } = tip;
          await addDoc(collection(this.db, "techTips"), {
            ...tData,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Seed ignoré (permissions ou hors-ligne):", e.message);
    }
  }
}

// Instance singleton rattachée à window
window.FirebaseBridge = new FirebaseBridgeService();

// Notification que le module Firebase est prêt
window.dispatchEvent(new CustomEvent("firebase_bridge_ready", { detail: window.FirebaseBridge }));
