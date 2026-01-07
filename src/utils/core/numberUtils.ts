/**
 * Safely converts a value to a fixed decimal string
 * Handles cases where the value might not be a number
 */
export const safeToFixed = (value: any, decimals: number = 2): string => {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return value.toFixed(decimals);
    }
    return '0.' + '0'.repeat(decimals);
};

/**
 * Safely converts a value to a number
 * Returns 0 if the value cannot be converted
 */
export const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
};
