/**
 * SharedService - A utility class with common helper methods
 * that can be used across all applications in the monorepo.
 */
export class SharedService {
  /**
   * Formats a date to a specified format string
   * @param date - The date to format
   * @param format - Format string: 'iso', 'date', 'time', 'datetime', or 'relative'
   * @returns Formatted date string
   */
  static formatDate(
    date: Date | string | number,
    format: 'iso' | 'date' | 'time' | 'datetime' | 'relative' = 'datetime'
  ): string {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided');
    }

    switch (format) {
      case 'iso':
        return d.toISOString();
      case 'date':
        return d.toLocaleDateString();
      case 'time':
        return d.toLocaleTimeString();
      case 'datetime':
        return d.toLocaleString();
      case 'relative':
        return SharedService.getRelativeTime(d);
      default:
        return d.toLocaleString();
    }
  }

  /**
   * Gets relative time string (e.g., "2 hours ago", "in 3 days")
   * @param date - The date to compare against now
   * @returns Relative time string
   */
  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (Math.abs(diffSec) < 60) {
      return 'just now';
    }
    if (Math.abs(diffMin) < 60) {
      return diffMin > 0 ? `in ${diffMin} minutes` : `${Math.abs(diffMin)} minutes ago`;
    }
    if (Math.abs(diffHour) < 24) {
      return diffHour > 0 ? `in ${diffHour} hours` : `${Math.abs(diffHour)} hours ago`;
    }
    return diffDay > 0 ? `in ${diffDay} days` : `${Math.abs(diffDay)} days ago`;
  }

  /**
   * Generates a unique identifier
   * @param prefix - Optional prefix for the ID
   * @param length - Length of the random portion (default: 8)
   * @returns A unique identifier string
   */
  static generateId(prefix = '', length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';

    for (let i = 0; i < length; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const timestamp = Date.now().toString(36);
    const baseId = `${timestamp}-${randomPart}`;

    return prefix ? `${prefix}_${baseId}` : baseId;
  }

  /**
   * Capitalizes the first letter of a string
   * @param str - The string to capitalize
   * @returns Capitalized string
   */
  static capitalizeString(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Capitalizes the first letter of each word in a string
   * @param str - The string to title case
   * @returns Title cased string
   */
  static toTitleCase(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => SharedService.capitalizeString(word))
      .join(' ');
  }

  /**
   * Converts a string to slug format (URL-friendly)
   * @param str - The string to slugify
   * @returns Slugified string
   */
  static slugify(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncates a string to a specified length with ellipsis
   * @param str - The string to truncate
   * @param maxLength - Maximum length before truncation
   * @param suffix - Suffix to append (default: '...')
   * @returns Truncated string
   */
  static truncate(str: string, maxLength: number, suffix = '...'): string {
    if (!str || typeof str !== 'string') {
      return '';
    }
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength - suffix.length).trim() + suffix;
  }

  /**
   * Deep clones an object
   * @param obj - The object to clone
   * @returns A deep clone of the object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Delays execution for a specified number of milliseconds
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
   * @param value - The value to check
   * @returns True if the value is empty
   */
  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  }
}
