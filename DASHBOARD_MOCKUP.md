# Premium Investment Platform - User Dashboard Mockup

## Layout Structure

```
+-------------------------------------------------------+
|  Status Bar (Time, Battery, Network)                 |
+-------------------------------------------------------+
|                                                       |
|  [User Avatar]    Welcome Back, John!                 |
|  Premium Member                                       |
|                                                       |
|  +-----------------------------------------------+   |
|  |                                               |   |
|  |        ₹12,560.75                             |   |
|  |        Wallet Balance                         |   |
|  |                                               |   |
|  |  [↑ ₹240 Today]  [↗ 12% This Month]           |   |
|  |                                               |   |
|  |  [View Transaction History]                   |   |
|  |                                               |   |
|  +-----------------------------------------------+   |
|                                                       |
|  Active Investments (2)                              |
|  +-----------------------------------------------+   |
|  |  [Gold Plan]                          [Active]  |   |
|  |  ₹5,000 • 25 Days Left • ₹250/day             |   |
|  |  [Progress: ██████████░░░░ 80%]               |   |
|  |                                               |   |
|  +-----------------------------------------------+   |
|                                                       |
|  +-----------------------------------------------+   |
|  |  [Platinum Plan]                      [Active]  |   |
|  |  ₹3,500 • 18 Days Left • ₹200/day             |   |
|  |  [Progress: ████████░░░░░░ 60%]               |   |
|  |                                               |   |
|  +-----------------------------------------------+   |
|                                                       |
|  Quick Actions                                   [+]  |
|  +--------+  +---------+  +---------+  +---------+   |
|  |  📋    |  |   💳    |  |   💸    |  |   🔗    |   |
|  |Products|  |Recharge |  |Withdraw |  | Referral|   |
|  +--------+  +---------+  +---------+  +---------+   |
|                                                       |
|  Market Insights                                      |
|  +-----------------------------------------------+   |
|  |  Market is bullish today!                         |
|  |  High-performing plans showing +3.2% returns      |
|  |  [View Recommendations]                           |
|  +-----------------------------------------------+   |
|                                                       |
|  +-----------------------------------------------+   |
|  |  [🔒] Platform Security                           |
|  |  Your investments are protected with bank-grade   |
|  |  encryption and regulatory compliance.            |
|  |  [Learn More]                                     |
|  +-----------------------------------------------+   |
|                                                       |
+-------------------------------------------------------+
|  [🏠 Home]  [📋 Products]  [💰 Wallet]  [👤 Profile]  |
+-------------------------------------------------------+
|  [+] Floating Action Button (Recharge)                |
+-------------------------------------------------------+
```

## Visual Design Elements

### Color Scheme
- **Background**: Deep space gradient (#0A0A1A to #121228)
- **Cards**: Translucent dark panels with glassmorphism effect
- **Accents**: Royal gold (#FFD700) for highlights and CTAs
- **Text**: White (#FFFFFF) for primary, silver (#B0B0C0) for secondary

### Typography
- **Welcome Text**: Playfair Display Bold, 24px
- **Balance Amount**: Poppins ExtraBold, 32px
- **Labels**: Poppins Medium, 14px
- **Body Text**: Poppins Regular, 16px

### Icons & Illustrations
- **Custom Icon Set**: Minimalist line icons with 2px stroke
- **Illustrations**: Abstract geometric shapes with gradient fills
- **Animations**: Micro-interactions on hover/tap

### Interactive Elements

#### Wallet Card
- Animated balance counter on load
- "Today" and "This Month" badges with subtle pulse animation
- Gradient border that responds to balance changes

#### Investment Cards
- Progress bars with animated fill
- Status indicators with color coding
- Expandable details with smooth transition

#### Quick Action Buttons
- Circular buttons with iconography
- Gold border with inner glow on hover
- Subtle scale animation on press

#### Bottom Navigation
- Translucent bar with blurred background
- Active tab indicator with gold gradient
- Haptic feedback on tap

## Micro-interactions

### Loading States
- Skeleton screens for cards with shimmer animation
- Custom spinner with gold/royal blue gradient
- Progress indicators for data fetching

### Feedback Animations
- Success checkmark animation for transactions
- Error shake animation for form validation
- Toast notifications with slide-in effect

### Page Transitions
- Fade transition with vertical movement
- Shared element transitions between related views
- Parallax effect on scrolling

## Premium Features Highlight

### Personalization
- Custom dashboard widgets based on user behavior
- Investment recommendations with AI-powered insights
- Personal achievement badges and milestones

### Security Indicators
- Real-time security status in the header
- Encryption badges with verification animations
- Two-factor authentication prompts

### Social Proof
- Community performance metrics
- Leaderboard of top investors
- Testimonials with user avatars

### Exclusive Content
- Premium market analysis
- Educational resources for investors
- Early access to new investment plans

## Responsive Adaptations

### Tablet View
- Split-screen layout with sidebar navigation
- Larger cards with more detailed information
- Multi-column investment listings

### Desktop View
- Full-width dashboard with expanded widgets
- Advanced filtering and sorting options
- Detailed charts and analytics panels

## Accessibility Features

### Visual
- High contrast mode toggle
- Text size adjustment options
- Colorblind-friendly palette

### Navigation
- Keyboard shortcuts for power users
- Voice commands integration
- Screen reader optimized content

### Interaction
- Reduced motion settings
- Clear focus indicators
- Alternative input methods support

## Animation Specifications

### Timing Functions
- **Entrances**: cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **Exits**: cubic-bezier(0.55, 0.085, 0.68, 0.53)
- **Standard**: cubic-bezier(0.455, 0.03, 0.515, 0.955)

### Durations
- **Micro-interactions**: 150ms
- **Page transitions**: 300ms
- **Complex animations**: 500ms

### Easing
- **Bounce**: For success states
- **Smooth**: For general transitions
- **Sharp**: For error states