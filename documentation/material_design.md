# Material Design in React Native

This document provides guidance on how to integrate Material Design components using React Native Paper.

## Installation

```bash
npx expo install react-native-paper react-native-safe-area-context
```

## Basic Setup

### 1. Configure the Provider in app/_layout.tsx

```typescript
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Define custom themes
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac4',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BB86FC',
    secondary: '#03DAC6',
  },
};

export default function RootLayout() {
  // Determine which theme to use
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
```

### 2. Create a Material Design Component

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  Switch,
  FAB,
  Divider,
  List,
  Chip,
  useTheme,
} from 'react-native-paper';

const MaterialExample = () => {
  const [text, setText] = useState('');
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Material Design Example" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
          <Card.Content>
            <Title>Material Design</Title>
            <Paragraph>
              This is an example of Material Design components using React Native Paper.
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button>Cancel</Button>
            <Button mode="contained">Ok</Button>
          </Card.Actions>
        </Card>

        {/* More components... */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // More styles...
});

export default MaterialExample;
```

## Dark Mode Toggle Implementation

For implementing a dark mode toggle, refer to the `theme_management.md` documentation.

## Available Components

React Native Paper provides many Material Design components:

- Appbar
- Button
- Card
- Checkbox
- Chip
- Dialog
- FAB
- List
- Menu
- Modal
- RadioButton
- Searchbar
- Switch
- TextInput
- And many more...

For a complete list and usage examples, visit the [React Native Paper documentation](https://callstack.github.io/react-native-paper/). 