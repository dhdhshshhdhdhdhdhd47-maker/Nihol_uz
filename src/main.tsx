import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Redirect API and WebSocket calls to the Render backend when deployed to Vercel or other production hosts.
if (
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  !window.location.hostname.includes('ais-dev') &&
  !window.location.hostname.includes('ais-pre')
) {
  const BACKEND_HOST = 'bogcham-uz.onrender.com';
  const BACKEND_URL = `https://${BACKEND_HOST}`;

  // 1. Intercept API Fetch requests
  try {
    const originalFetch = window.fetch;
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      const origin = window.location.origin;
      let isApiCall = false;
      let relativePath = '';

      if (url.startsWith('/api')) {
        isApiCall = true;
        relativePath = url;
      } else if (url.startsWith(`${origin}/api`)) {
        isApiCall = true;
        relativePath = url.substring(origin.length);
      } else if (url.startsWith('api/') || url.startsWith('./api/')) {
        isApiCall = true;
        relativePath = '/' + url.replace(/^\.?\/?/, '');
      }

      if (isApiCall) {
        const targetUrl = `${BACKEND_URL}${relativePath}`;
        console.log(`[Proxy Interceptor] Fetching: ${url} -> redirected to Render: ${targetUrl}`);
        if (typeof input === 'string') {
          return originalFetch(targetUrl, init);
        } else if (input instanceof URL) {
          return originalFetch(new URL(targetUrl), init);
        } else {
          const newRequest = new Request(targetUrl, input);
          return originalFetch(newRequest, init);
        }
      }
      return originalFetch(input, init);
    };

    try {
      window.fetch = customFetch;
    } catch (e) {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true
      });
    }
  } catch (err) {
    console.warn("[main] Failed to intercept fetch globally:", err);
  }

  // 2. Intercept WebSocket connections
  try {
    const OriginalWebSocket = window.WebSocket;
    const CustomWebSocket = function (this: WebSocket, url: string | URL, protocols?: string | string[]) {
      let targetUrl = typeof url === 'string' ? url : url.toString();
      if (targetUrl.includes(window.location.host)) {
        const originalUrl = targetUrl;
        targetUrl = targetUrl.replace(window.location.host, BACKEND_HOST);
        if (targetUrl.startsWith('ws://')) {
          targetUrl = targetUrl.replace('ws://', 'wss://');
        }
        console.log(`[Proxy Interceptor] WebSocket: ${originalUrl} -> redirected to Render: ${targetUrl}`);
      }
      return new OriginalWebSocket(targetUrl, protocols);
    };
    // @ts-ignore
    CustomWebSocket.prototype = OriginalWebSocket.prototype;

    try {
      // @ts-ignore
      window.WebSocket = CustomWebSocket;
    } catch (e) {
      Object.defineProperty(window, 'WebSocket', {
        value: CustomWebSocket,
        writable: true,
        configurable: true
      });
    }
  } catch (err) {
    console.warn("[main] Failed to intercept WebSocket globally:", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
