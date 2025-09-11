# Fishing App — Clean Starter (Leaflet)

Generated: 2025-09-11

This is a fresh rebuild with the features you asked for:
1) Drop-a-Pin + Auto-Suggest
2) Quick-Add Amenities
3) Single-Popup Mode
4) “What’s Biting Now” filter
5) Species filter
6) Rig Helper (modal + FAB)
8) Species Coverage Validator (Python)

## Quick start
1. Put this folder on any static host (or just open `index.html`).
2. You’ll see OpenStreetMap tiles and your Wellington/Miramar starter spots.
3. Right-click/long-press the map to add spots or amenities.
4. Use the toolbar for **🔥 Biting now** and species filtering.
5. Tap the **🎣 Rig** button for tailored rig suggestions.
6. Export pending additions via the modal’s **Export** button.

### Merge new spots into your dataset
```bash
python3 validate_species_coverage.py --spots-file data/spots_wellington_miramar.json --species-file data/species_wlg_kapiti.json
```

If you later consolidate to a single `spots.json`, run:
```bash
python3 validate_species_coverage.py --spots-file spots.json --species-file data/species_wlg_kapiti.json
```

You can also merge external `new_spots.json` into a consolidated file with your own tooling; the app’s export keeps clean schema v2 objects.

## Notes
- Uses Leaflet from CDN.
- Reverse geocoding via Nominatim (be gentle). For production, consider a small proxy or your own geocoder key.
- Everything new is additive; your original data isn’t overwritten.
