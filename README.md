Search Experience Overhaul Plan
This document outlines the plan to strongly improve the search functionality, making it a robust, responsive, and highly usable core part of the app.

User Review Required
IMPORTANT

Please review the improvements planned below. The goal is to make the search feel instant, accurate, and completely keyboard-accessible (like a native app).

Proposed Improvements
1. Enhanced Geocoding Data (src/api.ts)
Currently, the search only shows the City Name and Country. This causes confusion when multiple cities share the same name (e.g., "Paris, France" vs "Paris, Texas").

Improvement: I will update the API mapping to include the admin1 property (State/Region/Province). The dropdown will now clearly show: "City, State/Region, Country".
2. Keyboard Navigation (src/App.tsx)
A core part of a good search is not needing to use the mouse.

Improvement: I will add full keyboard support. You will be able to type, press the Down Arrow to navigate through the dropdown suggestions, highlight the one you want, and press Enter to instantly select it.
3. Clearer Loading & Empty States
Improvement: I will add a small loading spinner inside the search bar that appears specifically while the API is fetching autocomplete results.
Improvement: If you search for a city that doesn't exist, the dropdown will explicitly display a "No locations found" message, rather than just silently failing or disappearing.
4. Search UX Polish
Improvement: I will add a clear (X) button inside the search input. Clicking it will instantly clear the input and close the dropdown so you can quickly search again.
Improvement: Fix edge cases where pressing "Enter" too fast (before suggestions load) would cause weird behavior.
Open Questions
NOTE

Does this cover everything you felt was "bad" about the current search, or were there specific bugs/issues you encountered that you want me to focus on fixing?

Verification Plan
Type a common name like "Springfield" and verify that states/regions appear to distinguish them.
Verify that pressing the Down/Up arrows correctly highlights the suggestions in the dropdown, and Enter selects the highlighted one.
Type gibberish and verify the "No locations found" state appears gracefully.