import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ResizeObserver 에러 무시
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('ResizeObserver loop completed with undelivered notifications') ||
       args[0].includes('ResizeObserver'))) {
    return;
  }
  originalError.apply(console, args);
};

// 전역 에러 핸들러 추가
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && 
      event.error.message.includes('ResizeObserver')) {
    event.preventDefault();
    return false;
  }
});

// 전역 unhandledrejection 핸들러 추가
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('ResizeObserver')) {
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 