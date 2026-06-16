import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
  onChange?: (rating: number) => void;
}

export function StarRating({ rating, max = 5, size = 'sm', onChange }: StarRatingProps) {
  const starSize = size === 'sm' ? 12 : 16;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span
            key={i}
            onClick={() => onChange?.(i + 1)}
            className={onChange ? 'cursor-pointer' : ''}
          >
            <Star
              size={starSize}
              className={filled || partial
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
              }
            />
          </span>
        );
      })}
    </div>
  );
}
