import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

function mount() {
  const el = document.getElementById('root');
  if (!el) {
    setTimeout(mount, 24);
    return;
  }
  try {
    ReactDOM.createRoot(el).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    const loader = document.getElementById('boot-loader');
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  } catch (err) {
    el.innerHTML =
      '<div style="color:#f87171;font:13px system-ui;padding:24px">Startup error: ' +
      String(err && err.message ? err.message : err) +
      '</div>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
