# Bidirectional Vocabulary Exercise Implementation Plan

## Current Issue
The bidirectional vocabulary matching exercise fails because:
1. First direction completes and marks session as 'completed' 
2. Second direction tries to use the same session, but backend rejects 'completed' sessions
3. Results in "Active session not found" error

## Current Solution (Temporary)
- Only perform native_to_target direction (English → Chinese)
- Complete exercise after first direction finishes
- Maintains stability and user experience

## Future Implementation Options

### Option A: Extended Session Support (Recommended)
**Backend Changes:**
1. Add `phase` field to ExerciseSession ('first_direction', 'second_direction', 'completed')
2. Modify submitAnswer to allow 'first_direction' sessions to continue
3. Only mark as 'completed' when both directions are done

**Frontend Changes:**
1. Track current phase in session
2. Handle phase transitions properly
3. Update progress indicators for both phases

### Option B: Dual Session Approach
**Implementation:**
1. Create first session for native_to_target
2. When first session completes, create second session for target_to_native
3. Track both sessions and combine scores
4. Mark exercise complete when both sessions finish

### Option C: Client-Side Only Second Direction
**Implementation:**
1. First direction uses backend session (counts toward progress)
2. Second direction runs client-side only (for practice)
3. Only first direction score counts toward completion
4. Simpler but less comprehensive tracking

## Recommended Approach: Option A

**Phase 1**: Extend ExerciseSession model
```sql
ALTER TABLE "ExerciseSessions" ADD COLUMN "phase" VARCHAR(20) DEFAULT 'single_direction';
```

**Phase 2**: Update backend logic
- Modify session completion logic
- Add phase transition handling
- Update progress tracking

**Phase 3**: Update frontend
- Restore bidirectional question generation
- Handle phase transitions
- Update UI for both directions

## Benefits of Bidirectional Testing
- **Deeper Learning**: Tests both recognition and recall
- **Comprehensive Practice**: Users must understand words in both directions  
- **Better Retention**: Research shows bidirectional testing improves memory
- **Real-world Usage**: Language learners need both comprehension and production skills

## Timeline
- **Immediate**: Current single-direction solution works perfectly
- **Future Sprint**: Implement Option A for full bidirectional support
- **Consider**: User preference settings (uni vs bidirectional)