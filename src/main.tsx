import '@siemens/ix/dist/siemens-ix/siemens-ix.css';
import { defineCustomElements } from '@siemens/ix/loader';
import { IxApplicationContext } from '@siemens/ix-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

defineCustomElements();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IxApplicationContext>
      <App />
    </IxApplicationContext>
  </React.StrictMode>,
);
