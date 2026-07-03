import { useEffect, useRef } from "react";

export default function Hero3D() {
  const brainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      if (brainRef.current) {
        frame += 0.3;
        const floatY = Math.sin(frame * 0.02) * 15;
        const rotateY = Math.sin(frame * 0.01) * 8;
        const scale = 1 + Math.sin(frame * 0.015) * 0.03;
        brainRef.current.style.transform = `translateY(${floatY}px) rotateY(${rotateY}deg) scale(${scale})`;
      }
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent opacity-60 animate-pulse-slow" />
      
      <div 
        ref={brainRef}
        className="relative w-[550px] h-[550px] transform-gpu"
        style={{ 
          perspective: "1200px",
          transformStyle: "preserve-3d",
          willChange: "transform"
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-600/25 blur-3xl animate-pulse-slow" />
        
        <div className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-orange-400/50 to-red-500/50 blur-2xl animate-pulse" 
          style={{ animationDuration: "2s" }} 
        />
        
        <img
          src="/brain1.png"
          alt="Brain MRI with Tumor"
          className="relative w-full h-full object-contain drop-shadow-[0_0_70px_rgba(0,212,255,0.7)]"
          style={{
            filter: "brightness(1.15) contrast(1.25) saturate(1.1)",
            mixBlendMode: "screen",
            animation: "glow 3s ease-in-out infinite"
          }}
        />

        <div className="absolute top-[30%] right-[25%] w-16 h-16 rounded-full border-2 border-orange-400/60 animate-ping" 
          style={{ animationDuration: "2.5s" }} 
        />
        
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${15 + Math.random() * 70}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              boxShadow: "0 0 12px rgba(0,212,255,0.9), 0 0 24px rgba(0,212,255,0.5)",
              opacity: 0.6 + Math.random() * 0.4
            }}
          />
        ))}

        {[45, 135, 225, 315].map((angle, i) => (
          <div
            key={angle}
            className="absolute w-0.5 h-32 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
            style={{
              top: "50%",
              left: "50%",
              transformOrigin: "center top",
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              animation: `scan 4s linear infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#070b0f]/90 via-transparent to-[#070b0f]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b0f]/90 via-transparent to-[#070b0f] pointer-events-none" />
      
      <style>{`
        @keyframes glow {
          0%, 100% { filter: brightness(1.15) contrast(1.25) saturate(1.1) drop-shadow(0 0 70px rgba(0,212,255,0.7)); }
          50% { filter: brightness(1.25) contrast(1.3) saturate(1.15) drop-shadow(0 0 90px rgba(0,212,255,0.9)); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(var(--tx, 10px), var(--ty, -10px)); opacity: 1; }
        }
        @keyframes scan {
          0% { opacity: 0; }
          50% { opacity: 0.6; }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--angle)) scaleY(1.5); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
