# SOS Modal Component

## Overview
A modern, animated emergency alert modal that replaces the basic browser alert with a premium, urgent, and reassuring user experience.

## Features

### Visual Design
- **Dark gradient background** with red accent theme (emergency colors)
- **Rounded card design** with soft shadows and animated gradient border
- **Blur backdrop** for focus and urgency
- **Smooth animations** using Framer Motion (fade + scale-in transitions)

### Interactive Elements
- **Animated siren icon** with pulse effect and rotation
- **Progress indicator** showing connection to emergency services
- **Location display** showing current coordinates
- **Two action buttons**:
  - "Track Help" (primary) - Switches to map view
  - "Close" (secondary) - Dismisses modal
- **Emergency contact info** at bottom (112, 100)

### User Experience
- **Haptic feedback** - Vibrates on mobile devices when SOS is sent
- **Smooth transitions** - All elements animate in sequence
- **Responsive design** - Adapts to mobile, tablet, and desktop
- **Hover effects** - Interactive button states
- **Auto-progress** - Visual feedback that help is being dispatched

## Usage

```jsx
import SOSModal from '../components/SOSModal';

<SOSModal
  isOpen={showSOSModal}
  onClose={() => setShowSOSModal(false)}
  onTrackHelp={() => {
    setShowSOSModal(false);
    setActiveTab('map');
  }}
  location={location}
  userName={user?.name}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Controls modal visibility |
| `onClose` | function | Callback when modal is closed |
| `onTrackHelp` | function | Callback when "Track Help" is clicked |
| `location` | object | Current location `{ lat, lng }` |
| `userName` | string | User's name (optional) |

## Customization

### Colors
Edit `SOSModal.css` to change the color scheme:
- Primary red: `#ef4444`
- Dark red: `#dc2626`
- Darker red: `#b91c1c`

### Animations
Modify animation parameters in `SOSModal.jsx`:
- Icon pulse speed: Change `duration` in pulse animation
- Modal entrance: Adjust `damping` and `stiffness` values
- Progress speed: Modify interval timing in `useEffect`

### Sound/Vibration
Add custom sound by uncommenting and providing audio file:
```javascript
const audio = new Audio('/sos-alert.mp3');
audio.play();
```

## Browser Support
- Modern browsers with CSS backdrop-filter support
- Vibration API for mobile devices (optional enhancement)
- Framer Motion for animations (already installed)

## Accessibility
- Keyboard accessible (ESC to close)
- High contrast colors for visibility
- Clear typography hierarchy
- Focus management

## Future Enhancements
- Add Lottie animation for more dynamic icon
- Custom sound effects
- Real-time ETA display
- Live tracking integration
- Multi-language support
