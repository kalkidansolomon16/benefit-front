// Log in and registration pages open in a new browser tab from the public
// site (client request), so the visitor keeps the page they were reading.
const AUTH_PATHS = ['/login', '/register', '/signup/', '/join']

export function newTab(to: string | { path: string } | null | undefined): Record<string, string> {
  const path = typeof to === 'string' ? to : to?.path ?? ''
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p)) ? { target: '_blank', rel: 'noopener' } : {}
}
