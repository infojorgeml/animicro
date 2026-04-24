import { useRef, useEffect, useCallback } from 'react';
import { animate, stagger } from 'motion';
import type { ModuleConfig } from '../types';

interface AnimationPreviewProps {
  moduleId: string;
  config: ModuleConfig;
  onReset?: () => void;
}

const REVEAL_LINES = ['Motion', 'Micro', 'Animations'];
const TYPEWRITER_DEMO = {
  prefix: 'We ',
  strings: ['design', 'code', 'launch'],
  suffix: ' for you!',
};

export default function AnimationPreview({ moduleId, config, onReset }: AnimationPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ReturnType<typeof animate>>();
  const twTimerRef = useRef<number>();
  const isSplit = moduleId === 'split';
  const isTextReveal = moduleId === 'text-reveal';
  const isTypewriter = moduleId === 'typewriter';
  const isStagger = moduleId === 'stagger';
  const isGridReveal = moduleId === 'grid-reveal';
  const isHighlight = moduleId === 'highlight';
  const isTextFillScroll = moduleId === 'text-fill-scroll';
  const isParallax = moduleId === 'parallax';
  const isFloat = moduleId === 'float';
  const isPulse = moduleId === 'pulse';
  const isSkewUp = moduleId === 'skew-up';

  const play = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    controlsRef.current?.cancel();

    if (twTimerRef.current) {
      clearTimeout(twTimerRef.current);
      twTimerRef.current = undefined;
    }

    if (isTypewriter) {
      const textNode = el.querySelector<HTMLSpanElement>('[data-tw-text]');
      const cursor = el.querySelector<HTMLSpanElement>('[data-tw-cursor]');
      if (!textNode || !cursor) return;

      textNode.textContent = '';
      cursor.style.opacity = '1';
      cursor.style.transition = 'none';
      cursor.textContent = config.cursorChar || '|';

      const strings = TYPEWRITER_DEMO.strings;
      const typingSpeed = Math.max(0.005, config.typingSpeed ?? 0.06) * 1000;
      const backSpeed = Math.max(0.005, config.backSpeed ?? 0.03) * 1000;
      const startDelay = Math.max(0, config.delay ?? 0) * 1000;
      const backDelay = Math.max(0, config.backDelay ?? 1.5) * 1000;
      const loop = config.loop ?? true;
      const shuffle = config.shuffle ?? false;
      const cursorPersist = config.cursorPersist ?? true;

      // Simple order: in shuffle mode we just randomize the first cycle for
      // the preview — not worth the no-repeat bookkeeping here.
      let order = strings.map((_, i) => i);
      if (shuffle) {
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
      let orderPos = 0;

      function typeString(str: string) {
        let i = textNode!.textContent!.length;
        function frame() {
          if (i < str.length) {
            textNode!.textContent = (textNode!.textContent ?? '') + str[i++];
            twTimerRef.current = window.setTimeout(frame, typingSpeed);
          } else {
            onTyped();
          }
        }
        frame();
      }

      function deleteString(done: () => void) {
        function frame() {
          const data = textNode!.textContent ?? '';
          if (data.length > 0) {
            textNode!.textContent = data.slice(0, -1);
            twTimerRef.current = window.setTimeout(frame, backSpeed);
          } else {
            done();
          }
        }
        frame();
      }

      function onTyped() {
        const singleNoLoop = strings.length === 1 && !loop;
        const isLast = orderPos === order.length - 1;
        if (singleNoLoop || (!loop && isLast)) {
          if (!cursorPersist) {
            twTimerRef.current = window.setTimeout(() => {
              cursor!.style.transition = 'opacity 0.4s';
              cursor!.style.opacity = '0';
            }, 600);
          }
          return;
        }
        twTimerRef.current = window.setTimeout(() => {
          deleteString(() => {
            orderPos = (orderPos + 1) % order.length;
            typeString(strings[order[orderPos]]);
          });
        }, backDelay);
      }

      twTimerRef.current = window.setTimeout(() => {
        typeString(strings[order[orderPos]]);
      }, startDelay);
      return;
    }

    if (isHighlight) {
      const inner = el.querySelector<HTMLSpanElement>('[data-hl-inner]');
      if (!inner) return;

      inner.style.setProperty('--am-hl-duration', '0s');
      inner.classList.remove('am-highlight-active');
      void inner.offsetWidth;

      inner.style.setProperty('--am-hl-color', config.highlightColor ?? '#fde68a');
      inner.style.setProperty('--am-hl-origin', config.highlightDirection ?? 'left');
      inner.style.setProperty('--am-hl-duration', config.duration + 's');
      inner.style.setProperty('--am-hl-easing', config.easing ?? 'ease-out');
      inner.style.setProperty('--am-hl-delay', config.delay + 's');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inner.classList.add('am-highlight-active');
        });
      });
      return;
    }

    if (isTextFillScroll) {
      const fills = el.querySelectorAll<HTMLSpanElement>('[data-tfs-fill]');
      if (!fills.length) return;

      fills.forEach(f => { f.style.opacity = '0'; });

      requestAnimationFrame(() => {
        controlsRef.current = animate(
          fills,
          { opacity: [0, 1] },
          {
            duration: 0.4,
            delay: stagger(0.3),
            easing: 'linear',
          },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    if (isStagger) {
      const squares = el.querySelectorAll<HTMLDivElement>('[data-stagger-item]');
      if (!squares.length) return;

      const dist = config.distance ?? 20;
      squares.forEach(s => {
        s.style.opacity = '0';
        s.style.transform = `translateY(${dist}px)`;
      });

      requestAnimationFrame(() => {
        controlsRef.current = animate(
          squares,
          { opacity: [0, 1], y: [dist, 0] },
          {
            duration: config.duration,
            delay: stagger(config.staggerDelay ?? 0.1, { start: config.delay }),
            easing: config.easing as any,
          },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    if (isGridReveal) {
      const squares = el.querySelectorAll<HTMLDivElement>('[data-grid-item]');
      if (!squares.length) return;

      const dist = config.distance ?? 20;
      squares.forEach(s => {
        s.style.opacity = '0';
        s.style.transform = `translateY(${dist}px)`;
      });

      requestAnimationFrame(() => {
        const origin = config.origin ?? 'center';
        const count = squares.length;
        const cols = 3;
        const originMap: Record<string, [number, number]> = {
          'top-left': [0, 0], 'top': [0, 1], 'top-right': [0, 2],
          'left': [1, 0], 'center': [1, 1], 'right': [1, 2],
          'bottom-left': [2, 0], 'bottom': [2, 1], 'bottom-right': [2, 2],
        };

        const stag = config.staggerDelay ?? 0.08;
        let delays: number[];
        if (origin === 'random') {
          delays = Array.from({ length: count }, () =>
            config.delay + Math.random() * stag * (count - 1)
          );
        } else {
          const [or, oc] = originMap[origin] ?? [1, 1];
          const indexed = Array.from(squares).map((_, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            return { i, dist: Math.sqrt((r - or) ** 2 + (c - oc) ** 2) };
          });
          indexed.sort((a, b) => a.dist - b.dist);
          delays = new Array(count);
          indexed.forEach((entry, rank) => {
            delays[entry.i] = config.delay + rank * stag;
          });
        }

        const anims = Array.from(squares).map((sq, i) =>
          animate(
            sq,
            { opacity: [0, 1], y: [dist, 0] },
            { duration: config.duration, delay: delays[i], easing: config.easing as any },
          )
        );
        controlsRef.current = anims[0];
        anims.forEach(a => a.finished.catch(() => {}));
      });
      return;
    }

    if (isFloat) {
      const amp = config.amplitude ?? 12;
      el.style.opacity = '1';
      el.style.transform = 'none';
      requestAnimationFrame(() => {
        controlsRef.current = animate(
          el,
          { y: [0, -amp, 0] },
          { duration: config.duration, delay: config.delay, easing: config.easing as any, repeat: Infinity },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    if (isPulse) {
      const peak = config.scaleMax ?? 1.05;
      el.style.opacity = '1';
      el.style.transform = 'none';
      requestAnimationFrame(() => {
        controlsRef.current = animate(
          el,
          { scale: [1, peak, 1] },
          { duration: config.duration, delay: config.delay, easing: config.easing as any, repeat: Infinity },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    if (isSkewUp) {
      const dist = config.distance ?? 40;
      const skew = config.skew ?? 5;
      el.style.opacity = '0';
      el.style.transform = `translateY(${dist}px) skewY(${skew}deg)`;
      requestAnimationFrame(() => {
        controlsRef.current = animate(
          el,
          { opacity: [0, 1], y: [dist, 0], skewY: [skew, 0] },
          { duration: config.duration, delay: config.delay, easing: config.easing as any },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    if (isParallax) {
      const square = el.querySelector<HTMLDivElement>('[data-parallax-item]');
      if (!square) return;

      const distance = (config.speed ?? 0.5) * 60;
      square.style.transform = `translateY(${-distance}px)`;

      requestAnimationFrame(() => {
        controlsRef.current = animate(
          square,
          { y: [-distance, distance, -distance] },
          { duration: 3, easing: 'linear' },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

    if (isTextReveal) {
      const inners = el.querySelectorAll<HTMLSpanElement>('[data-tr-inner]');
      if (!inners.length) return;

      inners.forEach(s => {
        s.style.transform = 'translateY(100%)';
      });

      requestAnimationFrame(() => {
        controlsRef.current = animate(
          inners,
          { y: ['100%', '0%'] },
          {
            duration: config.duration,
            delay: stagger(config.staggerDelay ?? 0.12, { start: config.delay }),
            easing: config.easing as any,
          },
        );
        controlsRef.current.finished.catch(() => {});
      });
      return;
    }

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
  }, [config.duration, config.delay, config.easing, config.distance, config.scale, config.blur, config.staggerDelay, config.typingSpeed, config.backSpeed, config.backDelay, config.loop, config.shuffle, config.cursorChar, config.cursorPersist, config.speed, config.origin, config.highlightColor, config.highlightDirection, config.colorBase, config.colorFill, config.scrollStart, config.scrollEnd, config.amplitude, config.scaleMax, config.skew, moduleId, isSplit, isTextReveal, isTypewriter, isHighlight, isTextFillScroll, isStagger, isGridReveal, isParallax, isFloat, isPulse, isSkewUp]);

  useEffect(() => {
    play();
    return () => {
      controlsRef.current?.cancel();
      if (twTimerRef.current) clearTimeout(twTimerRef.current);
    };
  }, [play]);

  const splitChars = 'Animicro'.split('');

  const STAGGER_ITEMS = 6;

  const renderPreviewContent = () => {
    if (isHighlight) {
      return (
        <div ref={ref} style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.02em' }}>
          <span
            data-hl-inner=""
            className="am-highlight-inner"
            style={{
              '--am-hl-color': config.highlightColor ?? '#fde68a',
              '--am-hl-origin': config.highlightDirection ?? 'left',
              '--am-hl-duration': config.duration + 's',
              '--am-hl-easing': config.easing ?? 'ease-out',
              '--am-hl-delay': config.delay + 's',
            } as React.CSSProperties}
          >
            Animicro
          </span>
          <style>{`
            .am-highlight-inner { position: relative; display: inline; isolation: isolate; }
            .am-highlight-inner::after {
              content: '';
              position: absolute;
              left: 0; bottom: 0;
              width: 100%; height: 40%;
              background: var(--am-hl-color, #fde68a);
              transform: scaleX(0);
              transform-origin: var(--am-hl-origin, left);
              transition: transform var(--am-hl-duration, 0.8s) var(--am-hl-easing, ease-out) var(--am-hl-delay, 0s);
              z-index: -1;
            }
            .am-highlight-inner.am-highlight-active::after { transform: scaleX(1); }
          `}</style>
        </div>
      );
    }

    if (isTextFillScroll) {
      const words = ['Animicro', 'is', 'cool'];
      const baseColor = config.colorBase ?? '#cccccc';
      const fillColor = config.colorFill ?? '#000000';
      return (
        <div ref={ref} style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.4, textAlign: 'center' }}>
          {words.map((w, i) => (
            <span key={i}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ color: baseColor }}>{w}</span>
                <span
                  data-tfs-fill=""
                  style={{ position: 'absolute', left: 0, top: 0, color: fillColor, opacity: 0 }}
                >{w}</span>
              </span>
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      );
    }

    if (isStagger) {
      return (
        <div ref={ref} className="grid grid-cols-3 gap-3 p-4">
          {Array.from({ length: STAGGER_ITEMS }).map((_, i) => (
            <div
              key={i}
              data-stagger-item=""
              className="w-12 h-12 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                opacity: 0,
              }}
            />
          ))}
        </div>
      );
    }

    if (isGridReveal) {
      return (
        <div ref={ref} className="grid grid-cols-3 gap-3 p-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              data-grid-item=""
              className="w-12 h-12 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                opacity: 0,
              }}
            />
          ))}
        </div>
      );
    }

    if (isParallax) {
      return (
        <div ref={ref} className="flex items-center justify-center h-full overflow-hidden">
          <div
            data-parallax-item=""
            className="w-20 h-20 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          />
        </div>
      );
    }

    if (isTypewriter) {
      const gradient = {
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      } as React.CSSProperties;
      return (
        <div ref={ref} style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.01em', textAlign: 'center', padding: '0 12px', whiteSpace: 'pre-wrap' }}>
          <span style={{ color: '#4b5563' }}>{TYPEWRITER_DEMO.prefix}</span>
          <span data-tw-text="" style={gradient} />
          <span style={{ color: '#4b5563' }}>{TYPEWRITER_DEMO.suffix}</span>
          <span
            data-tw-cursor=""
            style={{
              display: 'inline-block',
              animation: 'am-tw-blink-preview 0.7s steps(2) infinite',
              marginLeft: '2px',
              ...gradient,
            }}
          >{config.cursorChar || '|'}</span>
          <style>{`@keyframes am-tw-blink-preview{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>
      );
    }

    if (isTextReveal) {
      return (
        <div ref={ref} className="flex flex-col items-center gap-0" style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.3 }}>
          {REVEAL_LINES.map((line, i) => (
            <span key={i} style={{ display: 'block', overflow: 'hidden' }}>
              <span
                data-tr-inner=""
                style={{
                  display: 'block',
                  transform: 'translateY(100%)',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {line}
              </span>
            </span>
          ))}
        </div>
      );
    }

    if (isSplit) {
      return (
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
      );
    }

    return (
      <div
        ref={ref}
        className="w-28 h-28 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          opacity: 0,
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(156 163 175) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {renderPreviewContent()}
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
          {isTextFillScroll
            ? `${config.colorBase ?? '#ccc'} → ${config.colorFill ?? '#000'} · start ${config.scrollStart ?? 62}% · end ${config.scrollEnd ?? 60}%`
            : isParallax
            ? `speed ${config.speed ?? 0.5} · ${((config.speed ?? 0.5) * 100).toFixed(0)}px range`
            : isTypewriter
            ? `${config.typingSpeed ?? 0.06}s type · ${config.backSpeed ?? 0.03}s back · hold ${config.backDelay ?? 1.5}s${(config.loop ?? true) ? ' · loop' : ''}${(config.shuffle ?? false) ? ' · shuffle' : ''}`
            : <>
                {config.duration}s · {config.easing} · {config.delay}s delay
                {moduleId.startsWith('slide') && config.distance != null && ` · ${config.distance}px`}
                {moduleId === 'scale' && config.scale != null && ` · scale ${config.scale}`}
                {moduleId === 'blur' && config.blur != null && ` · blur ${config.blur}px`}
                {isFloat && ` · ±${config.amplitude ?? 12}px`}
                {isPulse && ` · peak ${config.scaleMax ?? 1.05}`}
                {isSkewUp && ` · ${config.distance ?? 40}px · ${config.skew ?? 5}°`}
                {isSplit && ` · stagger ${config.staggerDelay ?? 0.05}s · ${config.distance ?? 15}px`}
                {isTextReveal && ` · stagger ${config.staggerDelay ?? 0.12}s`}
                {isStagger && ` · stagger ${config.staggerDelay ?? 0.1}s · ${config.distance ?? 20}px`}
                {isGridReveal && ` · ${config.origin ?? 'center'} · stagger ${config.staggerDelay ?? 0.08}s · ${config.distance ?? 20}px`}
                {isHighlight && ` · ${config.highlightDirection ?? 'left'} · ${config.highlightColor ?? '#fde68a'}`}
              </>
          }
        </p>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-brand-100 hover:text-brand-700"
        >
          Reset to default
        </button>
      )}
    </div>
  );
}
