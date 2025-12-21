# Iron Man HUD Targeting Reticles Design

## Overview

Add JARVIS-style targeting reticle animations to the node topology map, creating an immersive "mission control" surveillance aesthetic.

## Design Components

### 1. Ambient Scanning Reticles

Every node displays a subtle rotating reticle reflecting health status:

| Health | Color | Rotation Speed | Effect |
|--------|-------|----------------|--------|
| Healthy | Gold/Amber (#FFB800) | 8s/rev | Calm monitoring |
| Lagging | Orange (#FF8C00) | 5s/rev | Elevated alert |
| Issue | Red (#FF4444) | 3s/rev | Pulse effect |

**Tier Sizing:**
- Baker: 50px radius, 3px stroke
- Hub: 35px radius, 2px stroke
- Standard: 25px radius, 1.5px stroke
- Edge: 18px radius, 1px stroke

**Visual Details:**
- Two opposing arc segments (60° each)
- Opacity: 0.4-0.6 (subtle, not overwhelming)
- CSS animation for smooth rotation

### 2. Target Acquisition Sequence (0.6s)

**Phase 1 - Lock On (0-0.2s)**
- Four corner brackets converge from outside
- Amber reticle freezes and shifts to cyan

**Phase 2 - Spin Up (0.2-0.4s)**
- Brackets lock with scale bounce
- Two counter-rotating arc rings appear
- Color transitions to bright cyan

**Phase 3 - Data Stream (0.4-0.6s)**
- Data ticks appear on outer ring
- Scan line sweeps horizontally
- Glow pulse confirms acquisition

**Sustained State:**
- Triple-ring: inner static, two counter-rotating outer arcs
- Bright cyan (#00CCFF) with glow
- Connected peers get corner brackets only

### 3. JARVIS Sound Effects

| Event | Sound | Duration | Volume |
|-------|-------|----------|--------|
| Lock-on | Beep-chirp | 0.2s | 0.3 |
| Spin-up | Mechanical whir | 0.3s | 0.2 |
| Confirm | Soft ping | 0.15s | 0.3 |

- Web Audio API for low latency
- Mute toggle in UI
- Royalty-free sci-fi sounds

## Implementation Files

- `src/components/map/HUDReticle.tsx` - Reticle SVG component
- `src/components/map/TopologyGraph.tsx` - Integration
- `src/hooks/useAudio.ts` - Sound effect hook
- `src/app/globals.css` - Keyframe animations
- `public/sounds/` - Audio files
