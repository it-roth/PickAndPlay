/**
 * Utility functions for the application
 */

import logger from './logger';

/**
 * Combine class names conditionally
 * @param {...(string|undefined|null|boolean)} classes 
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format currency value
 * @param {number} value 
 * @param {string} currency 
 * @returns {string}
 */
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Generate unique ID
 * @returns {string}
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Get image URL from backend
 * @param {string} imagePath - The image path from the backend
 * @returns {string}
 */
export function getImageUrl(imagePath) {
  // Debug logging for development
  if (import.meta.env.DEV) {
    logger.debug('🖼️ getImageUrl called with:', {
      input: imagePath,
      inputType: typeof imagePath,
      isArray: Array.isArray(imagePath),
      isEmpty: !imagePath,
      stringValue: String(imagePath)
    });
  }

  if (!imagePath) {
    if (import.meta.env.DEV) logger.debug('🚫 getImageUrl: No imagePath provided');
    return null;
  }

  // If an array was provided, pick the first entry
  let path = imagePath;
  if (Array.isArray(imagePath)) {
    path = imagePath.length > 0 ? imagePath[0] : null;
    if (import.meta.env.DEV) logger.debug('📋 getImageUrl: Array input, extracted:', path);
  }

  // If the image is an object with a url/path property, use it
  if (path && typeof path === 'object') {
    const originalPath = path;
    path = path.url || path.path || path.filename || null;
    if (import.meta.env.DEV) logger.debug('🔧 getImageUrl: Object input, extracted:', { originalPath, extractedPath: path });
  }

  if (!path) {
    if (import.meta.env.DEV) logger.debug('🚫 getImageUrl: No valid path after processing');
    return null;
  }

  // If already an absolute URL or data URI, return as-is
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('/')) ) {
    if (import.meta.env.DEV) logger.debug('✅ getImageUrl: Already absolute URL, returning as-is:', path);
    return path;
  }

  // URL encode the image path to handle spaces and special characters
  // If the backend accidentally returned a full filesystem path (Windows backslashes
  // or forward slashes), use only the filename portion so the /images/** handler can
  // resolve the file on the server. This avoids producing URLs like /images/C%3A%5C....
  let normalized = String(path);
  if (import.meta.env.DEV) logger.debug('🔧 getImageUrl: Normalizing path:', { original: path, normalized });
  
  // If it's a URL already, leave it alone (handled above).
  // Extract basename if it contains path separators
  if (normalized.includes('/') || normalized.includes('\\')) {
    const parts = normalized.split(/[/\\]+/);
    normalized = parts[parts.length - 1];
    if (import.meta.env.DEV) logger.debug('📁 getImageUrl: Extracted filename from path:', { parts, filename: normalized });
  }
  const encodedPath = encodeURIComponent(normalized);

  // Allow backend host to be configured via Vite env var for non-local setups
  const backendHost = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
  const finalUrl = `${backendHost.replace(/\/$/, '')}/images/${encodedPath}`;
  
  if (import.meta.env.DEV) logger.debug('🎯 getImageUrl: Final URL constructed:', {
    backendHost,
    encodedPath,
    finalUrl
  });
  
  return finalUrl;
}

/**
 * Validate file type for image uploads
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
export function isValidImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Scroll to top of page with smooth animation
 * @param {number} offset - Optional offset from top (default: 0)
 * @param {string} behavior - Scroll behavior (default: 'smooth')
 */
export function scrollToTop(offset = 0, behavior = 'smooth') {
  try {
    window.scrollTo({
      top: offset,
      behavior: behavior
    });
  } catch (error) {
    // Fallback for older browsers
    window.scrollTo(0, offset);
  }
}

/**
 * Scroll to specific element with smooth animation
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Optional offset from element (default: -80 for navbar)
 */
export function scrollToElement(elementId, offset = -80) {
  try {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition + offset,
        behavior: 'smooth'
      });
    }
  } catch (error) {
    console.warn('Error scrolling to element:', error);
  }
}