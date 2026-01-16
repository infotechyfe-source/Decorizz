export const RAZORPAY_CONFIG = {
  // Only KEY_ID is safe to use in frontend test api rzp_test_RbFD9b67kdd1Br
  KEY_ID: (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_live_RlVWaYWKnxUru5',

  COMPANY_NAME: 'Decorizz',
  COMPANY_LOGO: '../assets/logo-r.png',
  THEME_COLOR: '#14b8a6',
};

// IMPORTANT: Never put KEY_SECRET in frontend!
// KEY_SECRET should only be in backend (Supabase Edge Function)
