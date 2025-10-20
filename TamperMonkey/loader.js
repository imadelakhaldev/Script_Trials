// ==UserScript==
// @name         Remote Script Controller (GitHub)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Remote JS Controller from GitHub with Retry, Fallback, and Monitoring Mechanisms
// @author       AfroSpy
// @match        *://*/*
// @connect      api.github.com
// @connect      raw.githubusercontent.com
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
        return;
    }

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        repo: 'imadelakhaldev/Script_Trials',
        branch: 'main',
        scriptPath: 'TamperMonkey/fsnb-1.js',
        debugMode: true,
        maxRetries: 6,
        retryDelay: 3000,
        timeout: 18000
    };

    // ==================== LOGGING ====================
    
    function log(message, data = null) {
        if (!CONFIG.debugMode) return;
        console.log(`[TM Loader] ${message}`, data || '');
    }

    function logError(message, error = null) {
        console.error(`[TM Loader] ERROR: ${message}`, error || '');
    }

    // ==================== GITHUB API ====================
    
    function getLatestCommitHash() {
        return new Promise((resolve, reject) => {
            const apiUrl = `https://api.github.com/repos/${CONFIG.repo}/commits/${CONFIG.branch}`;
            log('Fetching latest commit hash...');
            
            const timeoutId = setTimeout(() => {
                reject(new Error('GitHub API timeout'));
            }, CONFIG.timeout);
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'TamperMonkey-Script-Loader'
                },
                onload: function(response) {
                    clearTimeout(timeoutId);
                    
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            const hash = data.sha;
                            log(`Latest commit: ${hash.substring(0, 7)}`);
                            resolve(hash);
                        } catch (error) {
                            reject(new Error('Failed to parse GitHub API response'));
                        }
                    } else if (response.status === 403) {
                        // Rate limited - use cached hash
                        logError('GitHub API rate limited, using cached commit');
                        const cached = GM_getValue('last_commit_hash');
                        if (cached) {
                            resolve(cached);
                        } else {
                            reject(new Error('Rate limited and no cache available'));
                        }
                    } else {
                        reject(new Error(`GitHub API error: ${response.status}`));
                    }
                },
                onerror: function() {
                    clearTimeout(timeoutId);
                    reject(new Error('GitHub API network error'));
                },
                ontimeout: function() {
                    clearTimeout(timeoutId);
                    reject(new Error('GitHub API timeout'));
                }
            });
        });
    }

    // ==================== SCRIPT FETCHING ====================
    
    function fetchScript(url, attempt = 1) {
        return new Promise((resolve, reject) => {
            log(`Fetching script (attempt ${attempt}/${CONFIG.maxRetries})`);
            
            const timeoutId = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, CONFIG.timeout);
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'Cache-Control': 'no-cache'
                },
                onload: function(response) {
                    clearTimeout(timeoutId);
                    
                    if (response.status >= 200 && response.status < 400) {
                        if (!response.responseText || response.responseText.trim().length === 0) {
                            reject(new Error('Empty response received'));
                            return;
                        }
                        
                        log(`Script fetched successfully (${response.responseText.length} bytes)`);
                        resolve(response.responseText);
                    } else {
                        reject(new Error(`HTTP ${response.status}`));
                    }
                },
                onerror: function(response) {
                    clearTimeout(timeoutId);
                    reject(new Error(`Network error: ${response.error || 'Unknown'}`));
                },
                ontimeout: function() {
                    clearTimeout(timeoutId);
                    reject(new Error('Request timeout'));
                }
            });
        });
    }

    async function fetchWithRetry(url, attempt = 1) {
        try {
            return await fetchScript(url, attempt);
        } catch (error) {
            if (attempt < CONFIG.maxRetries) {
                log(`Retrying in ${CONFIG.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
                return fetchWithRetry(url, attempt + 1);
            }
            throw error;
        }
    }

    // ==================== SCRIPT INJECTION ====================
    
    function injectScript(scriptContent) {
        return new Promise((resolve, reject) => {
            try {
                log('Injecting script...');
                
                const blob = new Blob([scriptContent], { type: 'text/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = blobUrl;
                
                script.onload = () => {
                    URL.revokeObjectURL(blobUrl);
                    log('Script injected successfully');
                    resolve();
                };
                
                script.onerror = () => {
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error('Script injection failed'));
                };
                
                (document.head || document.documentElement).appendChild(script);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // ==================== MAIN LOGIC ====================
    
    async function initialize() {
        log('Starting loader...');
        
        try {
            // Get latest commit hash
            const commitHash = await getLatestCommitHash();
            
            // Cache the commit hash for rate limit scenarios
            GM_setValue('last_commit_hash', commitHash);
            
            // Build URL with commit hash (bypasses all caching)
            const scriptUrl = `https://raw.githubusercontent.com/${CONFIG.repo}/${commitHash}/${CONFIG.scriptPath}`;
            log(`Script URL: ${scriptUrl}`);
            
            // Fetch script
            const scriptContent = await fetchWithRetry(scriptUrl);
            
            // Inject script
            await injectScript(scriptContent);
            
            log('✓ Loader completed successfully');
            GM_setValue('last_success', Date.now());
            
        } catch (error) {
            logError('Loader failed', error);
            GM_setValue('last_failure', Date.now());
            
            // Try branch-based URL as last resort
            try {
                log('Attempting fallback with branch name...');
                const fallbackUrl = `https://raw.githubusercontent.com/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.scriptPath}`;
                const scriptContent = await fetchWithRetry(fallbackUrl);
                await injectScript(scriptContent);
                log('✓ Loaded via fallback');
            } catch (fallbackError) {
                logError('Fallback failed', fallbackError);
            }
        }
    }

    // ==================== HEALTH CHECK ====================
    
    window.addEventListener('load', () => {
        const lastSuccess = GM_getValue('last_success');
        const lastFailure = GM_getValue('last_failure');
        const lastCommit = GM_getValue('last_commit_hash');
        
        window.__TM_LOADER_STATUS__ = {
            lastSuccess: lastSuccess ? new Date(lastSuccess).toISOString() : null,
            lastFailure: lastFailure ? new Date(lastFailure).toISOString() : null,
            lastCommit: lastCommit ? lastCommit.substring(0, 7) : null,
            healthy: lastSuccess && (!lastFailure || lastSuccess > lastFailure)
        };
        
        if (CONFIG.debugMode) {
            log('Status:', window.__TM_LOADER_STATUS__);
        }
    });

    // Start
    initialize();

})();
