import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { AppProviders } from './providers';
import { App } from './app/app';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
