import React from 'react';
import ReactDOM from 'react-dom/client';
import OptionsApp from './App';
import '../popup/popup.css';
import './options.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
