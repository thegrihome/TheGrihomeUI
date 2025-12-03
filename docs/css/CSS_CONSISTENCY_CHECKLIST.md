# CSS Consistency Checklist for Grihome

## Common CSS Patterns to Enforce

### 1. Forum Pages Standard Layout

All forum pages should follow this pattern:

#### Header Section

```css
.forum-header {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.1);
}
```

#### Title & Subtitle Spacing

- **Title**: `font-size: 1.25rem`, `font-weight: 600`, `margin-bottom: 0.0625rem`
- **Subtitle**: `margin-top: 0.5rem`, `font-size: 0.75rem`, `color: #6b7280`

#### Icon & Text Alignment

- Use `align-items: center` for horizontal alignment
- Icon size: `4rem` for large icons
- Gap between icon and text: `1rem`

#### Stats Summary

- Display: `flex`, `gap: 0.5rem`, `margin-top: 0.5rem`
- Use separator: `<span className="forum-stat-separator">•</span>`

### 2. Header Navigation Alignment

All header elements should align at the bottom:

```css
.desktop-nav {
  align-items: flex-end;
}

.desktop-nav-links {
  align-items: flex-end;
}

.auth-section {
  align-items: flex-end;
}

.header-logo {
  align-items: flex-end;
  align-self: flex-end;
}
```

**DO NOT** use inline Tailwind classes like `flex items-center` on these elements as they override CSS.

### 3. Font Size Consistency

#### Forum Pages

- **Main Title**: `1.25rem` (all city names, category names)
- **Subtitle**: `0.75rem`
- **Stats**: `0.9rem`

#### Header

- **Logo Text**: `1.5rem`
- **Nav Links**: `0.9375rem` to `1rem` (responsive)
- **Buttons**: `0.875rem`

## Pages to Review

### Forum Pages

- [ ] `/pages/forum/index.tsx` - Main forum page
- [ ] `/pages/forum/category/general-discussions.tsx` - General discussions listing
- [ ] `/pages/forum/category/general-discussions/[city].tsx` - City-specific pages (e.g., Goa)
- [ ] `/pages/forum/category/general-discussions/[city]/[propertyType].tsx` - Property type pages
- [ ] `/pages/forum/category/general-discussions/states.tsx` - States listing
- [ ] `/pages/forum/category/[slug].tsx` - Generic category page
- [ ] `/pages/forum/thread/[slug].tsx` - Thread detail page
- [ ] `/pages/forum/search.tsx` - Search results
- [ ] `/pages/forum/user/[userId].tsx` - User profile

### Other Pages

- [ ] Header component - `/components/Header.tsx`
- [ ] Footer component - `/components/Footer.tsx`
- [ ] Properties pages - `/pages/properties/*`
- [ ] Projects pages - `/pages/projects/*`
- [ ] Builders pages - `/pages/builders/*`

## Verification Steps

### 1. Visual Inspection

For each page:

1. Check title and subtitle spacing (0.5rem gap)
2. Check icon and text alignment (horizontally centered)
3. Check stats have separator dots (•)
4. Check font sizes match the standard (1.25rem for titles)

### 2. Header Alignment Test

1. Open any page
2. Check that bottom of all text elements align:
   - GRIHOME logo text
   - Buy, Rent, Projects, Forum, Contact Us links
   - "Post property for free" button text
   - Welcome/username text
   - Sign in/Sign up button text

### 3. Code Review Checklist

Check each page file for:

```tsx
// ❌ BAD - Inline classes override CSS
<div className="desktop-nav-links flex items-center">

// ✅ GOOD - Let CSS handle it
<div className="desktop-nav-links">
```

Check for consistent class usage:

```tsx
// Title and subtitle pattern
<h1 className="forum-title">{title}</h1>
<p className="forum-subtitle">{subtitle}</p>

// Stats pattern
<div className="forum-stats-summary">
  <span className="forum-stat">{count1} items</span>
  <span className="forum-stat-separator">•</span>
  <span className="forum-stat">{count2} categories</span>
</div>

// Icon and text alignment
<div className="forum-city-header-section">
  <div className="forum-city-icon-large">🏛️</div>
  <div>
    <h1 className="forum-title">Title</h1>
    <div className="forum-stats-summary">...</div>
  </div>
</div>
```

## Common Issues & Fixes

### Issue 1: Elements Not Aligned Horizontally

**Problem**: Title appears at top instead of center with icon

**Fix**: Change `align-items: flex-start` to `align-items: center`

```css
.forum-city-header-section {
  align-items: center; /* NOT flex-start */
}
```

### Issue 2: Title and Subtitle Too Close

**Problem**: No spacing between title and subtitle

**Fix**: Add margin-top to subtitle

```css
.forum-subtitle {
  margin-top: 0.5rem;
}
```

### Issue 3: Header Items Top-Aligned

**Problem**: Logo and nav items align at top instead of bottom

**Fix**:

1. Use `align-items: flex-end` in CSS
2. Remove inline `flex items-center` from JSX

### Issue 4: Inconsistent Font Sizes

**Problem**: City names have different sizes on different pages

**Fix**: Standardize to 1.25rem for all titles

```css
.forum-title,
.forum-city-name {
  font-size: 1.25rem;
  font-weight: 600;
}
```

## Testing Script

Run this to find potential issues:

```bash
# Find inline Tailwind classes that might override CSS
grep -r "className.*flex items-center" pages/

# Find inconsistent font sizes in forum CSS
grep -r "font-size" styles/pages/forum/

# Check for missing forum-stat-separator
grep -L "forum-stat-separator" pages/forum/**/*.tsx
```

## CSS Organization Rules

1. **Use CSS files, not inline styles**: All styling should be in `.css` files
2. **Avoid Tailwind overrides**: Don't use inline Tailwind for layout that's in CSS
3. **Consistent class naming**: Follow existing patterns (`forum-*`, `header-*`)
4. **Responsive design**: Use media queries in CSS, not conditional Tailwind classes
5. **Component-specific styles**: Keep styles scoped to components

## Quick Fix Commands

### Remove all inline flex alignment from forum pages:

```bash
# Search and review first
grep -n "className.*desktop-nav.*flex items" components/Header.tsx
grep -n "className.*auth-section.*flex items" components/Header.tsx

# Manual fix required - update JSX to remove inline classes
```

### Standardize forum title spacing:

Already fixed in `/styles/pages/forum/index.css`

## Maintenance

When adding new pages:

1. Copy layout from existing working page
2. Use established class names from `/styles/pages/forum/index.css`
3. Don't create new classes unless absolutely necessary
4. Test on all screen sizes (mobile, tablet, desktop, ultrawide)
5. Verify alignment with existing pages before committing
