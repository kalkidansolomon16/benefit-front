import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Public ──────────────────────────────────────────────────
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      // Used for BOTH guest reset (token) and forced first-login reset (auth required)
      component: () => import('../views/ResetPasswordView.vue'),
    },
    {
      path: '/signup/company',
      name: 'signup-company',
      component: () => import('../views/CompanySignupView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/signup/partner',
      name: 'signup-partner',
      component: () => import('../views/PartnerSignupView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/signup/employee',
      name: 'signup-employee',
      component: () => import('../views/EmployeeSignupView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },

    // ── Employee portal ──────────────────────────────────────────
    {
      path: '/employee',
      component: () => import('../views/employee/EmployeeLayout.vue'),
      meta: { requiresEmployee: true },
      redirect: '/employee/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'employee-dashboard',
          component: () => import('../views/employee/EmployeeDashboard.vue'),
        },
        {
          path: 'gyms',
          name: 'employee-gyms',
          component: () => import('../views/employee/EmployeeGyms.vue'),
        },
        {
          path: 'checkins',
          name: 'employee-checkins',
          component: () => import('../views/employee/EmployeeCheckins.vue'),
        },
        {
          path: 'barcode',
          name: 'employee-barcode',
          component: () => import('../views/employee/EmployeeBarcode.vue'),
        },
      ],
    },

    // ── Partner / Gym portal ────────────────────────────────────
    {
      path: '/partner',
      component: () => import('../views/partner/PartnerLayout.vue'),
      meta: { requiresPartner: true },
      redirect: '/partner/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'partner-dashboard',
          component: () => import('../views/partner/PartnerDashboard.vue'),
          meta: { requiresPermission: 'gym.dashboard.view' },
        },
        {
          path: 'checkins',
          name: 'partner-checkins',
          component: () => import('../views/partner/PartnerCheckins.vue'),
          meta: { requiresPermission: 'gym.checkins.view' },
        },
        {
          path: 'facility',
          name: 'partner-facility',
          component: () => import('../views/partner/PartnerFacility.vue'),
          meta: { requiresPermission: 'gym.profile.manage' },
        },
        {
          path: 'team',
          name: 'partner-team',
          component: () => import('../views/partner/GymTeamView.vue'),
          meta: { requiresPermission: 'gym.team.manage' },
        },
      ],
    },

    // ── Company HR portal ────────────────────────────────────────
    {
      path: '/hr',
      component: () => import('../views/hr/HRLayout.vue'),
      meta: { requiresHR: true },
      redirect: '/hr/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'hr-dashboard',
          component: () => import('../views/hr/HRDashboard.vue'),
          meta: { requiresPermission: 'co.dashboard.view' },
        },
        {
          path: 'register',
          name: 'hr-register',
          component: () => import('../views/hr/RegisterEmployee.vue'),
          meta: { requiresPermission: 'co.employees.manage' },
        },
        {
          path: 'employees',
          name: 'hr-employees',
          component: () => import('../views/hr/HREmployees.vue'),
          meta: { requiresPermission: 'co.employees.view' },
        },
        {
          path: 'billing',
          name: 'hr-billing',
          component: () => import('../views/hr/HRBilling.vue'),
          meta: { requiresPermission: 'co.billing.view' },
        },
        {
          path: 'team',
          name: 'hr-team',
          component: () => import('../views/hr/CompanyTeamView.vue'),
          meta: { requiresPermission: 'co.team.manage' },
        },
      ],
    },

    // ── Admin panel ─────────────────────────────────────────────
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('../views/admin/DashboardView.vue'),
          meta: { requiresPermission: 'dashboard.view' },
        },
        {
          path: 'companies',
          name: 'admin-companies',
          component: () => import('../views/admin/CompaniesView.vue'),
          meta: { requiresPermission: 'companies.view' },
        },
        {
          path: 'gyms',
          name: 'admin-gyms',
          component: () => import('../views/admin/GymsView.vue'),
          meta: { requiresPermission: 'gyms.view' },
        },
        {
          path: 'employees',
          name: 'admin-employees',
          component: () => import('../views/admin/EmployeesView.vue'),
          meta: { requiresPermission: 'employees.view' },
        },
        {
          path: 'plans',
          name: 'admin-plans',
          component: () => import('../views/admin/PlansView.vue'),
          meta: { requiresPermission: 'plans.view' },
        },
        {
          path: 'memberships',
          name: 'admin-memberships',
          component: () => import('../views/admin/MembershipsView.vue'),
          meta: { requiresPermission: 'employees.view' },
        },
        {
          path: 'attendance',
          name: 'admin-attendance',
          component: () => import('../views/admin/AttendanceView.vue'),
          meta: { requiresPermission: 'reports.view' },
        },
        {
          path: 'activity',
          name: 'admin-activity',
          component: () => import('../views/admin/ActivityLogView.vue'),
          meta: { requiresPermission: 'activity_log.view' },
        },
        {
          path: 'billing/invoices',
          name: 'admin-billing-invoices',
          component: () => import('../views/admin/BillingInvoicesView.vue'),
          meta: { requiresPermission: 'billing.view' },
        },
        {
          path: 'billing/payment-methods',
          name: 'admin-payment-methods',
          component: () => import('../views/admin/PaymentMethodsView.vue'),
          meta: { requiresPermission: 'payment_methods.manage' },
        },
        {
          path: 'team',
          name: 'admin-team',
          component: () => import('../views/admin/AdminTeamView.vue'),
          meta: { requiresPermission: 'team.manage' },
        },
        {
          path: 'permissions',
          name: 'admin-permissions',
          component: () => import('../views/admin/AdminPermissionsView.vue'),
          meta: { requiresPermission: 'permissions.manage' },
        },
        {
          path: 'employee-approvals',
          name: 'admin-employee-approvals',
          component: () => import('../views/admin/AdminEmployeeApprovals.vue'),
          meta: { requiresPermission: 'employees.view' },
        },
      ],
    },

    // ── Catch-all ───────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// ── Navigation guard ────────────────────────────────────────────
router.beforeEach((to) => {
  const auth = useAuthStore()

  // If user must reset password, force them to the reset page
  if (auth.isLoggedIn && auth.mustResetPassword && to.name !== 'reset-password') {
    return { name: 'reset-password' }
  }

  // Redirect logged-in users away from guest-only pages (login, signup)
  // → send them directly to their portal dashboard so a new tab skips login
  if (to.meta.guestOnly && auth.isLoggedIn) {
    if (auth.isAdmin)    return { name: 'admin-dashboard' }
    if (auth.isHR)       return { name: 'hr-dashboard' }
    if (auth.isPartner)  return { name: 'partner-dashboard' }
    if (auth.isEmployee) return { name: 'employee-dashboard' }
    return { name: 'home' }
  }

  // Protect admin routes
  if (to.meta.requiresAdmin) {
    if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isAdmin)    return { name: 'home' }
  }

  // Protect HR routes
  if (to.meta.requiresHR) {
    if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isHR)       return { name: 'home' }
  }

  // Protect Employee routes
  if (to.meta.requiresEmployee) {
    if (!auth.isLoggedIn)   return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isEmployee)   return { name: 'home' }
  }

  // Protect Partner routes
  if (to.meta.requiresPartner) {
    if (!auth.isLoggedIn)   return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isPartner)    return { name: 'home' }
  }

  // Permission-gated routes
  if (to.meta.requiresPermission) {
    if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.hasPermission(to.meta.requiresPermission as string)) {
      // Redirect to the user's own portal home — but avoid looping if
      // the dashboard itself is also denied (just go to / in that case)
      const isDashboard = to.name?.toString().endsWith('-dashboard')
      if (!isDashboard) {
        if (auth.isAdmin)    return { name: 'admin-dashboard' }
        if (auth.isHR)       return { name: 'hr-dashboard' }
        if (auth.isPartner)  return { name: 'partner-dashboard' }
        if (auth.isEmployee) return { name: 'employee-dashboard' }
      }
      return { name: 'home' }
    }
  }
})

export default router
