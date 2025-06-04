import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import App from './app/app';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  </StrictMode>
);
