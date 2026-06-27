import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const pref = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Use explicit fallbacks — container may not have layout yet on first paint
    const W = container.offsetWidth  || 500;
    const H = container.offsetHeight || 460;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.0);

    const onResize = () => {
      const w = container.offsetWidth  || W;
      const h = container.offsetHeight || H;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const root = new THREE.Group();
    scene.add(root);

    const pH = 2.15;
    let   pW = pH * 1.33;

    // Brain plane — visible once texture loads
    const brainMat = new THREE.MeshStandardMaterial({
      transparent:       true,
      opacity:           0,
      roughness:         0.3,
      metalness:         0,
      emissive:          new THREE.Color(0x001f3a),
      emissiveIntensity: 0.35,
    });
    const brainMesh = new THREE.Mesh(new THREE.PlaneGeometry(pW, pH), brainMat);
    root.add(brainMesh);

    new THREE.TextureLoader().load(
      "/brain.png",
      (tex) => {
        tex.colorSpace    = THREE.SRGBColorSpace;
        brainMat.map      = tex;
        brainMat.opacity  = 1;
        brainMat.needsUpdate = true;
        const w = pH * (tex.image.width / tex.image.height);
        pW = w;
        brainMesh.geometry.dispose();
        brainMesh.geometry = new THREE.PlaneGeometry(w, pH);
      },
      undefined,
      () => {
        // Texture failed — show a plain emissive plane so something is visible
        brainMat.opacity = 0.6;
        brainMat.needsUpdate = true;
      }
    );

    // Inner glow plane — behind the brain image
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x004488, transparent: true, opacity: 0.20, depthWrite: false,
    });
    const innerGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(pW * 1.20, pH * 1.14),
      innerGlowMat
    );
    innerGlow.position.z = -0.06;
    root.add(innerGlow);

    // Outer ambient halo
    const outerHaloMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(pW * 1.90, pH * 1.72),
      new THREE.MeshBasicMaterial({ color: 0x001e40, transparent: true, opacity: 0.09, depthWrite: false })
    );
    outerHaloMesh.position.z = -0.16;
    root.add(outerHaloMesh);

    // MRI scan line — world-space so it stays horizontal
    const scanLineMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.48,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const scanLine = new THREE.Mesh(
      new THREE.PlaneGeometry(pW * 1.10, 0.003),
      scanLineMat
    );
    scene.add(scanLine);

    const scanGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00c8ff, transparent: true, opacity: 0.09,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const scanGlowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(pW * 1.10, 0.09),
      scanGlowMat
    );
    scene.add(scanGlowMesh);

    // HUD corner brackets
    const bracketMat = new THREE.LineBasicMaterial({
      color: 0x00aadd, transparent: true, opacity: 0.42,
    });
    const arm = 0.17;
    const pad = 0.06;
    [
      { x: -(pW * 0.5 + pad), y:  (pH * 0.5 + pad), sx:  1, sy: -1 },
      { x:  (pW * 0.5 + pad), y:  (pH * 0.5 + pad), sx: -1, sy: -1 },
      { x: -(pW * 0.5 + pad), y: -(pH * 0.5 + pad), sx:  1, sy:  1 },
      { x:  (pW * 0.5 + pad), y: -(pH * 0.5 + pad), sx: -1, sy:  1 },
    ].forEach(({ x, y, sx, sy }) => {
      root.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x,             y + sy * arm, 0.02),
          new THREE.Vector3(x,             y,            0.02),
          new THREE.Vector3(x + sx * arm,  y,            0.02),
        ]),
        bracketMat.clone()
      ));
    });

    // Diagnostic readout lines — right edge
    const readMat = new THREE.LineBasicMaterial({
      color: 0x007799, transparent: true, opacity: 0.32,
    });
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x00aacc, transparent: true, opacity: 0.65,
    });
    [0.52, 0.16, -0.20, -0.54].forEach((y) => {
      const x0 = pW * 0.40;
      const x1 = pW * 0.55;
      root.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x0, y, 0.02),
          new THREE.Vector3(x1, y, 0.02),
        ]),
        readMat.clone()
      ));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), dotMat.clone());
      dot.position.set(x1, y, 0.02);
      root.add(dot);
    });

    // Ambient particles
    const PARTICLE_COUNT = 75;
    const pBuf = new Float32Array(PARTICLE_COUNT * 3);
    type Particle = { x: number; y: number; z: number; vx: number; vy: number; ph: number };
    const pData: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * pW * 1.9;
      const y = (Math.random() - 0.5) * pH * 1.7;
      const z = (Math.random() - 0.5) * 0.5;
      pBuf[i * 3]     = x;
      pBuf[i * 3 + 1] = y;
      pBuf[i * 3 + 2] = z;
      pData.push({ x, y, z, vx: (Math.random() - 0.5) * 0.0014, vy: (Math.random() - 0.5) * 0.0014, ph: Math.random() * Math.PI * 2 });
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pBuf, 3));
    scene.add(new THREE.Points(particleGeo, new THREE.PointsMaterial({
      color: 0x2288bb, size: 0.017, transparent: true,
      opacity: 0.50, sizeAttenuation: true, depthWrite: false,
    })));

    // Lights
    scene.add(new THREE.AmbientLight(0x0a1830, 6.5));
    const keyLight = new THREE.DirectionalLight(0x4488aa, 3.8);
    keyLight.position.set(2, 3, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x001e44, 1.2);
    fillLight.position.set(-4, -2, -2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x00aacc, 1.4);
    rimLight.position.set(0, -2, -4);
    scene.add(rimLight);

    // Animation
    let t = 0;
    let scanT = 0;
    let animId: number;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      if (!pref) { t += 0.007; scanT += 0.006; }

      root.position.y = Math.sin(t * 0.55) * 0.038;

      innerGlowMat.opacity = 0.16 + Math.sin(t * 0.4) * 0.06;

      const sy = Math.sin(scanT) * pH * 0.46;
      scanLine.position.set(0, sy + root.position.y, 0.03);
      scanGlowMesh.position.set(0, sy + root.position.y, 0.02);
      scanLineMat.opacity = 0.36 + Math.sin(scanT + 1.1) * 0.14;
      scanGlowMat.opacity = 0.06 + Math.sin(scanT + 1.1) * 0.04;

      const pos = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const d = pData[i];
        d.x += d.vx + Math.sin(t * 0.7 + d.ph) * 0.0004;
        d.y += d.vy + Math.cos(t * 0.5 + d.ph) * 0.0004;
        if (d.x >  pW * 0.92) d.x = -pW * 0.92;
        if (d.x < -pW * 0.92) d.x =  pW * 0.92;
        if (d.y >  pH * 0.82) d.y = -pH * 0.82;
        if (d.y < -pH * 0.82) d.y =  pH * 0.82;
        pos.setXYZ(i, d.x, d.y + root.position.y * 0.3, d.z);
      }
      pos.needsUpdate = true;

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="hero-3d"
      ref={mountRef}
      aria-hidden="true"
      style={{ position: "relative", width: "100%", height: "100%" }}
    />
  );
}
