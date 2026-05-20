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
        },
        {
          path: 'checkins',
          name: 'partner-checkins',
          component: () => import('../views/partner/PartnerCheckins.vue'),
        },
        {
          path: 'facility',
          name: 'partner-facility',
          component: () => import('../views/partner/PartnerFacility.vue'),
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
        },
        {
          path: 'register',
          name: 'hr-register',
          component: () => import('../views/hr/RegisterEmployee.vue'),
        },
        {
          path: 'employees',
          name: 'hr-employees',
          component: () => import('../views/hr/HREmployees.vue'),
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
        },
        {
          path: 'companies',
          name: 'admin-companies',
          component: () => import('../views/admin/CompaniesView.vue'),
        },
        {
          path: 'gyms',
          name: 'admin-gyms',
          component: () => import('../views/admin/GymsView.vue'),
        },
        {
          path: 'employees',
          name: 'admin-employees',
          component: () => import('../views/admin/EmployeesView.vue'),
        },
        {
          path: 'plans',
          name: 'admin-plans',
          component: () => import('../views/admin/PlansView.vue'),
        },
        {
          path: 'attendance',
          name: 'admin-attendance',
          component: () => import('../views/admin/AttendanceView.vue'),
        },
        {
          path: 'activity',
          name: 'admin-activity',
          component: () => import('../views/admin/ActivityLogView.vue'),
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

  // Redirect logged-in users away from guest-only pages
  if (to.meta.guestOnly && auth.isLoggedIn) return { name: 'home' }

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
})

export default router
