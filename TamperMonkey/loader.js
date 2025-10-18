// ==UserScript==
// @name         Remote Script Controller (GitHub)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Remote JS Controller from GitHub with Retry, Fallback, and Monitoring Mechanisms
// @author       AfroSpy
// @match        *://*/*
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/imadelakhaldev/Script_Trials/refs/heads/main/TamperMonkey/loader.js
// @updateURL    https://raw.githubusercontent.com/imadelakhaldev/Script_Trials/refs/heads/main/TamperMonkey/loader.js
// ==/UserScript==

/* jshint esversion: 8 */

(function() {
    'use strict';

    // Prevent script from running in iframes
    if (window.top !== window.self) {
        console.log('TM Loader: Skipping iframe execution');
        return;
    }

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        // Using GitHub API to get latest commit hash, then fetch from jsDelivr
        // This ensures we always get the latest version without manual URL changes
        githubApiUrl: 'https://api.github.com/repos/imadelakhaldev/Script_Trials/commits/main',
        scriptPath: 'TamperMonkey/script.js',
        githubRawFallback: 'https://raw.githubusercontent.com/imadelakhaldev/Script_Trials/refs/heads/main/TamperMonkey/script.js',
        maxRetries: 6,
        retryDelay: 3000, // milliseconds
        timeout: 12000, // 12 seconds
        cacheBustingEnabled: true,
        enableLocalCache: false, // Set to true to cache script locally for offline scenarios
        cacheExpiration: 3600000, // 1 hour in milliseconds
        healthCheckEnabled: true,
        debugMode: true // Set to false in production
    };

    // ==================== UTILITY FUNCTIONS ====================
    
    function log(message, data = null) {
        if (CONFIG.debugMode) {
            const timestamp = new Date().toISOString();
            console.log(`[TM Loader ${timestamp}] ${message}`, data || '');
        }
    }

    function logError(message, error = null) {
        const timestamp = new Date().toISOString();
        console.error(`[TM Loader ${timestamp}] ERROR: ${message}`, error || '');
    }

    function getCacheBustedUrl(url) {
        if (!CONFIG.cacheBustingEnabled) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    }

    function getLocalCache() {
        if (!CONFIG.enableLocalCache) return null;
        try {
            const cached = GM_getValue('remote_script_cache');
            if (cached) {
                const { content, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CONFIG.cacheExpiration) {
                    log('Using cached script');
                    return content;
                }
            }
        } catch (e) {
            logError('Failed to read local cache', e);
        }
        return null;
    }

    function setLocalCache(content) {
        if (!CONFIG.enableLocalCache) return;
        try {
            GM_setValue('remote_script_cache', JSON.stringify({
                content,
                timestamp: Date.now()
            }));
            log('Script cached locally');
        } catch (e) {
            logError('Failed to cache script', e);
        }
    }

    // ==================== SCRIPT INJECTION ====================
    
    function injectScript(scriptContent) {
        return new Promise((resolve, reject) => {
            try {
                log('Injecting script via Blob URL...');
                
                // Create blob with script content
                const scriptBlob = new Blob([scriptContent], { type: 'text/javascript' });
                const blobUrl = URL.createObjectURL(scriptBlob);
                
                // Create script element
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = blobUrl;
                
                // Handle successful load
                script.onload = () => {
                    URL.revokeObjectURL(blobUrl);
                    log('Script injected and blob URL revoked successfully');
                    resolve();
                };
                
                // Handle errors
                script.onerror = (error) => {
                    URL.revokeObjectURL(blobUrl);
                    logError('Script injection failed', error);
                    reject(new Error('Script injection failed'));
                };
                
                // Inject into page
                const target = document.head || document.documentElement;
                if (!target) {
                    reject(new Error('No valid injection target found'));
                    return;
                }
                
                target.appendChild(script);
                
            } catch (error) {
                logError('Exception during script injection', error);
                reject(error);
            }
        });
    }

    // ==================== SCRIPT FETCHING ====================
    
    function getLatestCommitHash() {
        return new Promise((resolve, reject) => {
            log('Fetching latest commit hash from GitHub API...');
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: CONFIG.githubApiUrl,
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 5000,
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            const commitHash = data.sha;
                            log('Latest commit hash retrieved', { hash: commitHash.substring(0, 7) });
                            resolve(commitHash);
                        } else {
                            reject(new Error(`GitHub API returned ${response.status}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function(response) {
                    reject(new Error('Failed to fetch commit hash'));
                },
                ontimeout: function() {
                    reject(new Error('GitHub API timeout'));
                }
            });
        });
    }
    
    function fetchRemoteScript(url, attempt = 1) {
        return new Promise((resolve, reject) => {
            const cacheBustedUrl = getCacheBustedUrl(url);
            
            log(`Fetching remote script (attempt ${attempt}/${CONFIG.maxRetries})`, { url: cacheBustedUrl });
            
            const timeoutId = setTimeout(() => {
                logError('Request timed out', { url: cacheBustedUrl, timeout: CONFIG.timeout });
                reject(new Error(`Request timeout after ${CONFIG.timeout}ms`));
            }, CONFIG.timeout);
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: cacheBustedUrl,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                onload: function(response) {
                    clearTimeout(timeoutId);
                    
                    if (response.status >= 200 && response.status < 400) {
                        log('Remote script fetched successfully', { 
                            status: response.status,
                            size: response.responseText.length 
                        });
                        
                        // Basic validation
                        if (!response.responseText || response.responseText.trim().length === 0) {
                            reject(new Error('Empty response received'));
                            return;
                        }
                        
                        // Cache the script
                        setLocalCache(response.responseText);
                        
                        resolve(response.responseText);
                    } else {
                        logError('HTTP error', {
                            status: response.status,
                            statusText: response.statusText,
                            url: cacheBustedUrl
                        });
                        reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                    }
                },
                onerror: function(response) {
                    clearTimeout(timeoutId);
                    logError('Network error', {
                        error: response.error,
                        details: response.details,
                        url: cacheBustedUrl
                    });
                    reject(new Error(`Network error: ${response.error || 'Unknown'}`));
                },
                ontimeout: function() {
                    clearTimeout(timeoutId);
                    logError('Request timeout');
                    reject(new Error('Request timeout'));
                }
            });
        });
    }

    async function fetchWithRetry(url, attempt = 1) {
        try {
            return await fetchRemoteScript(url, attempt);
        } catch (error) {
            if (attempt < CONFIG.maxRetries) {
                log(`Retrying in ${CONFIG.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
                return fetchWithRetry(url, attempt + 1);
            }
            throw error;
        }
    }

    // ==================== MAIN EXECUTION ====================
    
    async function initialize() {
        log('Initializing Remote Script Loader...');
        
        let scriptContent = null;
        let scriptUrl = null;
        
        // Try to get the latest commit hash and build URL
        try {
            const commitHash = await getLatestCommitHash();
            // Use commit hash in jsDelivr URL - this bypasses all caching
            scriptUrl = `https://cdn.jsdelivr.net/gh/imadelakhaldev/TamperMonkey-Scripts@${commitHash}/${CONFIG.scriptPath}`;
            log('Built jsDelivr URL with commit hash', { url: scriptUrl });
        } catch (error) {
            logError('Failed to get commit hash, using fallback URL', error);
            scriptUrl = CONFIG.githubRawFallback;
        }
        
        // Try to fetch the script
        try {
            scriptContent = await fetchWithRetry(scriptUrl);
        } catch (primaryError) {
            logError('Failed to fetch from primary URL', primaryError);
            
            // Try fallback URL
            if (scriptUrl !== CONFIG.githubRawFallback) {
                log('Attempting fallback URL...');
                try {
                    scriptContent = await fetchWithRetry(CONFIG.githubRawFallback);
                } catch (fallbackError) {
                    logError('Failed to fetch from fallback URL', fallbackError);
                }
            }
        }
        
        // Inject script if we have content
        if (scriptContent) {
            try {
                await injectScript(scriptContent);
                log('Remote script loader completed successfully');
                
                // Store success metric
                if (CONFIG.healthCheckEnabled) {
                    GM_setValue('last_success', Date.now());
                }
            } catch (injectionError) {
                logError('Failed to inject script', injectionError);
            }
        } else {
            logError('CRITICAL: No script content available from any source');
            
            // Store failure metric
            if (CONFIG.healthCheckEnabled) {
                GM_setValue('last_failure', Date.now());
            }
        }
    }

    // ==================== HEALTH CHECK ====================
    
    if (CONFIG.healthCheckEnabled) {
        // Expose health status to page context for monitoring
        window.addEventListener('load', () => {
            const lastSuccess = GM_getValue('last_success');
            const lastFailure = GM_getValue('last_failure');
            
            window.__TM_LOADER_HEALTH__ = {
                lastSuccess: lastSuccess ? new Date(lastSuccess).toISOString() : null,
                lastFailure: lastFailure ? new Date(lastFailure).toISOString() : null,
                status: lastSuccess && (!lastFailure || lastSuccess > lastFailure) ? 'healthy' : 'degraded'
            };
            
            log('Health status exposed', window.__TM_LOADER_HEALTH__);
        });
    }

    // Start the loader
    initialize().catch(error => {
        logError('Unhandled error in initialize()', error);
    });

})();
