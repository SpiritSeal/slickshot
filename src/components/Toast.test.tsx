import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('<Toast />', () => {
  it('is hidden when message is null', () => {
    render(<Toast message={null} />);
    const toast = screen.getByRole('status');
    expect(toast).not.toHaveClass('toast--visible');
    expect(toast).toHaveTextContent('');
  });

  it('shows the message and the visible class when set', () => {
    render(<Toast message="Saved" />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Saved');
    expect(toast).toHaveClass('toast--visible');
  });
});
