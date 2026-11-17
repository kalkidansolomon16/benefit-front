// Shared state for the employee portal: dashboard data, the card state and the
// "activate your card" prompt. Module-level so every page sees an activation
// immediately without reloading.
import { computed, reactive, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { Crowd } from '@/components/GymCrowd.vue'

export interface CardInfo {
  activated: boolean
  /** HR approved, FitAccess final approval still pending — card can't be added yet */
  awaiting_approval?: boolean
  /** banned by admin or HR: same number, unusable until the ban is lifted */
  banned?: boolean
  banned_text?: string | null
  number: string | null
  active_since: string | null
  company: string | null
  status: string
}

export interface NewsItem {
  id: number
  title: string
  category: string
  excerpt: string | null
  body?: string | null
  image_url: string | null
  link_url: string | null
  link_label: string | null
  published_at: string | null
}

export interface TrainingItem {
  id: number
  title: string
  category: string
  image_url: string | null
  duration_minutes: number | null
  is_online: boolean
  location: string | null
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  participants: number | null
  joined: boolean
  description?: string | null
  provider?: string | null
  provider_contact?: string | null
  video_url?: string | null
}

export interface PortalGym {
  id: number
  name: string
  tier: string
  sub_city: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  facilities: string[]
  opening_hours: Record<string, string | null> | string | null
  crowd: Crowd | null
}

export interface PortalDashboard {
  profile: { name: string; email: string; phone: string | null; job_title: string | null; department: string | null; branch: string | null; card_number: string | null }
  company: { name: string | null; city: string | null }
  pass: { plan_name: string; plan_key: string; status: string; valid_until: string | null; access_message: string | null; accessible_tiers: string[]; plan_labels: Record<string, string> }
  stats: { total_checkins: number; this_month_checkins: number; this_week_checkins: number; last_visit: string | null }
  recent_checkins: { id: number; gym_name: string; gym_tier: string; gym_sub_city: string; checked_in_at: string | null; checked_out_at: string | null; duration_min: number | null }[]
  accessible_gyms: PortalGym[]
  card: CardInfo
  featured: NewsItem[]
  news: NewsItem[]
  trainings: TrainingItem[]
}

const data = ref<PortalDashboard | null>(null)
const loading = ref(false)
const error = ref('')
let inflight: Promise<void> | null = null

/** "Activate your card" prompt shown when a locked action is tried */
const lock = reactive({ open: false, title: '', message: '' })

export const TRAINING_LABELS: Record<string, string> = {
  fitness: 'Fitness',
  mental_health: 'Mental health',
  nutrition: 'Nutrition',
  medical: 'Health',
  yoga: 'Yoga',
  lifestyle: 'Lifestyle',
  other: 'Other',
}

export function useEmployeePortal() {
  const api = useApi()

  async function load(force = false) {
    if (data.value && !force) return
    if (inflight) return inflight
    loading.value = true
    error.value = ''
    inflight = api
      .get<PortalDashboard>('employee/dashboard')
      .then((res) => {
        data.value = res
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : 'Could not load your portal.'
      })
      .finally(() => {
        loading.value = false
        inflight = null
      })
    return inflight
  }

  /** Enter the card number HR sent. Throws with a readable message on failure. */
  async function activateCard(number: string) {
    const res = await api.post<{ message: string; card: CardInfo }>('employee/activate-card', {
      card_number: number,
    })
    if (data.value) {
      data.value.card = res.card
      data.value.profile.card_number = res.card.number
    }
    await load(true)
    return res
  }

  // A banned card counts as not usable: every card-only action shows the prompt
  const activated = computed(() => !!data.value?.card?.activated && !data.value?.card?.banned)
  const banned = computed(() => !!data.value?.card?.banned)
  const awaitingApproval = computed(() => !!data.value?.card?.awaiting_approval)

  /** Run `action` only when the card is active; otherwise show the prompt. */
  function requireCard(title: string, message: string, action?: () => void) {
    if (activated.value) {
      action?.()
      return true
    }
    lock.title = banned.value ? 'Your card is blocked' : title
    lock.message = banned.value
      ? `Your FitAccess card is blocked ${data.value?.card?.banned_text ?? ''}. Please contact your HR team.`
      : awaitingApproval.value
      ? 'Your company has approved you. FitAccess is doing the final check now. Once you are approved and your membership is paid, FitAccess e-mails you your card number and you can add it here to unlock this.'
      : message
    lock.open = true
    return false
  }

  return { data, loading, error, load, activateCard, activated, awaitingApproval, banned, lock, requireCard }
}

/** "1 Jan 2026" from "2026-01-01" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDuration(min: number | null | undefined): string {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:00` : `${m}:00`
}
