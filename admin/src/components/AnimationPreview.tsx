import { useRef, useEffect, useCallback } from 'react';
import { animate, stagger } from 'motion';
import type { ModuleConfig } from '../types';

interface AnimationPreviewProps {
  moduleId: string;
  config: ModuleConfig;
  onReset?: () => void;
}

export default function AnimationPreview({ moduleId, config, onReset }: AnimationPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ReturnType<typeof animate>>();
  const isSplit = moduleId === 'split';

  const play = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    controlsRef.current?.cancel();

    if (isSplit) {
      const spans = el.querySelectorAll<HTMLSpanElement>('span');
      if (!spans.length) return;

      const dist = config.distance ?? 15;
      spans.forEach(s => {
        s.style.opacity = '0';
        s.style.transform = `translateY(${dist}px)`;
      });

      requestAnimationFrame(() => {
        controlsRef.current = animate(
          spans,
          { opacity: [0, 1], y: [dist, 0] },
          {
            duration: config.duration,
            delay: stagger(config.staggerDelay ?? 0.05, { start: config.delay }),
            easing: config.easing as any,
          },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    const isSlide = moduleId.startsWith('slide');
    const isHorizontal = moduleId === 'slide-left' || moduleId === 'slide-right';
    const isNegative = moduleId === 'slide-down' || moduleId === 'slide-right';
    const isScale = moduleId === 'scale';
    const isBlur = moduleId === 'blur';

    el.style.opacity = '0';
    el.style.transform = 'none';
    el.style.filter = 'none';

    if (isSlide) {
      const dist = config.distance ?? 30;
      const from = isNegative ? -dist : dist;
      el.style.transform = isHorizontal ? `translateX(${from}px)` : `translateY(${from}px)`;
    } else if (isScale) {
      el.style.transform = `scale(${config.scale ?? 0.95})`;
    } else if (isBlur) {
      el.style.filter = `blur(${config.blur ?? 4}px)`;
    }

    requestAnimationFrame(() => {
      const keyframes: Record<string, any> = { opacity: [0, 1] };

      if (isSlide) {
        const dist = config.distance ?? 30;
        const from = isNegative ? -dist : dist;
        const axis = isHorizontal ? 'x' : 'y';
        keyframes[axis] = [from, 0];
      } else if (isScale) {
        keyframes.scale = [config.scale ?? 0.95, 1];
      } else if (isBlur) {
        keyframes.filter = [`blur(${config.blur ?? 4}px)`, 'blur(0px)'];
      }

      controlsRef.current = animate(
        el,
        keyframes,
        { duration: config.duration, delay: config.delay, easing: config.easing as any },
      );

      controlsRef.current.finished.catch(() => {});
    });
  }, [config.duration, config.delay, config.easing, config.distance, config.scale, config.blur, config.staggerDelay, moduleId, isSplit]);

  useEffect(() => {
    play();
    return () => {
      controlsRef.current?.cancel();
    };
  }, [play]);

  const splitChars = 'Animicro'.split('');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(156 163 175) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {isSplit ? (
          <div ref={ref} className="flex" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.02em' }}>
            {splitChars.map((ch, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        ) : (
          <div
            ref={ref}
            className="w-28 h-28 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              opacity: 0,
            }}
          />
        )}
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
          {moduleId === 'scale' && config.scale != null && ` · scale ${config.scale}`}
          {moduleId === 'blur' && config.blur != null && ` · blur ${config.blur}px`}
          {isSplit && ` · stagger ${config.staggerDelay ?? 0.05}s · ${config.distance ?? 15}px`}
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
