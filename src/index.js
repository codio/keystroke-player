import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles/app.scss';

import KeystrokePlayer from './keystroke-player';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<KeystrokePlayer />);
