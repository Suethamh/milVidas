import React, { useState, useRef } from 'react';
import { Star } from 'lucide-react';
import { spawnSparkles, spawnBigSparkles } from '../lib/animations';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [animating, setAnimating] = useState<number | null>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleClick(star: number) {
    onChange?.(star);
    setAnimating(star);

    // Sparkles na estrela clicada
    const el = starRefs.current[star - 1];
    if (el) {
      if (star === 5) {
        spawnBigSparkles(el);
      } else {
        spawnSparkles(el, 6);
      }
    }

    setTimeout(() => setAnimating(null), 500);
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          ref={el => { starRefs.current[star - 1] = el; }}
          disabled={readonly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? '' : 'cursor-pointer hover:scale-110'} transition-transform disabled:cursor-default`}
          style={
            animating !== null && star <= animating
              ? {
                  animation: `starBounce 0.5s ease-out`,
                  animationDelay: `${(star - 1) * 60}ms`,
                  animationFillMode: 'both',
                }
              : undefined
          }
        >
          <Star
            size={size}
            className={`transition-colors duration-200 ${
              star <= (hover || value)
                ? 'fill-accent-pink text-accent-pink'
                : 'fill-none text-gray-300'
            }`}
            style={
              star <= (hover || value)
                ? { filter: `drop-shadow(0 0 ${size * 0.2}px #ec4899)` }
                : undefined
            }
          />
        </button>
      ))}
    </div>
  );
}
