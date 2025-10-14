import { useState, useEffect } from 'react';

/**
 * Custom hook for managing local storage
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      import('../lib/logger').then(({ default: logger }) => logger.error(`Error reading localStorage key "${key}":`, error));
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      import('../lib/logger').then(({ default: logger }) => logger.error(`Error setting localStorage key "${key}":`, error));
    }
  };

  return [storedValue, setValue];
}

/**
 * Custom hook for API calls
 * @param {Function} apiFunction - The API function to call
 * @param {Array} deps - Dependencies array
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useApi(apiFunction, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, deps);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook for debounced values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} - Debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}