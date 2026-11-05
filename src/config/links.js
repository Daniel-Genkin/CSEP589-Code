// App store listings for the iOS and Android apps.
// Set VITE_APP_STORE_URL and VITE_GOOGLE_PLAY_URL (see .env.example) to the real listing URLs.
export const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || 'https://apps.apple.com/'
export const GOOGLE_PLAY_URL = import.meta.env.VITE_GOOGLE_PLAY_URL || 'https://play.google.com/store/apps'
