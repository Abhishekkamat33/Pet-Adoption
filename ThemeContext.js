import React, { createContext, useState, useContext } from 'react';

// Create a context with default value set to light mode
const ThemeContext = createContext();

// Provider component that will provide theme state to the entire app
export const ThemeProvider = ({ children }) => {
  // State for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle function for dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevState => !prevState);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext in other components
export const useTheme = () => useContext(ThemeContext);
