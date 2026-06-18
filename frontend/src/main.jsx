import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Each original app only loaded its own theme.css (the admin app's index.css and
// App.css were the unused Vite demo styles — importing index.css broke full-screen
// layouts via `body { display:flex }`). Load just the two themes that were in use.
import './admin/theme.css';
import './user/theme.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
