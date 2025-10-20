/**
 * Remote Script for TamperMonkey Loader (XPath - full absolute XPaths)
 * File: fsnb-1.js
 * Purpose: Modify banking interface values using the exact FULL XPATHs provided
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const SCRIPT_CONFIG = {
        scriptName: 'fsnb.js',
        version: '1.2.0',
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

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // ==================== XPATH HELPERS ====================
    function getXPathNode(xpath) {
        try {
            return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch (err) {
            logError(`Invalid XPath: ${xpath}`, err);
            return null;
        }
    }

    function getXPathNodes(xpath) {
        try {
            const snapshot = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const nodes = [];
            for (let i = 0; i < snapshot.snapshotLength; i++) {
                nodes.push(snapshot.snapshotItem(i));
            }
            return nodes;
        } catch (err) {
            logError(`Invalid XPath (nodes): ${xpath}`, err);
            return [];
        }
    }

    // ==================== GLOBAL RULES ====================
    const GLOBAL_RULES = [
        {
            name: 'Insert History Item',
            runOnce: false,
            execute: () => {
                // Full XPath for Activity -> History (the UL container)
                const historyListXPath = '/html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[1]/div[2]/ul';
                const historyList = getXPathNode(historyListXPath);

                if (!historyList) return false;

                // Skip if our custom item already exists by ID ember100
                if (getXPathNode('//*[@id="ember100"]')) return false;

                const historyItemHTML = `
<li id="ember100" class="component-accordion transaction-history-item ember-view"><div class="datatable-row parent-template pointer " data-toggle="collapse" data-target="#1360927038A5D37577278F4DF80E67D36CCFEDB4" data-parent="#historyItems" aria-controls="1360927038A5D37577278F4DF80E67D36CCFEDB4" test-id="blkAccordionHeader" aria-expanded="false" tabindex="0" role="button" data-ember-action="" data-ember-action-101="101">
    <div class="row-content flex">
        <div class="col-date uppercase" aria-label="Date: Oct 9 2025">Oct 9 2025</div>
        <div class="col-desc col-desc-no-pfm">
            <div test-id="historyItemDescription" class="description-text two-lines" aria-label="Description: Service Charge ">Service Charge</div>
        </div>
        <div class="col-amount">
            <span test-id="lblAmount" id="ember102" class="amount debit ui-number ui-currency currency currency-commercial currency-transaction currency-negative ember-view">
                <span class="sr-only">Amount: negative twelve dollars and fifty cents</span>
                <span class="numAmount" aria-hidden="true">($12.50)</span>
            </span>
            <span id="ember103" class="account-balance-text ui-number ui-currency currency currency-commercial currency-asset currency-positive ember-view">
                <span class="sr-only">Running Balance: nine hundred eighty dollars and thirty three cents</span>
                <span class="numAmount" aria-hidden="true">$980.33</span>
            </span>
        </div>
        <div class="col-actions">
            <q2-dropdown test-id="transactionActionsDropDown" icon="options" aria-label="Options" alignment="right" name="AccountDetails.main.transactions" context="Transaction::Q2Transaction" resolved-type="Transaction::GenericDebit" context-value="528030423" hide-label="" label="Options" type="icon" stencil-hydrated="">
                <q2-dropdown-item test-id="txnDropDownViewDetails" aria-controls="1360927038A5D37577278F4DF80E67D36CCFEDB4" aria-expanded="false" stencil-hydrated="">Toggle Details</q2-dropdown-item>
                <q2-dropdown-item test-id="txnDropDownPrint" stencil-hydrated="">Print</q2-dropdown-item>
            </q2-dropdown>
        </div>
    </div>
</div>
<div id="1360927038A5D37577278F4DF80E67D36CCFEDB4" class="collapse clearfix collapse-hidden" test-id="blkAccordionContainer"></div></li>`;

                historyList.insertAdjacentHTML('afterbegin', historyItemHTML);
                log('History item inserted using full XPath');
                return true;
            }
        }
    ];

    // ==================== ELEMENT-BASED RULES (USE PROVIDED FULL XPATHs) ====================
    const RULES = [
        {
            name: 'Home Balance',
            // Home -> Balance Full
            xpath: '/html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/div/div/q2-section/section/div/div[1]/div/div/div/div[2]/dl/div[1]/dd/span/span[2]',
            process: (element) => {
                if (!element || element.hasAttribute('data-script-processed')) return false;
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Home balance updated to $0.00');
                return true;
            }
        },
        {
            name: 'Activity Balance',
            // Activity -> Balance Full
            xpath: '/html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/div[2]/dl/div/dd/span/span[2]',
            process: (element) => {
                if (!element || element.hasAttribute('data-script-processed')) return false;
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Activity balance updated to $0.00');
                return true;
            }
        },
        {
            name: 'Details Current Balance',
            // Activity -> Details -> Current Full
            xpath: '/html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[1]/dd/span/span[2]',
            process: (element) => {
                if (!element || element.hasAttribute('data-script-processed')) return false;
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Details (Current) balance updated to $0.00');
                return true;
            }
        },
        {
            name: 'Details Available Balance',
            // Activity -> Details -> Available Full
            xpath: '/html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[2]/dd/span/span[2]',
            process: (element) => {
                if (!element || element.hasAttribute('data-script-processed')) return false;
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Details (Available) balance updated to $0.00');
                return true;
            }
        },
        {
            name: 'Details Deposit Balance',
            // Activity -> Details -> Deposit Full
            xpath: '/html/body/div[1]/div[6]/div[2]/div[1]/div[1]/div[1]/section/section/div/tecton-tabbed-outlet/q2-tab-container/tecton-tab-pane[2]/div[2]/dl/div[4]/dd/span/span[2]',
            process: (element) => {
                if (!element || element.hasAttribute('data-script-processed')) return false;
                element.textContent = '$0.00';
                element.setAttribute('data-script-processed', 'true');
                log('Details (Deposit) balance updated to $0.00');
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

    const executedGlobalRules = new Set();

    function executeGlobalRules() {
        let executionsCount = 0;
        for (const rule of GLOBAL_RULES) {
            try {
                if (rule.runOnce && executedGlobalRules.has(rule.name)) continue;
                const executed = rule.execute();
                if (executed) {
                    executionsCount++;
                    processingStats.globalRulesExecuted[rule.name] = (processingStats.globalRulesExecuted[rule.name] || 0) + 1;
                    if (rule.runOnce) executedGlobalRules.add(rule.name);
                }
            } catch (err) {
                logError(`Error executing global rule "${rule.name}"`, err);
            }
        }
        return executionsCount;
    }

    function processPageChanges() {
        const startTime = performance.now();
        let changesCount = 0;

        try {
            // Global rules first
            changesCount += executeGlobalRules();

            // Element rules (use exact full XPaths)
            for (const rule of RULES) {
                try {
                    const element = getXPathNode(rule.xpath);
                    if (element) {
                        const processed = rule.process(element);
                        if (processed) {
                            changesCount++;
                            processingStats.ruleExecutions[rule.name] = (processingStats.ruleExecutions[rule.name] || 0) + 1;
                        }
                    }
                } catch (error) {
                    logError(`Error processing rule "${rule.name}"`, error);
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

        log('Initializing observer (FULL XPATH mode)...');

        // Run initial pass
        processPageChanges();

        const debouncedProcess = debounce(() => processPageChanges(), SCRIPT_CONFIG.observerDebounce);

        observer = new MutationObserver(() => {
            debouncedProcess();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        observerActive = true;
        log('Observer running (FULL XPATH mode)');
    }

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

    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            log('Page visible, re-processing...');
            processPageChanges();
        }
    });

    // Cleanup on unload
    window.addEventListener('beforeunload', cleanup);

    log('Initialization complete (FULL XPATH mode)');

})();
