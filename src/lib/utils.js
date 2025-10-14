/**
 * Utility functions for the application
 */

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
  if (!imagePath) return null;

  // If an array was provided, pick the first entry
  let path = imagePath;
  if (Array.isArray(imagePath)) {
    path = imagePath.length > 0 ? imagePath[0] : null;
  }

  // If the image is an object with a url/path property, use it
  if (path && typeof path === 'object') {
    path = path.url || path.path || path.filename || null;
  }

  if (!path) return null;

  // If already an absolute URL or data URI, return as-is
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('/')) ) {
    return path;
  }

  // URL encode the image path to handle spaces and special characters
  const encodedPath = encodeURIComponent(String(path));

  // Allow backend host to be configured via Vite env var for non-local setups
  const backendHost = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
  return `${backendHost.replace(/\/$/, '')}/images/${encodedPath}`;
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