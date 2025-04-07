import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders Event Data Visualizer', () => {
  render(<App />);
  const headingElement = screen.getByText(/Event Data Visualizer/i);
  expect(headingElement).toBeInTheDocument();
});
