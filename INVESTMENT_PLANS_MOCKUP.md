# Premium Investment Platform - Investment Plans Mockup

## Layout Structure

```
+-------------------------------------------------------+
|  Status Bar (Time, Battery, Network)                 |
+-------------------------------------------------------+
|                                                       |
|  ← [Investment Plans]                            [?]  |
|                                                       |
|  +-----------------------------------------------+   |
|  |  [🔍 Search Plans] [📊 Filter] [⭐ Recommended] |   |
|  +-----------------------------------------------+   |
|                                                       |
|  Beginner Plans (3)                                   |
|  +-----------------------------------------------+   |
|  |  [Starter Plan]                           ₹490  |   |
|  |  [Beginner]                                   |   |
|  |  ₹80/day • 9 Days • ₹230 Profit               |   |
|  |  [Progress: 720/720]                          |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
|  +-----------------------------------------------+   |
|  |  [Smart Saver]                            ₹750  |   |
|  |  [Beginner]                                   |   |
|  |  ₹85/day • 14 Days • ₹440 Profit              |   |
|  |  [Progress: 0/1190]                           |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
|  Intermediate Plans (2)                               |
|  +-----------------------------------------------+   |
|  |  [Bronze Booster]                        ₹1,000 |   |
|  |  [Intermediate]                               |   |
|  |  ₹100/day • 15 Days • ₹500 Profit             |   |
|  |  [Progress: 0/1500]                           |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
|  +-----------------------------------------------+   |
|  |  [Silver Growth]                         ₹1,500 |   |
|  |  [Intermediate]                               |   |
|  |  ₹115/day • 20 Days • ₹800 Profit             |   |
|  |  [Progress: 0/2300]                           |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
|  Advanced Plans (2)                                   |
|  +-----------------------------------------------+   |
|  |  [Gold Income]                           ₹2,000 |   |
|  |  [Advanced]                                   |   |
|  |  ₹135/day • 23 Days • ₹1,105 Profit           |   |
|  |  [Progress: 0/3105]                           |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
|  +-----------------------------------------------+   |
|  |  [Platinum Plan]                         ₹2,500 |   |
|  |  [Advanced]                                   |   |
|  |  ₹160/day • 24 Days • ₹1,340 Profit           |   |
|  |  [Progress: 0/3840]                           |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
|  Premium Plans (4)                                    |
|  +-----------------------------------------------+   |
|  |  [Elite Earning]                         ₹3,000 |   |
|  |  [Premium]                                    |   |
|  |  ₹180/day • 25 Days • ₹1,500 Profit           |   |
|  |  [Progress: 0/4500]                           |   |
|  |  +-------------------------------------------+ |   |
|  |  |  [Purchase Plan]                          | |   |
|  |  +-------------------------------------------+ |   |
|  +-----------------------------------------------+   |
|                                                       |
+-------------------------------------------------------+
|  [🏠 Home]  [📋 Products]  [💰 Wallet]  [👤 Profile]  |
+-------------------------------------------------------+
|  [+] Floating Action Button (Recharge)                |
+-------------------------------------------------------+
```

## Visual Design Elements

### Color Scheme by Category
- **Beginner**: Emerald Green (#00C853) accents
- **Intermediate**: Royal Blue (#4169E1) accents
- **Advanced**: Purple (#7B1FA2) accents
- **Premium**: Gold (#FFD700) accents

### Card Design
- **Category Header**: Full-width banner with category color
- **Plan Card**: Translucent dark background with glassmorphism
- **Border**: 1px solid rgba(255, 255, 255, 0.1)
- **Shadow**: Subtle float shadow with category-colored glow on hover

### Typography
- **Plan Name**: Poppins SemiBold, 18px
- **Category Tag**: Poppins Bold, 12px with category color
- **Price**: Poppins ExtraBold, 24px with gold accent
- **Details**: Poppins Regular, 14px
- **Profit**: Poppins Medium, 16px with success color

### Progress Visualization
- **Track**: Dark background with category-colored fill
- **Fill**: Animated gradient matching category color
- **Label**: Current/Total values in gold
- **Animation**: Smooth fill animation on load

## Interactive Elements

### Category Headers
- Expand/collapse animation
- Chevron icon rotation
- Subtle background highlight on tap

### Plan Cards
- 3D tilt effect on hover (desktop)
- Gentle scale animation on press
- Detailed view expansion with smooth transition
- Purchase button with pulse animation for available plans

### Search & Filter
- Animated search bar expansion
- Filter dropdown with fade-in effect
- Chip-based selection with bounce animation

### Purchase Flow
- Modal overlay with backdrop blur
- Step-by-step wizard with progress indicator
- Confirmation animation with confetti effect

## Micro-interactions

### Hover States
- Card lift effect with shadow intensification
- Button glow with category-colored light
- Text color transition to gold

### Tap States
- Ripple effect originating from touch point
- Subtle scale down animation
- Haptic feedback for physical response

### Loading States
- Shimmer animation on plan cards
- Skeleton screens for dynamic content
- Animated spinner with gradient colors

### Success States
- Checkmark animation for completed purchases
- Balance update counter animation
- Toast notification with slide-up effect

## Premium Features

### Plan Recommendations
- AI-powered suggestions based on user profile
- "Recommended" badge with star icon
- Personalized messaging in plan descriptions

### Comparison Tool
- Side-by-side plan comparison
- Highlighting differences with color coding
- Interactive sliders for custom duration calculations

### Performance Visualization
- Historical return charts for each plan
- Risk indicators with visual metaphors
- Comparison to market benchmarks

### Educational Content
- Tooltip explanations for financial terms
- Video tutorials accessible from each plan
- FAQ section with expandable answers

## Responsive Adaptations

### Tablet View
- Two-column grid for plan cards
- Expanded filter sidebar
- Detailed plan view without modal

### Desktop View
- Three-column grid for optimal use of space
- Advanced filtering with multiple criteria
- Comparison table view option
- Detailed analytics dashboard

## Accessibility Features

### Visual
- High contrast mode for all plan cards
- Text scaling options for plan details
- Colorblind-safe palette variations

### Navigation
- Keyboard navigation for all plan cards
- Screen reader optimized content structure
- Focus indicators for interactive elements

### Interaction
- Reduced motion settings for animations
- Alternative input methods support
- Clear error messaging for purchase restrictions

## Animation Specifications

### Card Interactions
- **Hover**: 300ms transform with cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **Press**: 150ms scale with cubic-bezier(0.55, 0.085, 0.68, 0.53)
- **Expand**: 400ms height with cubic-bezier(0.455, 0.03, 0.515, 0.955)

### Progress Animations
- **Fill**: 1000ms linear for accurate timing
- **Text Counter**: 800ms with ease-out for natural feel
- **Pulse**: Infinite 2s ease-in-out for attention

### Purchase Flow
- **Modal Entry**: 300ms fade with backdrop blur
- **Step Transition**: 250ms slide with fade
- **Confirmation**: 500ms bounce for celebratory effect