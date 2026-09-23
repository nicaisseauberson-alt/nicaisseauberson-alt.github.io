/**
 * Outlook Studio - Cloudinary Storage & Direct Download Engine (2026)
 * High-Performance Client-Side Cloud Asset Management (Zero Backend Secrets)
 * Compatible with 100% Cloudinary Free Tier (Unsigned Upload Preset)
 */

class CloudinaryService {
  static STORAGE_KEY = "outlook_studio_cloudinary_config";
  static DEFAULT_FOLDER = "outlook_studio";

  /**
   * Récupère la configuration Cloudinary active (Firestore, StorageService ou LocalStorage)
   */
  static getConfig() {
    let config = {
      cloudName: "",
      uploadPreset: "",
      folder: this.DEFAULT_FOLDER
    };

    // 1. Depuis StorageService
    if (window.StorageService && typeof window.StorageService.get === "function") {
      const dbData = window.StorageService.get();
      if (dbData && dbData.cloudinary) {
        config = { ...config, ...dbData.cloudinary };
      }
    }

    // 2. Depuis localStorage local dédié (fallback prioritaire)
    try {
      const local = localStorage.getItem(this.STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.cloudName) config.cloudName = parsed.cloudName;
        if (parsed.uploadPreset) config.uploadPreset = parsed.uploadPreset;
        if (parsed.folder) config.folder = parsed.folder;
      }
    } catch (e) {}

    return config;
  }

  /**
   * Sauvegarde la configuration Cloudinary
   */
  static saveConfig(newConfig, notifyUI = true) {
    if (!newConfig) return;
    const cleanConfig = {
      cloudName: (newConfig.cloudName || "").trim(),
      uploadPreset: (newConfig.uploadPreset || "").trim(),
      folder: (newConfig.folder || this.DEFAULT_FOLDER).trim()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanConfig));
    } catch (e) {}

    if (window.StorageService && typeof window.StorageService.get === "function") {
      const dbData = window.StorageService.get();
      dbData.cloudinary = { ...(dbData.cloudinary || {}), ...cleanConfig };
      window.StorageService.save(dbData, false);
    }

    // Synchronisation Firestore si configuré
    if (window.FirebaseBridge && window.FirebaseBridge.isConfigured && typeof window.FirebaseBridge.saveCloudinaryConfig === "function") {
      window.FirebaseBridge.saveCloudinaryConfig(cleanConfig).catch(err => {
        console.warn("⚠️ [Cloudinary] Avertissement synchro Firestore:", err);
      });
    }

    if (notifyUI) {
      window.dispatchEvent(new CustomEvent("cloudinary_config_updated", { detail: cleanConfig }));
    }

    return cleanConfig;
  }

  /**
   * Vérifie si Cloudinary est configuré et prêt
   */
  static isConfigured() {
    const config = this.getConfig();
    return !!(config.cloudName && config.cloudName.length > 2 && config.uploadPreset && config.uploadPreset.length > 2);
  }

  /**
   * Formate une taille en octets en chaîne lisible (Ko, Mo)
   */
  static formatFileSize(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "Taille inconnue";
    const kb = bytes / 1024;
    if (kb < 1000) {
      return kb.toFixed(1) + " KB";
    }
    const mb = kb / 1024;
    return mb.toFixed(2) + " MB";
  }

  /**
   * Injecte le flag fl_attachment dans une URL Cloudinary pour forcer le téléchargement direct
   * sans prévisualisation dans le navigateur et avec Content-Disposition: attachment.
   */
  static formatDirectDownloadUrl(url, originalFileName = "") {
    if (!url || typeof url !== "string") return "";
    
    // Si ce n'est pas une ressource Cloudinary, retourner l'URL brute
    if (!url.includes("cloudinary.com")) {
      return url;
    }

    // Nettoyer le nom de fichier pour le paramètre fl_attachment
    let cleanFileName = "";
    if (originalFileName) {
      cleanFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      // Retirer l'extension si présente pour le paramètre Cloudinary fl_attachment:filename
      const dotIndex = cleanFileName.lastIndexOf(".");
      if (dotIndex > 0) {
        cleanFileName = cleanFileName.substring(0, dotIndex);
      }
    }

    // Éviter de doubler le flag fl_attachment si déjà présent
    if (url.includes("/fl_attachment")) {
      return url;
    }

    const attachmentFlag = cleanFileName ? `fl_attachment:${cleanFileName}` : "fl_attachment";

    // Remplacement après /upload/
    if (url.includes("/upload/")) {
      return url.replace("/upload/", `/upload/${attachmentFlag}/`);
    }

    return url;
  }

  /**
   * Téléversement direct vers Cloudinary via Unsigned Upload Preset avec suivi de progression
   * 
   * @param {File} file - Fichier sélectionné par l'utilisateur
   * @param {Object} options - Options (onProgress callback, folder, etc.)
   * @returns {Promise<Object>} Détails du fichier téléversé
   */
  static uploadFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      const config = this.getConfig();

      if (!this.isConfigured()) {
        return reject(new Error(
          "Cloudinary n'est pas encore configuré.\n\n" +
          "👉 Rendez-vous dans l'Espace Admin > Paramètres & Profil > ☁️ Configuration Cloudinary pour renseigner votre Cloud Name et votre Upload Preset."
        ));
      }

      if (!file) {
        return reject(new Error("Aucun fichier fourni pour l'upload."));
      }

      // Vérification des quotas indicatifs de l'offre gratuite Cloudinary (10 Mo pour documents bruts)
      const maxSizeBytes = 25 * 1024 * 1024; // 25 Mo
      if (file.size > maxSizeBytes) {
        return reject(new Error(
          `Le fichier « ${file.name} » (${this.formatFileSize(file.size)}) dépasse la limite recommandée de 25 Mo.\n` +
          `Veuillez sélectionner un fichier plus compact.`
        ));
      }

      const folder = options.folder || config.folder || this.DEFAULT_FOLDER;
      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset);
      if (folder) {
        formData.append("folder", folder);
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);

      // Suivi de progression en temps réel (0% à 100%)
      if (xhr.upload && typeof options.onProgress === "function") {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
            options.onProgress(percent, e.loaded, e.total);
          }
        };
      }

      xhr.onload = () => {
        let response = {};
        try {
          response = JSON.parse(xhr.responseText);
        } catch (e) {
          response = {};
        }

        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
          const directDownloadUrl = this.formatDirectDownloadUrl(response.secure_url, file.name);
          const formattedSize = this.formatFileSize(response.bytes || file.size);

          resolve({
            url: response.secure_url,
            secure_url: response.secure_url,
            downloadUrl: directDownloadUrl,
            public_id: response.public_id,
            resource_type: response.resource_type || "raw",
            format: response.format || (file.name.split(".").pop() || "bin").toLowerCase(),
            bytes: response.bytes || file.size,
            fileName: file.name,
            fileSize: formattedSize,
            created_at: response.created_at || new Date().toISOString()
          });
        } else {
          let errorMsg = "Échec de l'upload Cloudinary.";
          if (response.error && response.error.message) {
            errorMsg = response.error.message;
            if (errorMsg.toLowerCase().includes("upload preset")) {
              errorMsg += "\n\n💡 Vérifiez que votre Upload Preset dans Cloudinary est bien configuré en mode 'Unsigned'.";
            }
          } else if (xhr.status === 401 || xhr.status === 400) {
            errorMsg = `Erreur (${xhr.status}) : Identifiants Cloud Name ou Upload Preset invalides.`;
          }
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Erreur réseau lors de l'envoi vers Cloudinary. Vérifiez votre connexion Internet."));
      };

      xhr.ontimeout = () => {
        reject(new Error("Délai d'attente dépassé lors de l'upload vers Cloudinary."));
      };

      // 3 minutes de timeout pour les fichiers volumineux
      xhr.timeout = 180000;

      xhr.send(formData);
    });
  }

  /**
   * Déclenche un téléchargement immédiat et sans authentification dans le navigateur du visiteur.
   * Utilise fl_attachment côté Cloudinary + téléchargement par blob ou balise d'ancrage.
   * 
   * @param {string} fileUrl - URL du fichier (Cloudinary ou externe)
   * @param {string} fileName - Nom sous lequel enregistrer le fichier
   */
  static async triggerBrowserDownload(fileUrl, fileName = "document") {
    if (!fileUrl) {
      alert("Erreur : l'adresse de téléchargement du fichier est introuvable.");
      return;
    }

    // 1. S'assurer que le flag fl_attachment est appliqué si c'est Cloudinary
    const finalUrl = this.formatDirectDownloadUrl(fileUrl, fileName);

    // 2. Tenter un téléchargement via Blob pour forcer le popup de sauvegarde du navigateur
    try {
      const response = await fetch(finalUrl, { mode: "cors" });
      if (!response.ok) throw new Error("HTTP error " + response.status);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      link.download = fileName || "document_outlook_studio";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 5000);
      return;
    } catch (corsOrNetError) {
      console.info("ℹ️ [Download Engine] Fallback direct via ancre download:", corsOrNetError.message);
    }

    // 3. Fallback immédiat : déclenchement direct via ancre HTML5 download
    try {
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = finalUrl;
      link.download = fileName || "document_outlook_studio";
      link.target = "_blank"; // Empêche de quitter la page si le navigateur bloque
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) document.body.removeChild(link);
      }, 2000);
    } catch (e) {
      // 4. Ultime recours
      window.open(finalUrl, "_blank");
    }
  }
}

// Exposer globalement
window.CloudinaryService = CloudinaryService;
