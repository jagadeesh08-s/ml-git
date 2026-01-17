# Plan: Fix Bloch Sphere Overlapping Issues

## Problem Analysis
The user reported that the Bloch sphere visualization is "covered" by the Probabilities chart.
- **Root Cause**: The interface currently displays Bloch sphere cards in a 2-column grid (`grid-cols-1 sm:grid-cols-2`) within a restricted width panel (`xl:col-span-5`).
- This results in very narrow cards (~250-300px wide).
- The "Probabilities" chart is fixed width (~160px).
- This leaves almost no space for the 3D sphere when placed side-by-side, causing it to be obscured or rendered in a tiny strip.

## Implementation Steps

### 1. Update Workspace Layout (`src/pages/Workspace.tsx`)
- **Action**: Change the grid layout for the Bloch sphere cards from `grid-cols-1 sm:grid-cols-2` to `grid-cols-1`.
- **Reasoning**: This will force the cards to take the full width of the "Quantum State Analysis" column (approx. 500-600px).
- **Result**:
    - Probability Chart: ~180px (with padding)
    - 3D Sphere: ~320px+ (Remaining space)
    - This provides a comfortable side-by-side view.

### 2. Verify BlochSphere Component (`src/components/core/BlochSphere.tsx`)
- Ensure the internal layout uses `flex-row` to properly distribute vertical space into horizontal space.
- (This step was largely completed in the previous turn, but we will confirm the behavior matches the new wide layout).

## Outcome
The user will see:
- A list of stacked cards (one per qubit).
- Each card will show the Probability Chart on the left and a large, visible Bloch Sphere on the right.
- No overlapping content.
