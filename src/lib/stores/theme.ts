// Storage key for localStorage
const STORAGE_KEY = 'duit-theme';

// Theme options
export type ThemeOption = 'light' | 'dark' | 'system';

// The actual applied theme (what the UI shows)
export type AppliedTheme = 'light' | 'dark';

/**
 * Get the saved theme preference from localStorage
 */
export function getThemePreference(): ThemeOption {
  if (typeof localStorage === 'undefined') return 'system';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

/**
 * Save theme preference to localStorage
 */
export function setThemePreference(theme: ThemeOption): void {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): AppliedTheme {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get the applied theme based on the preference
 */
export function getAppliedTheme(preference: ThemeOption = getThemePreference()): AppliedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply theme to the document by toggling 'dark' class on <html>
 */
export function applyTheme(preference: ThemeOption = getThemePreference()): void {
  if (typeof document === 'undefined') return;

  const applied = getAppliedTheme(preference);
  const html = document.documentElement;

  // Check for reduced motion preference
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    // Instant switch for reduced motion preference
    html.classList.toggle('dark', applied === 'dark');
  } else {
    // Add transition class for smooth theme change
    html.classList.add('theme-transition');
    html.classList.toggle('dark', applied === 'dark');

    // Remove transition class after animation completes
    setTimeout(() => {
      html.classList.remove('theme-transition');
    }, 300);
  }
}

/**
 * Initialize theme on app load - call this in the root layout
 */
export function initializeTheme(): void {
  if (typeof window === 'undefined') return;

  // Apply the saved theme preference
  applyTheme();

  // Listen for system theme changes when preference is 'system'
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', () => {
    const preference = getThemePreference();
    if (preference === 'system') {
      applyTheme('system');
    }
  });
}
