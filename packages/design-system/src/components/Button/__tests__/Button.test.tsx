import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../index';

describe('design-system Button', () => {
  test('renders the children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('forwards onClick to MUI without overriding', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    screen.getByRole('button', { name: 'Tap' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('does not autoFocus by default (regression: autoFocus was hardcoded)', () => {
    render(
      <>
        <input data-testid="other" />
        <Button>Submit</Button>
      </>,
    );
    // MUI Buttons do not auto-focus unless autoFocus is explicitly passed.
    expect(document.activeElement).not.toBe(screen.getByRole('button'));
  });
});
