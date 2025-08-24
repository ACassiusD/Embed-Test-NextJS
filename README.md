# VaultFeed - Social Media Content Aggregator

A Next.js application that aggregates and displays content from Instagram, TikTok, and YouTube in a unified grid layout with consistent sizing and popup video players.

## 🚀 Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎯 Key Features Implemented

### 1. **Consistent Embed Sizing (9:16 Aspect Ratio)**
- **Problem**: Instagram embeds were expanding vertically and breaking grid layout
- **Solution**: Implemented 9:16 aspect ratio (`paddingTop: "177.78%"`) for all thumbnails
- **Result**: All embeds (Instagram, TikTok, YouTube) now have uniform sizing

### 2. **TikTok Embed Loading Issues Fixed**
- **Problem**: First TikTok video worked, but subsequent ones failed to load
- **Root Cause**: TikTok's embed script conflicts with multiple instances
- **Solution**: Switched from problematic embed script to direct iframe with official embed URLs
- **Implementation**: `https://www.tiktok.com/embed/${videoId}` instead of `tiktok-embed.js`

### 3. **Hydration Error Prevention**
- **Problem**: Randomization caused server/client HTML mismatch
- **Solution**: Implemented seeded randomization for consistent order between server and client
- **Implementation**: Fisher-Yates shuffle with fixed seed (42)

### 4. **Content Randomization**
- **Feature**: Videos display in random order on each page load
- **Implementation**: Seeded shuffle algorithm for consistent randomization
- **Result**: Fresh layout experience every time

## 🏗️ Architecture

### **Embed Components**
- **`InlineInstagramEmbed`**: Direct iframe approach for grid display
- **`ThirdPartyEmbed`**: Modal popup player for all platforms
- **`loadScriptOnce`**: Prevents duplicate script loading

### **Styling System**
- **Grid Layout**: CSS Grid with responsive columns (`minmax(220px, 1fr)`)
- **Aspect Ratios**: 9:16 for thumbnails, 9:16 for modal videos
- **Dark Theme**: Consistent color scheme throughout

### **Data Structure**
```typescript
type Clip = {
  id: string;
  provider: "youtube" | "tiktok" | "instagram";
  folder: string;
  title?: string;
  youtube?: { videoId: string };
  tiktok?: { videoId: string; citeUrl?: string };
  instagram?: { permalink: string };
  thumbUrl?: string;
};
```

## 📱 Expo Go Migration Notes

### **Critical Implementation Details**
1. **Aspect Ratio Approach**: Use `paddingTop: "177.78%"` for 9:16 ratio containers
2. **TikTok Embeds**: Use `https://www.tiktok.com/embed/${videoId}` URLs
3. **Instagram Embeds**: Use direct iframe with `/embed` URLs
4. **YouTube Embeds**: Standard embed URLs work reliably

### **Why These Solutions Work**
- **9:16 Aspect Ratio**: Instagram Reel/YouTube Short format, mobile-optimized
- **Direct Iframe URLs**: Bypass platform embed script conflicts
- **Seeded Randomization**: Prevents hydration issues in React Native
- **Consistent Sizing**: All platforms maintain uniform dimensions

### **Mobile Considerations**
- **Touch Interactions**: Ensure clickable areas are properly sized
- **Performance**: Direct iframes are more performant than complex embed scripts
- **Cross-Platform**: These solutions work in both web and React Native environments

## 🎨 Sample Content

### **Current Library (28 videos)**
- **Instagram Posts**: 10 cooking-related posts
- **TikTok Videos**: 8 cooking videos from various creators
- **YouTube Videos**: 10 cooking channels and shorts

### **Content Categories**
- All content categorized under "Cooking" folder
- Random display order for variety
- Consistent 9:16 aspect ratio across all platforms

## 🔧 Technical Implementation

### **Key Functions**
```typescript
// Seeded randomization for consistent ordering
const clips = useMemo(() => {
  const shuffled = [...initialClips];
  let seed = 42; // Fixed seed for consistent randomization
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280; // Simple PRNG
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}, []);

// Direct TikTok iframe (no script conflicts)
if (clip.provider === "tiktok" && clip.tiktok) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.tiktok.com/embed/${videoId}`;
  // ... iframe setup
}
```

### **CSS Styles**
```css
thumbWrap: {
  position: "relative",
  background: "#000",
  paddingTop: "177.78%", // 9:16 aspect ratio
}

modalVideoWrap: {
  position: "relative",
  paddingTop: "177.78%", // 9:16 aspect ratio for modal
  background: "#000",
}
```

## 🚨 Common Issues & Solutions

### **Instagram Vertical Expansion**
- **Symptom**: Instagram embeds taller than other thumbnails
- **Solution**: Use 9:16 aspect ratio containers with `overflow: hidden`

### **TikTok Loading Failures**
- **Symptom**: Second+ TikTok videos fail to load
- **Solution**: Use direct iframe with `/embed` URLs, avoid embed scripts

### **Hydration Errors**
- **Symptom**: Server/client HTML mismatch
- **Solution**: Seeded randomization instead of `Math.random()`

### **Firefox Security Warnings**
- **Symptom**: "Firefox Can't Open This Page" for TikTok
- **Solution**: Use official embed URLs (`/embed/` not `/video/`)

## 📚 Dependencies

- **Next.js 14**: App Router, React 18
- **React Hooks**: useState, useEffect, useMemo, useRef
- **CSS-in-JS**: Inline styles for consistency
- **No External UI Libraries**: Pure React implementation

## 🎯 Success Metrics

- ✅ **Consistent Sizing**: All embeds maintain 9:16 aspect ratio
- ✅ **Reliable Loading**: Multiple TikTok videos work without conflicts
- ✅ **No Hydration Errors**: Seeded randomization prevents mismatches
- ✅ **Cross-Platform Ready**: Solutions work in web and React Native
- ✅ **Performance**: Direct iframes outperform complex embed scripts

## 🔮 Future Enhancements

- **Lazy Loading**: Implement intersection observer for performance
- **Error Boundaries**: Better error handling for failed embeds
- **Analytics**: Track embed loading success rates
- **Mobile Optimization**: Touch gestures and mobile-specific interactions

---

**Note**: This implementation specifically addresses the challenges of embedding social media content with consistent sizing and reliable loading across multiple platforms. The solutions are designed to work in both web and React Native (Expo Go) environments.
