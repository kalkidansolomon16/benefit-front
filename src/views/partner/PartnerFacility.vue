<template>
  <div class="pf">

    <div v-if="loading" class="pf-loading">
      <div class="spinner"></div>
      <p>Loading facility info…</p>
    </div>

    <template v-else-if="gym">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: tab === 'profile' }" @click="tab = 'profile'">Profile</button>
        <button class="tab-btn" :class="{ active: tab === 'edit' }"    @click="startEdit">Edit Profile</button>
        <button class="tab-btn" :class="{ active: tab === 'upgrade' }" @click="tab = 'upgrade'; loadRequests()">
          Upgrade Request
          <span v-if="pendingRequest" class="tab-badge">1</span>
        </button>
      </div>

      <!-- ─────────── TAB: VIEW PROFILE ─────────── -->
      <template v-if="tab === 'profile'">

        <div class="profile-card">
          <div class="profile-avatar">{{ initials(gym.name) }}</div>
          <div class="profile-body">
            <div class="profile-name-row">
              <h2 class="profile-name">{{ gym.name }}</h2>
              <span class="tier-badge" :class="`tier--${gym.tier}`">{{ tierLabel(gym.tier) }}</span>
              <span class="status-badge" :class="gym.is_active ? 'badge--active' : 'badge--inactive'">
                {{ gym.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="profile-sub">Partner Gym · {{ gym.city }}</p>
            <p v-if="gym.partnership_start" class="profile-since">
              Partner since <strong>{{ gym.partnership_start }}</strong>
            </p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3 class="info-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Contact Details
            </h3>
            <div class="info-rows">
              <div class="info-row"><span class="info-key">Contact Person</span><span class="info-val">{{ gym.contact_person }}</span></div>
              <div class="info-row"><span class="info-key">Phone</span><span class="info-val">{{ gym.contact_phone }}</span></div>
              <div class="info-row"><span class="info-key">Email</span><span class="info-val">{{ gym.contact_email }}</span></div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="info-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Location
            </h3>
            <div class="info-rows">
              <div class="info-row"><span class="info-key">City</span><span class="info-val">{{ gym.city }}</span></div>
              <div v-if="gym.sub_city" class="info-row"><span class="info-key">Sub-city</span><span class="info-val">{{ gym.sub_city }}</span></div>
              <div v-if="gym.address"  class="info-row"><span class="info-key">Address</span><span class="info-val">{{ gym.address }}</span></div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="info-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Operations
            </h3>
            <div class="info-rows">
              <div class="info-row"><span class="info-key">Max Capacity</span><span class="info-val">{{ gym.max_capacity }} members/hr</span></div>
              <div v-if="parsedHours" class="info-row opening-hours-row">
                <span class="info-key">Opening Hours</span>
                <div class="hours-block">
                  <div v-if="parsedHours.weekdays" class="hours-line"><span class="hours-day">Weekdays</span><span class="hours-time">{{ parsedHours.weekdays }}</span></div>
                  <div v-if="parsedHours.weekends" class="hours-line"><span class="hours-day">Weekends</span><span class="hours-time">{{ parsedHours.weekends }}</span></div>
                  <span v-if="!parsedHours.weekdays && !parsedHours.weekends" class="info-val">{{ parsedHours.summary ?? gym.opening_hours }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="info-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Membership Info
            </h3>
            <div class="info-rows">
              <div class="info-row"><span class="info-key">Tier</span><span class="info-val">{{ tierLabel(gym.tier) }}</span></div>
              <div v-if="gym.partnership_start" class="info-row"><span class="info-key">Partnership Start</span><span class="info-val">{{ gym.partnership_start }}</span></div>
              <div class="info-row"><span class="info-key">Status</span><span :class="gym.is_active ? 'val--active' : 'val--inactive'">{{ gym.is_active ? 'Active' : 'Inactive' }}</span></div>
            </div>
          </div>
        </div>

        <div v-if="gym.facilities?.length" class="card">
          <h3 class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            Facilities &amp; Amenities
          </h3>
          <div class="facilities-grid">
            <span v-for="f in gym.facilities" :key="f" class="facility-chip">{{ f }}</span>
          </div>
        </div>

      </template>

      <!-- ─────────── TAB: EDIT PROFILE ─────────── -->
      <template v-else-if="tab === 'edit'">
        <div class="edit-card">
          <h2 class="edit-title">Edit Facility Profile</h2>

          <div class="edit-section">
            <h3 class="edit-section-title">Contact Details</h3>
            <div class="form-grid">
              <div class="field">
                <label class="field-label">Facility Name</label>
                <input v-model="editForm.name" class="input" placeholder="Gym name" />
              </div>
              <div class="field">
                <label class="field-label">Contact Person</label>
                <input v-model="editForm.contact_person" class="input" placeholder="Full name" />
              </div>
              <div class="field">
                <label class="field-label">Phone</label>
                <input v-model="editForm.contact_phone" class="input" placeholder="+251 9xx xxx xxxx" />
              </div>
            </div>
          </div>

          <div class="edit-section">
            <h3 class="edit-section-title">Location</h3>
            <div class="form-grid">
              <div class="field">
                <label class="field-label">City</label>
                <input v-model="editForm.city" class="input" placeholder="Addis Ababa" />
              </div>
              <div class="field">
                <label class="field-label">Sub-city</label>
                <input v-model="editForm.sub_city" class="input" placeholder="Bole, Kirkos…" />
              </div>
              <div class="field">
                <label class="field-label">Address / Landmark</label>
                <input v-model="editForm.address" class="input" placeholder="Near Edna Mall…" />
              </div>
            </div>
          </div>

          <div class="edit-section">
            <h3 class="edit-section-title">Operations</h3>
            <div class="form-grid">
              <div class="field">
                <label class="field-label">Max Capacity (members/hr)</label>
                <input v-model.number="editForm.max_capacity" type="number" min="1" class="input" />
              </div>
              <div class="field">
                <label class="field-label">Weekday Hours</label>
                <input v-model="editForm.opening_hours.weekdays" class="input" placeholder="08:00–20:00" />
              </div>
              <div class="field">
                <label class="field-label">Weekend Hours</label>
                <input v-model="editForm.opening_hours.weekends" class="input" placeholder="10:00–16:00" />
              </div>
            </div>
          </div>

          <div class="edit-section">
            <h3 class="edit-section-title">Facilities &amp; Amenities</h3>
            <p class="edit-hint">Add features like "Swimming Pool", "Sauna", "Free Weights", etc.</p>
            <div class="chip-input-wrap">
              <span v-for="(f, i) in editForm.facilities" :key="i" class="facility-chip editable-chip">
                {{ f }}
                <button type="button" class="chip-remove" @click="removeFacility(i)">×</button>
              </span>
              <input
                v-model="newFacility"
                class="chip-input"
                placeholder="Type and press Enter…"
                @keydown.enter.prevent="addFacility"
                @keydown.comma.prevent="addFacility"
              />
            </div>
          </div>

          <p v-if="editError" class="form-error">{{ editError }}</p>

          <div class="edit-actions">
            <button class="btn-cancel" @click="tab = 'profile'">Cancel</button>
            <button class="btn-save" :disabled="editSaving" @click="saveProfile">
              <span v-if="editSaving" class="spinner-sm"></span>
              {{ editSaving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </template>

      <!-- ─────────── TAB: UPGRADE REQUEST ─────────── -->
      <template v-else-if="tab === 'upgrade'">

        <!-- Pending request banner -->
        <div v-if="pendingRequest" class="pending-upgrade-banner">
          <div class="pub-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p class="pub-title">Upgrade request pending</p>
            <p class="pub-sub">You have a pending request for <strong>{{ tierLabel(pendingRequest.requested_tier) }}</strong> tier. The admin will review it shortly.</p>
          </div>
        </div>

        <!-- New request form (only if no pending) -->
        <div v-if="!pendingRequest" class="upgrade-card">
          <h2 class="edit-title">Request Tier Upgrade</h2>
          <p class="upgrade-sub">Your current tier: <strong class="tier-inline" :class="`tier--${gym.tier}`">{{ tierLabel(gym.tier) }}</strong></p>

          <div class="field" style="margin-bottom:16px">
            <label class="field-label">Requested Tier <span class="req">*</span></label>
            <div class="tier-grid">
              <button
                v-for="t in upgradableTiers"
                :key="t.value"
                type="button"
                class="tier-btn"
                :class="{ selected: upgradeForm.requested_tier === t.value }"
                @click="upgradeForm.requested_tier = t.value"
              >
                <span class="tier-dot" :class="`dot-${t.value}`"></span>
                <span>{{ t.label }}</span>
              </button>
            </div>
            <p v-if="!upgradableTiers.length" class="upgrade-at-max">You are already on the highest available tier.</p>
          </div>

          <div class="field" style="margin-bottom:20px">
            <label class="field-label">Tell us why you deserve the upgrade <span class="req">*</span></label>
            <textarea
              v-model="upgradeForm.message"
              class="input textarea"
              rows="4"
              placeholder="e.g. We have added a swimming pool, spa, and hydrotherapy facilities and now offer 24/7 service…"
            ></textarea>
          </div>

          <p v-if="upgradeError" class="form-error">{{ upgradeError }}</p>

          <div class="edit-actions">
            <button
              class="btn-save"
              :disabled="upgradeSaving || !upgradeForm.requested_tier || !upgradeForm.message"
              @click="submitUpgrade"
            >
              <span v-if="upgradeSaving" class="spinner-sm"></span>
              {{ upgradeSaving ? 'Submitting…' : 'Submit Upgrade Request' }}
            </button>
          </div>
        </div>

        <!-- Request history -->
        <div v-if="upgradeRequests.length" class="card" style="margin-top:20px">
          <h3 class="card-title">Request History</h3>
          <div class="upgrade-history">
            <div v-for="r in upgradeRequests" :key="r.id" class="history-row">
              <div class="history-left">
                <span class="history-tier">→ {{ tierLabel(r.requested_tier) }}</span>
                <span class="history-date">{{ formatDate(r.created_at) }}</span>
              </div>
              <div class="history-right">
                <span class="history-status" :class="`hs--${r.status}`">{{ r.status }}</span>
                <p v-if="r.rejection_reason" class="history-reason">Reason: {{ r.rejection_reason }}</p>
              </div>
            </div>
          </div>
        </div>

      </template>
    </template>

    <div v-else class="pf-error">
      <p>Failed to load facility info.</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">{{ toast.message }}</div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

/* ── Types ─────────────────────────────────────────────────── */
interface OpeningHours { weekdays?: string; weekends?: string; summary?: string; [k: string]: string | undefined }
interface GymInfo {
  id: number; name: string; tier: string; city: string; sub_city: string | null
  address: string | null; contact_person: string; contact_phone: string; contact_email: string
  max_capacity: number; facilities: string[]; opening_hours: OpeningHours | null
  is_active: boolean; partnership_start: string | null
}
interface Plan   { id: number; name: string; tier: string; is_active: boolean }
interface UpgradeRequest {
  id: number; requested_tier: string; message: string | null; status: string
  rejection_reason: string | null; reviewed_at: string | null; created_at: string
}

/* ── State ─────────────────────────────────────────────────── */
const loading = ref(true)
const gym     = ref<GymInfo | null>(null)
const tab     = ref<'profile' | 'edit' | 'upgrade'>('profile')
const plans   = ref<Plan[]>([])

/* Edit form */
const editSaving = ref(false)
const editError  = ref('')
const newFacility = ref('')
const editForm = reactive({
  name: '', contact_person: '', contact_phone: '',
  city: '', sub_city: '', address: '',
  max_capacity: 0,
  facilities: [] as string[],
  opening_hours: { weekdays: '', weekends: '' } as OpeningHours,
})

/* Upgrade form */
const upgradeRequests = ref<UpgradeRequest[]>([])
const upgradeError    = ref('')
const upgradeSaving   = ref(false)
const upgradeForm = reactive({ requested_tier: '', message: '' })

/* Toast */
const toast = reactive({ show: false, message: '', type: 'success' })
let toastTimer: ReturnType<typeof setTimeout>
function showToast(msg: string, type = 'success') {
  clearTimeout(toastTimer)
  toast.show = true; toast.message = msg; toast.type = type
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

/* ── Load ──────────────────────────────────────────────────── */
async function load() {
  loading.value = true
  try {
    const [dashRes, planRes] = await Promise.all([
      api.get<{ gym: GymInfo }>('partner/dashboard'),
      api.get<Plan[]>('membership-plans').catch(() => [] as Plan[]),
    ])
    gym.value   = dashRes.gym
    plans.value = (Array.isArray(planRes) ? planRes : []).filter(p => p.is_active)
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function loadRequests() {
  try {
    const res = await api.get<UpgradeRequest[]>('partner/upgrade-requests')
    upgradeRequests.value = Array.isArray(res) ? res : []
  } catch { upgradeRequests.value = [] }
}

/* ── Tier helpers ──────────────────────────────────────────── */
const TIER_RANK: Record<string, number> = { basic: 0, basic_plus: 1, premium: 2, platinum: 3 }

function normalizeTier(t: string): string {
  const s = t.toLowerCase().replace(/^[a-z]+_(?=basic|premium|platinum|gold|silver)/i, '')
  if (s.includes('platinum') || s.includes('gold')) return 'platinum'
  if (s.includes('premium')) return 'premium'
  if (s.includes('basic_plus') || s.includes('plus')) return 'basic_plus'
  return 'basic'
}

function tierLabel(t: string): string {
  const canonical = normalizeTier(t)
  const plan = plans.value.find(p => normalizeTier(p.tier) === canonical)
  if (plan) return plan.name
  return canonical.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Plans that are strictly higher than the current gym tier */
const upgradableTiers = computed(() => {
  if (!gym.value) return []
  const currentRank = TIER_RANK[normalizeTier(gym.value.tier)] ?? 0
  const seen = new Set<string>()
  const result: { value: string; label: string }[] = []
  const sorted = [...plans.value].sort((a, b) => (TIER_RANK[normalizeTier(a.tier)] ?? 0) - (TIER_RANK[normalizeTier(b.tier)] ?? 0))
  for (const p of sorted) {
    const canonical = normalizeTier(p.tier)
    const rank = TIER_RANK[canonical] ?? 0
    if (rank > currentRank && !seen.has(canonical)) {
      seen.add(canonical)
      result.push({ value: canonical, label: p.name })
    }
  }
  return result
})

const pendingRequest = computed(() =>
  upgradeRequests.value.find(r => r.status === 'pending') ?? null
)

/* ── Edit profile ──────────────────────────────────────────── */
function startEdit() {
  if (!gym.value) return
  const g = gym.value
  const hours = typeof g.opening_hours === 'object' && g.opening_hours
    ? g.opening_hours : {}
  Object.assign(editForm, {
    name: g.name, contact_person: g.contact_person, contact_phone: g.contact_phone,
    city: g.city, sub_city: g.sub_city ?? '', address: g.address ?? '',
    max_capacity: g.max_capacity,
    facilities: [...(g.facilities ?? [])],
    opening_hours: { weekdays: hours.weekdays ?? '', weekends: hours.weekends ?? '' },
  })
  editError.value = ''
  tab.value = 'edit'
}

function addFacility() {
  const val = newFacility.value.trim().replace(/,+$/, '')
  if (val && !editForm.facilities.includes(val)) editForm.facilities.push(val)
  newFacility.value = ''
}
function removeFacility(i: number) { editForm.facilities.splice(i, 1) }

async function saveProfile() {
  editError.value = ''
  editSaving.value = true
  try {
    const payload = {
      name:           editForm.name,
      contact_person: editForm.contact_person,
      contact_phone:  editForm.contact_phone,
      city:           editForm.city,
      sub_city:       editForm.sub_city || undefined,
      address:        editForm.address || undefined,
      max_capacity:   editForm.max_capacity,
      facilities:     editForm.facilities,
      opening_hours:  {
        weekdays: editForm.opening_hours.weekdays || undefined,
        weekends: editForm.opening_hours.weekends || undefined,
      },
    }
    const res = await api.put<{ message: string; gym: GymInfo }>('partner/profile', payload)
    gym.value = res.gym
    tab.value = 'profile'
    showToast('Profile updated successfully.')
  } catch (e: unknown) {
    editError.value = e instanceof Error ? e.message : 'Failed to save profile.'
  } finally {
    editSaving.value = false
  }
}

/* ── Upgrade request ───────────────────────────────────────── */
async function submitUpgrade() {
  upgradeError.value = ''
  if (!upgradeForm.requested_tier) { upgradeError.value = 'Please select a tier.'; return }
  if (!upgradeForm.message.trim())  { upgradeError.value = 'Please explain why you deserve this upgrade.'; return }
  upgradeSaving.value = true
  try {
    await api.post('partner/upgrade-request', {
      requested_tier: upgradeForm.requested_tier,
      message:        upgradeForm.message,
    })
    upgradeForm.requested_tier = ''
    upgradeForm.message = ''
    await loadRequests()
    showToast('Upgrade request submitted. The admin will review it shortly.')
  } catch (e: unknown) {
    upgradeError.value = e instanceof Error ? e.message : 'Failed to submit request.'
  } finally {
    upgradeSaving.value = false
  }
}

/* ── Misc ──────────────────────────────────────────────────── */
const parsedHours = computed<OpeningHours | null>(() => {
  if (!gym.value?.opening_hours) return null
  const raw = gym.value.opening_hours
  if (typeof raw === 'object') return raw as OpeningHours
  try { return JSON.parse(raw as unknown as string) as OpeningHours } catch { return { summary: String(raw) } }
})

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.pf { display: flex; flex-direction: column; gap: 18px; }

.pf-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 0; color: #64748b;
}
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #4CD964;
  border-radius: 50%; animation: spin .7s linear infinite;
}
.spinner-sm {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  border-radius: 50%; animation: spin .7s linear infinite;
  margin-right: 6px; vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

.pf-error {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 0; color: #ef4444;
}
.retry-btn {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: #4CD964; color: #fff; font-weight: 600; cursor: pointer;
}

/* Tab bar */
.tab-bar { display: flex; gap: 6px; background: #f1f5f9; border-radius: 10px; padding: 4px; }
.tab-btn {
  flex: 1; padding: 8px 12px; border: none; background: transparent;
  border-radius: 7px; font-size: 0.84rem; font-weight: 500; color: #64748b;
  cursor: pointer; transition: all .18s; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.tab-btn.active { background: #fff; color: #0f172a; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.tab-badge {
  min-width: 18px; height: 18px; border-radius: 9px;
  background: #f59e0b; color: #fff; font-size: 0.7rem; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 5px;
}

/* Profile card */
.profile-card {
  display: flex; align-items: center; gap: 20px;
  background: #fff; border-radius: 14px; padding: 22px 26px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.profile-avatar {
  width: 60px; height: 60px; border-radius: 16px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CD964, #2EB84B);
  color: #fff; font-weight: 800; font-size: 1.3rem;
  display: flex; align-items: center; justify-content: center;
}
.profile-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.profile-name { font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0; }
.profile-sub  { font-size: 0.84rem; color: #64748b; margin: 0 0 4px; }
.profile-since { font-size: 0.8rem; color: #94a3b8; margin: 0; }

/* Tier + status badges */
.tier-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;
}
.tier--basic      { background: #eff6ff; color: #3b82f6; }
.tier--basic_plus { background: #f0fdf4; color: #16a34a; }
.tier--premium    { background: #fff7ed; color: #ea580c; }
.tier--platinum   { background: #faf5ff; color: #9333ea; }
.tier-inline { display: inline-block; padding: 1px 8px; border-radius: 8px; font-weight: 700; }
.status-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.badge--active   { background: #dcfce7; color: #16a34a; }
.badge--inactive { background: #fee2e2; color: #dc2626; }

/* Info grid */
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.info-card {
  background: #fff; border-radius: 12px; padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.info-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.82rem; font-weight: 700; color: #374151; text-transform: uppercase;
  letter-spacing: .04em; margin: 0 0 14px;
}
.info-rows { display: flex; flex-direction: column; gap: 8px; }
.info-row { display: flex; justify-content: space-between; gap: 8px; font-size: 0.85rem; }
.info-key { color: #94a3b8; font-weight: 500; flex-shrink: 0; }
.info-val { color: #0f172a; text-align: right; }
.val--active { color: #16a34a; font-weight: 600; }
.val--inactive { color: #dc2626; font-weight: 600; }
.opening-hours-row { align-items: flex-start; }
.hours-block { display: flex; flex-direction: column; gap: 4px; text-align: right; }
.hours-line { display: flex; gap: 8px; justify-content: flex-end; }
.hours-day  { color: #94a3b8; font-size: 0.8rem; }
.hours-time { color: #0f172a; font-size: 0.83rem; }

/* Facilities card */
.card {
  background: #fff; border-radius: 12px; padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.82rem; font-weight: 700; color: #374151; text-transform: uppercase;
  letter-spacing: .04em; margin: 0 0 14px;
}
.facilities-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.facility-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; background: #f1f5f9; border-radius: 20px;
  font-size: 0.82rem; color: #475569;
}
.editable-chip { background: #e0f2fe; color: #0369a1; }
.chip-remove {
  border: none; background: none; cursor: pointer; font-size: 1rem;
  color: #0369a1; line-height: 1; padding: 0;
}

/* Edit card */
.edit-card, .upgrade-card {
  background: #fff; border-radius: 14px; padding: 26px 28px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.edit-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 22px; }
.edit-section { margin-bottom: 24px; }
.edit-section-title {
  font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: #94a3b8; margin: 0 0 12px;
}
.edit-hint { font-size: 0.82rem; color: #94a3b8; margin: -8px 0 10px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
.req { color: #ef4444; }
.input {
  padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 0.9rem; color: #0f172a; outline: none; transition: border-color .15s;
  font-family: inherit;
}
.input:focus { border-color: #4CD964; }
.textarea { resize: vertical; min-height: 90px; }

.chip-input-wrap {
  display: flex; flex-wrap: wrap; gap: 7px; align-items: center;
  border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;
  min-height: 44px;
}
.chip-input {
  border: none; outline: none; font-size: 0.88rem; color: #0f172a;
  min-width: 120px; flex: 1; background: transparent;
}

.edit-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.btn-cancel {
  padding: 9px 20px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #fff; color: #64748b; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.btn-save {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 22px; border-radius: 8px; border: none;
  background: #4CD964; color: #fff; font-weight: 600; font-size: 0.88rem;
  cursor: pointer; transition: opacity .15s;
}
.btn-save:disabled { opacity: .55; cursor: not-allowed; }
.form-error { color: #dc2626; font-size: 0.84rem; margin-top: 4px; }

/* Upgrade section */
.upgrade-sub { color: #64748b; font-size: 0.88rem; margin: -14px 0 20px; }
.upgrade-at-max { color: #94a3b8; font-size: 0.84rem; margin-top: 6px; }
.tier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 8px; }
.tier-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
  background: #fff; cursor: pointer; font-size: 0.88rem; font-weight: 500; color: #374151;
  transition: all .15s;
}
.tier-btn.selected { border-color: #4CD964; background: #f0fdf4; color: #16a34a; font-weight: 600; }
.tier-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-basic       { background: #3b82f6; }
.dot-basic_plus  { background: #22c55e; }
.dot-premium     { background: #f97316; }
.dot-platinum    { background: #a855f7; }

/* Pending upgrade banner */
.pending-upgrade-banner {
  display: flex; align-items: flex-start; gap: 14px;
  background: #fefce8; border: 1.5px solid #fde047; border-radius: 12px; padding: 16px 20px;
}
.pub-icon { color: #ca8a04; flex-shrink: 0; margin-top: 2px; }
.pub-title { font-size: 0.9rem; font-weight: 700; color: #92400e; margin: 0 0 4px; }
.pub-sub   { font-size: 0.84rem; color: #78350f; margin: 0; }

/* History */
.upgrade-history { display: flex; flex-direction: column; gap: 12px; }
.history-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 12px 16px; background: #f8fafc; border-radius: 8px; gap: 12px;
}
.history-left { display: flex; flex-direction: column; gap: 3px; }
.history-tier  { font-size: 0.88rem; font-weight: 600; color: #0f172a; }
.history-date  { font-size: 0.78rem; color: #94a3b8; }
.history-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.history-status {
  display: inline-block; padding: 2px 10px; border-radius: 10px;
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
}
.hs--pending  { background: #fef9c3; color: #854d0e; }
.hs--approved { background: #dcfce7; color: #15803d; }
.hs--rejected { background: #fee2e2; color: #b91c1c; }
.history-reason { font-size: 0.78rem; color: #94a3b8; text-align: right; max-width: 220px; }

/* Toast */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 12px 24px; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
  box-shadow: 0 4px 20px rgba(0,0,0,.18); z-index: 9999; pointer-events: none;
  animation: slideUp .25s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 12px); } }
.toast--success { background: #1e293b; color: #fff; }
.toast--error   { background: #dc2626; color: #fff; }
</style>
