# AI Assistant Wiki Maintenance Guidelines

When modifying or updating any Wiki pages, components, or mod features in this repository:

## 1. `<UpdatedFrame>` Component Rules
- Wrap any newly added or updated wiki content, cards, or sections in `<UpdatedFrame id="unique_id" isUpdated={true}>`.
- Ensures users see the animated glowing border and `UPDATED (7s)` badge upon viewing.

## 2. Wiki Maintenance & Version Update Note (CRITICAL)
- **Mandatory Update**: Whenever you update any wiki content or implement commit changes, you **MUST** also update the **Wiki Maintenance Note** in:
  - `/src/components/special/HomeView.tsx`
- **Underline Rule**: Underline ONLY the exact sentence:
  `<u>The wiki is always updated before a new version releases.</u>`
- **Highlights List**: Update the `Recent Highlights` list inside the notice box with concise bullet points describing the newest entities, procedures, commands, or mechanics added in the latest update.

## 3. Data Integrity & Accuracy
- Always inspect the source code or patch diffs to verify mechanics before updating descriptions.
- Never guess or extrapolate features without checking source implementation.
- When adding new items, blocks, etc., always check if it has a recipe. If it does, always use the crafting table grid design (`FancyRecipeView.tsx`). If none, then leave it.

## 4. Recipe Grid Implementation (FancyRecipeView.tsx)
- **NO MANUAL RECIPE TABLES**: You are strictly forbidden from writing manual HTML tables, bullet points, or text descriptions to display crafting recipes.
- **Automated Rendering**: `ItemsView.tsx` and `BlocksView.tsx` automatically render the `<FancyRecipeView>` grid if the item's `id` has a matching recipe in `recipe_details.json`.
- **How to add a new recipe**:
  1. Add the raw JSON recipe data (exactly as it appears in the mod's source code) into the `recipe_details.json` file.
  2. Ensure the item ID in the view (e.g., `id: "splinter_needle"`) precisely matches the suffix of the recipe result (e.g., `the_backwoods:splinter_needle`).
  3. If the recipe contains new items/ingredients not yet visually mapped, add their shortcodes, colors, and visual specs to `getItemVisualSpec` in `/src/components/special/FancyRecipeView.tsx`.

## 5. Strict Factuality & Anti-Narrative Rule (CRITICAL REMINDER)
- **NEVER USE NARRATIVE TONES**: Avoid sensationalized, roleplay, fictional, or dramatized language across all wiki articles and components.
- State verified factual parameters, exact formulas, precise bounding boxes, tags, and source mechanics only.

## 6. Mod Updates vs. Wiki Articles (CRITICAL REMINDER)
- When a new mod release occurs, ONLY edit the **Wiki Maintenance Note** in `HomeView.tsx` (and `wikiArticles.ts` summary) to document the release highlights.
- Do NOT rewrite or alter existing wiki articles unless actual source code mechanics or registries were altered in the mod build.
