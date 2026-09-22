/**
 * Three.js 3D Optical Illusion Logo Engine
 * For Nicklaus Auberson Portfolio
 * 60/120 FPS ultra-fluid WebGL animation
 */

class LogoScene3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.logoGroup = null;
    this.particleRing = null;
    this.outerHalo = null;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0.003, y: 0.007 };
    this.isVisible = true;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 360;
    const height = this.container.clientHeight || 360;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 7.5;

    // 3. Renderer with antialias and alpha
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 5, 8);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.2); // subtle futuristic blue accent
    rimLight.position.set(-5, -5, -4);
    this.scene.add(rimLight);

    // 5. Build the 3D Optical Illusion Logo
    this.create3DLogo();

    // 6. Listeners & Responsive handling
    this.setupInteractivity();

    // 7. Pause when offscreen (High Performance for Mobile)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(this.container);
    }

    // 8. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  create3DLogo() {
    this.logoGroup = new THREE.Group();
    this.scene.add(this.logoGroup);

    // Material for the pure white 3D S-ribbons
    const whiteRibbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x222222,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });

    // Generate the iconic spiral S curves from the uploaded logo
    // Upper Spiral Blade
    const upperCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.8, 0.3),
      new THREE.Vector3(1.2, 1.4, 0.1),
      new THREE.Vector3(0.4, 1.9, -0.2),
      new THREE.Vector3(-0.9, 1.7, 0.1),
      new THREE.Vector3(-1.8, 0.9, 0.4),
      new THREE.Vector3(-2.1, 0.0, 0.2),
      new THREE.Vector3(-1.9, -0.6, 0.0),
      new THREE.Vector3(-1.2, -0.9, -0.1)
    ]);

    // Lower Spiral Blade (Symmetric 180 deg)
    const lowerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.5, -0.8, -0.3),
      new THREE.Vector3(-1.2, -1.4, -0.1),
      new THREE.Vector3(-0.4, -1.9, 0.2),
      new THREE.Vector3(0.9, -1.7, -0.1),
      new THREE.Vector3(1.8, -0.9, -0.4),
      new THREE.Vector3(2.1, -0.0, -0.2),
      new THREE.Vector3(1.9, 0.6, 0.0),
      new THREE.Vector3(1.2, 0.9, 0.1)
    ]);

    // Extrude ribbon geometries
    const upperGeo = new THREE.TubeGeometry(upperCurve, 70, 0.28, 16, false);
    const lowerGeo = new THREE.TubeGeometry(lowerCurve, 70, 0.28, 16, false);

    const upperMesh = new THREE.Mesh(upperGeo, whiteRibbonMaterial);
    const lowerMesh = new THREE.Mesh(lowerGeo, whiteRibbonMaterial);
    this.logoGroup.add(upperMesh);
    this.logoGroup.add(lowerMesh);

    // Also include a central glowing core disk
    const centerDiskGeo = new THREE.TorusGeometry(1.05, 0.08, 16, 64);
    const centerDiskMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });
    const centerDisk = new THREE.Mesh(centerDiskGeo, centerDiskMat);
    centerDisk.rotation.x = Math.PI / 2.5;
    this.logoGroup.add(centerDisk);

    // Texture Plane with the original uploaded logo, masked to white-only
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/logo.jpg', (texture) => {
      const planeGeo = new THREE.PlaneGeometry(3.6, 3.6);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending, // Black becomes invisible, pure white shines!
        depthWrite: false
      });
      const logoPlane = new THREE.Mesh(planeGeo, planeMat);
      logoPlane.position.z = 0.05;
      this.logoGroup.add(logoPlane);
    });

    // 7. OPTICAL ILLUSION: Dynamic Self-Drawing Circle
    // The circle is drawn out of orbiting particles that trace the perimeter in 3D
    const ringParticlesCount = 380;
    const ringGeo = new THREE.BufferGeometry();
    const ringPositions = new Float32Array(ringParticlesCount * 3);
    const ringColors = new Float32Array(ringParticlesCount * 3);
    const ringScales = new Float32Array(ringParticlesCount);

    const radius = 2.05;
    for (let i = 0; i < ringParticlesCount; i++) {
      const angle = (i / ringParticlesCount) * Math.PI * 2;
      ringPositions[i * 3] = Math.cos(angle) * radius;
      ringPositions[i * 3 + 1] = Math.sin(angle) * radius;
      ringPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;

      // Pure white with subtle gradient
      ringColors[i * 3] = 1.0;
      ringColors[i * 3 + 1] = 1.0;
      ringColors[i * 3 + 2] = 1.0;
      ringScales[i] = Math.random();
    }

    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));

    const ringMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.particleRing = new THREE.Points(ringGeo, ringMat);
    this.scene.add(this.particleRing);

    // Glowing subtle outer ring that pulses
    const haloGeo = new THREE.RingGeometry(2.0, 2.08, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.outerHalo = new THREE.Mesh(haloGeo, haloMat);
    this.scene.add(this.outerHalo);
  }

  setupInteractivity() {
    // Mouse move & Parallax
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 1.5;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 1.5;
    });

    // Touch & Drag on the canvas
    const dom = this.renderer.domElement;

    const onStart = (clientX, clientY) => {
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onMove = (clientX, clientY) => {
      if (!this.isDragging || !this.logoGroup) return;
      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.logoGroup.rotation.y += deltaX * 0.012;
      this.logoGroup.rotation.x += deltaY * 0.012;

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    // Mouse drag
    dom.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    // Touch drag (Mobile iPhone / Android)
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', onEnd);

    // Resize handling
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (!this.isVisible) return;

    // Smooth inertia mouse tracking
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Auto-rotation of the 3D logo
    if (this.logoGroup && !this.isDragging) {
      this.logoGroup.rotation.y += this.rotationVelocity.y;
      this.logoGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.2 + this.mouse.y * 0.5;
      this.logoGroup.rotation.z = Math.cos(Date.now() * 0.0008) * 0.15 + this.mouse.x * 0.5;
    }

    // Optical Illusion: Outer Circle rotates in counter-phase to create the self-drawing illusion
    if (this.particleRing) {
      this.particleRing.rotation.z -= 0.008;
      this.particleRing.rotation.x = this.mouse.y * 0.25;
      this.particleRing.rotation.y = this.mouse.x * 0.25;
    }

    if (this.outerHalo) {
      const pulse = 0.25 + Math.sin(Date.now() * 0.0025) * 0.15;
      this.outerHalo.material.opacity = pulse;
      this.outerHalo.rotation.z += 0.004;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialisation globale
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('logo3d-canvas')) {
    window.logo3D = new LogoScene3D('logo3d-canvas');
  }
});
