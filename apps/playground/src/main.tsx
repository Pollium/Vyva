import App from './App';
import '@vyva/react/fonts';
import '@vyva/react/styles.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if(root === null) throw new Error('The page has no #root element');

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);
