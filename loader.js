// ==UserScript==
// @name         Remote Script Loader (GitHack No-Cache Edition)
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Always loads the newest version of remote script via GitHack (no cache ever)
// @author       Engineering Team
// @match        *://*/*
// @connect      raw.githack.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @downloadURL  https://raw.githack.com/imadelakhaldev/TamperMonkey-Scripts/main/loader.js
// @updateURL    https://raw.githack.com/imadelakhaldev/TamperMonkey-Scripts/main/loader.js
// ==/UserScript==

(function () {
  'use strict';

  if (window.top !== window.self) return; // skip if inside iframe

  const CONFIG = {
    primaryUrl: 'https://raw.githack.com/imadelakhaldev/TamperMonkey-Scripts/main/scripts/sample.js',
    fallbackUrl: null,
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 10000,
    debugMode: true,
    healthCheckEnabled: true
  };

  // --- Logging utilities ---
  function log(msg, data = null) {
    if (CONFIG.debugMode) console.log(`[TM Loader ${new Date().toISOString()}] ${msg}`, data || '');
  }
  function logError(msg, err = null) {
    console.error(`[TM Loader ${new Date().toISOString()}] ERROR: ${msg}`, err || '');
  }

  // --- Cache-busting URL ---
  function getCacheBustedUrl(url) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}_nocache=${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // --- Inject script into page ---
  function injectScript(content) {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
          URL.revokeObjectURL(url);
          log('Script injected successfully');
          resolve();
        };
        script.onerror = e => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        (document.head || document.documentElement).appendChild(script);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- Fetch remote script (no cache) ---
  function fetchRemoteScript(url, attempt = 1) {
    return new Promise((resolve, reject) => {
      const targetUrl = getCacheBustedUrl(url);
      log(`Fetching remote script (attempt ${attempt})`, targetUrl);

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${CONFIG.timeout}ms`));
      }, CONFIG.timeout);

      GM_xmlhttpRequest({
        method: 'GET',
        url: targetUrl,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        },
        onload: res => {
          clearTimeout(timeoutId);
          if (res.status >= 200 && res.status < 400 && res.responseText.trim()) {
            log(`Fetched ${res.responseText.length} bytes`);
            resolve(res.responseText);
          } else {
            reject(new Error(`HTTP ${res.status}: ${res.statusText}`));
          }
        },
        onerror: e => {
          clearTimeout(timeoutId);
          reject(new Error(`Network error: ${e.error || 'Unknown'}`));
        },
        ontimeout: () => {
          clearTimeout(timeoutId);
          reject(new Error('Request timeout'));
        }
      });
    });
  }

  // --- Retry logic ---
  async function fetchWithRetry(url, attempt = 1) {
    try {
      return await fetchRemoteScript(url, attempt);
    } catch (err) {
      if (attempt < CONFIG.maxRetries) {
        log(`Retrying in ${CONFIG.retryDelay}ms...`);
        await new Promise(r => setTimeout(r, CONFIG.retryDelay));
        return fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  // --- Main loader ---
  async function initialize() {
    log('Initializing GitHack No-Cache Loader...');
    let scriptContent = null;

    try {
      scriptContent = await fetchWithRetry(CONFIG.primaryUrl);
    } catch (primaryErr) {
      logError('Primary URL failed', primaryErr);
      if (CONFIG.fallbackUrl) {
        try {
          scriptContent = await fetchWithRetry(CONFIG.fallbackUrl);
        } catch (fallbackErr) {
          logError('Fallback URL failed', fallbackErr);
        }
      }
    }

    if (scriptContent) {
      try {
        await injectScript(scriptContent);
        log('Remote script loaded successfully');
        if (CONFIG.healthCheckEnabled) GM_setValue('last_success', Date.now());
      } catch (injectErr) {
        logError('Failed to inject script', injectErr);
      }
    } else {
      logError('No valid script content loaded');
      if (CONFIG.healthCheckEnabled) GM_setValue('last_failure', Date.now());
    }
  }

  // --- Optional: expose loader health info ---
  if (CONFIG.healthCheckEnabled) {
    window.addEventListener('load', () => {
      const lastSuccess = GM_getValue('last_success');
      const lastFailure = GM_getValue('last_failure');
      window.__TM_LOADER_HEALTH__ = {
        lastSuccess: lastSuccess ? new Date(lastSuccess).toISOString() : null,
        lastFailure: lastFailure ? new Date(lastFailure).toISOString() : null,
        status:
          lastSuccess && (!lastFailure || lastSuccess > lastFailure)
            ? 'healthy'
            : 'degraded'
      };
      log('Health status exposed', window.__TM_LOADER_HEALTH__);
    });
  }

  initialize().catch(e => logError('Unhandled loader error', e));
})();
