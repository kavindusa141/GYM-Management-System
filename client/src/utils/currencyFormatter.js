/**
 * Currency Formatter Utility
 * Formats amounts with the currency symbol from environment variables
 */

const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || 'Rs.';
const CURRENCY_CODE = import.meta.env.VITE_CURRENCY_CODE || 'LKR';

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {boolean} includeDecimals - Whether to include decimal places (default: true)
 * @returns {string} Formatted currency string (e.g., "Rs. 5000" or "Rs. 5,000.00")
 */
export const formatCurrency = (amount, includeDecimals = false) => {
  if (amount === null || amount === undefined) return `${CURRENCY_SYMBOL} 0`;
  
  const num = Number(amount);
  if (isNaN(num)) return `${CURRENCY_SYMBOL} 0`;
  
  if (includeDecimals) {
    return `${CURRENCY_SYMBOL} ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  return `${CURRENCY_SYMBOL} ${Math.round(num).toLocaleString('en-US')}`;
};

/**
 * Get just the currency symbol
 * @returns {string} Currency symbol (e.g., "Rs.")
 */
export const getCurrencySymbol = () => CURRENCY_SYMBOL;

/**
 * Get the currency code
 * @returns {string} Currency code (e.g., "LKR")
 */
export const getCurrencyCode = () => CURRENCY_CODE;

/**
 * Format currency for charts/tooltips
 * @param {number} value - The value to format
 * @returns {string} Formatted value for display
 */
export const formatChartCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return `${CURRENCY_SYMBOL} 0`;
  
  return `${CURRENCY_SYMBOL} ${num.toLocaleString('en-US')}`;
};

export default {
  formatCurrency,
  getCurrencySymbol,
  getCurrencyCode,
  formatChartCurrency
};
