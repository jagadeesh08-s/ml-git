
import { Theme } from '@/components/general/ThemeProvider';

export interface ThemeLayoutConfig {
    circuitBuilderColSpan: string;
    analysisColSpan: string;
    orderReversed: boolean;
    isVertical: boolean;
    containerClass?: string;
    circuitBuilderClass?: string;
    analysisClass?: string;
}

export const themeLayouts: Record<Theme, ThemeLayoutConfig> = {
    // Standard Layouts
    quantum: {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-4',
    },
    'quantum-light': {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-4',
    },
    system: {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-4',
    },
    light: {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-4',
    },
    dark: {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-4',
    },
    cosmic: {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-6', // More space for "space" theme
    },

    // Unique Layouts
    superposition: {
        circuitBuilderColSpan: 'xl:col-span-6',
        analysisColSpan: 'xl:col-span-6',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-8', // Wide separation
    },
    entanglement: {
        circuitBuilderColSpan: 'xl:col-span-5',
        analysisColSpan: 'xl:col-span-7', // More focus on analysis (entanglement stats)
        orderReversed: true, // Swapped position
        isVertical: false,
        containerClass: 'gap-4',
    },
    tunneling: {
        circuitBuilderColSpan: 'xl:col-span-8',
        analysisColSpan: 'xl:col-span-4',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-2', // Tight layout
    },
    decoherence: {
        circuitBuilderColSpan: 'xl:col-span-12',
        analysisColSpan: 'xl:col-span-12',
        orderReversed: false,
        isVertical: true, // Fully vertical
        containerClass: 'gap-12 space-y-8',
    },
    minimal: {
        circuitBuilderColSpan: 'xl:col-span-12',
        analysisColSpan: 'xl:col-span-12',
        orderReversed: false,
        isVertical: true,
        containerClass: 'gap-8 max-w-5xl mx-auto', // Centered single column
    },
    neon: {
        circuitBuilderColSpan: 'xl:col-span-7',
        analysisColSpan: 'xl:col-span-5',
        orderReversed: false,
        isVertical: false,
        containerClass: 'gap-6 p-4 border border-neon-glow rounded-xl',
    },
    retro: {
        circuitBuilderColSpan: 'xl:col-span-9',
        analysisColSpan: 'xl:col-span-3',
        orderReversed: true, // Sidebar on left (actually right if reversed? No order-last puts it last)
        // Wait, if I reverse, the one with order-last goes to end.
        // Default is DOM order: Circuit then Analysis.
        // If Analysis has order-first, it goes left.
        isVertical: false,
        containerClass: 'gap-0 border-4 border-double border-primary',
    }
};
