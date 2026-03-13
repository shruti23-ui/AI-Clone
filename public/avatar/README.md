# Avatar GLB

Place your `avatar.glb` file here: `public/avatar/avatar.glb`

The app renders a built-in procedural 3D head automatically if no GLB is found,
so you can run the project immediately without a GLB.

---

## Getting a 3D Avatar GLB

### Option 1: Avaturn — Recommended (Free, photo-based)
> Ready Player Me shut down Jan 31, 2026. Avaturn is the best replacement.

1. Go to https://avaturn.me
2. Upload a photo of yourself — it generates a realistic 3D avatar
3. Download as **GLB**
4. Rename to `avatar.glb` and place in this folder

Avaturn exports with ARKit blendshapes including all visemes your lip sync needs:
`viseme_sil`, `viseme_PP`, `viseme_FF`, `viseme_TH`, `viseme_DD`, `viseme_kk`,
`viseme_CH`, `viseme_SS`, `viseme_nn`, `viseme_RR`, `viseme_aa`, `viseme_E`,
`viseme_I`, `viseme_O`, `viseme_U`

No code changes needed — lip sync works automatically.

---

### Option 2: VRoid Studio (Free, anime/stylized)
1. Download VRoid Studio: https://vroid.com/en/studio
2. Create and customize your avatar
3. Export as `.vrm`
4. Convert VRM → GLB using the VRM Add-on for Blender:
   https://vrm-addon-for-blender.info/
5. In Blender, rename facial shape keys to match the viseme names above
6. Export as GLB (File > Export > glTF 2.0, enable Shape Keys)

---

### Option 3: Blender + Custom Model (Full control)
1. Open Blender with any character mesh
2. Add **Shape Keys** named exactly: `viseme_aa`, `viseme_PP`, `viseme_FF`, etc.
3. Sculpt each mouth shape for that viseme
4. Export: File > Export > glTF 2.0
   - Format: glTF Binary (.glb)
   - Enable: Shape Keys, Skinning, Animations

---

### Option 4: Sketchfab Free Models (Quick testing)
1. Go to https://sketchfab.com/features/free-3d-models
2. Filter: Downloadable + GLB format, search "character head"
3. Most won't have viseme shape keys — the jaw animation fallback still runs

---

### Option 5: Use the Built-in Procedural Avatar (No setup needed)
The app ships with a procedural Three.js head that:
- Blinks naturally
- Animates the jaw for speech
- Has holographic ring base
- Fully replaces the GLB when none is present

No action needed — just run `npm run dev` and it works.
