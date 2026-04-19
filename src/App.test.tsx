import { render, screen } from '@testing-library/react';
import App from './app/App';

test('opens sign-in experience on the home route', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /^aira$/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /^sign in$/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /^register$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
});
