/**
 * Remote Script for TamperMonkey Loader
 * File: fsnb-1.js
 * Purpose: Modify banking interface values
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const SCRIPT_CONFIG = {
        scriptName: 'fsnb.js',
        version: '1.0.0',
        debugMode: true,
        observerDebounce: 100
    };

    // ==================== LOGGING ====================
    
    function log(message, data = null) {
        if (!SCRIPT_CONFIG.debugMode) return;
        console.log(`[${SCRIPT_CONFIG.scriptName}] ${message}`, data || '');
    }

    function logError(message, error = null) {
        console.error(`[${SCRIPT_CONFIG.scriptName}] ERROR: ${message}`, error || '');
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // ==================== PROCESSING RULES ====================
    
    // Global rules (executed once on initialization)
    const GLOBAL_RULES = [
        {
            name: 'Insert History Item',
            runOnce: false, // Run repeatedly to handle SPA navigation
            execute: () => {
                const historyList = document.querySelector('#historyItems');
                
                if (!historyList) return false;
                
                // Check if our custom item already exists
                if (historyList.querySelector('#ember100')) return false;
                
                const historyItemHTML = `
<li id="ember100" class="component-accordion transaction-history-item ember-view"><div class="datatable-row parent-template pointer " data-toggle="collapse" data-target="#1360927038A5D37577278F4DF80E67D36CCFEDB4" data-parent="#historyItems" aria-controls="1360927038A5D37577278F4DF80E67D36CCFEDB4" test-id="blkAccordionHeader" aria-expanded="false" tabindex="0" role="button" data-ember-action="" data-ember-action-101="101">
    <div class="row-content flex">
        <div class="col-date uppercase" aria-label="Date: Oct 9 2025">
                Oct 9 2025
        </div>
        <div class="col-desc col-desc-no-pfm">
            <div test-id="historyItemDescription" class="description-text two-lines" aria-label="Description: Service Charge ">
                Service Charge
            </div>
        </div>
        <div class="col-amount">
                <span test-id="lblAmount" id="ember102" class="amount debit ui-number ui-currency currency currency-commercial currency-transaction currency-negative ember-view"><span class="sr-only">Amount: negative twelve dollars and fifty cents</span>
<span class="numAmount" aria-hidden="true">
    ($12.50)
</span></span>
                    <span id="ember103" class="account-balance-text ui-number ui-currency currency currency-commercial currency-asset currency-positive ember-view"><span class="sr-only">Running Balance: nine hundred eighty dollars and thirty three cents</span>
<span class="numAmount" aria-hidden="true">
    $980.33
</span></span>
        </div>
        <div class="col-actions">
            <q2-dropdown test-id="transactionActionsDropDown" icon="options" aria-label="Options" alignment="right" name="AccountDetails.main.transactions" context="Transaction::Q2Transaction" resolved-type="Transaction::GenericDebit" context-value="528030423" hide-label="" label="Options" type="icon" stencil-hydrated="">
                    <q2-dropdown-item test-id="txnDropDownViewDetails" aria-controls="1360927038A5D37577278F4DF80E67D36CCFEDB4" aria-expanded="false" stencil-hydrated="">Toggle Details</q2-dropdown-item>
                    <q2-dropdown-item test-id="txnDropDownPrint" stencil-hydrated="">Print</q2-dropdown-item>
            </q2-dropdown>
        </div>
    </div>
</div>
<div id="1360927038A5D37577278F4DF80E67D36CCFEDB4" class="collapse clearfix collapse-hidden" test-id="blkAccordionContainer">
</div></li>`;
                
                // Insert at the top of the history list
                historyList.insertAdjacentHTML('afterbegin', historyItemHTML);
                log('History item inserted successfully');
                return true;
            }
        }
    ];

    // Element-based rules (run when matching elements are found)
    const RULES = [
        // Home -> Balance
        // Full XPath: /html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/div/div/q2-section/section/div/div[1]/div/div/div/div[2]/dl/div[1]/dd/span/span[2]
        {
            name: 'Home Balance',
            selector: 'q2-section section dl > div:nth-child(1) dd span span.numAmount:not([data-script-processed])',
            process: (element) => {
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Home balance updated to $0.00');
                return true;
            }
        },

        // Activity -> Balance (First balance in Activity tab)
        // Full XPath: /html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[1]/dd/span/span[2]
        {
            name: 'Activity Balance',
            selector: 'tecton-tab-pane[slot="tab-2"] dl > div:nth-child(1) dd span span.numAmount:not([data-script-processed])',
            process: (element) => {
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Activity balance updated to $0.00');
                return true;
            }
        },

        // Activity -> Details -> Current (Same as Activity Balance - div[1])
        // Full XPath: /html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[1]/dd/span/span[2]
        {
            name: 'Details Current Balance',
            selector: 'tecton-tab-pane[slot="tab-2"] dl > div:nth-child(1) dd span span.numAmount:not([data-script-processed])',
            process: (element) => {
                // This might be duplicate of Activity Balance, but keeping it for clarity
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Current balance updated to $0.00');
                return true;
            }
        },

        // Activity -> Details -> Available (div[2])
        // Full XPath: /html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[2]/dd/span/span[2]
        {
            name: 'Details Available Balance',
            selector: 'tecton-tab-pane[slot="tab-2"] dl > div:nth-child(2) dd span span.numAmount:not([data-script-processed])',
            process: (element) => {
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Available balance updated to $0.00');
                return true;
            }
        },

        // Activity -> Details -> Deposit (div[4])
        // Full XPath: /html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[4]/dd/span/span[2]
        {
            name: 'Details Deposit Balance',
            selector: 'tecton-tab-pane[slot="tab-2"] dl > div:nth-child(4) dd span span.numAmount:not([data-script-processed])',
            process: (element) => {
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Deposit balance updated to $0.00');
                return true;
            }
        },

        // ALTERNATIVE: More robust approach using XPath directly
        // Uncomment these if the CSS selectors above don't work reliably
        
        /*
        // Home Balance - XPath version
        {
            name: 'Home Balance (XPath)',
            selector: null,
            process: () => {
                const element = document.evaluate(
                    '//q2-section//section//dl/div[1]//dd//span//span[@class="numAmount"]',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                
                if (element && !element.hasAttribute('data-script-processed')) {
                    element.textContent = '$0.00';
                    element.setAttribute('data-script-processed', 'true');
                    log('Home balance updated to $0.00');
                    return true;
                }
                return false;
            }
        },

        // Activity Balance - XPath version
        {
            name: 'Activity Balance (XPath)',
            selector: null,
            process: () => {
                const element = document.evaluate(
                    '//tecton-tab-pane[@slot="tab-2"]//dl/div[1]//dd//span//span[@class="numAmount"]',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                
                if (element && !element.hasAttribute('data-script-processed')) {
                    element.textContent = '$0.00';
                    element.setAttribute('data-script-processed', 'true');
                    log('Activity balance updated to $0.00');
                    return true;
                }
                return false;
            }
        },
        */
    ];

    // ==================== PROCESSING ENGINE ====================
    
    let processingStats = {
        totalProcessed: 0,
        ruleExecutions: {},
        globalRulesExecuted: {},
        lastProcessTime: 0
    };

    const executedGlobalRules = new Set();

    function executeGlobalRules() {
        let executionsCount = 0;

        for (const rule of GLOBAL_RULES) {
            try {
                if (rule.runOnce && executedGlobalRules.has(rule.name)) {
                    continue;
                }

                const executed = rule.execute();
                
                if (executed) {
                    executionsCount++;
                    processingStats.globalRulesExecuted[rule.name] = 
                        (processingStats.globalRulesExecuted[rule.name] || 0) + 1;
                    
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
                // If rule has a selector, use querySelector
                if (rule.selector) {
                    const elements = document.querySelectorAll(rule.selector);
                    
                    if (elements.length > 0) {
                        elements.forEach((element) => {
                            try {
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
                } else {
                    // If no selector, call process directly (for XPath-based rules)
                    try {
                        const processed = rule.process();
                        if (processed) {
                            changesCount++;
                            processingStats.ruleExecutions[rule.name] = 
                                (processingStats.ruleExecutions[rule.name] || 0) + 1;
                        }
                    } catch (error) {
                        logError(`Error processing rule "${rule.name}"`, error);
                    }
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
            log('Observer already active');
            return;
        }

        log('Initializing observer...');
        
        // Run initial check
        processPageChanges();

        // Create debounced processing function
        const debouncedProcess = debounce(() => {
            processPageChanges();
        }, SCRIPT_CONFIG.observerDebounce);

        // Create MutationObserver
        observer = new MutationObserver(() => {
            debouncedProcess();
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        observerActive = true;
        log('Observer running');
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

    // Expose control interface
    window.__REMOTE_SCRIPT__ = {
        version: SCRIPT_CONFIG.version,
        getStats,
        reprocess: processPageChanges,
        cleanup,
        restart: () => {
            cleanup();
            executedGlobalRules.clear();
            initializePersistentObserver();
        },
        executeGlobalRule: (ruleName) => {
            const rule = GLOBAL_RULES.find(r => r.name === ruleName);
            if (rule) {
                log(`Manually executing: ${ruleName}`);
                return rule.execute();
            }
            logError(`Rule not found: ${ruleName}`);
            return false;
        },
        resetGlobalRule: (ruleName) => {
            executedGlobalRules.delete(ruleName);
            log(`Reset rule: ${ruleName}`);
        }
    };

    // ==================== INITIALIZATION ====================
    
    log(`Script loaded (v${SCRIPT_CONFIG.version})`);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePersistentObserver);
    } else {
        if (document.body) {
            initializePersistentObserver();
        } else {
            setTimeout(initializePersistentObserver, 50);
        }
    }

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            log('Page visible, checking...');
            processPageChanges();
        }
    });

    // Cleanup on unload
    window.addEventListener('beforeunload', cleanup);

    log('Initialization complete');

})();
