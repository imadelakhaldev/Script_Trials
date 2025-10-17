/**
 * Remote Script for TamperMonkey Loader
 * File: script.js
 * URL: https://digisoftworks.ma/tampermonkey/script.js
 * 
 * This script is designed to be persistent and work on Single Page Applications (SPAs).
 * It uses MutationObserver to detect DOM changes and apply modifications dynamically.
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const SCRIPT_CONFIG = {
        scriptName: 'Remote Script',
        version: '1.0.1',
        debugMode: true,
        observerDebounce: 100, // milliseconds to debounce observer callback
        maxProcessingTime: 50 // max ms to spend processing per mutation batch
    };

    // ==================== UTILITY FUNCTIONS ====================
    
    function log(message, data = null) {
        if (SCRIPT_CONFIG.debugMode) {
            const timestamp = new Date().toISOString();
            console.log(`[${SCRIPT_CONFIG.scriptName} ${timestamp}] ${message}`, data || '');
        }
    }

    function logError(message, error = null) {
        const timestamp = new Date().toISOString();
        console.error(`[${SCRIPT_CONFIG.scriptName} ${timestamp}] ERROR: ${message}`, error || '');
    }

    // Debounce function to prevent excessive processing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ==================== PROCESSING RULES ====================
    
    /**
     * Define all your DOM manipulation rules here.
     * Each rule should be a function that returns true if it made changes.
     */
    
    // Global rules (executed once on initialization or on-demand)
    const GLOBAL_RULES = [
        // Example 1: Show alert on page load
        {
            name: 'Welcome Alert',
            runOnce: true, // Only run once per session
            execute: () => {
                alert('Welcome to our internal tools! Version: ' + SCRIPT_CONFIG.version);
                log('Welcome alert displayed');
                return true;
            }
        },

        // Example 2: Set up global event listeners
        {
            name: 'Global Click Tracker',
            runOnce: true,
            execute: () => {
                document.addEventListener('click', (e) => {
                    log('Tracked click', { element: e.target.className });
                    // Send analytics, etc.
                });
                log('Global click tracker initialized');
                return true;
            }
        },

        // Example 3: Inject custom CSS
        {
            name: 'Inject Custom Styles',
            runOnce: true,
            execute: () => {
                const style = document.createElement('style');
                style.textContent = `
                    .custom-even-row { background-color: #f5f5f5 !important; }
                    .custom-nav-btn { 
                        background: #007bff; 
                        color: white; 
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .custom-nav-btn:hover { background: #0056b3; }
                `;
                document.head.appendChild(style);
                log('Custom styles injected');
                return true;
            }
        },

        // Example 4: Check for specific conditions periodically
        {
            name: 'Session Monitor',
            runOnce: false, // Runs on every mutation check (use sparingly!)
            execute: () => {
                // Only run every 30 seconds
                const lastRun = window.__SESSION_MONITOR_LAST_RUN__ || 0;
                const now = Date.now();
                if (now - lastRun < 30000) return false;
                
                window.__SESSION_MONITOR_LAST_RUN__ = now;
                
                // Check for session timeout warning
                const warningEl = document.querySelector('.session-warning');
                if (warningEl) {
                    log('Session warning detected!');
                    // Could trigger notification, auto-refresh, etc.
                }
                return false;
            }
        },

        // Example 5: Intercept fetch/XHR requests
        {
            name: 'API Request Interceptor',
            runOnce: true,
            execute: () => {
                // Wrap fetch to log API calls
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    log('Fetch intercepted', { url: args[0] });
                    return originalFetch.apply(this, args);
                };
                log('Fetch interceptor installed');
                return true;
            }
        }
    ];

    // Element-based rules (run when matching elements are found)
    const RULES = [
        // Rule 1: Change balance numeric display
        {
            name: 'Update Balance Amount',
            selector: '.numAmount:not([data-remote-processed])',
            process: (element) => {
                element.innerHTML = '$99.99';
                element.setAttribute('data-remote-processed', 'true');
                element.style.color = '#00a86b'; // Optional: add green color
                return true;
            }
        },

        // Rule 2: Change balance detail text
        {
            name: 'Update Balance Detail',
            selector: '[test-id="hade-detail"]:not([data-remote-processed])',
            process: (element) => {
                element.innerHTML = 'Hello World!';
                element.setAttribute('data-remote-processed', 'true');
                return true;
            }
        },

        // Rule 3: Hide details/settings panel
        {
            name: 'Hide Settings Tab',
            selector: '#tab-1014-1:not([data-remote-processed])',
            process: (element) => {
                element.style.display = 'none';
                element.setAttribute('data-remote-processed', 'true');
                return true;
            }
        },

        // Rule 4: Example - Add custom button to navigation
        {
            name: 'Add Custom Navigation Button',
            selector: '.nav-container:not([data-remote-processed])',
            process: (element) => {
                const customBtn = document.createElement('button');
                customBtn.className = 'nav-btn custom-nav-btn';
                customBtn.textContent = 'Dashboard';
                customBtn.onclick = () => {
                    log('Custom button clicked');
                    // Add your custom action here
                };
                element.appendChild(customBtn);
                element.setAttribute('data-remote-processed', 'true');
                return true;
            }
        },

        // Rule 5: Example - Modify table rows
        {
            name: 'Process Table Rows',
            selector: 'table.data-table tr:not([data-remote-processed])',
            process: (element) => {
                // Example: Add custom class to alternating rows
                const rowIndex = Array.from(element.parentElement.children).indexOf(element);
                if (rowIndex % 2 === 0) {
                    element.classList.add('custom-even-row');
                }
                element.setAttribute('data-remote-processed', 'true');
                return true;
            }
        },

        // Rule 6: Example - Intercept and modify form inputs
        {
            name: 'Enhance Form Inputs',
            selector: 'input[type="email"]:not([data-remote-processed])',
            process: (element) => {
                // Add validation helper
                element.setAttribute('data-remote-processed', 'true');
                element.addEventListener('blur', function() {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(this.value)) {
                        this.style.borderColor = 'red';
                        log('Invalid email detected', this.value);
                    } else {
                        this.style.borderColor = '';
                    }
                });
                return true;
            }
        }
    ];

    // ==================== PROCESSING ENGINE ====================
    
    let processingStats = {
        totalProcessed: 0,
        ruleExecutions: {},
        globalRulesExecuted: {},
        lastProcessTime: 0
    };

    // Track which global rules have been executed
    const executedGlobalRules = new Set();

    function executeGlobalRules() {
        let executionsCount = 0;

        for (const rule of GLOBAL_RULES) {
            try {
                // Check if this is a runOnce rule that's already been executed
                if (rule.runOnce && executedGlobalRules.has(rule.name)) {
                    continue;
                }

                // Execute the rule
                const executed = rule.execute();
                
                if (executed) {
                    executionsCount++;
                    processingStats.globalRulesExecuted[rule.name] = 
                        (processingStats.globalRulesExecuted[rule.name] || 0) + 1;
                    
                    // Mark as executed if it's a runOnce rule
                    if (rule.runOnce) {
                        executedGlobalRules.add(rule.name);
                        log(`Global rule "${rule.name}" executed (runOnce)`);
                    }
                }
            } catch (error) {
                logError(`Error executing global rule "${rule.name}"`, error);
            }
        }

        return executionsCount;
    }

    function processPageChanges() {
        const startTime = performance.now();
        let changesCount = 0;

        try {
            // Execute global rules first
            changesCount += executeGlobalRules();

            // Process each element-based rule
            for (const rule of RULES) {
                // Find all matching elements that haven't been processed
                const elements = document.querySelectorAll(rule.selector);
                
                if (elements.length > 0) {
                    log(`Processing ${elements.length} elements for rule: ${rule.name}`);
                    
                    elements.forEach((element) => {
                        try {
                            // Check if we're exceeding max processing time
                            if (performance.now() - startTime > SCRIPT_CONFIG.maxProcessingTime) {
                                log('Max processing time reached, deferring remaining rules');
                                return;
                            }

                            const processed = rule.process(element);
                            if (processed) {
                                changesCount++;
                                processingStats.ruleExecutions[rule.name] = 
                                    (processingStats.ruleExecutions[rule.name] || 0) + 1;
                            }
                        } catch (error) {
                            logError(`Error processing element for rule "${rule.name}"`, error);
                        }
                    });
                }
            }

            if (changesCount > 0) {
                processingStats.totalProcessed += changesCount;
                const processingTime = (performance.now() - startTime).toFixed(2);
                processingStats.lastProcessTime = processingTime;
                log(`Processed ${changesCount} changes in ${processingTime}ms`);
            }

        } catch (error) {
            logError('Error in processPageChanges', error);
        }
    }

    // ==================== OBSERVER SETUP ====================
    
    let observer = null;
    let observerActive = false;

    function initializePersistentObserver() {
        if (observerActive) {
            log('Observer already active, skipping initialization');
            return;
        }

        log('Initializing persistent observer...');
        
        // Run initial check for existing content
        processPageChanges();

        // Create debounced processing function
        const debouncedProcess = debounce(() => {
            processPageChanges();
        }, SCRIPT_CONFIG.observerDebounce);

        // Create MutationObserver
        observer = new MutationObserver((mutations) => {
            // Use debounced processing to avoid excessive calls
            debouncedProcess();
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,     // Watch for direct children being added/removed
            subtree: true,       // Watch all descendants
            attributes: false,   // Don't watch attribute changes (performance optimization)
            characterData: false // Don't watch text changes (performance optimization)
        });

        observerActive = true;
        log('Persistent observer is now running');
    }

    // ==================== LIFECYCLE MANAGEMENT ====================
    
    function cleanup() {
        if (observer) {
            observer.disconnect();
            observerActive = false;
            log('Observer disconnected');
        }
    }

    function getStats() {
        return {
            ...processingStats,
            observerActive,
            config: SCRIPT_CONFIG
        };
    }

    // Expose stats and control functions for debugging
    window.__REMOTE_SCRIPT__ = {
        version: SCRIPT_CONFIG.version,
        getStats,
        reprocess: processPageChanges,
        cleanup,
        restart: () => {
            cleanup();
            executedGlobalRules.clear(); // Reset global rules
            initializePersistentObserver();
        },
        // Manually execute a specific global rule
        executeGlobalRule: (ruleName) => {
            const rule = GLOBAL_RULES.find(r => r.name === ruleName);
            if (rule) {
                log(`Manually executing global rule: ${ruleName}`);
                return rule.execute();
            } else {
                logError(`Global rule not found: ${ruleName}`);
                return false;
            }
        },
        // Reset a runOnce global rule so it can run again
        resetGlobalRule: (ruleName) => {
            executedGlobalRules.delete(ruleName);
            log(`Reset global rule: ${ruleName}`);
        }
    };

    // ==================== INITIALIZATION ====================
    
    log(`Script loaded (v${SCRIPT_CONFIG.version})`);

    // Wait for body to be available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePersistentObserver);
    } else {
        // DOM is already ready
        if (document.body) {
            initializePersistentObserver();
        } else {
            // Body not yet available, wait a bit
            setTimeout(initializePersistentObserver, 50);
        }
    }

    // Optional: Handle page visibility changes (pause/resume observer)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            log('Page hidden, observer continues running');
        } else {
            log('Page visible, running check...');
            processPageChanges();
        }
    });

    // Optional: Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        log('Page unloading, cleaning up...');
        cleanup();
    });

    log('Remote script initialization complete');

})();
