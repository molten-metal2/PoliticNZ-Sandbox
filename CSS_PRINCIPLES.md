# CSS Principles - PoliticNZ

This document outlines the key principles and guidelines we follow for styling the PoliticNZ application.

## Core Philosophy

**Keep it lean.** Our CSS is intentionally minimal, including only what's necessary for functionality and clean presentation.

## Design Principles

### 1. Minimalism First
- Write only the CSS that's needed
- Avoid unnecessary decorations or complex effects
- Prefer simple, clean designs over elaborate styling

### 2. System Fonts
- Use native system font stacks for optimal performance and familiar UX
- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`
- No custom web fonts to reduce load time

### 3. Simple Color Palette
- **Background**: `#f5f5f5` (light gray)
- **Primary**: `#1a73e8` (blue) for CTAs and links
- **Text**: `#333` (dark gray) for body text
- **Secondary text**: `#666` (medium gray) for metadata
- **Borders**: `#ddd` (light gray)
- **Error/Delete**: `#c00` (red) and variations
- **White cards**: `#fff` for content containers

### 4. Responsive & Mobile-First
- Center-aligned containers with `max-width: 600px` for optimal readability
- Padding: `0 15px` for mobile breathing room
- Flexible layouts using flexbox
- No media queries needed for basic functionality

### 5. Consistent Spacing
- Card padding: `15px`
- Element gaps: `8px`, `15px`, `20px` (increments for hierarchy)
- Margin between cards: `15px` (posts), `20px` (create post)
- Border radius: `4px` (buttons/inputs), `8px` (cards)

### 6. Subtle Interactions
- Hover states on all interactive elements
- Smooth transitions: `transition: background-color 0.2s`
- Disabled states with reduced opacity and `cursor: not-allowed`
- Visual feedback for actions (liked posts, delete hover)

### 7. Accessibility
- Clear focus states with `border-color: #1a73e8`
- Remove default outlines but replace with visible alternatives
- Sufficient color contrast for text readability
- Cursor hints: `pointer` for clickable, `not-allowed` for disabled

### 8. Component-Based Structure
- Each UI component has isolated, well-named classes
- No deeply nested selectors
- Organized by sections with clear comments
- Reusable patterns across the application

### 9. Naming Conventions
- Descriptive, semantic class names
- BEM-inspired but simplified (e.g., `.post-card`, `.post-header`, `.post-actions`)
- State classes: `.liked`, `.disabled`
- Avoid generic names like `.container` or `.box`

### 10. Performance
- Minimal CSS file size
- No complex animations or transforms
- Hardware-accelerated properties only when needed
- Cache-busting via query string versioning (`?v=2.0.0`)

## File Organization

CSS is organized in logical sections:
1. **Reset and Base Styles** - Global resets and body styles
2. **Navbar** - Navigation component
3. **Main Content** - Page layout containers
4. **Feed Container** - Feed-specific layout
5. **Create Post Card** - Post creation UI
6. **Post Cards** - Individual post styling
7. **Post Interactions** - Like/comment buttons
8. **Edit Form** - Inline editing components
9. **Comments Preview** - Comment preview styling
10. **States** - Loading, error, empty states

## Version Management

- CSS files use query string versioning: `styles.css?v=2.0.0`
- Increment version when CSS changes to bust browser cache
- Keep version consistent across all HTML files

## Don't Do

- ❌ Add unnecessary animations or transitions
- ❌ Use complex CSS frameworks or preprocessors
- ❌ Create deeply nested selectors (max 2-3 levels)
- ❌ Include unused styles "just in case"
- ❌ Use !important (except in rare edge cases)
- ❌ Add vendor prefixes unless absolutely necessary
- ❌ Create overly specific selectors

## Testing

Before committing CSS changes:
1. Test in Chrome, Firefox, and Safari
2. Verify mobile responsiveness
3. Check all interactive states (hover, focus, disabled)
4. Ensure accessibility with keyboard navigation
5. Update version number in all HTML files

