/**
 * Detect if the user is on a mobile device
 * Checks for touch support and common mobile user agents
 */
export function isMobileDevice(): boolean {
  // Check for touch support
  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0

  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile'
  ]
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))

  // Check screen size (mobile typically < 768px)
  const isSmallScreen = window.innerWidth < 768

  // Device is mobile if it has touch AND (mobile UA OR small screen)
  return hasTouchScreen && (isMobileUA || isSmallScreen)
}
