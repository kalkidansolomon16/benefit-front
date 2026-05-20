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

export const useAuthStore = defineStore('auth', () => {
  const user  = ref<User | null>(JSON.parse(localStorage.getItem('fa_user') || 'null'))
  const token = ref<string | null>(localStorage.getItem('fa_token'))

  const isLoggedIn   = computed(() => !!token.value)
  const isAdmin      = computed(() => ['super_admin', 'fitaccess_admin'].includes(user.value?.role ?? ''))
  const isHR         = computed(() => user.value?.role === 'company_hr')
  const isEmployee   = computed(() => user.value?.role === 'employee')
  const isGymStaff   = computed(() => user.value?.role === 'gym_staff')
  const isPartner    = computed(() => user.value?.role === 'gym_partner')

  function setSession(newUser: User, newToken: string) {
    user.value  = newUser
    token.value = newToken
    localStorage.setItem('fa_user',  JSON.stringify(newUser))
    localStorage.setItem('fa_token', newToken)
  }

  function clearSession() {
    user.value  = null
    token.value = null
    localStorage.removeItem('fa_user')
    localStorage.removeItem('fa_token')
  }

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || data.errors?.email?.[0] || 'Login failed')
    }

    setSession(data.user, data.token)
  }

  async function logout(): Promise<void> {
    if (token.value) {
      await fetch('http://localhost:8000/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.value}`, 'Accept': 'application/json' },
      }).catch(() => {})
    }
    clearSession()
  }

  return { user, token, isLoggedIn, isAdmin, isHR, isEmployee, isGymStaff, isPartner, login, logout, setSession, clearSession }
})
