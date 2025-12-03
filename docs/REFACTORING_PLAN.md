# Codebase Refactoring Plan

## Executive Summary

This plan outlines a comprehensive refactoring of the Grihome codebase to make it leaner, easier to maintain, and better organized. The plan is designed with a phased approach to minimize risk to the production system.

---

## Phase 1: Cleanup Unnecessary Files (Low Risk)

### 1.1 Delete Development/One-time Scripts

**Files to Delete:**

- `dev-builder-data.sql` - Development SQL data (can be regenerated)
- `scripts/add-states-forum-categories.js` - One-time migration script
- `scripts/init-ad-slots.js` - One-time initialization script
- `scripts/init-forum-categories.js` - One-time initialization script
- `scripts/update-ad-pricing.ts` - One-time update script
- `scripts/update-builder-addresses.ts` - One-time update script
- `scripts/update-builder-description.js` - One-time update script
- `scripts/update-myhome-apas-description.ts` - One-time update script
- `scripts/add-myhome-apas.ts` - One-time data script
- `scripts/add-myhome-apas-all-images.ts` - One-time data script

**Rationale:** These are one-time migration/seed scripts that have already run. They add no value to the production codebase and can be archived in git history.

**Verification:** Check git history to confirm these scripts have been run.

### 1.2 Delete Temporary Build Artifacts

**Files to Delete:**

- `tsconfig.tsbuildinfo` - TypeScript incremental build info (regenerated)

**Note:** Keep `.next/` in `.gitignore` as it should already be.

---

## Phase 2: Consolidate Documentation (Low Risk)

### 2.1 Create Documentation Folder

**New Structure:**

```
docs/
├── README.md (main project README)
├── setup/
│   ├── ENV_SETUP.md
│   ├── DEPLOYMENT.md
│   └── PROJECT_SETUP_SUMMARY.md
├── responsive/
│   ├── RESPONSIVE_DESIGN.md
│   ├── RESPONSIVE_QUICK_REFERENCE.md
│   ├── RESPONSIVE_IMPLEMENTATION_SUMMARY.md
│   ├── RESPONSIVE_FILES_CREATED.md
│   └── TESTING_RESPONSIVE_GUIDE.md
├── css/
│   ├── CSS_CONSISTENCY_CHECKLIST.md
│   ├── HEADER_ICONS_FIX.md
│   ├── HEADER_LAYOUT_FIX.md
│   ├── IPAD_ICON_FIX.md
│   ├── MOBILE_HEADER_ALIGNMENT_FIX.md
│   ├── MOBILE_MENU_TEXT_FIX.md
│   └── EMOJI_CLIPPING_FIX.md
└── features/
    └── AD_SYSTEM_README.md
```

**Files to Move:**

- All `*.md` files from root (except README.md, CLAUDE.md)
- `__tests__/README.md` → `docs/testing/README.md`

**Keep in Root:**

- `README.md` - Main project README
- `CLAUDE.md` - AI assistant instructions (required in root)

---

## Phase 3: CSS Organization (Medium Risk)

### 3.1 Remove Inline Styles

**Files with Inline Styles to Fix:**

1. `pages/properties/[id].tsx` - line 585
2. `pages/projects/[id].tsx`
3. `pages/properties/index.tsx`
4. `pages/properties/edit/[id].tsx`
5. `pages/properties/add-property.tsx`
6. `pages/projects/submit.tsx`
7. `pages/projects/edit/[id].tsx`
8. `pages/forum/new-post.tsx`
9. `pages/index.tsx` - lines 413, 430, 447

**Approach:**

- Identify all inline styles
- Create appropriate CSS classes in existing CSS files
- Replace inline styles with Tailwind classes or CSS classes
- Verify mobile/desktop rendering after each change

### 3.2 CSS Module Cleanup

**Current CSS Modules:**

- `styles/pages/projects/detail.module.css`
- `styles/pages/properties/my-properties.module.css`

**Decision:** Keep CSS modules for now (already working), but ensure consistency.

### 3.3 CSS Structure Verification

Current structure is good:

```
styles/
├── components/
│   ├── Header.css
│   └── Footer.css
├── pages/
│   ├── auth/
│   ├── contactUs/
│   ├── forum/
│   ├── projects/
│   └── properties/
└── globals.css
```

---

## Phase 4: Component Reusability (Medium Risk)

### 4.1 Current Component Analysis

**Well-Organized Components (Keep as-is):**

- `components/auth/CountryCodeDropdown.tsx` - Reusable
- `components/properties/PropertyCard.tsx` - Reusable
- `components/properties/PropertyMap.tsx` - Reusable
- `components/properties/ExpressInterestButton.tsx` - Reusable
- `components/projects/ImageUploader.tsx` - Reusable
- `components/projects/DynamicList.tsx` - Reusable
- `components/projects/BuilderSelector.tsx` - Reusable
- `components/forum/UserStats.tsx` - Reusable
- `components/forum/ForumSearch.tsx` - Reusable
- `components/forum/ContentRenderer.tsx` - Reusable
- `components/common/SimpleRichTextEditor.tsx` - Reusable

**Components to Potentially Create:**

- `components/common/LoadingSpinner.tsx` - Extract from Header.tsx (line 23-36)
- `components/common/CustomDropdown.tsx` - Standard dropdown pattern used across pages
- `components/common/Pagination.tsx` - Used in multiple listing pages

### 4.2 Move Root-Level Components

**Current:**

- `components/GrihomeLogo.tsx` - Keep in root (used by Header)
- `components/Header.tsx` - Keep in root (global)
- `components/Footer.tsx` - Keep in root (global)

---

## Phase 5: Test Optimization (High Impact)

### 5.1 Current State

- **Total Test Files:** 133
- **Total Test Lines:** 77,288+
- **Largest Test Files:** Several over 1,000 lines

### 5.2 Optimization Strategy

**A. Enable Parallel Test Execution:**
Update `jest.config.js`:

```javascript
module.exports = {
  // ... existing config
  maxWorkers: '50%', // Use 50% of available CPUs
  testTimeout: 10000, // Keep current timeout
}
```

**B. Add Test Sharding for CI:**

```json
// package.json scripts
"test:ci": "jest --ci --coverage --maxWorkers=2 --shard=1/4"
```

**C. Consolidate Redundant Tests:**

- Review comprehensive test files (e.g., `Header-comprehensive.test.tsx` vs `Header.test.tsx`)
- Merge or remove duplicate coverage

**D. Add Coverage to Default Test Command:**
Update `package.json`:

```json
"test": "jest --coverage",
```

**E. Remove Slow/Redundant Test Patterns:**

- Review responsive tests (`__tests__/responsive/`) - may be overkill
- Review if all 133 test files are necessary

### 5.3 Responsive Test Consideration

The responsive tests (`__tests__/responsive/`) total 3 files testing CSS utilities. These are useful but may be slow. Options:

1. Keep as-is (thorough but slow)
2. Move to a separate test suite: `npm run test:responsive`
3. Simplify to critical paths only

---

## Phase 6: Folder Structure Improvements (Low Risk)

### 6.1 Current Structure Assessment

**Good:**

- `pages/` follows Next.js conventions
- `components/` properly organized by feature
- `lib/` has clear subfolders
- `styles/` mirrors page structure

**Improvements:**

- Create `docs/` folder for documentation
- Consider `scripts/archived/` for keeping script history (optional)

### 6.2 Proposed Final Structure

```
TheGrihomeUI/
├── .claude/           # Claude Code config
├── .github/           # GitHub workflows
├── .husky/            # Git hooks
├── __mocks__/         # Jest mocks
├── __tests__/         # Test files (mirror source structure)
├── components/        # React components
│   ├── auth/
│   ├── common/        # Shared components (new)
│   ├── forum/
│   ├── projects/
│   └── properties/
├── docs/              # Documentation (new)
├── lib/               # Utilities and database
│   ├── cockroachDB/
│   └── utils/
├── pages/             # Next.js pages
│   ├── api/
│   ├── auth/
│   ├── forum/
│   ├── properties/
│   └── projects/
├── prisma/            # Database schema
├── public/            # Static assets
├── styles/            # CSS files
│   ├── components/
│   └── pages/
├── types/             # TypeScript types
├── CLAUDE.md          # AI instructions (keep in root)
├── README.md          # Project README
└── [config files]     # package.json, tsconfig, etc.
```

---

## Execution Order (Recommended)

1. **Phase 1** - Delete unnecessary scripts (immediate, low risk)
2. **Phase 2** - Consolidate documentation (same session, low risk)
3. **Phase 5.2.D** - Add coverage to test command (quick win)
4. **Phase 5.2.A** - Enable parallel tests (quick win)
5. **Phase 3.1** - Remove inline styles (one file at a time, verify)
6. **Phase 4.1** - Extract common components (one at a time)
7. **Phase 5.3** - Optimize responsive tests (if needed)

---

## Verification Checklist

After each phase:

- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No lint errors
- [ ] Run `npm run format:check` - Formatting correct
- [ ] Run `npm test` - All tests pass
- [ ] Manual verification of CSS on mobile/tablet/desktop
- [ ] Git commit with descriptive message

---

## Risk Assessment

| Phase             | Risk Level | Rollback Ease              |
| ----------------- | ---------- | -------------------------- |
| 1. Delete Scripts | Low        | Git restore                |
| 2. Move Docs      | Low        | Git restore                |
| 3. CSS Cleanup    | Medium     | Git restore, visual verify |
| 4. Components     | Medium     | Git restore                |
| 5. Tests          | Low        | Git restore                |
| 6. Structure      | Low        | Git restore                |

---

## Success Criteria

1. ✓ All unnecessary scripts deleted (10 files)
2. ✓ Documentation consolidated in `docs/` folder
3. ✓ No inline styles in TSX files
4. ✓ Tests run in under 2 minutes with coverage
5. ✓ All tests pass
6. ✓ CSS works on mobile, tablet, desktop
7. ✓ No TypeScript or lint errors
8. ✓ Clean, maintainable folder structure
