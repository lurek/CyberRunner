How to add new character models (.glb)

1. Place the `.glb` file in the `public/` folder at the repository root.
   - Example: `public/MyNewCharacter.glb`
   - Keep file names simple (avoid special characters); spaces are supported but URI-encoding is used by the loader.

2. Add a character entry in `src/utils/constants.js` inside the `CHARACTERS` object.
   - Required fields: `id`, `name`, `modelPath` (leading slash OK), `cost`, `currency`.
   - Optional: `previewHeight` (meters) — tune this value so the character fills the preview consistently.

   Example entry:
   {
     my_new_char: {
       id: 'my_new_char',
       name: 'My New Char',
       description: 'Cool new runner',
       cost: 4000,
       currency: 'coins',
       modelPath: '/MyNewCharacter.glb',
       color: '#ffaa66',
       scale: 1.0,
       previewHeight: 2.1,
       stats: { speed: 1.0, jumpHeight: 1.0 }
     }
   }

3. (Optional) Run the verification script to confirm the model is present and discover any missing references:

   ```bash
   node scripts/verify-models.js
   ```

4. Start the dev server and open the app. Hard-refresh with DevTools Network → "Disable cache" to ensure the new bundle and assets are loaded.

5. If the model looks too big or small in the preview, adjust `previewHeight` in `src/utils/constants.js` for that character and reload.

If you want, tell me the names of the new GLB files you want added and I can add character entries for them (placeholders referencing the filenames) and run the verification script for you.