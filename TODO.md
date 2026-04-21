# Music Stream UI Improvements TODO

Status: In Progress

## Steps from Approved Plan:

### 1. Create this TODO.md ✅

### 2. [ ] Improve src/app/search/page.tsx
   - Filter \"Hasil serupa\" to songs only (exclude live/channel/artist profiles)
   - Add responsive scrollable list

### 3. [ ] Update src/components/FullPlayer.tsx  
   - Add queue end detection & auto-load trending/genres recommendations
   - Enhance upnext for genres (DJ, pop, rock, dangdut)

### 4. [ ] Add theme selector to src/components/Sidebar.tsx
   - Dark/Light/Auto + custom accent color picker
   - Use CSS vars & localStorage

### 5. [ ] Fix navbar src/components/TopNavbar.tsx
   - Add mobile burger menu (replace Bell)
   - Fix floating positioning

### 6. [ ] Fix volume src/components/PlayerBar.tsx
   - Larger responsive slider

### 7. [ ] Update globals.css
   - Theme vars & volume styles

### 8. [ ] Ensure LikeButton everywhere (TrackBrowser.tsx)

### 9. [ ] Edit dependents: usePlayerStore.ts, API routes if needed

### 10. [ ] Test responsive, volume, themes, search filter, auto-queue
    - `npm run dev`
    - Chrome devtools mobile/desktop

Next step: Edit search/page.tsx
