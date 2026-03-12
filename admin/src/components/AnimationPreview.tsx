import { useRef, useEffect, useCallback } from 'react';
import { animate } from 'motion';
import type { ModuleConfig } from '../types';

interface AnimationPreviewProps {
  moduleId: string;
  config: ModuleConfig;
  onReset?: () => void;
}

export default function AnimationPreview({ moduleId, config, onReset }: AnimationPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ReturnType<typeof animate>>();

  const play = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    controlsRef.current?.cancel();

    const isSlide = moduleId.startsWith('slide');
    const dist = config.distance ?? 30;

    el.style.opacity = '0';
    if (isSlide) el.style.transform = `translateY(${dist}px)`;

    requestAnimationFrame(() => {
      const keyframes: Record<string, any> = { opacity: [0, 1] };
      if (isSlide) keyframes.y = [dist, 0];

      controlsRef.current = animate(
        el,
        keyframes,
        { duration: config.duration, delay: config.delay, easing: config.easing as any },
      );

      controlsRef.current.finished.catch(() => {});
    });
  }, [config.duration, config.delay, config.easing, config.distance, moduleId]);

  useEffect(() => {
    play();
    return () => {
      controlsRef.current?.cancel();
    };
  }, [play]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(156 163 175) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div
          ref={ref}
          className="w-28 h-28 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            opacity: 0,
          }}
        />
      </div>

      <button
        type="button"
        onClick={play}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        Replay
      </button>

      <div className="w-full text-center space-y-1">
        <p className="text-[10px] text-gray-400 font-mono">
          {config.duration}s · {config.easing} · {config.delay}s delay
          {moduleId.startsWith('slide') && config.distance != null && ` · ${config.distance}px`}
        </p>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Reset to default
        </button>
      )}
    </div>
  );
}
