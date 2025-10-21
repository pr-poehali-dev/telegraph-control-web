import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

type TelegraphPosition = 
  | 'full-astern'
  | 'half-astern'
  | 'slow-astern'
  | 'dead-slow-astern'
  | 'stop'
  | 'dead-slow-ahead'
  | 'slow-ahead'
  | 'half-ahead'
  | 'full-ahead'
  | 'finished-with-engines';

const POSITIONS: { angle: number; label: string; key: TelegraphPosition }[] = [
  { angle: -135, label: 'FULL ASTERN', key: 'full-astern' },
  { angle: -100, label: 'HALF ASTERN', key: 'half-astern' },
  { angle: -65, label: 'SLOW ASTERN', key: 'slow-astern' },
  { angle: -30, label: 'DEAD SLOW ASTERN', key: 'dead-slow-astern' },
  { angle: 0, label: 'STOP', key: 'stop' },
  { angle: 30, label: 'DEAD SLOW AHEAD', key: 'dead-slow-ahead' },
  { angle: 65, label: 'SLOW AHEAD', key: 'slow-ahead' },
  { angle: 100, label: 'HALF AHEAD', key: 'half-ahead' },
  { angle: 135, label: 'FULL AHEAD', key: 'full-ahead' },
  { angle: 180, label: 'FINISHED WITH ENGINES', key: 'finished-with-engines' },
];

export default function EngineTelegraph() {
  const [currentPosition, setCurrentPosition] = useState<TelegraphPosition>('stop');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const leverRef = useRef<HTMLDivElement>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  const getCurrentAngle = () => {
    return currentAngle;
  };

  const playBell = () => {
    if (bellAudioRef.current) {
      bellAudioRef.current.currentTime = 0;
      bellAudioRef.current.play().catch(() => {});
    }
  };

  const findClosestPosition = (angle: number): TelegraphPosition => {
    let closest = POSITIONS[0];
    let minDiff = Math.abs(angle - closest.angle);

    POSITIONS.forEach(pos => {
      const diff = Math.abs(angle - pos.angle);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pos;
      }
    });

    return closest.key;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (e.currentTarget instanceof Element) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    
    const telegraphElement = document.querySelector('.telegraph-dial');
    if (!telegraphElement) return;

    const rect = telegraphElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = angle - 90;

    if (angle < -180) angle += 360;
    if (angle > 180) angle -= 360;

    angle = Math.max(-135, Math.min(180, angle));
    setCurrentAngle(angle);

    const newPosition = findClosestPosition(angle);
    if (newPosition !== currentPosition) {
      setCurrentPosition(newPosition);
      playBell();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const telegraphElement = document.querySelector('.telegraph-dial');
    if (!telegraphElement) return;

    const rect = telegraphElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = angle - 90;

    if (angle < -180) angle += 360;
    if (angle > 180) angle -= 360;

    angle = Math.max(-135, Math.min(180, angle));
    setCurrentAngle(angle);

    const newPosition = findClosestPosition(angle);
    if (newPosition !== currentPosition) {
      setCurrentPosition(newPosition);
      playBell();
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c0be531c83.mp3?filename=ship-bell-sound-6617.mp3');
    audio.volume = 0.6;
    bellAudioRef.current = audio;

    return () => {
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy via-background to-navy p-4">
      <div className="relative">
        <div className="absolute inset-0 bg-brass/5 blur-3xl rounded-full" />
        
        <div className="relative bg-gradient-to-b from-brass/20 to-copper/30 rounded-full p-8 shadow-2xl border-8 border-brass/40">
          <div className="telegraph-dial relative w-80 h-80 md:w-96 md:h-96 bg-gradient-to-br from-navy/90 to-primary rounded-full shadow-inner flex items-center justify-center border-4 border-brass/60">
            
            {POSITIONS.map((pos) => {
              const radius = 140;
              const angleRad = (pos.angle * Math.PI) / 180;
              const x = Math.sin(angleRad) * radius;
              const y = -Math.cos(angleRad) * radius;

              return (
                <div
                  key={pos.key}
                  className="absolute text-[10px] md:text-xs font-bold text-brass text-center uppercase tracking-wider"
                  style={{
                    transform: `translate(${x}px, ${y}px) rotate(${pos.angle}deg)`,
                    width: '80px',
                    marginLeft: '-40px',
                  }}
                >
                  <div style={{ transform: `rotate(-${pos.angle}deg)` }}>
                    {pos.label}
                  </div>
                </div>
              );
            })}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-copper to-brass rounded-full shadow-lg border-4 border-brass/80" />
            </div>

            <div
              ref={leverRef}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `rotate(${getCurrentAngle()}deg)`,
                transition: 'none',
              }}
            >
              <div className="absolute top-1/2 w-3 h-32 -mt-32 bg-gradient-to-b from-brass via-copper to-brass rounded-full shadow-xl pointer-events-none" />
              <div 
                className="absolute top-1/2 -mt-24 w-12 h-12 bg-gradient-to-br from-copper to-brass rounded-full shadow-lg border-3 border-brass/80 cursor-grab active:cursor-grabbing pointer-events-auto"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 bg-navy/80 px-6 py-3 rounded-lg border-2 border-brass/60 shadow-xl">
              <p className="text-brass text-xs md:text-sm font-bold uppercase tracking-widest text-center whitespace-nowrap">
                {POSITIONS.find(p => p.key === currentPosition)?.label}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 text-brass">
          <Icon name="Anchor" size={24} />
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider">Engine Telegraph</h1>
          <Icon name="Anchor" size={24} />
        </div>
      </div>
    </div>
  );
}