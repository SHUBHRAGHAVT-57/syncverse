import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
const root = document.getElementById('root');
if (!root) throw new Error('Missing application mount point');
createRoot(root).render(<App />);
