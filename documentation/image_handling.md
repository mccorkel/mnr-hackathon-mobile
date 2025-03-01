# Image Handling in React Native

## Best Practices for Images in React Native Paper

### 1. Using Card.Cover Component

The `Card.Cover` component in React Native Paper is used to display images in cards. Here's how to use it effectively:

```typescript
// Basic usage
<Card.Cover source={{ uri: 'https://example.com/image.jpg' }} />

// With error handling
const [imageError, setImageError] = useState(false);

{!imageError ? (
  <Card.Cover 
    source={{ uri: 'https://example.com/image.jpg' }} 
    onError={() => setImageError(true)}
  />
) : (
  <Card.Cover source={require('../assets/images/placeholder.png')} />
)}
```

### 2. Reliable Image Sources

When using remote images, consider these reliable sources:

- Picsum Photos: `https://picsum.photos/700` - Simple placeholder images that work well for testing
- Unsplash: `https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=700`
- React Native docs: `https://reactnative.dev/img/tiny_logo.png`
- Your own CDN or image hosting service

#### Note on Picsum Photos

Picsum Photos (`https://picsum.photos/`) is a simple service that provides random placeholder images. It's great for development and testing, but occasionally might have connectivity issues. If you're experiencing issues with images not loading, you might want to:

1. Try a different size: `https://picsum.photos/500` instead of `https://picsum.photos/700`
2. Use a specific image ID: `https://picsum.photos/id/237/700/500`
3. Add a cache-busting parameter: `https://picsum.photos/700?random=1`

### 3. Image Caching

For better performance, consider using an image caching library:

```bash
npx expo install expo-image
```

Then use it in your components:

```typescript
import { Image } from 'expo-image';

// In your component
<Image
  style={styles.image}
  source="https://example.com/image.jpg"
  placeholder={blurhash}
  contentFit="cover"
  transition={1000}
/>
```

### 4. Image Dimensions

Always specify dimensions for your images to prevent layout shifts:

```typescript
<Card.Cover 
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ height: 200 }}
/>
```

### 5. Troubleshooting Image Issues

If images aren't loading:

1. Check the URL in a browser to ensure it's valid
2. Verify network connectivity
3. Add error handling with onError
4. Use a placeholder image as fallback
5. Check if the image source requires authentication 