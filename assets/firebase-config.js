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
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// =============================================================================
// 1. CONFIGURATION DU PROJET FIREBASE
// =============================================================================
let defaultFirebaseConfig = {
  apiKey: "AIzaSyAPtktFUBSV40nPOWFqq7cZ3DvxLwDq6tw",
  authDomain: "outlook-studio.firebaseapp.com",
  projectId: "outlook-studio",
  storageBucket: "outlook-studio.firebasestorage.app",
  messagingSenderId: "158901788592",
  appId: "1:158901788592:web:50cb0bebdf6811297ec075",
  measurementId: "G-LMSRCVNBMR"
};

// Permet également à l'administrateur de coller sa config depuis l'interface sans devoir recompiler
try {
  const savedCustomConfig = localStorage.getItem("nicaisse_custom_firebase_config");
  if (savedCustomConfig) {
    const parsed = JSON.parse(savedCustomConfig);
    if (parsed && (parsed.projectId === "auberson-26" || !parsed.apiKey || parsed.apiKey.includes("REPLACE_WITH_YOUR_KEY"))) {
      localStorage.removeItem("nicaisse_custom_firebase_config");
    } else if (parsed && parsed.apiKey) {
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
let storage = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    try {
      storage = getStorage(app);
    } catch (sErr) {
      console.warn("⚠️ [Firebase Storage] Initialisation reportée:", sErr.message);
    }

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
    this.storage = storage;
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

  // --- CLOUD STORAGE : TÉLÉVERSEMENT DE DOCUMENTS SANS LIMITE DE TAILLE ---
  async uploadFile(file, folder = "documents", onProgress) {
    if (!this.storage) {
      throw new Error("Firebase Storage n'est pas encore activé dans votre console Firebase.");
    }
    const cleanName = (file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePath = `${folder}/${Date.now()}_${cleanName}`;
    const fileRef = ref(this.storage, uniquePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (snapshot.totalBytes > 0 && typeof onProgress === "function") {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(pct, snapshot.bytesTransferred, snapshot.totalBytes);
          }
        },
        (error) => {
          console.error("❌ [Firebase Storage] Erreur upload:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
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
        tips.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("techTips", tips);
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

    // 5. Écouteur en direct sur la collection Actualités
    try {
      const newsCol = collection(this.db, "news");
      const unsubNews = onSnapshot(newsCol, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("news", items);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener news:", error.message);
      });
      this.unsubscribers.push(unsubNews);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup news listener:", e);
    }

    // 6. Écouteur sur le Thème & Néon
    try {
      const themeDocRef = doc(this.db, "settings", "theme");
      const unsubTheme = onSnapshot(themeDocRef, (docSnap) => {
        if (docSnap.exists()) {
          onDataUpdated("theme", docSnap.data());
        }
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener theme:", error.message);
      });
      this.unsubscribers.push(unsubTheme);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup theme listener:", e);
    }

    // 7. Écouteur sur les Arrière-plans par catégorie
    try {
      const bgDocRef = doc(this.db, "settings", "backgrounds");
      const unsubBg = onSnapshot(bgDocRef, (docSnap) => {
        if (docSnap.exists()) {
          onDataUpdated("backgrounds", docSnap.data());
        }
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener backgrounds:", error.message);
      });
      this.unsubscribers.push(unsubBg);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup backgrounds listener:", e);
    }

    // 8. Écouteur sur les Catégories Personnalisées
    try {
      const catCol = collection(this.db, "customCategories");
      const unsubCat = onSnapshot(catCol, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        onDataUpdated("categories", items.length > 0 ? items : null);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener categories:", error.message);
      });
      this.unsubscribers.push(unsubCat);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup categories listener:", e);
    }

    // 9. Écouteur sur la configuration Plateforme
    try {
      const platformDocRef = doc(this.db, "settings", "platform");
      const unsubPlatform = onSnapshot(platformDocRef, (docSnap) => {
        if (docSnap.exists()) {
          onDataUpdated("platform", docSnap.data());
        }
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener platform:", error.message);
      });
      this.unsubscribers.push(unsubPlatform);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup platform listener:", e);
    }

    // 10. Écouteur sur la collection Gaming & Moteurs 3D
    try {
      const gamingCol = collection(this.db, "gaming");
      const unsubGaming = onSnapshot(gamingCol, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("gaming", items);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener gaming:", error.message);
      });
      this.unsubscribers.push(unsubGaming);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup gaming listener:", e);
    }

    // 11. Écouteur sur la collection Documents & Ressources
    try {
      const docsCol = collection(this.db, "documents");
      const unsubDocs = onSnapshot(docsCol, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("documents", items);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener documents:", error.message);
      });
      this.unsubscribers.push(unsubDocs);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup documents listener:", e);
    }

    // 12. Écouteur sur la collection Snippets de Code & Scripts
    try {
      const codeCol = collection(this.db, "codeSnippets");
      const unsubCode = onSnapshot(codeCol, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("codeSnippets", items);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener codeSnippets:", error.message);
      });
      this.unsubscribers.push(unsubCode);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup codeSnippets listener:", e);
    }

    // 13. Écouteur sur la collection Portfolio d'Auberson
    try {
      const portCol = collection(this.db, "portfolioItems");
      const unsubPort = onSnapshot(portCol, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        onDataUpdated("portfolioItems", items);
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener portfolioItems:", error.message);
      });
      this.unsubscribers.push(unsubPort);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup portfolioItems listener:", e);
    }

    // 14. Écouteur sur la configuration Cloudinary
    try {
      const cloudinaryDocRef = doc(this.db, "settings", "cloudinary");
      const unsubCloudinary = onSnapshot(cloudinaryDocRef, (docSnap) => {
        if (docSnap.exists()) {
          onDataUpdated("cloudinary", docSnap.data());
        }
      }, (error) => {
        console.warn("⚠️ [Firestore] Erreur listener cloudinary:", error.message);
      });
      this.unsubscribers.push(unsubCloudinary);
    } catch (e) {
      console.warn("⚠️ [Firestore] Erreur setup cloudinary listener:", e);
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

  async deleteAllProjects() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "projects"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "projects", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
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

  async deleteAllTips() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "techTips"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "techTips", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
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

  // --- CRUD THÈME & NÉON ---
  async updateTheme(themeData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "settings", "theme");
    return await setDoc(docRef, {
      ...themeData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // --- CRUD ARRIÈRE-PLANS PAR CATÉGORIE ---
  async updateBackgrounds(bgData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "settings", "backgrounds");
    return await setDoc(docRef, {
      ...bgData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // --- CRUD PLATEFORME & IDENTITÉ ---
  async updatePlatform(platformData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "settings", "platform");
    return await setDoc(docRef, {
      ...platformData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // --- CONFIGURATION CLOUDINARY ---
  async updateCloudinary(cloudinaryData) {
    if (!this.isConfigured || !this.db) return false;
    const docRef = doc(this.db, "settings", "cloudinary");
    return await setDoc(docRef, {
      ...cloudinaryData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  async saveCloudinaryConfig(cloudinaryData) {
    return await this.updateCloudinary(cloudinaryData);
  }

  // --- CRUD ACTUALITÉS ---
  async addNews(newsData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...newsData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "news"), cleanData);
  }

  async updateNews(id, newsData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "news", id);
    return await updateDoc(docRef, {
      ...newsData,
      updatedAt: serverTimestamp()
    });
  }

  async deleteNews(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "news", id));
  }

  async deleteAllNews() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "news"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "news", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
  }

  // --- CRUD CATÉGORIES EXTENSIBLES ---
  async addCategory(catData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...catData,
      createdAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "customCategories"), cleanData);
  }

  async deleteCategory(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "customCategories", id));
  }

  // --- CRUD GAMING & 3D ---
  async addGaming(gamingData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...gamingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "gaming"), cleanData);
  }

  async updateGaming(id, gamingData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const docRef = doc(this.db, "gaming", id);
    return await updateDoc(docRef, {
      ...gamingData,
      updatedAt: serverTimestamp()
    });
  }

  async deleteGaming(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "gaming", id));
  }

  async deleteAllGaming() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "gaming"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "gaming", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
  }

  // --- CRUD DOCUMENTS ---
  async addDocument(docData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...docData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "documents"), cleanData);
  }

  async deleteDocument(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "documents", id));
  }

  async deleteAllDocuments() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "documents"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "documents", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
  }

  // --- CRUD CODE SNIPPETS & SCRIPTS ---
  async addCodeSnippet(codeData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...codeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "codeSnippets"), cleanData);
  }

  async deleteCodeSnippet(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "codeSnippets", id));
  }

  async deleteAllCodeSnippets() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "codeSnippets"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "codeSnippets", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
  }

  // --- CRUD PORTFOLIO ITEMS ---
  async addPortfolioItem(itemData) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const cleanData = {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return await addDoc(collection(this.db, "portfolioItems"), cleanData);
  }

  async deletePortfolioItem(id) {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    return await deleteDoc(doc(this.db, "portfolioItems", id));
  }

  async deleteAllPortfolioItems() {
    if (!this.isConfigured || !this.db) throw new Error("Firestore n'est pas configuré.");
    const snap = await getDocs(collection(this.db, "portfolioItems"));
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(this.db, "portfolioItems", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
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
