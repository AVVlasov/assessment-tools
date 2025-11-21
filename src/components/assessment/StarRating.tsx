import React from 'react';
import { Box, HStack } from '@chakra-ui/react';

interface StarRatingProps {
  value: number;
  maxScore?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  maxScore = 5,
  onChange,
  readonly = false,
  size = 'md'
}) => {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizeMap = {
    sm: '20px',
    md: '32px',
    lg: '40px'
  };

  const iconSize = sizeMap[size];

  const handleClick = (score: number) => {
    if (!readonly && onChange) {
      onChange(score);
    }
  };

  const handleMouseEnter = (score: number) => {
    if (!readonly) {
      setHoverValue(score);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <HStack gap="4px">
      {Array.from({ length: maxScore }, (_, index) => {
        const score = index + 1;
        const isFilled = score <= displayValue;

        return (
          <Box
            key={score}
            width={iconSize}
            height={iconSize}
            cursor={readonly ? 'default' : 'pointer'}
            onClick={() => handleClick(score)}
            onMouseEnter={() => handleMouseEnter(score)}
            onMouseLeave={handleMouseLeave}
            transition="all 0.2s"
            opacity={readonly ? 0.8 : 1}
            _hover={readonly ? {} : { transform: 'scale(1.1)' }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill={isFilled ? '#D4FF00' : 'none'}
              stroke="#D4FF00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: isFilled ? 'drop-shadow(0 0 8px rgba(212, 255, 0, 0.5))' : 'none'
              }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </Box>
        );
      })}
    </HStack>
  );
};

