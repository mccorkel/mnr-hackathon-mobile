# Expo Router Guide

## Understanding the File Structure

Expo Router uses a file-based routing system similar to Next.js:

- **App.tsx**: The entry point that initializes the app and providers
- **app/_layout.tsx**: Defines the root layout for all screens
- **app/(tabs)/_layout.tsx**: Defines the tab navigation layout
- **app/(tabs)/index.tsx**: The default screen that loads when the app starts

## Navigation Flow

1. When the app starts, it loads `App.tsx` first
2. Expo Router then takes over and loads the file structure in the `app/` directory
3. It first looks for `_layout.tsx` files to set up the navigation structure
4. Then it renders the appropriate screen based on the current route (starting with `index.tsx`)

## Common Patterns

### Tab Navigation

```
app/
  (tabs)/
    _layout.tsx  # Tab navigator configuration
    index.tsx    # First tab
    profile.tsx  # Second tab
```

### Stack Navigation

```
app/
  (stack)/
    _layout.tsx  # Stack navigator configuration
    index.tsx    # First screen
    details.tsx  # Details screen
```

### Nested Navigation

```
app/
  (tabs)/
    _layout.tsx
    index.tsx
    profile/
      _layout.tsx  # Nested stack within the profile tab
      index.tsx    # Profile main screen
      edit.tsx     # Profile edit screen
```

## Using with UI Libraries

When using UI libraries like React Native Paper:

1. Set up providers in `app/_layout.tsx`
2. Use components in your screen files
3. For theming, define your theme in `app/_layout.tsx` 