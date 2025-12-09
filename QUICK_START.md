# 🚀 QUICK START - Character Model Integration

## ⚡ 3-MINUTE SETUP

### Step 1: Update App.jsx (30 seconds)

Open `src/App.jsx` and find line ~24:

**FIND THIS:**
```javascript
import CharacterPreviewPage from "./ui/CharacterPreviewPage_COMPLETE_FIX.jsx";
```

**REPLACE WITH:**
```javascript
import CharacterPreviewPage from "./ui/CharacterPreviewPage_NEW.jsx";
import "./ui/CharacterPreviewPage_NEW.css";
```

Save the file.

---

### Step 2: Verify Setup (30 seconds)

Run this command:
```bash
node scripts/verify-character-models.js
```

**Expected Output:**
```
✅ Main Runner
✅ Eve
✅ Kachujin
✅ SWAT Officer
✅ Vanguard
✅ ALL CHECKS PASSED!
```

If you see ❌ errors, check:
- All GLB files are in `/public` folder
- File names match exactly (case-sensitive)

---

### Step 3: Test It! (2 minutes)

Start the game:
```bash
npm start
```

**Test Checklist:**
1. ✅ Click "Characters" button on home screen
2. ✅ See character with idle animation
3. ✅ Drag to rotate character
4. ✅ Click left/right arrows to see all 5 characters
5. ✅ Click "EQUIP" button
6. ✅ Return to home screen
7. ✅ See equipped character on home screen

---

## 🎮 NEW FEATURES

### **Characters Page:**
- **5 characters** with different costs and abilities
- **3D rotation** - drag to spin character around
- **Idle animations** - characters breathe and move naturally
- **Stats display** - see speed, jump, magnet bonuses
- **Equip button** - changes to "✓ EQUIPPED" when active

### **Home Screen:**
- **Equipped character** displays in 3D
- **Idle animation** plays automatically
- **Proper sizing** on all devices

---

## 🎯 Character List

| Character | Cost | Ability |
|-----------|------|---------|
| Main Runner | FREE | Balanced stats |
| Eve | 3,500 | +5% Speed |
| Kachujin | 5,000 | +8% Jump |
| SWAT Officer | 6,500 | +10% Magnet |
| Vanguard | 8,000 | +3% All Stats |

---

## 🔍 Troubleshooting (If Needed)

### **Characters Not Showing?**
```bash
# Check if GLB files exist
ls public/*.glb

# Should show:
# Main_Character.glb
# Eve By J.Gonzales.glb
# Kachujin G Rosales.glb
# SWAT.glb
# Vanguard By T. Choonyung.glb
```

### **Animations Not Playing?**
1. Open browser console (F12)
2. Look for "🎬 Playing idle animation" message
3. Check for any ❌ errors

### **Still Having Issues?**
Read the detailed guides:
- `CHARACTER_INTEGRATION_SUMMARY.md` - Full overview
- `NEW_CHARACTER_INTEGRATION_GUIDE.md` - Complete documentation

---

## ✅ That's It!

You now have:
- ✅ 5 fully animated characters
- ✅ 3D rotation viewer
- ✅ Proper equip/purchase system
- ✅ Home screen integration
- ✅ Mobile-optimized

**Enjoy! 🎉**

---

**Questions?** Check the console logs - they show detailed info about what's happening.

**Want to add more characters?** See `NEW_CHARACTER_INTEGRATION_GUIDE.md` for instructions.
