import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width  = container.clientWidth;
    const height = container.clientHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Fibonacci sphere node distribution
    const NODE_COUNT   = 80;
    const radius       = 3.4;
    const goldenAngle  = Math.PI * (3 - Math.sqrt(5));
    const positions: THREE.Vector3[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const y     = 1 - (i / (NODE_COUNT - 1)) * 2;
      const r     = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      positions.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
    }

    const pointsGeo = new THREE.BufferGeometry().setFromPoints(positions);
    const pointsMat = new THREE.PointsMaterial({ color: 0x3ddc97, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.9 });
    group.add(new THREE.Points(pointsGeo, pointsMat));

    const linePos: number[] = [];
    const MAX_DIST = 1.7;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < MAX_DIST) {
          linePos.push(positions[i].x, positions[i].y, positions[i].z, positions[j].x, positions[j].y, positions[j].z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    group.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x3ddc97, transparent: true, opacity: 0.12 })));

    const wireGeo = new THREE.IcosahedronGeometry(radius + 0.55, 1);
    group.add(new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({ color: 0x5b9fe3, wireframe: true, transparent: true, opacity: 0.06 })));

    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      mouseY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);

    let frameId: number;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!prefersReducedMotion) {
        t += 0.0022;
        group.rotation.y = t;
        group.rotation.x = Math.sin(t * 0.5) * 0.15;
      }
      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      pointsGeo.dispose(); pointsMat.dispose();
      lineGeo.dispose(); wireGeo.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="hero-3d" aria-hidden="true" />;
}
