// Immediate console suppression helper.
// This module is imported as the very first user script in the app entry so
// that noisy console statements in other modules don't pollute the console.
// To re-enable logging temporarily for debugging open the browser console and run:
//   window.__SUPPRESS_CONSOLE = false
// or set it to 'debug' to re-enable selectively in the logger.
try {
  // If explicitly set to false, do not suppress
  if (typeof window !== 'undefined' && window.__SUPPRESS_CONSOLE === false) {
    // user wants logs
  } else {
    const noop = () => {};
    const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'group', 'groupCollapsed', 'groupEnd'];
    methods.forEach(m => {
      try { if (console && console[m]) console[m] = noop; } catch (e) { /* ignore */ }
    });
  }
} catch (e) {
  // ignore any errors while suppressing
}
