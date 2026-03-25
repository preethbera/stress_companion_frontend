'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils'; // Make sure this path points to your actual utils file

// --- BASE TAILWIND CLASSES (Replaced cva) ---
const visualizerBaseClasses = [
  'relative flex items-center justify-center',
  '**:data-lk-index:bg-current/10',
  '**:data-lk-index:absolute **:data-lk-index:top-1/2 **:data-lk-index:left-1/2 **:data-lk-index:origin-bottom **:data-lk-index:-translate-x-1/2',
  '**:data-lk-index:rounded-full **:data-lk-index:transition-colors **:data-lk-index:duration-150 **:data-lk-index:ease-linear **:data-lk-index:data-[lk-highlighted=true]:bg-current',
  'has-data-[lk-state=connecting]:**:data-lk-index:duration-300',
  'has-data-[lk-state=initializing]:**:data-lk-index:duration-300',
  'has-data-[lk-state=listening]:**:data-lk-index:duration-300',
  'has-data-[lk-state=thinking]:animate-spin has-data-[lk-state=thinking]:[animation-duration:5s] has-data-[lk-state=thinking]:**:data-lk-index:bg-current',
];

// --- HELPER FUNCTIONS FOR ANIMATIONS ---

function findGcdLessThan(columns, max = columns) {
  function gcd(a, b) {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
  for (let i = max; i >= 1; i--) {
    if (gcd(columns, i) === i) {
      return i;
    }
  }
  return 1;
}

function generateConnectingSequenceBar(columns) {
  const seq = [];
  const center = Math.floor(columns / 2);

  for (let x = 0; x < columns; x++) {
    seq.push([x, (x + center) % columns]);
  }

  return seq;
}

function generateListeningSequenceBar(columns) {
  const divisor = columns > 8 ? columns / findGcdLessThan(columns, 4) : findGcdLessThan(columns, 2);

  return Array.from({ length: divisor }, (_, idx) => [
    ...Array(Math.floor(columns / divisor))
      .fill(1)
      .map((_, idx2) => idx2 * divisor + idx),
  ]);
}

// --- ORIGINAL ANIMATOR HOOK ---

export const useAgentAudioVisualizerRadialAnimator = (state, barCount, interval) => {
  const [index, setIndex] = useState(0);
  const [sequence, setSequence] = useState([[]]);

  useEffect(() => {
    if (state === 'thinking') {
      setSequence(generateListeningSequenceBar(barCount));
    } else if (state === 'connecting' || state === 'initializing') {
      setSequence(generateConnectingSequenceBar(barCount));
    } else if (state === 'listening') {
      setSequence(generateListeningSequenceBar(barCount));
    } else if (state === undefined || state === 'speaking') {
      setSequence([new Array(barCount).fill(0).map((_, idx) => idx)]);
    } else {
      setSequence([[]]);
    }
    setIndex(0);
  }, [state, barCount]);

  const animationRef = useRef(null);
  
  useEffect(() => {
    let startTime = performance.now();

    const animate = (time) => {
      const timeElapsed = time - startTime;

      if (timeElapsed >= interval) {
        setIndex((prev) => prev + 1);
        startTime = time;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [interval, barCount, state, sequence.length]);

  return sequence[index % sequence.length] ?? [];
};

// --- SMOOTH/WAVY RANDOM VOLUME SIMULATOR ---

function useSimulatedVolumeBands(state, barCount) {
  const [bands, setBands] = useState(new Array(barCount).fill(0));
  const targetsRef = useRef(new Array(barCount).fill(0));
  const currentRef = useRef(new Array(barCount).fill(0));
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Reset arrays if barCount ever changes dynamically
  useEffect(() => {
    targetsRef.current = new Array(barCount).fill(0);
    currentRef.current = new Array(barCount).fill(0);
    setBands(new Array(barCount).fill(0));
  }, [barCount]);

  useEffect(() => {
    if (state !== 'speaking') {
      targetsRef.current = new Array(barCount).fill(0);
    }

    const animate = (time) => {
      // Pick new random peaks every 200ms to mimic speaking rhythms
      if (state === 'speaking' && time - lastUpdateRef.current > 200) {
        const newTargets = new Array(barCount).fill(0);
        const numPeaks = Math.max(1, Math.floor(barCount / 6)); // Create a few focal points
        
        for (let i = 0; i < numPeaks; i++) {
           const peakIdx = Math.floor(Math.random() * barCount);
           const peakVal = 0.4 + Math.random() * 0.6; // Values between 0.4 and 1.0
           
           // Apply to center
           newTargets[peakIdx] = peakVal;

           // Smoothly spread to neighbors (wrap around the circle)
           const left1 = (peakIdx - 1 + barCount) % barCount;
           const right1 = (peakIdx + 1) % barCount;
           const left2 = (peakIdx - 2 + barCount) % barCount;
           const right2 = (peakIdx + 2) % barCount;

           newTargets[left1] = Math.max(newTargets[left1], peakVal * 0.7);
           newTargets[right1] = Math.max(newTargets[right1], peakVal * 0.7);
           newTargets[left2] = Math.max(newTargets[left2], peakVal * 0.3);
           newTargets[right2] = Math.max(newTargets[right2], peakVal * 0.3);
        }

        // Apply a secondary smoothing pass over the whole array for that "wavy" connected feel
        const smoothed = new Array(barCount).fill(0);
        for (let i = 0; i < barCount; i++) {
           const l = (i - 1 + barCount) % barCount;
           const r = (i + 1) % barCount;
           smoothed[i] = (newTargets[l] + newTargets[i] * 2 + newTargets[r]) / 4;
        }

        targetsRef.current = smoothed;
        lastUpdateRef.current = time;
      }

      // Frame-by-frame interpolation to remove jumpiness
      let needsUpdate = false;
      const newCurrent = [...currentRef.current];
      
      for (let i = 0; i < barCount; i++) {
        const diff = targetsRef.current[i] - newCurrent[i];
        // 12% easing per frame toward the target = very smooth motion
        newCurrent[i] += diff * 0.12; 
        
        if (Math.abs(diff) > 0.001) {
          needsUpdate = true;
        }
      }

      if (needsUpdate || state === 'speaking') {
        currentRef.current = newCurrent;
        setBands([...newCurrent]);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, barCount]);

  return bands;
}

// --- MAIN COMPONENT ---

export function RadialVisualizer({
  state = 'connecting', // Accepts: 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'
  color,
  radius = 32,    // Default radius if none is provided
  barCount = 24,  // Default barCount if none is provided
  className,
  style,
  ...props
}) {
  if (barCount % 4 !== 0) {
    console.warn('barCount should be divisible by 4 for optimal visual results');
  }

  // Use the simulated volume hook from the previous step
  const bands = useSimulatedVolumeBands(state, barCount);

  const sequencerInterval = useMemo(() => {
    switch (state) {
      case 'connecting':
      case 'listening':
        return 500;
      case 'initializing':
        return 250;
      case 'thinking':
        return Infinity;
      default:
        return 1000;
    }
  }, [state]);

  const highlightedIndices = useAgentAudioVisualizerRadialAnimator(
    state,
    barCount,
    sequencerInterval
  );

  // 1. Dynamically calculate the perfect size for each dot based ONLY on radius and barCount
  const dotSize = useMemo(() => {
    return (radius * Math.PI) / barCount;
  }, [radius, barCount]);

  // 2. Dynamically size the container so it doesn't collapse without the Tailwind size classes
  const containerSize = (radius * 2) + (dotSize * 12); // Add padding to account for speaking bar heights

  return (
    <div
      data-lk-state={state}
      className={cn(visualizerBaseClasses, className)}
      style={{ 
        ...style, 
        color,
        width: `${containerSize}px`,
        height: `${containerSize}px`
      }}
      {...props}
    >
      {bands.map((band, idx) => {
        const angle = (idx / barCount) * Math.PI * 2;

        return (
          <div
            key={`${barCount}-${idx}`}
            data-lk-state={state}
            className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2"
            style={{
              transformOrigin: 'center',
              transform: `rotate(${angle}rad) translateY(${radius}px)`,
            }}
          >
            <div
              data-lk-index={idx}
              data-lk-highlighted={highlightedIndices.includes(idx)}
              style={{
                width: dotSize,
                minHeight: dotSize,
                // The height scales smoothly based on the simulated wave
                height: state === 'speaking' ? `${dotSize * 10 * band}px` : 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}