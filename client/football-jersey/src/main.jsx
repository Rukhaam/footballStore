// client/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async'; 
import { store } from './app/store';
import App from './App.jsx';
import { ToastProvider } from './context/contextHook.jsx';
import '../src/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider> 
      <Provider store={store}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Provider>
    </HelmetProvider>
  </StrictMode>,
);