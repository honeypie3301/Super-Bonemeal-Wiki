import React, { useEffect, useRef, useState } from 'react';

interface UpdatedFrameProps {
  id: string; // Unique identifier for localStorage tracking
  children: React.ReactNode;
  isUpdated?: boolean;
  className?: string;
  badgeLabel?: string;
}

export const UpdatedFrame: React.FC<UpdatedFrameProps> = ({
  id,
  children,
  isUpdated = true,
  className = '',
  badgeLabel = 'UPDATED',
}) => {
  const [active, setActive] = useState<boolean>(() => {
    if (!isUpdated) return false;
    try {
      const seen = localStorage.getItem(`bonemeal_updated_seen_${id}`);
      return seen !== 'true';
    } catch (e) {
      return true;
    }
  });

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor visibility using IntersectionObserver
  useEffect(() => {
    if (!active) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [active]);

  // Start 7-second countdown once displayed on user screen
  useEffect(() => {
    if (active && isVisible) {
      const timer = setTimeout(() => {
        setActive(false);
        try {
          localStorage.setItem(`bonemeal_updated_seen_${id}`, 'true');
        } catch (e) {
          // Ignore quota / security error in restricted sandboxes
        }
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [active, isVisible, id]);

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-700 ${
        active
          ? 'z-20 border border-[#f472b6]/60 shadow-[0_0_16px_rgba(244,114,182,0.25)] rounded-xl'
          : ''
      } ${className}`}
    >
      {active && (
        <div className="absolute top-2.5 right-2.5 z-30 bg-[#f472b6] text-[#0d070b] font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-pink-200/50 shadow-md uppercase tracking-wider flex items-center gap-1.5 pointer-events-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-100 animate-ping" />
          <span>{badgeLabel}</span>
          <span className="text-[8px] opacity-80 font-normal">(7s)</span>
        </div>
      )}
      {children}
    </div>
  );
};

export default UpdatedFrame;
