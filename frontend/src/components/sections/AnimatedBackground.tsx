import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = Math.min(80, Math.floor((width * height) / 18000));
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.25 - 0.1,
        opacity: Math.random() * 0.5 + 0.15,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.005,
      });
    }
    particlesRef.current = particles;

    let frame = 0;

    const drawJusticeSilhouette = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const cx = w * 0.72;
      const cy = h * 0.45;
      const scale = Math.min(w, h) * 0.0028;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      ctx.globalAlpha = 0.04 + Math.sin(frame * 0.008) * 0.015;
      ctx.fillStyle = "#C8A951";

      ctx.beginPath();
      ctx.ellipse(0, -120, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-28, -95);
      ctx.lineTo(28, -95);
      ctx.lineTo(22, -30);
      ctx.lineTo(-22, -30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-55, -80);
      ctx.quadraticCurveTo(-55, -95, -40, -95);
      ctx.lineTo(-28, -95);
      ctx.lineTo(-22, -30);
      ctx.lineTo(-18, -30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(55, -80);
      ctx.quadraticCurveTo(55, -95, 40, -95);
      ctx.lineTo(28, -95);
      ctx.lineTo(22, -30);
      ctx.lineTo(18, -30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-8, -30);
      ctx.lineTo(8, -30);
      ctx.lineTo(12, 60);
      ctx.lineTo(-12, 60);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-12, 60);
      ctx.lineTo(12, 60);
      ctx.lineTo(22, 120);
      ctx.lineTo(-22, 120);
      ctx.closePath();
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#C8A951";
      ctx.beginPath();
      ctx.moveTo(-70, -78);
      ctx.lineTo(-70, -50);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-85, -78);
      ctx.lineTo(-55, -78);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-70, -78, 15, 0, Math.PI, true);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-70, -63);
      ctx.lineTo(-70, -40);
      ctx.stroke();

      const bowlY = -40 + Math.sin(frame * 0.02) * 2;
      ctx.beginPath();
      ctx.moveTo(-90, bowlY);
      ctx.quadraticCurveTo(-70, bowlY + 12, -50, bowlY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(40, -85);
      ctx.lineTo(65, -55);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(55, -45, 25, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const gridSize = 100;
      const offsetX = (frame * 0.15) % gridSize;
      const offsetY = (frame * 0.12) % gridSize;

      ctx.strokeStyle = "rgba(200, 169, 81, 0.04)";
      ctx.lineWidth = 0.5;

      for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let y = -gridSize + offsetY; y < h + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawGrid(ctx, width, height);
      drawJusticeSilhouette(ctx, width, height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const currentOpacity = p.opacity * (0.6 + Math.sin(p.pulse) * 0.4);
        const currentSize = p.size * (0.85 + Math.sin(p.pulse * 0.7) * 0.15);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 169, 81, ${currentOpacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 169, 81, ${currentOpacity * 0.12})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(200, 169, 81, ${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="animated-background"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
