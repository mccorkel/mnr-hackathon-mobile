/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * TigerCare theme colors for light and dark modes
 */

const tintColorLight = '#FF7A5A';  // Coral
const tintColorDark = '#FF7A5A';   // Keep coral in dark mode

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#5F4B8B',
    tabIconDefault: '#9D89BC',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9D89BC',
    tabIconDefault: '#6F5B9B',
    tabIconSelected: tintColorDark,
  },
};
