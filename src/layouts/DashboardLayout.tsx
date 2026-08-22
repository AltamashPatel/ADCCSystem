import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      frameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth)  * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        document.documentElement.style.setProperty('--mouse-x', x.toFixed(3));
        document.documentElement.style.setProperty('--mouse-y', y.toFixed(3));
        document.documentElement.style.setProperty('--spotlight-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--spotlight-y', `${e.clientY}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-adcc-bg text-adcc-textPrimary font-sans antialiased relative overflow-hidden">

      {/* ── Background Layer ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">

        {/* Parallax dot grid */}
        <div className="absolute -inset-12 dot-grid opacity-100 pointer-events-none z-0" />

        {/* Mouse Spotlight Layer */}
        <div className="absolute inset-0 mouse-spotlight z-10" />

        {/* Deep radial gradient — focal glow behind content */}
        <div className="absolute inset-0 z-20"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,224,255,0.045) 0%, transparent 70%)' }}
        />

        {/* Secondary warm accent bottom-right */}
        <div className="absolute inset-0 z-20"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 85% 90%, rgba(59,130,246,0.04) 0%, transparent 60%)' }}
        />

        {/* Vignette edges */}
        <div className="absolute inset-0 z-20"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(8,13,24,0.55) 100%)' }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => {
            const size    = 2 + (i % 3) * 1.2;
            const delay   = -(i * 4.5);
            const dur     = 40 + (i % 4) * 8;
            const left    = (i * 11 + 5) % 100;
            const top     = (i * 17 + 8) % 100;
            return (
              <div
                key={i}
                className="absolute rounded-full animate-float-particle pointer-events-none"
                style={{
                  width:  `${size}px`,
                  height: `${size}px`,
                  left:   `${left}%`,
                  top:    `${top}%`,
                  background: 'rgba(0,224,255,0.22)',
                  filter: 'blur(0.5px)',
                  animationDelay:    `${delay}s`,
                  animationDuration: `${dur}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div className="relative z-20">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300 relative z-10">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
