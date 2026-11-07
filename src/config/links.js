// App store listings for the iOS and Android apps.
// Set VITE_APP_STORE_URL and VITE_GOOGLE_PLAY_URL (see .env.example) to the real listing URLs.
export const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || 'https://apps.apple.com/'
export const GOOGLE_PLAY_URL = import.meta.env.VITE_GOOGLE_PLAY_URL || 'https://play.google.com/store/apps'

// Willingness-to-pay survey (insightfeed). Every main call-to-action points
// here until the product exists; opens in a new tab because the survey page
// refuses to render inside a frame.
export const SURVEY_URL = 'https://insightfeed.com/feedlinks/00ffe3b9-9f86-4d23-8349-f30599b9706c'
