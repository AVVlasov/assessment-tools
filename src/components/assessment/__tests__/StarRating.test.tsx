import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../StarRating';
import { Provider } from '../../../theme';

describe('StarRating', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<Provider>{component}</Provider>);
  };

  it('renders correct number of stars', () => {
    const { container } = renderWithProvider(<StarRating value={0} maxScore={5} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('displays current value correctly', () => {
    const { container } = renderWithProvider(<StarRating value={3} maxScore={5} />);
    const stars = container.querySelectorAll('svg polygon');
    const filledStars = Array.from(stars).filter(star => 
      star.getAttribute('fill') === '#D4FF00'
    );
    expect(filledStars.length).toBe(3);
  });

  it('calls onChange when star is clicked', () => {
    const handleChange = jest.fn();
    const { container } = renderWithProvider(
      <StarRating value={0} maxScore={5} onChange={handleChange} />
    );
    
    const stars = container.querySelectorAll('svg');
    fireEvent.click(stars[2]);
    
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange in readonly mode', () => {
    const handleChange = jest.fn();
    const { container } = renderWithProvider(
      <StarRating value={0} maxScore={5} onChange={handleChange} readonly />
    );
    
    const stars = container.querySelectorAll('svg');
    fireEvent.click(stars[2]);
    
    expect(handleChange).not.toHaveBeenCalled();
  });
});

