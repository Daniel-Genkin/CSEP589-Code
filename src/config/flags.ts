// Switches for things that exist in the code but are not shown in the demo build.

/**
 * "Upload a screenshot" on Home. v1 has no image parsing: the stub returns the sample portfolio
 * for any image, which looks fake in a demo, so the control is hidden unless this is set.
 * Turn on with VITE_SHOW_SCREENSHOT_UPLOAD=true.
 */
export const SHOW_SCREENSHOT_UPLOAD = import.meta.env.VITE_SHOW_SCREENSHOT_UPLOAD === 'true'
