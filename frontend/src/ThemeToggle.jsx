// Shared dark/light toggle used across the user app, admin, and landing nav.
import { useSyncExternalStore } from 'react';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { subscribe, getTheme, toggleTheme } from './theme';
import './theme-toggle.css';

export default function ThemeToggle({ className = '' }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <IoSunnyOutline /> : <IoMoonOutline />}
    </button>
  );
}
