# Theme Management in React Native Paper

## Dark Mode Toggle Implementation

This project implements a theme toggle system using React Native Paper and React Context. Here's how it works:

### 1. Theme Context

The theme context is defined in `app/_layout.tsx` and provides:
- `isDarkMode`: Boolean indicating if dark mode is active
- `toggleTheme`: Function to switch between light and dark themes

```typescript
// Create and export the theme context
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Custom hook for easy access to theme functions
export const useThemeToggle = () => useContext(ThemeContext);
```

### 2. Using the Theme Toggle

In any component, you can access the theme toggle functionality:

```typescript
import { useThemeToggle } from '../app/_layout';

function MyComponent() {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  
  return (
    <View>
      <Text>Current theme: {isDarkMode ? 'Dark' : 'Light'}</Text>
      <Switch value={isDarkMode} onValueChange={toggleTheme} />
    </View>
  );
}
```

### 3. Accessing Theme Colors

React Native Paper provides a `useTheme` hook to access the current theme colors:

```typescript
import { useTheme } from 'react-native-paper';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        This text uses theme colors
      </Text>
    </View>
  );
}
```

### 4. Theme Customization

You can customize both light and dark themes in `app/_layout.tsx`:

```typescript
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    // Add custom colors here
  }
};

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#BB86FC',
    accent: '#03DAC6',
    // Add custom colors here
  }
};
```

### 5. Troubleshooting Theme Issues

#### "Cannot read property 'colors' of undefined" Error

If you encounter this error, it usually means the theme object is not properly initialized. Here are some solutions:

1. **Define theme objects outside the component**:
   ```typescript
   // Define these outside your component
   const lightTheme = {
     ...MD3LightTheme,
     colors: {
       ...MD3LightTheme.colors,
       primary: '#6200ee',
       // other colors
     },
   };
   
   const darkTheme = {
     ...MD3DarkTheme,
     colors: {
       ...MD3DarkTheme.colors,
       primary: '#BB86FC',
       // other colors
     },
   };
   
   // Then in your component
   const theme = isDarkMode ? darkTheme : lightTheme;
   ```

2. **Add fallback values when accessing theme properties**:
   ```typescript
   // Use optional chaining and fallback values
   const backgroundColor = theme?.colors?.background || '#f6f6f6';
   ```

3. **Ensure you're using the correct theme imports**:
   ```typescript
   // For React Native Paper v5+
   import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
   
   // For older versions
   import { DefaultTheme, DarkTheme } from 'react-native-paper';
   ``` 