# Responsive Design Quick Reference

## 🚀 Quick Start

### Essential Breakpoints

```
xs:   360px  (Mobile)
sm:   640px  (Mobile Landscape)
md:   768px  (Tablet)
lg:   1024px (Tablet Landscape)
xl:   1280px (Desktop)
2xl:  1536px (Large Desktop)
3xl:  1920px (Full HD)
4xl:  2560px (Ultra-wide)
```

### Most Used Classes

#### Containers

```html
<div class="container-responsive">
  <!-- Auto-adjusts padding & max-width -->
</div>
```

#### Responsive Text

```html
<p class="text-responsive-base">Scales beautifully</p>
<span class="text-responsive-sm">Medium text</span>
<small class="text-responsive-xs">Small text</small>
```

#### Responsive Grid

```html
<!-- 1 col mobile → 2 tablet → 3 desktop → 4 large -->
<div class="grid-responsive-1 sm:grid-responsive-2 lg:grid-responsive-3 xl:grid-responsive-4">
  <div>Item</div>
</div>
```

#### Responsive Images

```html
<img src="/photo.jpg" class="img-responsive" alt="Photo" />
```

## 🎨 Common Patterns

### Hide/Show by Screen Size

```html
<!-- Show only on mobile -->
<div class="block md:hidden">Mobile only</div>

<!-- Show only on desktop -->
<div class="hidden md:block">Desktop only</div>

<!-- Show only on tablet -->
<div class="hidden md:block lg:hidden">Tablet only</div>
```

### Responsive Spacing

```html
<div class="p-4 md:p-6 lg:p-8 xl:p-12">Padding grows with screen size</div>

<div class="mt-2 md:mt-4 lg:mt-8">Margin grows with screen size</div>
```

### Responsive Text Size

```html
<h1 class="text-2xl md:text-4xl xl:text-6xl">Heading scales up</h1>
```

### Responsive Layout

```html
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-2/3">Main</div>
  <div class="w-full lg:w-1/3">Sidebar</div>
</div>
```

## ✅ Testing Checklist

### Run Tests

```bash
npm test responsive                    # All responsive tests
npm test viewport.integration.test    # Viewport tests
npm test components.responsive.test   # Component tests
```

### Manual Testing

- [ ] Test on mobile (360px - 767px)
- [ ] Test on tablet (768px - 1023px)
- [ ] Test on desktop (1024px - 1919px)
- [ ] Test on ultra-wide (1920px+)
- [ ] Test portrait & landscape
- [ ] Verify no horizontal scroll
- [ ] Check touch targets (min 44x44px)
- [ ] Verify text is readable (min 14px)

## 🎯 Quick Fixes

### Horizontal Overflow

```css
/* Add to component */
overflow-x: hidden;
max-width: 100%;
```

### Small Touch Targets

```css
min-width: 44px;
min-height: 44px;
padding: 12px;
```

### Tiny Text

```html
<!-- Use responsive classes -->
<p class="text-responsive-base">Auto-scaling text</p>
```

### Fixed Width Issues

```html
<!-- ❌ Bad -->
<div style="width: 1200px">
  <!-- ✅ Good -->
  <div class="w-full max-w-screen-xl"></div>
</div>
```

## 📱 Test Utilities

```typescript
import {
  setScreenSize,
  testAcrossScreenSizes,
  getCurrentBreakpoint,
} from '@/__tests__/utils/viewport-test-utils'

// Set viewport to mobile
setScreenSize('mobile')

// Test across all sizes
testAcrossScreenSizes(size => {
  // Your test here
})

// Check current breakpoint
const bp = getCurrentBreakpoint() // Returns 'xs', 'sm', 'md', etc.
```

## 🔧 Common Use Cases

### Responsive Navigation

```tsx
<nav>
  {/* Mobile menu */}
  <button className="md:hidden">☰</button>

  {/* Desktop menu */}
  <div className="hidden md:flex gap-4">
    <a href="/properties">Properties</a>
    <a href="/projects">Projects</a>
  </div>
</nav>
```

### Responsive Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <div key={item.id} className="card">
      <img src={item.image} className="img-responsive" />
      <h3 className="text-responsive-sm">{item.title}</h3>
    </div>
  ))}
</div>
```

### Responsive Hero

```tsx
<section className="hero">
  <div className="container-responsive">
    <h1 className="text-3xl md:text-5xl xl:text-7xl">Big Headline</h1>
    <p className="text-responsive-base">Subtitle text</p>
  </div>
</section>
```

## 📚 Learn More

See [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) for complete documentation.

---

💡 **Pro Tip:** Always test on real devices when possible!
