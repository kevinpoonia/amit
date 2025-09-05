# Premium Investment Platform - UI Component Library

## Core Components

### 1. Glassmorphism Cards

#### Structure
```
<div class="premium-card">
  <div class="card-content">
    <!-- Card content here -->
  </div>
</div>
```

#### CSS Implementation
```css
.premium-card {
  background: rgba(25, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.premium-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 215, 0, 0.4);
}
```

#### Usage Examples
- Dashboard summary cards
- Investment plan displays
- Transaction history items
- User profile sections

### 2. Gradient Buttons

#### Structure
```
<button class="gradient-button">
  <span>Call to Action</span>
</button>
```

#### CSS Implementation
```css
.gradient-button {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0a1a;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.gradient-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(255, 215, 0, 0.5);
}

.gradient-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 15px rgba(255, 215, 0, 0.3);
}

.gradient-button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -60%;
  width: 20px;
  height: 200%;
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(30deg);
  transition: all 0.6s;
}

.gradient-button:hover::after {
  left: 120%;
}
```

#### Variants
- Primary (gold gradient)
- Secondary (royal blue gradient)
- Tertiary (translucent with border)

### 3. Animated Progress Indicators

#### Structure
```
<div class="progress-container">
  <div class="progress-track">
    <div class="progress-fill" style="width: 75%"></div>
  </div>
  <div class="progress-label">75% Complete</div>
</div>
```

#### CSS Implementation
```css
.progress-container {
  width: 100%;
  margin: 16px 0;
}

.progress-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4169e1, #6a8dff);
  border-radius: 6px;
  transition: width 1s cubic-bezier(0.22, 0.61, 0.36, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-label {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #b0b0c0;
  text-align: right;
  margin-top: 8px;
}
```

#### Usage Examples
- Investment plan progress
- Profile completion
- Transaction status
- Loading indicators

### 4. Floating Action Button (FAB)

#### Structure
```
<button class="fab">
  <span>+</span>
</button>
```

#### CSS Implementation
```css
.fab {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0a1a;
  border: none;
  font-size: 32px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 100;
}

.fab:hover {
  transform: scale(1.1) translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.6);
}

.fab:active {
  transform: scale(0.95) translateY(1px);
}
```

#### Behavior
- Fixed positioning for easy access
- Haptic feedback on tap
- Smooth scaling animations
- Shadow enhancements on interaction

### 5. Bottom Navigation

#### Structure
```
<nav class="bottom-nav">
  <button class="nav-item active">
    <i class="nav-icon">🏠</i>
    <span class="nav-label">Home</span>
  </button>
  <!-- Repeat for other items -->
</nav>
```

#### CSS Implementation
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 70px;
  background: rgba(15, 15, 35, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  z-index: 99;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #b0b0c0;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item.active {
  color: #ffd700;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 5px;
  width: 4px;
  height: 4px;
  background: #ffd700;
  border-radius: 50%;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.nav-label {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
}
```

#### Responsive Behavior
- Icons only on small screens
- Labels appear on larger screens
- Active state indicator
- Haptic feedback on selection

## Data Visualization Components

### 1. Financial Summary Cards

#### Structure
```
<div class="financial-card">
  <div class="card-header">
    <h3 class="card-title">Wallet Balance</h3>
    <i class="card-icon">💰</i>
  </div>
  <div class="card-value">₹12,560.75</div>
  <div class="card-trend positive">
    <span>↑ ₹240 Today</span>
  </div>
</div>
```

#### CSS Implementation
```css
.financial-card {
  background: rgba(25, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 600;
  color: #b0b0c0;
  margin: 0;
}

.card-icon {
  font-size: 24px;
}

.card-value {
  font-family: 'Poppins', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 8px 0;
}

.card-trend {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.card-trend.positive {
  color: #00c853;
}

.card-trend.negative {
  color: #ff1744;
}
```

### 2. Investment Plan Cards

#### Structure
```
<div class="plan-card">
  <div class="plan-header">
    <h3 class="plan-name">Platinum Plan</h3>
    <span class="plan-category premium">Premium</span>
  </div>
  <div class="plan-price">₹2,500</div>
  <div class="plan-details">
    <div class="detail-item">
      <span class="detail-label">Daily Income</span>
      <span class="detail-value">₹160</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Duration</span>
      <span class="detail-value">24 Days</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Profit</span>
      <span class="detail-value">₹1,340</span>
    </div>
  </div>
  <div class="plan-progress">
    <div class="progress-track">
      <div class="progress-fill" style="width: 0%"></div>
    </div>
    <div class="progress-text">0/3840</div>
  </div>
  <button class="plan-purchase">Purchase Plan</button>
</div>
```

#### CSS Implementation
```css
.plan-card {
  background: rgba(25, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-5px);
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-name {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.plan-category {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
}

.plan-category.premium {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0a1a;
}

.plan-price {
  font-family: 'Poppins', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffd700;
  margin: 16px 0;
}

.plan-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.detail-item {
  text-align: center;
}

.detail-label {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  color: #b0b0c0;
  display: block;
  margin-bottom: 4px;
}

.detail-value {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  display: block;
}

.plan-progress {
  margin: 20px 0;
}

.progress-text {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #b0b0c0;
  text-align: right;
  margin-top: 8px;
}

.plan-purchase {
  width: 100%;
  background: linear-gradient(135deg, #4169e1, #6a8dff);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
}

.plan-purchase:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(65, 105, 225, 0.4);
}

.plan-purchase:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

## Micro-interactions

### 1. Button Hover Effects

#### CSS Implementation
```css
.interactive-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.interactive-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.interactive-button:hover::before {
  left: 100%;
}
```

### 2. Card Flip Animation

#### Structure
```
<div class="flip-card">
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <!-- Front content -->
    </div>
    <div class="flip-card-back">
      <!-- Back content -->
    </div>
  </div>
</div>
```

#### CSS Implementation
```css
.flip-card {
  background-color: transparent;
  width: 300px;
  height: 200px;
  perspective: 1000px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front, .flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.flip-card-front {
  background: rgba(25, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.flip-card-back {
  background: linear-gradient(135deg, #4169e1, #6a8dff);
  color: white;
  transform: rotateY(180deg);
}
```

## Responsive Design Patterns

### 1. Flexible Grid System

#### CSS Implementation
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.grid {
  display: grid;
  gap: 24px;
}

/* Mobile */
.grid {
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 2. Adaptive Typography

#### CSS Implementation
```css
.responsive-heading {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 1rem 0;
}

.responsive-text {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  line-height: 1.6;
}
```

## Accessibility Enhancements

### 1. Focus Styles

#### CSS Implementation
```css
.focusable:focus {
  outline: 2px solid #ffd700;
  outline-offset: 2px;
}

.focusable:focus:not(:focus-visible) {
  outline: none;
}

.focusable:focus-visible {
  outline: 2px solid #ffd700;
  outline-offset: 2px;
}
```

### 2. Reduced Motion Support

#### CSS Implementation
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This component library provides a comprehensive set of premium UI elements that can be used to build a luxurious investment platform with a consistent design language, smooth animations, and excellent user experience.