import { render, screen } from '@testing-library/react';
import App from './App';

describe('Widget route', () => {
  it('renders widget at /widget', () => {
    window.history.pushState({}, '', '/widget');

    render(<App />);

    expect(screen.getByText('Área de Conversação')).toBeInTheDocument();
    expect(screen.getAllByText('Sou novato(a)').length).toBeGreaterThan(0);
  });
});
