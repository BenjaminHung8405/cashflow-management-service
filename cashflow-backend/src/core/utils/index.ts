/**
 * Common utility functions for the application
 */

/**
 * Safely parse JSON string
 */
export const safeJsonParse = <T = unknown>(
  json: string,
  fallback: T
): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format decimal value with specific precision
 */
export const formatDecimal = (value: number | string, decimals: number = 2): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Sleep for given milliseconds
 */
export const sleep = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Pick specific keys from object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    result[key] = obj[key];
  });
  return result;
};

/**
 * Normalize AI/HTML-like content into plain readable text.
 */
export const formatAssistantOutputText = (input: string): string => {
  let text = input.trim();

  // Some LLM outputs are wrapped in a single pair of quotes.
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  return text
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(b|i|u|strong|em)>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
