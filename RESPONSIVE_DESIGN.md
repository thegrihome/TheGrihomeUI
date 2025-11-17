# Responsive Design System Documentation

## Overview

TheGrihomeUI implements a comprehensive responsive design system that ensures optimal viewing experience across all devices from small mobile phones (360px) to ultra-wide displays (2560px+).

## 📱 Supported Screen Sizes

### Mobile Devices
| Breakpoint | Min Width | Description | Common Devices |
|------------|-----------|-------------|----------------|
| **xs** | 360px | Small mobile | iPhone SE, Galaxy S |
| **sm** | 640px | Mobile landscape | iPhone 12/13 landscape |

### Tablet Devices
| Breakpoint | Min Width | Description | Common Devices |
|------------|-----------|-------------|----------------|
| **md** | 768px | Tablet portrait | iPad Mini, iPad Air |
| **lg** | 1024px | Tablet landscape | iPad Pro 11" |

### Desktop Devices
| Breakpoint | Min Width | Description | Common Devices |
|------------|-----------|-------------|----------------|
| **xl** | 1280px | Desktop | MacBook Air, Standard monitors |
| **2xl** | 1536px | Large desktop | MacBook Pro 16", Large monitors |

### Ultra-Wide Displays
| Breakpoint | Min Width | Description | Common Devices |
|------------|-----------|-------------|----------------|
| **3xl** | 1920px | Full HD | 1080p monitors |
| **4xl** | 2560px | 2K/Ultra-wide | 1440p monitors, Ultra-wide displays |

## 🎨 Tailwind Configuration

The responsive system is configured in `tailwind.config.js`:

```javascript
screens: {
  'xs': '360px',    // Small mobile
  'sm': '640px',    // Mobile landscape
  'md': '768px',    // Tablet portrait
  'lg': '1024px',   // Tablet landscape
  'xl': '1280px',   // Desktop
  '2xl': '1536px',  // Large desktop
  '3xl': '1920px',  // Full HD
  '4xl': '2560px',  // 2K/Ultra-wide
}
```

## 🛠️ Responsive Utilities

### Container Classes

#### `.container-responsive`
Adaptive container that adjusts padding and max-width based on screen size:

- **xs-sm**: 100% width, 1rem padding
- **md**: 768px max-width, 2rem padding
- **lg**: 1024px max-width, 2.5rem padding
- **xl**: 1280px max-width, 3rem padding
- **2xl**: 1536px max-width, 4rem padding
- **3xl**: 1920px max-width, 5rem padding
- **4xl**: 2560px max-width, 6rem padding

**Usage:**
```html
<div class="container-responsive">
  <!-- Content automatically adjusts to screen size -->
</div>
```

### Typography Classes

#### `.text-responsive-xs`
Small text that scales with viewport:
- Mobile: 0.75rem (12px)
- Desktop: 0.875rem (14px)
- Large: 1rem (16px)

#### `.text-responsive-sm`
Medium text that scales with viewport:
- Mobile: 0.875rem (14px)
- Desktop: 1rem (16px)
- Large: 1.125rem (18px)

#### `.text-responsive-base`
Base text that scales with viewport:
- Mobile: 1rem (16px)
- Desktop: 1.125rem (18px)
- Large Desktop: 1.25rem (20px)
- Full HD: 1.5rem (24px)

**Usage:**
```html
<p class="text-responsive-base">This text scales beautifully!</p>
```

### Grid Classes

#### Responsive Grid System
```html
<!-- 1 column on mobile, 2 on tablet, 3 on desktop, 4 on large displays -->
<div class="grid-responsive-1 sm:grid-responsive-2 lg:grid-responsive-3 xl:grid-responsive-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

#### Individual Grid Classes
- `.grid-responsive-1`: Single column (all sizes)
- `.grid-responsive-2`: 2 columns (640px+)
- `.grid-responsive-3`: 3 columns (1024px+)
- `.grid-responsive-4`: 4 columns (1536px+)
- `.grid-responsive-6`: 6 columns (2560px+)

### Image Classes

#### `.img-responsive`
Ensures images never exceed container width:
```html
<img src="/photo.jpg" alt="Photo" class="img-responsive" />
```

#### `.img-cover-responsive`
Makes images fill their container while maintaining aspect ratio:
```html
<img src="/background.jpg" alt="BG" class="img-cover-responsive" />
```

#### `.img-contain-responsive`
Fits entire image within container:
```html
<img src="/logo.png" alt="Logo" class="img-contain-responsive" />
```

## 📱 Safe Area Support

For devices with notches (iPhone X and newer):

```html
<header class="safe-top">
  <!-- Respects safe area at top of screen -->
</header>

<footer class="safe-bottom">
  <!-- Respects safe area at bottom of screen -->
</footer>
```

## 🎯 Tailwind Responsive Modifiers

Use standard Tailwind modifiers with our custom breakpoints:

```html
<!-- Hide on mobile, show on tablet -->
<div class="hidden md:block">Desktop content</div>

<!-- Full width on mobile, half on desktop -->
<div class="w-full lg:w-1/2">Responsive width</div>

<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col lg:flex-row">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- Responsive padding -->
<div class="p-4 lg:p-8 3xl:p-12">
  Content with growing padding
</div>

<!-- Responsive text size -->
<h1 class="text-2xl md:text-4xl xl:text-6xl 3xl:text-8xl">
  Huge Heading
</h1>
```

## 🧪 Testing Responsive Designs

### Test Utilities

Import viewport testing utilities:

```typescript
import {
  setScreenSize,
  testAcrossScreenSizes,
  testAcrossCommonDevices,
  assertElementIsResponsive,
  assertTextIsReadable,
  assertTouchTargetIsAdequate,
} from '@/__tests__/utils/viewport-test-utils'
```

### Example Test

```typescript
describe('MyComponent Responsive', () => {
  it('renders on all screen sizes', () => {
    testAcrossScreenSizes((screenSize, dimensions) => {
      setScreenSize(screenSize)
      const { container } = render(<MyComponent />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  it('maintains responsive layout', () => {
    setScreenSize('mobile')
    const { container } = render(<MyComponent />)
    const element = container.querySelector('.container-responsive')
    assertElementIsResponsive(element!)
  })

  it('has readable text on mobile', () => {
    setScreenSize('mobile-small')
    const { container } = render(<MyComponent />)
    const text = container.querySelector('p')
    assertTextIsReadable(text!)
  })
})
```

### Run Tests

```bash
# Run all responsive tests
npm test responsive

# Run specific responsive test file
npm test responsive.test.tsx

# Run with coverage
npm test responsive -- --coverage
```

## 📋 Common Responsive Patterns

### 1. Mobile-First Navigation

```tsx
<header className="header">
  {/* Mobile menu button - hidden on desktop */}
  <button className="mobile-menu-button md:hidden">
    ☰
  </button>

  {/* Desktop nav - hidden on mobile */}
  <nav className="hidden md:flex desktop-nav">
    <a href="/properties">Properties</a>
    <a href="/projects">Projects</a>
  </nav>
</header>
```

### 2. Responsive Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
  {items.map(item => (
    <div key={item.id} className="card">
      <img src={item.image} className="img-responsive" />
      <h3 className="text-responsive-sm">{item.title}</h3>
    </div>
  ))}
</div>
```

### 3. Responsive Hero Section

```tsx
<section className="hero">
  <div className="container-responsive">
    <h1 className="text-3xl md:text-5xl xl:text-7xl 3xl:text-9xl font-bold">
      Find Your Dream Home
    </h1>
    <p className="text-responsive-base mt-4">
      Browse thousands of properties
    </p>
  </div>
</section>
```

### 4. Responsive Form Layout

```tsx
<form className="container-responsive">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input type="text" placeholder="First Name" />
    <input type="text" placeholder="Last Name" />
  </div>
  <input type="email" placeholder="Email" className="w-full mt-4" />
  <button className="w-full md:w-auto mt-4 px-8 py-3">
    Submit
  </button>
</form>
```

### 5. Responsive Sidebar Layout

```tsx
<div className="flex flex-col lg:flex-row gap-6">
  {/* Main content - full width on mobile, 2/3 on desktop */}
  <main className="w-full lg:w-2/3">
    <h1 className="text-responsive-base">Main Content</h1>
  </main>

  {/* Sidebar - full width on mobile, 1/3 on desktop */}
  <aside className="w-full lg:w-1/3">
    <div className="bg-gray-100 p-4">Sidebar</div>
  </aside>
</div>
```

## ⚡ Performance Considerations

### 1. Image Optimization

Always use responsive images with proper sizing:

```tsx
<img 
  src="/property.jpg"
  srcSet="/property-320.jpg 320w,
          /property-640.jpg 640w,
          /property-1280.jpg 1280w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
  className="img-responsive"
  alt="Property"
/>
```

### 2. Lazy Loading

Enable lazy loading for off-screen content:

```tsx
<img src="/image.jpg" loading="lazy" className="img-responsive" />
```

### 3. Responsive Loading

Load different components based on screen size:

```tsx
const isMobile = window.innerWidth < 768

return isMobile ? <MobileComponent /> : <DesktopComponent />
```

## 🎯 Accessibility Guidelines

### 1. Touch Targets

Ensure minimum 44x44px touch targets on mobile:

```css
.btn-mobile {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}
```

### 2. Readable Text

Maintain minimum 14px font size:

```css
body {
  font-size: 16px; /* Base size */
}

@media (max-width: 640px) {
  body {
    font-size: 14px; /* Minimum readable size */
  }
}
```

### 3. Contrast Ratios

Ensure WCAG AAA compliance:
- Normal text: 7:1 ratio
- Large text: 4.5:1 ratio

### 4. Focus Indicators

Make focus visible on all devices:

```css
button:focus,
a:focus {
  outline: 2px solid #4F46E5;
  outline-offset: 2px;
}
```

## 🐛 Common Issues & Solutions

### Issue 1: Horizontal Overflow

**Problem:** Content extends beyond viewport width

**Solution:**
```css
html, body {
  overflow-x: hidden;
  width: 100%;
}

* {
  max-width: 100%;
}
```

### Issue 2: Fixed Width Elements

**Problem:** Fixed pixel widths break on mobile

**Solution:**
```css
/* ❌ Bad */
.container {
  width: 1200px;
}

/* ✅ Good */
.container {
  width: 100%;
  max-width: 1200px;
}
```

### Issue 3: Small Touch Targets

**Problem:** Buttons too small to tap on mobile

**Solution:**
```css
@media (max-width: 768px) {
  button, a {
    min-width: 44px;
    min-height: 44px;
    padding: 12px;
  }
}
```

### Issue 4: Tiny Text on Mobile

**Problem:** Text too small to read

**Solution:**
```html
<!-- Use responsive text utilities -->
<p class="text-responsive-base">Readable on all devices</p>
```

## 📱 Device Testing Checklist

Test your designs on these common viewports:

- [ ] iPhone SE (375×667)
- [ ] iPhone 12/13 (390×844)
- [ ] iPhone 14 Pro Max (430×932)
- [ ] iPad Mini (768×1024)
- [ ] iPad Pro 11" (834×1194)
- [ ] iPad Pro 12.9" (1024×1366)
- [ ] MacBook Air (1280×800)
- [ ] MacBook Pro 16" (1728×1117)
- [ ] Desktop 1080p (1920×1080)
- [ ] Desktop 1440p (2560×1440)
- [ ] Desktop 4K (3840×2160)

## 🔧 Browser DevTools Tips

### Chrome DevTools

1. **Toggle Device Toolbar:** `Ctrl/Cmd + Shift + M`
2. **Responsive Mode:** Select "Responsive" from device dropdown
3. **Custom Dimensions:** Enter specific width/height
4. **Throttling:** Test on slow networks

### Firefox DevTools

1. **Responsive Design Mode:** `Ctrl/Cmd + Shift + M`
2. **Device Selector:** Choose from preset devices
3. **DPR Simulation:** Test retina displays

### Safari DevTools

1. **Enter Responsive Design Mode:** Develop → Enter Responsive Design Mode
2. **User Agent:** Test different device user agents

## 📚 Additional Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)

## 🎓 Best Practices

1. **Mobile-First:** Start with mobile styles, enhance for larger screens
2. **Test Early:** Test responsive behavior during development
3. **Use Relative Units:** Prefer %, rem, em over px
4. **Optimize Images:** Use appropriate image sizes for each breakpoint
5. **Progressive Enhancement:** Ensure basic functionality on all devices
6. **Touch-Friendly:** Make interactive elements easy to tap
7. **Performance:** Minimize layout shifts and reflows
8. **Accessibility:** Maintain usability for all users

---

**Last Updated:** November 2024  
**Version:** 1.0.0
