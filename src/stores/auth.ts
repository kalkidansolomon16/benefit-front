import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: string
  fan_number: string | null
  phone: string | null
  photo_path: string | null
  is_active: boolean
}

const ADMIN_ROLES        = ['super_admin', 'fitaccess_admin', 'admin_finance', 'admin_support']
const HR_ROLES           = ['company_hr', 'company_finance', 'company_ceo']
const PARTNER_ROLES      = ['gym_partner', 'gym_staff']
const ADMIN_SUB_ROLES    = ['admin_finance', 'admin_support']
const COMPANY_SUB_ROLES  = ['company_finance', 'company_ceo']
const GYM_SUB_ROLES      = ['gym_staff']

export const useAuthStore = defineStore('auth', () => {
  const user              = ref<User | null>(JSON.parse(localStorage.getItem('fa_user') || 'null'))
  const token             = ref<string | null>(localStorage.getItem('fa_token'))
  const mustResetPassword = ref<boolean>(localStorage.getItem('fa_must_reset') === 'true')
  const permissions       = ref<string[]>(JSON.parse(localStorage.getItem('fa_permissions') || '[]'))

  /* ── Role helpers ─────────────────────────────────────── */
  const isLoggedIn  = computed(() => !!token.value)
  const isAdmin     = computed(() => ADMIN_ROLES.includes(user.value?.role ?? ''))
  const isHR        = computed(() => HR_ROLES.includes(user.value?.role ?? ''))
  const isEmployee  = computed(() => user.value?.role === 'employee')
  const isGymStaff  = computed(() => user.value?.role === 'gym_staff')
  const isPartner   = computed(() => PARTNER_ROLES.includes(user.value?.role ?? ''))
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  /* Sub-role helpers (to show/hide team management) */
  const isAdminSubRole   = computed(() => ADMIN_SUB_ROLES.includes(user.value?.role ?? ''))
  const isCompanySubRole = computed(() => COMPANY_SUB_ROLES.includes(user.value?.role ?? ''))
  const isGymSubRole     = computed(() => GYM_SUB_ROLES.includes(user.value?.role ?? ''))

  /* Primary HR/partner (can manage team) */
  const isPrimaryHR      = computed(() => ['super_admin', 'fitaccess_admin', 'company_hr'].includes(user.value?.role ?? ''))
  const isPrimaryPartner = computed(() => user.value?.role === 'gym_partner')

  /* ── Permission helper ────────────────────────────────── */
  function hasPermission(permission: string): boolean {
    if (['super_admin', 'fitaccess_admin'].includes(user.value?.role ?? '')) return true
    return permissions.value.includes(permission)
  }

  /* ── Session management ───────────────────────────────── */
  function setSession(
    newUser: User,
    newToken: string,
    newPermissions: string[] = [],
    newMustReset  = false,
  ) {
    user.value              = newUser
    token.value             = newToken
    permissions.value       = newPermissions
    mustResetPassword.value = newMustReset

    localStorage.setItem('fa_user',        JSON.stringify(newUser))
    localStorage.setItem('fa_token',       newToken)
    localStorage.setItem('fa_permissions', JSON.stringify(newPermissions))
    localStorage.setItem('fa_must_reset',  String(newMustReset))
  }

  function clearSession() {
    user.value              = null
    token.value             = null
    permissions.value       = []
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
  async function login(email: string, password: string): Promise<void> {
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || data.errors?.email?.[0] || 'Login failed')
    }

    setSession(
      data.user,
      data.token,
      data.permissions ?? [],
      data.must_reset_password ?? false,
    )
  }

  /* ── Logout ───────────────────────────────────────────── */
  async function logout(): Promise<void> {
    if (token.value) {
      await fetch('http://localhost:8000/api/v1/auth/logout', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token.value}`, 'Accept': 'application/json' },
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
    logout,
    setSession,
    clearSession,
    clearMustReset,
  }
})
