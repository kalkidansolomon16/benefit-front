import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: string
  /** true for every admin team role, including custom ones created on the Roles page */
  admin_portal?: boolean
  fan_number: string | null
  phone: string | null
  photo_path: string | null
  is_active: boolean
  company_id?: number | null
  company_branch_id?: number | null
  gym_id?: number | null
  must_change_password?: boolean
}

const ADMIN_ROLES = ['super_admin', 'fitaccess_admin', 'admin_finance', 'admin_support']
const HR_ROLES = ['company_hr', 'co_hr', 'co_executive', 'co_finance', 'company_finance', 'company_ceo']
const PARTNER_ROLES = ['gym_partner', 'gym_hr', 'gym_executive', 'gym_finance']
const ADMIN_SUB_ROLES = ['admin_finance', 'admin_support']
const COMPANY_SUB_ROLES = ['co_hr', 'co_executive', 'co_finance', 'company_finance', 'company_ceo']
const GYM_SUB_ROLES = ['gym_hr', 'gym_executive', 'gym_finance']

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL
const RECAPTCHA_SITE_KEY: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

let recaptchaScriptPromise: Promise<void> | null = null

function loadRecaptchaScript(): Promise<void> {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve()
  if (window.grecaptcha) return Promise.resolve()
  if (recaptchaScriptPromise) return recaptchaScriptPromise

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'))
    document.head.appendChild(script)
  })

  return recaptchaScriptPromise
}

async function getRecaptchaToken(action: string): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY) return undefined

  await loadRecaptchaScript()

  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window
        .grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(reject)
    })
  })
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(JSON.parse(localStorage.getItem('fa_user') || 'null'))
  const token = ref<string | null>(localStorage.getItem('fa_token'))
  const mustResetPassword = ref<boolean>(localStorage.getItem('fa_must_reset') === 'true')
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem('fa_permissions') || '[]'))

  /* ── MFA (two-factor) challenge state ────────────────────
   * Set when /auth/login responds that the account must scan a freshly
   * generated QR code and confirm a code before a session token is
   * issued. A new QR is generated on every login (never persisted to
   * localStorage) — it only lives for the duration of the login flow. */
  const mfaToken = ref<string | null>(null)
  const mfaSetupRequired = ref(false)
  const mfaQrCode = ref<string | null>(null)
  const mfaSecret = ref<string | null>(null)
  const mfaMessage = ref('')
  const mfaEnrolled = ref(false)

  function clearMfaState() {
    mfaToken.value = null
    mfaSetupRequired.value = false
    mfaQrCode.value = null
    mfaSecret.value = null
    mfaMessage.value = ''
    mfaEnrolled.value = false
  }

  /* ── Role helpers ─────────────────────────────────────── */
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => ADMIN_ROLES.includes(user.value?.role ?? '') || user.value?.admin_portal === true)
  const isHR = computed(() => HR_ROLES.includes(user.value?.role ?? ''))
  const isEmployee = computed(() => user.value?.role === 'employee')
  const isGymStaff = computed(() => user.value?.role === 'gym_staff')
  const isPartner = computed(() => PARTNER_ROLES.includes(user.value?.role ?? ''))
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  /* Sub-role helpers (to show/hide team management) */
  const isAdminSubRole = computed(() => ADMIN_SUB_ROLES.includes(user.value?.role ?? ''))
  const isCompanySubRole = computed(() => COMPANY_SUB_ROLES.includes(user.value?.role ?? ''))
  const isGymSubRole = computed(() => GYM_SUB_ROLES.includes(user.value?.role ?? ''))

  /* Primary HR/partner (can manage team) */
  const isPrimaryHR = computed(() =>
    ['super_admin', 'fitaccess_admin', 'company_hr'].includes(user.value?.role ?? ''),
  )
  const isPrimaryPartner = computed(() => user.value?.role === 'gym_partner')

  /* ── Permission helper ────────────────────────────────── */
  function hasPermission(permission: string): boolean {
    if (['super_admin', 'fitaccess_admin'].includes(user.value?.role ?? '')) return true
    const role = user.value?.role ?? ''
    // Primary company account always has full access to their company scope
    if (role === 'company_hr' && permission.startsWith('co.')) return true
    // Primary gym account always has full access to their gym scope
    if (role === 'gym_partner' && permission.startsWith('gym.')) return true
    return permissions.value.includes(permission)
  }

  /* ── Session management ───────────────────────────────── */
  function setSession(
    newUser: User,
    newToken: string,
    newPermissions: string[] = [],
    newMustReset = false,
  ) {
    user.value = newUser
    token.value = newToken
    permissions.value = newPermissions
    mustResetPassword.value = newMustReset

    localStorage.setItem('fa_user', JSON.stringify(newUser))
    localStorage.setItem('fa_token', newToken)
    localStorage.setItem('fa_permissions', JSON.stringify(newPermissions))
    localStorage.setItem('fa_must_reset', String(newMustReset))
  }

  function clearSession() {
    user.value = null
    token.value = null
    permissions.value = []
    mustResetPassword.value = false

    localStorage.removeItem('fa_user')
    localStorage.removeItem('fa_token')
    localStorage.removeItem('fa_permissions')
    localStorage.removeItem('fa_must_reset')
  }

  /* Mark password reset complete (called after firstLoginReset) */
  function clearMustReset() {
    mustResetPassword.value = false
    localStorage.setItem('fa_must_reset', 'false')
  }

  /* ── Login ────────────────────────────────────────────── */
  async function postLogin(email: string, password: string, recaptchaToken?: string) {
    const body: Record<string, string> = { email, password }
    if (recaptchaToken) body.recaptcha_token = recaptchaToken

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })

    return { res, data: await res.json() }
  }

  async function login(email: string, password: string): Promise<void> {
    clearMfaState()

    let { res, data } = await postLogin(email, password)

    // Repeated failures for this account: fetch a CAPTCHA token and retry once.
    if (!res.ok && data.requires_captcha) {
      const recaptchaToken = await getRecaptchaToken('login')
      ;({ res, data } = await postLogin(email, password, recaptchaToken))
    }

    if (!res.ok) {
      throw new Error(data.message || data.errors?.email?.[0] || 'Login failed')
    }

    if (data.mfa_setup_required) {
      mfaSetupRequired.value = true
      mfaToken.value = data.mfa_token
      mfaQrCode.value = data.qr_code
      mfaSecret.value = data.secret
      mfaMessage.value = data.message ?? ''
      mfaEnrolled.value = !!data.mfa_enrolled
      return
    }

    setSession(data.user, data.token, data.permissions ?? [], data.user?.must_change_password ?? false)
  }

  /* Step 2: confirm the freshly generated TOTP secret (scanned via the QR
   * shown on this login attempt) and finish signing in. */
  async function confirmMfaSetup(code: string): Promise<void> {
    if (!mfaToken.value) throw new Error('Your login session has expired. Please sign in again.')

    const res = await fetch(`${API_BASE_URL}/auth/mfa/setup/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ mfa_token: mfaToken.value, code }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Invalid authentication code.')
    }

    clearMfaState()
    setSession(data.user, data.token, data.permissions ?? [], data.user?.must_change_password ?? false)
  }

  /* ── Logout ───────────────────────────────────────────── */
  async function logout(): Promise<void> {
    if (token.value) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
      }).catch(() => {})
    }
    clearSession()
  }

  return {
    /* state */
    user,
    token,
    mustResetPassword,
    permissions,

    /* MFA challenge state */
    mfaSetupRequired,
    mfaQrCode,
    mfaSecret,
    mfaMessage,
    mfaEnrolled,

    /* role booleans */
    isLoggedIn,
    isAdmin,
    isHR,
    isEmployee,
    isGymStaff,
    isPartner,
    isSuperAdmin,
    isAdminSubRole,
    isCompanySubRole,
    isGymSubRole,
    isPrimaryHR,
    isPrimaryPartner,

    /* methods */
    hasPermission,
    login,
    confirmMfaSetup,
    clearMfaState,
    logout,
    setSession,
    clearSession,
    clearMustReset,
  }
})
