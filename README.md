# 🎮 Cyber Runner 3D: PRO

<div align="center">

![Version](https://img.shields.io/badge/version-2.0-cyan)
![Status](https://img.shields.io/badge/status-Active-success)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-blue)

**The Ultimate Cyberpunk Endless Runner Experience**

[Play Now](https://cyberrunner.pages.dev/) • [Report Bug](https://github.com/lurek/CyberRunner/issues) • [Request Feature](https://github.com/lurek/CyberRunner/issues)

</div>

---

## ✨ Features

### 🌟 **Core Gameplay**
- **Endless Runner** with procedurally generated cyberpunk city
- **Three-lane system** with smooth lane switching
- **Advanced movement**: Jump, Slide, Grapple
- **Dynamic difficulty** that adapts to your skill
- **Real-time combo system** rewarding skillful play

### 📱 **Mobile Optimized**
- ✅ **Safe Area Insets** - Full notch support for iPhone X+
- ✅ **Touch Target Optimization** - 48x48px minimum buttons
- ✅ **Gesture Conflict Prevention** - Disabled iOS swipe-back during gameplay
- ✅ **Viewport Configuration** - Proper `viewport-fit=cover` meta tags
- ✅ **Orientation Handling** - Optimized for portrait mode

### ⚡ **Performance Tier System**
- ✅ **Auto-Detection** - Analyzes CPU cores, memory, GPU, device type
- ✅ **Three Quality Tiers**:
  - **High**: Full effects, shadows, reflections, 60 FPS
  - **Medium**: Balanced visuals and performance
  - **Low**: Maximum performance, saves 20-30 FPS on old devices
- ✅ **Battery Saver Mode** - 30 FPS cap with minimal effects

### 🎮 **Gameplay Mechanics**
- ✅ **Grappling Hook** - Hold to target, swipe to aim, release to launch
- ✅ **Energy Mode** - Collect 50 coins for invincibility + 2x speed
- ✅ **Jump Safety System** - Landing invincibility + slow-motion near-misses
- ✅ **Combo System** - Chain actions for multipliers up to 3x
- ✅ **Boss Sections** - Epic challenges every 2000m

### 🎨 **Visuals & Effects**
- **Post-Processing Pipeline**:
  - Bloom effects for neon lights
  - Chromatic aberration at high speeds
  - Speed lines during boosts
- **Particle Systems**:
  - Player trail (changes with power-ups)
  - Coin sparkles
  - Power-up auras
  - Collision sparks
- **Environmental Effects**:
  - Flying vehicles
  - Volumetric light beams
  - Animated billboards
  - Rain system (quality-dependent)
- **Real-time reflections** (High quality only)

### 🎯 **Power-Up System**
| Power-Up | Effect | Upgrade Path |
|----------|--------|--------------|
| 🛡️ **Shield** | Invincibility + 15 points per obstacle | +1s duration per level |
| ⚡ **Multiplier** | 2x score for 10s | +1.5s duration per level |
| 🧲 **Magnet** | Auto-collect nearby coins | +1s duration per level |
| ⏰ **Time Slow** | 50% game speed for 3s | +0.5s duration per level |
| ❤️ **Health Restore** | Restores player health | Instant effect |

**Synergies:**
- Shield + Magnet = 2x magnet radius
- Shield + Multiplier = Bonus points per obstacle passed
- Magnet + Multiplier = 1.5x coin value

### 🏪 **Shop System**
- **Upgrade Categories**: Shield, Multiplier, Magnet, Health, Time Slow
- **Character Selection**: Multiple unique characters with different stats
- **Booster System**: Pre-game power-up selection
- **Meta-Progression**: Coins persist between runs
- **Auto-Save**: Never lose your progress

### 🎯 **Mission System**
- **Daily Missions**: 3 random challenges that reset daily
- **Weekly Missions**: Harder challenges with bigger rewards
- **Lifetime Achievements**: Long-term goals with exclusive rewards
- **Word Hunt**: Collect letters "C-Y-B-E-R" for bonus rewards

---

## 🎮 Controls

### 🖱️ **Desktop/PC**
| Action | Key |
|--------|-----|
| Move Left | `←` or `A` |
| Move Right | `→` or `D` |
| Jump | `↑` or `Space` |
| Slide | `↓` or `S` |
| Grapple | Hold `G`, use `←`/`→` to aim, release to launch |

### 📱 **Mobile/Touch**
| Action | Gesture |
|--------|---------|
| Move Left/Right | Swipe Left/Right |
| Jump | Swipe Up |
| Slide | Swipe Down |
| Grapple | Long Press → Swipe to aim → Release |

---

## 🛠️ Technical Specifications

### **Performance**
- **Target FPS**: 60 FPS (High/Medium), 30 FPS (Low)
- **Engine**: Three.js (WebGL)
- **Rendering**: Object pooling + Instanced rendering
- **Physics**: Custom collision detection with spatial partitioning
- **Optimization**: Frustum culling, LOD system, texture atlasing

### **Supported Devices**
- ✅ **Desktop**: Windows, macOS, Linux (Chrome, Firefox, Safari, Edge)
- ✅ **Mobile**: iOS 12+, Android 8+
- ✅ **Tablets**: iPad, Android tablets
- ⚠️ **Minimum Requirements**:
  - 2 CPU cores
  - 2 GB RAM
  - WebGL-compatible GPU

### **Architecture**
```
Cyber-Runner/
├── src/
│   ├── game/
│   │   ├── engine/           # Core game loop & managers
│   │   ├── systems/          # AI systems (Combo, Difficulty, Boss, etc.)
│   │   ├── models/           # 3D character models
│   │   ├── controls/         # Input handling
│   │   └── helpers/          # Utility functions
│   ├── effects/              # Visual effects (Post-processing, Particles)
│   ├── ui/                   # React UI components
│   ├── utils/                # Constants, collision, sound, performance
│   └── main.jsx              # Entry point
├── public/                   # Static assets (models, textures, sounds)
└── android/                  # Capacitor Android project
```

---

## 🚀 Getting Started

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/lurek/CyberRunner.git

# Navigate to project
cd CyberRunner

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### **Android APK Build**
```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 📋 Roadmap

### ✅ **Completed**
- [x] Mobile Responsiveness & Safe Areas
- [x] Performance Tier System
- [x] Jump Safety System
- [x] Cyberpunk Skybox & PBR Textures
- [x] Dynamic Lighting & Audio
- [x] Currency System (Coins, Gems)
- [x] Character Selection
- [x] Power-Up Upgrades
- [x] Booster System
- [x] 3D Character Preview
- [x] Cloud Save Integration
- [x] Background Music System

### 🔄 **In Progress**
- [ ] Daily/Weekly Missions UI
- [ ] Leaderboards
- [ ] Additional Characters

### 📌 **Planned**
- [ ] Firebase Authentication
- [ ] Player Profiles
- [ ] Rewarded Video Ads
- [ ] Season Pass
- [ ] New Game Modes

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Open an issue with your feature request
3. **Submit PRs**: Fork → Create Branch → Commit → Push → PR
4. **Improve Docs**: Help us keep documentation accurate

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

### **Technologies**
- [Three.js](https://threejs.org/) - 3D graphics library
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Capacitor](https://capacitorjs.com/) - Mobile app framework
- [Lucide React](https://lucide.dev/) - Icon library

### **Inspiration**
- Subway Surfers
- Temple Run
- Mirror's Edge
- Tron Legacy

---

<div align="center">

**Made with ❤️ and ⚡ by the Cyber Runner Team**

[⬆ Back to Top](#-cyber-runner-3d-pro)

</div>
