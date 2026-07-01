import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const NODE_VERT = `
  uniform float uTime;
  uniform float uPhase;
  varying vec3 vNormal;
  void main() {
    vNormal = normal;
    float s = 1.0 + 0.06 * sin(uTime * 2.2 + uPhase);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * s, 1.0);
  }
`;

const NODE_FRAG = `
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uPhase;
  varying vec3  vNormal;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), vec3(0,0,1))), 1.8);
    float p = 0.6 + 0.4 * sin(uTime * 2.2 + uPhase);
    vec3  c = uColor * (0.7 + f * 0.8) * p;
    gl_FragColor = vec4(c, 0.5 + f * 0.5);
  }
`;

const RING_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RING_FRAG = `
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uPhase;
  varying vec3  vNormal;
  void main() {
    float p = 0.3 + 0.7 * abs(sin(uTime * 1.8 + uPhase));
    gl_FragColor = vec4(uColor, p * 0.7);
  }
`;

const BEAM_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAG = `
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uOffset;
  varying vec2  vUv;
  void main() {
    float flow   = fract(vUv.x * 1.5 - uTime * 0.6 + uOffset);
    float streak = smoothstep(0.0, 0.2, flow) * smoothstep(0.55, 0.2, flow);
    float edge   = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float alpha  = streak * edge * 0.9;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const CENTER_VERT = `
  uniform float uTime;
  varying vec3 vNormal;
  void main() {
    vNormal = normal;
    float s = 1.0 + 0.04 * sin(uTime * 1.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * s, 1.0);
  }
`;

const CENTER_FRAG = `
  uniform float uTime;
  varying vec3 vNormal;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), vec3(0,0,1))), 1.6);
    float p = 0.75 + 0.25 * sin(uTime * 1.5);
    vec3  c = vec3(0.0, 0.83, 1.0) * p + vec3(0.1, 0.5, 1.0) * f;
    gl_FragColor = vec4(c, 0.55 + f * 0.45);
  }
`;

type Vec3 = [number, number, number];

const CENTER_POS: Vec3 = [0, 0, 0];

const NODES: { label: string; pos: Vec3; color: THREE.Color; phase: number }[] = [
  { label: "CNN",          pos: [-2.6,  1.2, 0], color: new THREE.Color(0.18, 0.62, 1.0),  phase: 0.0 },
  { label: "EfficientNet", pos: [ 0.0, -2.2, 0], color: new THREE.Color(0.00, 0.90, 0.95), phase: 2.1 },
  { label: "ViT-B/16",     pos: [ 2.6,  1.2, 0], color: new THREE.Color(0.60, 0.45, 1.0),  phase: 4.2 },
];

function ModelNode({ pos, color, phase }: { pos: Vec3; color: THREE.Color; phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const r1Ref   = useRef<THREE.Mesh>(null!);
  const r2Ref   = useRef<THREE.Mesh>(null!);

  const uNode = useMemo(() => ({
    uTime:  { value: 0 },
    uColor: { value: color },
    uPhase: { value: phase },
  }), [color, phase]);

  const uRing = useMemo(() => ({
    uTime:  { value: 0 },
    uColor: { value: color },
    uPhase: { value: phase },
  }), [color, phase]);

  const geo  = useMemo(() => new THREE.IcosahedronGeometry(0.32, 3), []);
  const rGeo = useMemo(() => new THREE.TorusGeometry(0.48, 0.014, 12, 64), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    uNode.uTime.value = t;
    uRing.uTime.value = t;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.5 + phase;
      meshRef.current.rotation.x = Math.sin(t * 0.3 + phase) * 0.2;
    }
    if (r1Ref.current) r1Ref.current.rotation.z =  t * 0.6 + phase;
    if (r2Ref.current) r2Ref.current.rotation.z = -t * 0.4 + phase;
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef} geometry={geo}>
        <shaderMaterial vertexShader={NODE_VERT} fragmentShader={NODE_FRAG} uniforms={uNode} transparent />
      </mesh>
      <mesh ref={r1Ref} geometry={rGeo}>
        <shaderMaterial vertexShader={RING_VERT} fragmentShader={RING_FRAG} uniforms={uRing} transparent depthWrite={false} />
      </mesh>
      <mesh ref={r2Ref} geometry={useMemo(() => new THREE.TorusGeometry(0.60, 0.008, 12, 64), [])}>
        <shaderMaterial
          vertexShader={RING_VERT}
          fragmentShader={RING_FRAG}
          uniforms={{ ...uRing, uPhase: { value: phase + 1.0 } }}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CenterNode() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const r1Ref   = useRef<THREE.Mesh>(null!);
  const r2Ref   = useRef<THREE.Mesh>(null!);

  const uCenter = useMemo(() => ({ uTime: { value: 0 } }), []);
  const uRing   = useMemo(() => ({
    uTime:  { value: 0 },
    uColor: { value: new THREE.Color(0.0, 0.83, 1.0) },
    uPhase: { value: 0 },
  }), []);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.50, 4), []);
  const r1  = useMemo(() => new THREE.TorusGeometry(0.72, 0.018, 12, 80), []);
  const r2  = useMemo(() => new THREE.TorusGeometry(0.88, 0.010, 12, 80), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    uCenter.uTime.value = t;
    uRing.uTime.value   = t;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.25;
      meshRef.current.rotation.x = t * 0.18;
    }
    if (r1Ref.current) r1Ref.current.rotation.z =  t * 0.35;
    if (r2Ref.current) r2Ref.current.rotation.z = -t * 0.28;
  });

  return (
    <group position={CENTER_POS}>
      <mesh ref={meshRef} geometry={geo}>
        <shaderMaterial vertexShader={CENTER_VERT} fragmentShader={CENTER_FRAG} uniforms={uCenter} transparent />
      </mesh>
      <mesh ref={r1Ref} geometry={r1}>
        <shaderMaterial vertexShader={RING_VERT} fragmentShader={RING_FRAG} uniforms={uRing} transparent depthWrite={false} />
      </mesh>
      <mesh ref={r2Ref} geometry={r2}>
        <shaderMaterial
          vertexShader={RING_VERT}
          fragmentShader={RING_FRAG}
          uniforms={{ ...uRing, uPhase: { value: 1.4 } }}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Beam({ from, to, color, offset }: { from: Vec3; to: Vec3; color: THREE.Color; offset: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  const { geo, pos, rot } = useMemo(() => {
    const a  = new THREE.Vector3(...from);
    const b  = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const mid = a.clone().add(b).multiplyScalar(0.5);

    const g = new THREE.PlaneGeometry(len, 0.032, 80, 1);

    const angle = Math.atan2(dir.y, dir.x);
    return { geo: g, pos: mid.toArray() as Vec3, rot: angle };
  }, [from, to]);

  const u = useMemo(() => ({
    uTime:   { value: 0 },
    uColor:  { value: color },
    uOffset: { value: offset },
  }), [color, offset]);

  useFrame((s) => { u.uTime.value = s.clock.elapsedTime; });

  return (
    <mesh ref={ref} geometry={geo} position={pos} rotation={[0, 0, rot]}>
      <shaderMaterial
        vertexShader={BEAM_VERT}
        fragmentShader={BEAM_FRAG}
        uniforms={u}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null!);

  const { buf, init, vel } = useMemo(() => {
    const N   = 200;
    const b   = new Float32Array(N * 3);
    const ini = new Float32Array(N * 3);
    const v   = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r  = 1.6 + Math.random() * 2.2;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;
      const x  = r * Math.cos(ph) * Math.cos(th);
      const y  = r * Math.sin(ph);
      const z  = r * Math.cos(ph) * Math.sin(th);
      b[i*3] = ini[i*3] = x;
      b[i*3+1] = ini[i*3+1] = y;
      b[i*3+2] = ini[i*3+2] = z;
      v[i*3]   = (Math.random() - 0.5) * 0.004;
      v[i*3+1] = (Math.random() - 0.5) * 0.004;
      v[i*3+2] = (Math.random() - 0.5) * 0.004;
    }
    return { buf: b, init: ini, vel: v };
  }, []);

  useFrame((s) => {
    if (!ref.current) return;
    const t   = s.clock.elapsedTime * 0.25;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 200; i++) {
      pos.setXYZ(i,
        init[i*3]   + Math.sin(t + vel[i*3]   * 1000) * 0.08,
        init[i*3+1] + Math.cos(t + vel[i*3+1] * 1000) * 0.08,
        init[i*3+2] + Math.sin(t + vel[i*3+2] * 1000) * 0.08,
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buf, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#00d4ff" size={0.025} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function FloatWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (ref.current) ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.4) * 0.07;
  });
  return <group ref={ref}>{children}</group>;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[0,  5, 4]} intensity={2.0} color="#00d4ff" distance={15} />
      <pointLight position={[-4, 2, 2]} intensity={0.9} color="#4facfe" distance={12} />
      <pointLight position={[4,  2, 2]} intensity={0.9} color="#a78bfa" distance={12} />
      <pointLight position={[0, -4, 2]} intensity={1.0} color="#00f2fe" distance={12} />

      <FloatWrapper>
        {NODES.map((n) => (
          <ModelNode key={n.label} pos={n.pos} color={n.color} phase={n.phase} />
        ))}
        <CenterNode />
        {NODES.map((n, i) => (
          <Beam
            key={n.label}
            from={n.pos}
            to={CENTER_POS}
            color={n.color}
            offset={i * 0.33}
          />
        ))}
      </FloatWrapper>

      <Particles />

      <EffectComposer>
        <Bloom luminanceThreshold={0.08} luminanceSmoothing={0.85} intensity={2.4} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export default function Hero3D() {
  return (
    <div
      className="hero-3d"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", minHeight: "460px" }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
