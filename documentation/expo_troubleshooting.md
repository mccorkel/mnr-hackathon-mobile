# Expo Troubleshooting Guide

## Hot Reloading Issues

If hot reloading/hot swapping isn't working in Expo Go:

1. **Clear Metro Bundler Cache**
   ```
   npx expo start -c
   ```

2. **Check Expo Go Version**
   Make sure your Expo Go app is up to date and compatible with your project's SDK version.

3. **Restart Expo Go**
   Completely close Expo Go and reopen it.

4. **Check Network Connection**
   Ensure your development machine and device are on the same network.

5. **Disable VPN or Firewall**
   VPNs or firewalls might block the WebSocket connection needed for hot reloading.

6. **Use Tunnel Connection**
   If on different networks, try using tunnel connection:
   ```
   npx expo start --tunnel
   ```

7. **Check for Infinite Loops**
   Review your code for infinite loops or components that constantly re-render.

8. **Create a Development Build**
   If issues persist, create a development build:
   ```
   npx expo install expo-dev-client
   npx expo prebuild
   npx expo run:android  # or run:ios
   ```

## Common Error Messages

- **"Unable to resolve module..."**: Run `npx expo install [missing-package]`
- **"Cannot connect to Metro"**: Restart Metro with `npx expo start -c`
- **"Network response timed out"**: Check your network connection or use tunnel mode

## Debugging Tools

- Enable Remote Debugging from the Dev Menu
- Use React DevTools: `npm install -g react-devtools`
- Check Metro Bundler logs in your terminal

Remember: Always use `npx expo` instead of the deprecated `expo-cli` commands.

## Vector Icons Font Issues

If you encounter this error:
```
Error: [ios.xcodeproj]: withIosXcodeprojBaseMod: ENOENT: no such file or directory, stat '/path/to/node_modules/react-native-vector-icons/MaterialIcons.ttf'
```

Try one of these solutions:

1. **Update font paths in app.json**:
   ```json
   "plugins": [
     [
       "expo-font",
       {
         "fonts": [
           "./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf",
           "./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"
         ]
       }
     ]
   ]
   ```

2. **Create a local fonts directory**:
   ```bash
   mkdir -p assets/fonts
   cp node_modules/react-native-vector-icons/Fonts/MaterialIcons.ttf assets/fonts/
   cp node_modules/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf assets/fonts/
   ```
   
   Then update app.json to use these local fonts:
   ```json
   "plugins": [
     [
       "expo-font",
       {
         "fonts": [
           "./assets/fonts/MaterialIcons.ttf",
           "./assets/fonts/MaterialCommunityIcons.ttf"
         ]
       }
     ]
   ]
   ```

3. **Use Expo's built-in vector icons**:
   Instead of importing from 'react-native-vector-icons', use:
   ```javascript
   import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
   ```
   This approach doesn't require any font configuration in app.json. 

## Multiple Commands Produce Error

If you encounter this error:
```
error: Multiple commands produce '/path/to/DerivedData/app-name/Build/Products/Debug-iphonesimulator/app-name.app/MaterialIcons.ttf'
```

This happens when the same font files are being included from multiple sources. Try these solutions:

1. **Remove duplicate font configurations**:
   - Remove the expo-font plugin from app.json if you're using @expo/vector-icons
   - Make sure you're not including the same fonts in multiple places

2. **Use Expo's vector icons exclusively**:
   ```javascript
   import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
   ```
   
3. **Clean the build**:
   ```bash
   npx expo prebuild --clean
   ```
   
4. **Clear Xcode's derived data**:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ``` 

## Persistent Font Duplication Errors

If you're still encountering font duplication errors after trying the basic solutions:

1. **Create a react-native.config.js file**:
   ```javascript
   module.exports = {
     dependencies: {
       'react-native-vector-icons': {
         platforms: {
           ios: null,
           android: null,
         },
       },
     },
     assets: [],
   };
   ```

2. **Perform a complete clean**:
   ```bash
   # Clean everything
   npx expo prebuild --clean
   rm -rf ~/Library/Developer/Xcode/DerivedData
   rm -rf node_modules
   npm install
   
   # Try building again
   npx expo run:ios
   ```

3. **Check for conflicting packages**:
   Some packages might include their own copies of these fonts. Check your package.json for any UI libraries that might include Material icons. 

## Simplest Solution for Font Duplication Errors

If you're not actually using the vector icons directly in your code:

1. **Remove all vector icon imports**:
   ```javascript
   // Remove these imports if you're not using them directly
   import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
   import Icon from 'react-native-vector-icons/MaterialIcons';
   ```

2. **Keep using React Native Paper components**:
   React Native Paper will handle the icons internally without requiring you to import them directly.

This is often the simplest solution when you're using a UI library like React Native Paper that already manages its own icons. 

## Missing RCTThirdPartyFabricComponentsProvider.mm Error

If you encounter this error:
```
error: Build input file cannot be found: '/path/to/node_modules/react-native/React/Fabric/RCTThirdPartyFabricComponentsProvider.mm'
```

This is related to React Native's Fabric architecture. Add the following to your Podfile's post_install hook:

```ruby
# Fix for missing RCTThirdPartyFabricComponentsProvider.mm file
fabric_components_path = File.join(config[:reactNativePath], "React/Fabric")
third_party_provider_file = File.join(fabric_components_path, "RCTThirdPartyFabricComponentsProvider.mm")

unless File.exist?(third_party_provider_file)
  File.open(third_party_provider_file, 'w') do |f|
    f.write(<<~CONTENT
      #import "RCTThirdPartyFabricComponentsProvider.h"

      namespace facebook {
      namespace react {

      void ThirdPartyFabricComponentsProvider::registerThirdPartyComponents() {
        // Add third-party component registrations here
      }

      } // namespace react
      } // namespace facebook
    CONTENT
    )
  end
  puts "Created missing RCTThirdPartyFabricComponentsProvider.mm file"
end
```

Then run:
```bash
npx pod-install
npx expo run:ios
```

## Development Build Issues

If you encounter this error:
```
CommandError: No development build (com.example.myapp) for this project is installed. Please make and install a development build on the device first.
```

You need to create a development build before you can run the app on your device or simulator:

### Method 1: Local Development Build

```bash
# Install the dev client
npx expo install expo-dev-client

# Create a development build for iOS
npx expo prebuild
cd ios
pod install
cd ..
npx expo run:ios

# Create a development build for Android
npx expo prebuild
npx expo run:android
```

### Method 2: EAS Build (Cloud-based)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure EAS Build
eas build:configure

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

After the build completes, you can install it on your device by scanning the QR code or downloading the build from the Expo website.

### Troubleshooting Development Builds

1. **Clean the project before rebuilding**:
   ```bash
   npx expo prebuild --clean
   ```

2. **Check your app.json configuration**:
   Make sure your bundle identifier/package name is correctly set in app.json.

3. **Verify signing configuration** (for iOS):
   Check that your Apple Developer account is properly set up if building for a physical iOS device. 