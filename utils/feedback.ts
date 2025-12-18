export type HapticType = 'success' | 'error' | 'light' | 'medium' | 'heavy';

export const triggerHaptic = (type: HapticType) => {
    if (!navigator.vibrate) return;

    switch (type) {
        case 'success':
            navigator.vibrate([10, 30, 10]); // Short-Long-Short pattern
            break;
        case 'error':
            navigator.vibrate([50, 50, 50, 50]); // Shake-like pattern
            break;
        case 'light':
            navigator.vibrate(5); // Very subtle click
            break;
        case 'medium':
            navigator.vibrate(15); // Standard tap
            break;
        case 'heavy':
            navigator.vibrate(40); // Noticeable thud (e.g. delete)
            break;
    }
};
