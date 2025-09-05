# Premium Investment Platform Design System

## Visual Identity

### Color Palette
- **Primary Dark**: #0A0A1A (Luxury Dark)
- **Secondary Dark**: #121228 (Deep Space)
- **Accent Gold**: #FFD700 (Royal Gold)
- **Accent Blue**: #4169E1 (Royal Blue)
- **Success**: #00C853 (Emerald)
- **Warning**: #FFAB00 (Amber)
- **Error**: #FF1744 (Ruby)
- **Text Primary**: #FFFFFF (Pure White)
- **Text Secondary**: #B0B0C0 (Silver)
- **Card Background**: rgba(25, 25, 45, 0.7) (Translucent Navy)

### Typography
- **Primary Font**: Poppins (Modern Sans-serif for UI elements)
- **Secondary Font**: Playfair Display (Elegant Serif for headings)
- **Font Weights**: 
  - Light: 300
  - Regular: 400
  - Medium: 500
  - Semi-bold: 600
  - Bold: 700

### Spacing System
- **XXS**: 4px
- **XS**: 8px
- **SM**: 12px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **XXL**: 48px

### Border Radius
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 24px
- **XXL**: 32px

### Shadows
- **Subtle**: 0 2px 8px rgba(0, 0, 0, 0.1)
- **Elevated**: 0 4px 16px rgba(0, 0, 0, 0.15)
- **Float**: 0 8px 32px rgba(0, 0, 0, 0.2)
- **Glow**: 0 0 15px rgba(255, 215, 0, 0.3)

## UI Components

### Buttons
- **Primary**: Gold gradient background with dark text
- **Secondary**: Translucent dark background with gold border
- **Tertiary**: Text-only buttons with gold text
- **States**: 
  - Default: Base style
  - Hover: Slight scale up (1.05x) and glow effect
  - Active: Pressed state with inset shadow
  - Disabled: 50% opacity

### Cards
- **Base**: Translucent dark background with glassmorphism effect
- **Border**: 1px solid rgba(255, 215, 0, 0.2)
- **Shadow**: Float shadow
- **Radius**: LG (16px)
- **Padding**: MD (16px)

### Input Fields
- **Background**: rgba(30, 30, 50, 0.5)
- **Border**: 1px solid rgba(255, 255, 255, 0.1)
- **Focus**: Gold border with glow effect
- **Radius**: MD (12px)
- **Padding**: SM (12px)

### Navigation
- **Bottom Nav**: Translucent dark bar with glassmorphism
- **Tabs**: Gold indicator for active state
- **Icons**: Consistent line weight and rounded corners

## Micro-interactions

### Animations
- **Page Transitions**: Fade with slight vertical movement
- **Button Press**: Subtle scale down (0.95x)
- **Card Hover**: Gentle lift and glow
- **Loading**: Custom shimmer with gold gradient
- **Success/Error**: Subtle pulse effect

### Feedback
- **Haptic Feedback**: For all primary interactions
- **Visual Feedback**: Immediate state changes
- **Audio Feedback**: Optional subtle sound for transactions

## Mobile-First Design Principles

### Layout
- **Grid System**: 4-column grid for mobile, 8-column for tablet, 12-column for desktop
- **Safe Areas**: Respect device notches and curved edges
- **Touch Targets**: Minimum 48px for all interactive elements

### Navigation
- **Bottom Navigation**: Primary actions within thumb reach
- **Floating Action Button**: Key action always accessible
- **Swipe Gestures**: For common actions (back, refresh)

### Responsive Breakpoints
- **Mobile**: 0px - 768px
- **Tablet**: 769px - 1024px
- **Desktop**: 1025px+

## Premium Design Elements

### Visual Hierarchy
- **Headings**: Playfair Display with gold accent
- **Body Text**: Poppins for readability
- **Emphasis**: Gold color for important elements
- **Contrast**: Sufficient for accessibility

### Iconography
- **Style**: Linear icons with consistent stroke width
- **Size**: 24px default, scalable based on context
- **Color**: Gold for primary, white for secondary

### Data Visualization
- **Charts**: Minimalist with gold and blue accents
- **Progress Indicators**: Animated with gradient fill
- **Status Indicators**: Color-coded with appropriate icons

## Accessibility

### Color Contrast
- All text meets WCAG 2.1 AA standards
- Gold text on dark background with proper contrast ratio

### Typography
- Minimum 16px for body text
- Clear hierarchy with appropriate sizing
- Proper line height for readability

### Interaction
- Focus states for keyboard navigation
- Sufficient touch target sizes
- Clear visual feedback for all actions