/**
 * Utility functions for dynamic badge colors based on dropdown options
 */

import { DropdownOption } from '@/hooks/useDropdownOptions';

/**
 * Color palette used when no custom color is specified
 * Generates consistent colors based on value hash
 */
const COLOR_PALETTES = [
  { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' },
  { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
];

/**
 * Generate a hash from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get badge color classes from a hash-based palette
 */
function getColorFromPalette(value: string): { bg: string; text: string; border: string } {
  const index = hashString(value) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

/**
 * Convert hex color to Tailwind-like classes
 * This is a simplified version - in production, you might want to use inline styles
 */
function hexToTailwindClasses(hexColor: string): { bg: string; text: string; border: string } {
  // For now, we'll map common colors to Tailwind classes
  // In a real implementation, you might use inline styles with the hex color
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    '#ef4444': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    '#f97316': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    '#f59e0b': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    '#eab308': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    '#84cc16': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' },
    '#22c55e': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    '#10b981': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    '#14b8a6': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    '#06b6d4': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    '#0ea5e9': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    '#3b82f6': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    '#6366f1': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    '#8b5cf6': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
    '#a855f7': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    '#d946ef': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
    '#ec4899': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
    '#f43f5e': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const normalizedColor = hexColor.toLowerCase();
  return colorMap[normalizedColor] || getColorFromPalette(hexColor);
}

/**
 * Get badge color classes for a dropdown option value
 * Looks up the color from dropdown options, falls back to hash-based palette
 * 
 * @param value - The dropdown value (e.g., "HIGH", "CRITICAL")
 * @param options - Array of dropdown options to search for color
 * @returns Object with bg, text, and border Tailwind classes
 */
export function getBadgeColorClasses(
  value: string,
  options: DropdownOption[]
): { bg: string; text: string; border: string } {
  // Find the option matching this value
  const option = options.find(opt => opt.value === value);
  
  // If option has a color, use it
  if (option?.color) {
    return hexToTailwindClasses(option.color);
  }
  
  // Fall back to hash-based color
  return getColorFromPalette(value);
}

/**
 * Get inline styles for a badge from a hex color
 * Useful when Tailwind classes are not sufficient
 * 
 * @param hexColor - Hex color string (e.g., "#FF0000")
 * @returns Object with CSS properties for background, text, and border
 */
export function getBadgeInlineStyles(hexColor: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
    color: `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
  };
}

/**
 * Get combined classes and styles for a dropdown value
 * Uses dropdown option color if available, otherwise hash-based palette
 * 
 * @param value - The dropdown value
 * @param options - Array of dropdown options
 * @returns Object with className string and optional style object
 */
export function getDynamicBadgeProps(
  value: string,
  options: DropdownOption[]
): {
  className: string;
  style?: React.CSSProperties;
} {
  const option = options.find(opt => opt.value === value);
  
  if (option?.color) {
    const styles = getBadgeInlineStyles(option.color);
    return {
      className: 'border',
      style: styles,
    };
  }
  
  const classes = getColorFromPalette(value);
  return {
    className: `${classes.bg} ${classes.text} ${classes.border}`,
  };
}
