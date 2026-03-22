// frontend/src/main.jsx
//
// WHY THIS FILE:
// This is the entry point of the React application.
// It mounts the <App /> component into the #root div in index.html.
// Every React app needs this exact pattern.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// ReactDOM.createRoot() is the modern React 18 way to start the app
// It attaches React to the <div id="root"> in index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode runs extra checks in development (no effect in production)
  // It helps catch common mistakes early
  <React.StrictMode>
    <App />
  </React.StrictMode>
)