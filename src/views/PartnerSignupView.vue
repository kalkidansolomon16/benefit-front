<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import BranchFields from '@/components/BranchFields.vue'
import LocationPicker from '@/components/LocationPicker.vue'
import { mapsLink as toMapsLink, type PlaceAddress } from '@/utils/geo'
import {
  emptyBranch,
  branchValid,
  branchMissing,
  branchPayload,
  type BranchForm,
} from '@/utils/branches'

// -- Step state --------------------------------------------------------------
const step = ref(1)
const TOTAL_STEPS = 4

// ------------------------------------------------------------------------------
// STEP 1 — Business Identity & Category
// ------------------------------------------------------------------------------
const facilityName = ref('')
const selectedCategories = ref<string[]>([])
const contactPerson = ref('')
const contactPhone = ref('')
const contactEmail = ref('')
const tinNumber = ref('')
const website = ref('')

/** Adds https:// when the partner typed just "www.example.com". */
function normalizedWebsite(): string {
  const w = website.value.trim()
  if (!w) return ''
  return /^https?:\/\//i.test(w) ? w : 'https://' + w
}
const websiteOk = computed(() => {
  const w = normalizedWebsite()
  if (!w) return true
  try {
    const u = new URL(w)
    return /\./.test(u.hostname)
  } catch {
    return false
  }
})

const serviceCategories = [
  { id: 'gym', label: '🏋️ Gym & Fitness Center' },
  { id: 'swimming', label: '🏊 Swimming Pool' },
  { id: 'spa', label: '💆 Spa & Hydrotherapy' },
  { id: 'reflexology', label: '🦶 Reflexology & Massage Center' },
  { id: 'cinema', label: '🎬 Cinema / Theatre' },
  { id: 'yoga', label: '🧘 Yoga & Pilates Studio' },
  { id: 'sauna', label: '🧖 Sauna & Steam Room' },
  { id: 'nutrition', label: '🥗 Nutrition & Wellness Clinic' },
]

function toggleCategory(id: string) {
  const idx = selectedCategories.value.indexOf(id)
  if (idx === -1) selectedCategories.value.push(id)
  else selectedCategories.value.splice(idx, 1)
}

const step1Valid = computed(() => {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.value)
  const phoneOk = contactPhone.value.replace(/\s/g, '').length >= 9
  return (
    facilityName.value.trim() &&
    selectedCategories.value.length > 0 &&
    contactPerson.value.trim() &&
    phoneOk &&
    emailOk &&
    tinNumber.value.trim() &&
    websiteOk.value
  )
})

// ------------------------------------------------------------------------------
// STEP 2 — Location Details
// ------------------------------------------------------------------------------
const city = ref('')
const subCity = ref('')
const woreda = ref('')
const landmark = ref('')
const mapsLink = ref('')

const cities = [
  'Addis Ababa',
  'Hawassa',
  'Adama (Nazret)',
  'Dire Dawa',
  'Bahir Dar',
  'Mekelle',
  'Gondar',
  'Jimma',
  'Dessie',
  'Jijiga',
]

const subCitiesMap: Record<string, string[]> = {
  'Addis Ababa': [
    'Arada',
    'Addis Ketema',
    'Akaki Kality',
    'Bole',
    'Gullele',
    'Kirkos',
    'Kolfe Keranio',
    'Lideta',
    'Nifas Silk-Lafto',
    'Yeka',
    'Lemi Kura',
  ],
}

const availableSubCities = computed(() => subCitiesMap[city.value] ?? [])

// Reset sub-city when city changes (unless it still belongs to the new city,
// e.g. both were just filled in from the map pin)
watch(city, () => {
  if (!availableSubCities.value.includes(subCity.value)) subCity.value = ''
})

// Map pin for the main location (auto-detected, adjustable)
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)

watch([latitude, longitude], ([lat, lng]) => {
  mapsLink.value = lat != null && lng != null ? toMapsLink({ lat, lng }) : ''
})

function onMainAddress(a: PlaceAddress) {
  if (a.city && cities.includes(a.city)) city.value = a.city
  const subs = subCitiesMap[a.city] ?? []
  if (a.sub_city && subs.includes(a.sub_city)) subCity.value = a.sub_city
  if (a.landmark && !landmark.value.trim()) landmark.value = a.landmark
}

/** Main location pin, used as the starting point for each branch map */
const mainPin = computed(() =>
  latitude.value != null && longitude.value != null
    ? { lat: latitude.value, lng: longitude.value, label: 'Main location' }
    : null,
)

const step2Valid = computed(() => city.value.trim() && woreda.value.trim())

// ------------------------------------------------------------------------------
// STEP 3 — Facility Operations & Capacity
// ------------------------------------------------------------------------------
const weekdayOpen = ref('06:00')
const weekdayClose = ref('22:00')
const weekendOpen = ref('08:00')
const weekendClose = ref('20:00')
const weekendClosed = ref(false)
const maxCapacity = ref('')
const selectedAmenities = ref<string[]>([])

const amenitiesList = [
  { id: 'locker', label: '🚪 Locker Rooms' },
  { id: 'parking', label: '🅿️ Parking' },
  { id: 'classes', label: '👥 Group Classes' },
  { id: 'personal', label: '💪 Personal Training' },
  { id: 'cafe', label: '☕ Café / Juice Bar' },
  { id: 'wifi', label: '📶 Free Wi-Fi' },
  { id: 'shower', label: '🚿 Showers' },
  { id: 'ac', label: '❄️ Air Conditioning' },
]

function toggleAmenity(id: string) {
  const idx = selectedAmenities.value.indexOf(id)
  if (idx === -1) selectedAmenities.value.push(id)
  else selectedAmenities.value.splice(idx, 1)
}

// -- Branches (other locations of the same business) ---------------------------
const hasBranches = ref(false)
const mainBranchName = ref('')
const branches = ref<BranchForm[]>([])

function toggleHasBranches() {
  hasBranches.value = !hasBranches.value
  if (hasBranches.value && branches.value.length === 0) branches.value.push(emptyBranch())
}
function addBranch() {
  branches.value.push(emptyBranch())
}
function removeBranch(i: number) {
  branches.value.splice(i, 1)
  if (branches.value.length === 0) hasBranches.value = false
}

const branchesValid = computed(
  () => !hasBranches.value || (mainBranchName.value.trim() && branches.value.every((b) => branchValid(b, 'gym', false)))
)

// Facility standards: each must be answered yes or no (null = not answered yet)
const standardsQuestions = [
  { key: 'has_permits', text: 'Does the facility have approval for use and current permits required to conduct business?' },
  { key: 'has_certified_equipment', text: 'Does the facility have certified equipment and devices ensuring the safety of exercisers?' },
  { key: 'has_reception', text: 'Does the facility have a permanent reception with staff?' },
] as const
type StandardKey = (typeof standardsQuestions)[number]['key']
const standards = ref<Record<StandardKey, boolean | null>>({
  has_permits: null,
  has_certified_equipment: null,
  has_reception: null,
})
const standardsAnswered = computed(() => Object.values(standards.value).every((v) => v !== null))

// Human-readable list of what still blocks the Continue button on step 3
const step3Missing = computed(() => {
  const out: string[] = []
  if (!standardsAnswered.value) out.push('facility standards questions')
  if (!(Number(maxCapacity.value) > 0)) out.push('main location capacity')
  if (weekdayClose.value <= weekdayOpen.value) out.push('main weekday hours')
  if (!weekendClosed.value && weekendClose.value <= weekendOpen.value) out.push('main weekend hours')
  if (hasBranches.value) {
    if (!mainBranchName.value.trim()) out.push('name of the main location')
    branches.value.forEach((b, i) => {
      if (!branchValid(b, 'gym', false)) out.push(`Branch ${i + 1}: ${branchMissing(b, 'gym', false).join(', ')}`)
    })
  }
  return out
})

const step3Valid = computed(() => {
  const cap = Number(maxCapacity.value)
  return (
    standardsAnswered.value &&
    branchesValid.value &&
    weekdayOpen.value &&
    weekdayClose.value &&
    weekdayClose.value > weekdayOpen.value &&
    cap > 0 &&
    (weekendClosed.value ||
      (weekendOpen.value && weekendClose.value && weekendClose.value > weekendOpen.value))
  )
})

// ------------------------------------------------------------------------------
// STEP 4 — Review & submit
// No password here: once FitAccess approves the application, the partner
// account is created and the login details (temporary password) are emailed.
// ------------------------------------------------------------------------------
const agreeTerms = ref(false)
const loading = ref(false)
const error = ref('')
const submittedRef = ref('')
const step4Valid = computed(() => agreeTerms.value)

// ------------------------------------------------------------------------------
// Navigation
// ------------------------------------------------------------------------------
const canProceed = computed(() => {
  if (step.value === 1) return step1Valid.value
  if (step.value === 2) return step2Valid.value
  if (step.value === 3) return step3Valid.value
  return step4Valid.value
})

function next() {
  if (!canProceed.value) return
  error.value = ''
  step.value++
}
function back() {
  error.value = ''
  step.value--
}

// ------------------------------------------------------------------------------
// Submit
// ------------------------------------------------------------------------------
async function handleSubmit() {
  if (!step4Valid.value) return
  loading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('facility_name', facilityName.value)
    fd.append('categories', JSON.stringify(selectedCategories.value))
    fd.append('contact_person', contactPerson.value)
    fd.append('contact_phone', '+251' + contactPhone.value.replace(/\s/g, ''))
    fd.append('contact_email', contactEmail.value)
    fd.append('tin_number', tinNumber.value)
    if (normalizedWebsite()) fd.append('website', normalizedWebsite())
    for (const q of standardsQuestions) fd.append(q.key, standards.value[q.key] ? '1' : '0')

    fd.append('city', city.value)
    fd.append('sub_city', subCity.value)
    fd.append('woreda', woreda.value)
    fd.append('landmark', landmark.value)
    fd.append('google_maps_link', mapsLink.value)
    if (latitude.value != null && longitude.value != null) {
      fd.append('latitude', String(latitude.value))
      fd.append('longitude', String(longitude.value))
    }

    const hours = weekendClosed.value
      ? `Weekdays ${weekdayOpen.value}–${weekdayClose.value} | Weekends: Closed`
      : `Weekdays ${weekdayOpen.value}–${weekdayClose.value} | Weekends ${weekendOpen.value}–${weekendClose.value}`
    fd.append('operating_hours', hours)
    fd.append('weekday_open', weekdayOpen.value)
    fd.append('weekday_close', weekdayClose.value)
    fd.append('weekend_open', weekendClosed.value ? '' : weekendOpen.value)
    fd.append('weekend_close', weekendClosed.value ? '' : weekendClose.value)
    fd.append('max_capacity', maxCapacity.value)
    fd.append('amenities', JSON.stringify(selectedAmenities.value))
    if (hasBranches.value && branches.value.length) {
      fd.append('branch_name', mainBranchName.value.trim())
      fd.append('branches', JSON.stringify(branches.value.map((b) => branchPayload(b, 'gym', false))))
    }

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register/partner`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fd,
    })
    if (!res.ok) {
      const data = await res.json()
      let firstErr: string | null = null
      if (data.errors) {
        const [field, msgs] = Object.entries(data.errors as Record<string, string[]>)[0] ?? []
        firstErr = msgs?.[0] ?? 'Validation error'
        // Say which branch an error belongs to (e.g. "branches.0.email")
        const m = field?.match(/^branches\.(\d+)\./)
        if (m) {
          const i = Number(m[1])
          const name = branches.value[i]?.branch_name.trim()
          firstErr = `Branch ${i + 1}${name ? ` (${name})` : ''}: ${firstErr}`
        }
      }
      throw new Error(firstErr || data.message || 'Your application could not be sent. Please try again.')
    }
    const data = await res.json()
    submittedRef.value = data.reference ?? 'received'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

const stepLabels = ['Identity', 'Location', 'Operations', 'Review']
</script>

<template>
  <div class="signup-page">
    <div class="signup-card">
      <!-- Brand -->
      <RouterLink to="/" class="brand" aria-label="FitAccess home">
        <span class="brand-icon">F</span>
        <span class="brand-name">FitAccess</span>
        <span class="brand-tag">Partner Portal</span>
      </RouterLink>

      <!-- -- Application sent -- -->
      <div v-if="submittedRef" class="card-body done">
        <div class="done-icon">
          <svg width="34" height="34" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 class="heading done-heading">Thank you!</h1>
        <p class="subtext">
          Your application for <strong>{{ facilityName }}</strong> has been registered<template v-if="submittedRef !== 'received'">
          under number <strong class="done-ref">{{ submittedRef }}</strong></template>. We have sent a
          confirmation to <strong>{{ contactEmail }}</strong>.
        </p>
        <div class="done-steps">
          <p class="done-steps-title">What now?</p>
          <ol>
            <li>Our team will review your application and contact you within 3 business days.</li>
            <li>We check that your facility meets our terms of cooperation.</li>
            <li>Once approved, you receive an email with your login details and a temporary password.
              You will choose your own password when you first sign in.</li>
          </ol>
        </div>
        <div class="actions">
          <RouterLink to="/" class="btn-next btn-partner active done-btn">Back to the homepage</RouterLink>
        </div>
      </div>

      <!-- Progress -->
      <div v-if="!submittedRef" class="progress-wrap">
        <div class="progress-steps">
          <div
            v-for="n in TOTAL_STEPS"
            :key="n"
            class="progress-step"
            :class="{ done: n < step, active: n === step }"
          >
            <div class="step-dot">
              <svg
                v-if="n < step"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ n }}</span>
            </div>
            <span class="step-label">{{ stepLabels[n - 1] }}</span>
          </div>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- -- STEP 1: Business Identity & Category -- -->
      <div v-if="!submittedRef && step === 1" class="card-body">
        <h1 class="heading">Business identity</h1>
        <div class="authority-notice">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Only the person who has authority to represent this facility should register here.
        </div>
        <p class="subtext">Tell us about your facility so FitAccess can verify and onboard you.</p>

        <div class="fields">
          <!-- Facility Name -->
          <div class="field-group">
            <label class="field-label">Official Facility Name <span class="req">*</span></label>
            <input
              v-model="facilityName"
              type="text"
              class="input"
              placeholder="e.g. Sheraton Addis Fitness Center"
            />
          </div>

          <!-- Service Categories -->
          <div class="field-group">
            <label class="field-label">
              Service Category <span class="req">*</span>
              <span class="optional">(select all that apply)</span>
            </label>
            <div class="category-grid">
              <button
                v-for="cat in serviceCategories"
                :key="cat.id"
                type="button"
                class="cat-btn"
                :class="{ selected: selectedCategories.includes(cat.id) }"
                @click="toggleCategory(cat.id)"
              >
                <span class="cat-check">
                  <svg
                    v-if="selectedCategories.includes(cat.id)"
                    width="11"
                    height="11"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Contact Person -->
          <div class="field-group">
            <label class="field-label">Primary Contact Person <span class="req">*</span></label>
            <input
              v-model="contactPerson"
              type="text"
              class="input"
              placeholder="Owner or General Manager full name"
            />
          </div>

          <!-- Phone + Email -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Contact Phone <span class="req">*</span></label>
              <div class="phone-wrap">
                <div class="phone-prefix">
                  <span class="flag">🇪🇹</span>
                  <span>+251</span>
                </div>
                <input
                  v-model="contactPhone"
                  type="tel"
                  class="input phone-input"
                  placeholder="91 123 4567"
                  maxlength="11"
                />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Contact Email <span class="req">*</span></label>
              <input
                v-model="contactEmail"
                type="email"
                class="input"
                placeholder="info@yourfacility.et"
              />
            </div>
          </div>

          <!-- TIN -->
          <div class="field-group">
            <label class="field-label"
              >TIN (Taxpayer Identification Number) <span class="req">*</span></label
            >
            <input
              v-model="tinNumber"
              type="text"
              class="input"
              placeholder="e.g. 0021234567"
              maxlength="20"
            />
            <p class="field-hint">Your 10-digit tax registration number issued by ERCA</p>
          </div>

          <!-- Website (optional) -->
          <div class="field-group">
            <label class="field-label">Website <span class="optional">(optional)</span></label>
            <input
              v-model="website"
              type="text"
              inputmode="url"
              class="input"
              placeholder="https://www.example.com"
              maxlength="255"
              autocomplete="url"
            />
            <p v-if="!websiteOk" class="field-hint error-hint">Please enter a valid website address, e.g. www.example.com</p>
          </div>

        </div>
        <!-- /fields -->

        <div class="actions">
          <button
            class="btn-next"
            :class="{ active: step1Valid }"
            :disabled="!step1Valid"
            @click="next"
          >
            Continue
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p class="signin-link">Already a partner? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>

      <!-- -- STEP 2: Location Details -- -->
      <div v-else-if="step === 2" class="card-body">
        <button class="back-btn" @click="back">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 class="heading">Location details</h1>
        <p class="subtext">Help FitAccess members find your facility on the map.</p>

        <div class="fields">
          <!-- Map -->
          <div class="field-group">
            <label class="field-label">Facility location on the map <span class="optional">(recommended)</span></label>
            <LocationPicker
              v-model:lat="latitude"
              v-model:lng="longitude"
              auto-locate
              @address="onMainAddress"
            />
            <p class="field-hint">
              We detect your location automatically. If you are not at the facility right now,
              search for it or drag the pin to its entrance. City, sub-city and landmark are filled in
              from the pin.
            </p>
          </div>

          <!-- City + Sub-City -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">City <span class="req">*</span></label>
              <div class="select-wrap">
                <select v-model="city" class="input select-input">
                  <option value="" disabled>Select city</option>
                  <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
                </select>
                <svg
                  class="select-arrow"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">
                Sub-City
                <span v-if="availableSubCities.length" class="optional">(optional)</span>
                <span v-else class="optional">(N/A for selected city)</span>
              </label>
              <div class="select-wrap">
                <select
                  v-model="subCity"
                  class="input select-input"
                  :disabled="!availableSubCities.length"
                >
                  <option value="">
                    {{ availableSubCities.length ? 'Select sub-city' : 'Not applicable' }}
                  </option>
                  <option v-for="sc in availableSubCities" :key="sc" :value="sc">{{ sc }}</option>
                </select>
                <svg
                  class="select-arrow"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Woreda & House No. -->
          <div class="field-group">
            <label class="field-label">Woreda & House Number <span class="req">*</span></label>
            <input
              v-model="woreda"
              type="text"
              class="input"
              placeholder="e.g. Woreda 03, House No. 247"
            />
            <p class="field-hint">Used for physical verification and local mapping</p>
          </div>

          <!-- Landmark -->
          <div class="field-group">
            <label class="field-label"
              >Specific Landmark / Neighborhood <span class="optional">(optional)</span></label
            >
            <input
              v-model="landmark"
              type="text"
              class="input"
              placeholder='e.g. "Behind Edna Mall, next to Commercial Bank"'
            />
            <p class="field-hint">Help members find you easily on foot or by taxi</p>
          </div>
        </div>

        <div class="actions">
          <button
            class="btn-next"
            :class="{ active: step2Valid }"
            :disabled="!step2Valid"
            @click="next"
          >
            Continue
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- -- STEP 3: Facility Operations & Capacity -- -->
      <div v-else-if="step === 3" class="card-body">
        <button class="back-btn" @click="back">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 class="heading">Operations & capacity</h1>
        <p class="subtext">
          Set your opening hours and how many FitAccess members you can accommodate.
        </p>

        <div class="fields">
          <!-- Operating Hours -->
          <div class="field-group">
            <label class="field-label">Operating Hours <span class="req">*</span></label>

            <!-- Weekdays -->
            <div class="hours-block">
              <div class="hours-label-row">
                <span class="hours-day-label">Weekdays (Mon – Fri)</span>
              </div>
              <div class="hours-row">
                <div class="hours-field">
                  <label class="time-label">Opens</label>
                  <input v-model="weekdayOpen" type="time" class="input time-input" />
                </div>
                <div class="hours-dash">—</div>
                <div class="hours-field">
                  <label class="time-label">Closes</label>
                  <input v-model="weekdayClose" type="time" class="input time-input" />
                </div>
              </div>
              <p
                v-if="weekdayOpen && weekdayClose && weekdayClose <= weekdayOpen"
                class="field-hint error-hint"
              >
                Closing time must be after opening time.
              </p>
            </div>

            <!-- Weekends -->
            <div class="hours-block">
              <div class="hours-label-row">
                <span class="hours-day-label">Weekends (Sat – Sun)</span>
                <label class="closed-toggle">
                  <input v-model="weekendClosed" type="checkbox" class="checkbox" />
                  <span>Closed on weekends</span>
                </label>
              </div>
              <div v-if="!weekendClosed" class="hours-row">
                <div class="hours-field">
                  <label class="time-label">Opens</label>
                  <input v-model="weekendOpen" type="time" class="input time-input" />
                </div>
                <div class="hours-dash">—</div>
                <div class="hours-field">
                  <label class="time-label">Closes</label>
                  <input v-model="weekendClose" type="time" class="input time-input" />
                </div>
              </div>
              <div v-else class="closed-banner">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                Facility is closed on weekends
              </div>
              <p
                v-if="!weekendClosed && weekendOpen && weekendClose && weekendClose <= weekendOpen"
                class="field-hint error-hint"
              >
                Closing time must be after opening time.
              </p>
            </div>
          </div>

          <!-- Facility standards (required yes/no) -->
          <div v-for="q in standardsQuestions" :key="q.key" class="field-group">
            <label class="field-label">{{ q.text }} <span class="req">*</span></label>
            <div class="yn-row" role="radiogroup" :aria-label="q.text">
              <label class="yn-opt" :class="{ selected: standards[q.key] === false }">
                <input v-model="standards[q.key]" type="radio" :name="q.key" :value="false" />
                <span class="yn-dot"></span> No
              </label>
              <label class="yn-opt" :class="{ selected: standards[q.key] === true }">
                <input v-model="standards[q.key]" type="radio" :name="q.key" :value="true" />
                <span class="yn-dot"></span> Yes
              </label>
            </div>
          </div>

          <!-- Hourly Capacity -->
          <div class="field-group">
            <label class="field-label">Maximum Hourly Capacity <span class="req">*</span></label>
            <div class="capacity-wrap">
              <input
                v-model="maxCapacity"
                type="number"
                class="input capacity-input"
                placeholder="e.g. 80"
                min="1"
                max="9999"
              />
              <span class="capacity-unit">members / hour</span>
            </div>
            <p class="field-hint">
              How many FitAccess members can your facility comfortably accommodate per hour?
            </p>
          </div>

          <!-- Amenities (optional) -->
          <div class="field-group">
            <label class="field-label"
              >Available Amenities
              <span class="optional">(optional — select all that apply)</span></label
            >
            <div class="amenities-grid">
              <button
                v-for="am in amenitiesList"
                :key="am.id"
                type="button"
                class="amenity-btn"
                :class="{ selected: selectedAmenities.includes(am.id) }"
                @click="toggleAmenity(am.id)"
              >
                {{ am.label }}
              </button>
            </div>
          </div>

          <!-- Branches -->
          <div class="field-group branches-box">
            <label class="field-label">Does your business have other branches?</label>
            <p class="field-hint">
              Add every location now. Each branch is listed to members as its own location and, once approved, gets its own login (sent to its email). A branch can only manage itself and sees the other branches read-only; this main location can see and manage them all.
            </p>
            <div class="branch-choice">
              <button type="button" class="amenity-btn" :class="{ selected: !hasBranches }" @click="hasBranches && toggleHasBranches()">
                No, single location
              </button>
              <button type="button" class="amenity-btn" :class="{ selected: hasBranches }" @click="!hasBranches && toggleHasBranches()">
                Yes, we have branches
              </button>
            </div>

            <template v-if="hasBranches">
              <div class="field-group">
                <label class="field-label">
                  Name of this main location <span class="req">*</span>
                </label>
                <input
                  v-model="mainBranchName"
                  type="text"
                  class="input"
                  placeholder="e.g. Head Office, Bole"
                  maxlength="100"
                />
                <p class="field-hint">The location you filled in above. Your other branches go below.</p>
              </div>

              <div v-for="(br, i) in branches" :key="i" class="branch-card">
                <div class="branch-card-head">
                  <span class="branch-card-title">Branch {{ i + 1 }}</span>
                  <button type="button" class="branch-remove" @click="removeBranch(i)">Remove</button>
                </div>
                <BranchFields :model-value="br" :reference="mainPin" :with-password="false" />
              </div>

              <button type="button" class="branch-add" @click="addBranch">+ Add another branch</button>
            </template>
          </div>
        </div>

        <p v-if="!step3Valid && step3Missing.length" class="field-hint error-hint step-missing">
          Still needed: {{ step3Missing.join(' · ') }}
        </p>

        <div class="actions">
          <button
            class="btn-next"
            :class="{ active: step3Valid }"
            :disabled="!step3Valid"
            @click="next"
          >
            Continue
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- -- STEP 4: Create Account -- -->
      <div v-else-if="!submittedRef" class="card-body">
        <button class="back-btn" @click="back">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <!-- Summary chip -->
        <div class="summary-chip">
          <div class="summary-avatar">{{ facilityName.slice(0, 2).toUpperCase() }}</div>
          <div class="summary-info">
            <span class="summary-name">{{ facilityName }}</span>
            <span class="summary-location">{{ subCity ? subCity + ', ' : '' }}{{ city }}</span>
          </div>
        </div>

        <h1 class="heading">Review &amp; submit</h1>
        <p class="subtext">
          Please check your details. After you submit, our team reviews your facility and creates
          your partner account. You do not need to choose a password now.
        </p>

        <div class="fields">
          <div class="review-box">
            <p class="review-title">Facility</p>
            <dl class="review-list">
              <dt>Facility name</dt><dd>{{ facilityName }}</dd>
              <dt>Services</dt><dd>{{ selectedCategories.length }} selected</dd>
              <dt>TIN</dt><dd>{{ tinNumber }}</dd>
              <template v-if="normalizedWebsite()">
                <dt>Website</dt><dd>{{ normalizedWebsite() }}</dd>
              </template>
              <dt>Address</dt><dd>{{ [woreda, subCity, city].filter(Boolean).join(', ') }}</dd>
              <dt>Max. capacity</dt><dd>{{ maxCapacity }} per hour</dd>
              <template v-for="q in standardsQuestions" :key="'r' + q.key">
                <dt>{{ { has_permits: 'Permits', has_certified_equipment: 'Certified equipment', has_reception: 'Staffed reception' }[q.key] }}</dt>
                <dd>{{ standards[q.key] ? 'Yes' : 'No' }}</dd>
              </template>
              <template v-if="hasBranches && branches.length">
                <dt>Other branches</dt><dd>{{ branches.map((b) => b.branch_name).join(', ') }}</dd>
              </template>
            </dl>
          </div>
          <div class="review-box">
            <p class="review-title">Contact person</p>
            <dl class="review-list">
              <dt>Name</dt><dd>{{ contactPerson }}</dd>
              <dt>Email</dt><dd>{{ contactEmail }}</dd>
              <dt>Phone</dt><dd>+251 {{ contactPhone }}</dd>
            </dl>
          </div>
          <p class="review-note">
            Your login details will be sent to <strong>{{ contactEmail }}</strong> once your application is approved.
          </p>

          <!-- Terms -->
          <label class="checkbox-row">
            <input v-model="agreeTerms" type="checkbox" class="checkbox" />
            <span>
              I agree to FitAccess <a href="#" class="link">Partner Terms</a>,
              <a href="#" class="link">Service Agreement</a>, and
              <a href="#" class="link">Privacy Policy</a>.
            </span>
          </label>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="actions">
          <button
            class="btn-next btn-partner"
            :class="{ active: step4Valid && !loading }"
            :disabled="!step4Valid || loading"
            @click="handleSubmit"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>Submit application</span>
          </button>
        </div>

        <div class="review-notice">
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Applications are reviewed by our team within 3 business days.
        </div>

        <p class="signin-link">Already a partner? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>
    </div>
    <!-- /card -->

    <footer class="signup-footer">
      <p class="footer-notice">
        Protected by FitAccess Ethiopia &nbsp;·&nbsp;
        <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
        <a href="#">Partner Terms</a>
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* -- Review step + thank-you ----------------------------------------- */
.review-box { border: 1.5px solid #e8e4dc; border-radius: 14px; padding: 16px 18px; background: #faf9f6; }
.review-title { font-weight: 700; font-size: 0.95rem; margin: 0 0 10px; }
.review-list { display: grid; grid-template-columns: 150px 1fr; gap: 8px 12px; margin: 0; font-size: 0.9rem; }
.review-list dt { color: #57534e; }
.review-list dd { margin: 0; font-weight: 600; word-break: break-word; }
.review-note { font-size: 0.88rem; color: #44403c; margin: 0; }
.done { text-align: center; }
.done-icon { width: 72px; height: 72px; margin: 8px auto 18px; border-radius: 50%; background: #8BE000; color: #0B0C10; display: flex; align-items: center; justify-content: center; }
.done-heading { font-size: 2.2rem; }
.done-ref { white-space: nowrap; }
.done-steps { text-align: left; margin: 22px 0 6px; padding: 18px 20px; border-radius: 14px; background: #faf9f6; border: 1.5px solid #e8e4dc; }
.done-steps-title { font-weight: 700; margin: 0 0 8px; }
.done-steps ol { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 0.92rem; line-height: 1.5; }
.done-btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
@media (max-width: 520px) { .review-list { grid-template-columns: 1fr; gap: 2px; } .review-list dd { margin-bottom: 8px; } }

/* -- Page & Card ------------------------------------------- */
.signup-page {
  min-height: 100vh;
  background: #f0ede8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 16px 0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.signup-card {
  width: 100%;
  max-width: 680px;
  background: #ffffff;
  border: 1px solid #e0dbd4;
  border-radius: 16px;
  padding: 40px 48px 48px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

/* -- Brand ------------------------------------------------- */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
  text-decoration: none;
  width: fit-content;
}
.brand-icon {
  font-size: 1.6rem;
  color: #8BE000;
  line-height: 1;
}
.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #8BE000;
  letter-spacing: -0.01em;
}
.brand-tag {
  margin-left: 4px;
  padding: 3px 10px;
  background: #e8f5e9;
  color: #16a34a;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* -- Progress ---------------------------------------------- */
.progress-wrap {
  margin-bottom: 36px;
}
.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eee;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.3s;
}
.progress-step.active .step-dot {
  background: #16a34a;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.15);
}
.progress-step.done .step-dot {
  background: #16a34a;
  color: #fff;
}
.step-label {
  font-size: 0.72rem;
  color: #aaa;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.3s;
}
.progress-step.active .step-label {
  color: #16a34a;
  font-weight: 600;
}
.progress-step.done .step-label {
  color: #16a34a;
}
.progress-track {
  height: 3px;
  background: #e8e4df;
  border-radius: 99px;
  overflow: hidden;
  margin-top: 4px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #16a34a, #8BE000);
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* -- Authority notice -------------------------------------- */
.authority-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 0.82rem;
  color: #92400e;
  font-weight: 500;
  margin-bottom: 14px;
}
.authority-notice svg { flex-shrink: 0; color: #d97706; }

/* -- Body -------------------------------------------------- */
.card-body {
  display: flex;
  flex-direction: column;
}
.back-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  width: fit-content;
  transition: color 0.2s;
}
.back-btn:hover {
  color: #111;
}
.heading {
  font-size: 1.8rem;
  font-weight: 800;
  color: #111;
  line-height: 1.2;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.subtext {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 28px;
  line-height: 1.5;
}
.subtext strong {
  color: #333;
}

/* -- Fields ------------------------------------------------ */
.fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}
.req {
  color: #ef4444;
}
.optional {
  color: #aaa;
  font-weight: 400;
  font-size: 0.8rem;
}
.field-hint {
  font-size: 0.78rem;
  color: #999;
  margin-top: 2px;
}
.error-hint {
  color: #ef4444;
}

.input {
  width: 100%;
  padding: 13px 16px;
  font-size: 0.95rem;
  color: #111;
  background: #f9f7f5;
  border: 1.5px solid #ddd8d2;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}
.input::placeholder {
  color: #aaa;
}
.input:focus {
  border-color: #16a34a;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}
.input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}
.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-wrap {
  position: relative;
}
.select-input {
  appearance: none;
  cursor: pointer;
  padding-right: 40px;
}
.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #888;
}

/* -- Service Category Grid --------------------------------- */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.cat-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: #f9f7f5;
  border: 1.5px solid #ddd8d2;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 500;
  color: #444;
  transition: all 0.2s;
  font-family: inherit;
}
.cat-btn:hover {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #166534;
}
.cat-btn.selected {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
}
.cat-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  flex-shrink: 0;
  border: 1.5px solid #ddd8d2;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #16a34a;
}
.cat-btn.selected .cat-check {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

/* -- Phone ------------------------------------------------- */
.phone-wrap {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #ddd8d2;
  background: #f9f7f5;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.phone-wrap:focus-within {
  border-color: #16a34a;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}
.phone-prefix {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  background: #f0ede8;
  border-right: 1.5px solid #ddd8d2;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  flex-shrink: 0;
}
.flag {
  font-size: 1.1rem;
}
.phone-input {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  flex: 1;
}

/* -- Operating Hours --------------------------------------- */
.hours-block {
  background: #f9f7f5;
  border: 1.5px solid #ddd8d2;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}
.hours-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hours-day-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}
.closed-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  color: #555;
  cursor: pointer;
}
.hours-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
.hours-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}
.time-label {
  font-size: 0.75rem;
  color: #888;
  font-weight: 500;
}
.time-input {
  padding: 10px 14px;
  font-size: 0.9rem;
}
.hours-dash {
  font-size: 1.2rem;
  color: #ccc;
  padding-bottom: 10px;
  flex-shrink: 0;
}
.closed-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #94a3b8;
  padding: 8px 0 2px;
}

/* -- Capacity ---------------------------------------------- */
.capacity-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1.5px solid #ddd8d2;
  border-radius: 10px;
  overflow: hidden;
  background: #f9f7f5;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.capacity-wrap:focus-within {
  border-color: #16a34a;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}
.capacity-input {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  flex: 1;
  width: auto;
}
.capacity-unit {
  padding: 0 16px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #888;
  background: #f0ede8;
  border-left: 1.5px solid #ddd8d2;
  white-space: nowrap;
  align-self: stretch;
  display: flex;
  align-items: center;
}

/* -- Amenities --------------------------------------------- */
.amenities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.amenity-btn {
  padding: 9px 10px;
  background: #f9f7f5;
  border: 1.5px solid #ddd8d2;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  font-family: inherit;
}
.amenity-btn:hover {
  border-color: #16a34a;
  color: #16a34a;
}
.amenity-btn.selected {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #16a34a;
  font-weight: 600;
}

/* -- Yes / No questions ------------------------------------ */
.yn-row { display: flex; gap: 12px; flex-wrap: wrap; }
.yn-opt {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 110px;
  padding: 12px 22px;
  border: 1.5px solid #ddd8d2;
  border-radius: 14px;
  background: #fff;
  font-size: 0.9rem;
  color: #0B0C10;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.yn-opt input { position: absolute; opacity: 0; pointer-events: none; }
.yn-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #bbb;
  flex-shrink: 0;
  transition: border 0.15s;
}
.yn-opt:hover { border-color: #8BE000; }
.yn-opt:has(input:focus-visible) { box-shadow: 0 0 0 3px rgba(139, 224, 0, 0.4); }
.yn-opt.selected { border-color: #8BE000; background: #F4FBE8; font-weight: 600; }
.yn-opt.selected .yn-dot { border: 5px solid #8BE000; }

/* -- Password ---------------------------------------------- */
.pass-wrap {
  position: relative;
}
.pass-wrap .input {
  padding-right: 48px;
}
.toggle-pass {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}
.toggle-pass:hover {
  color: #333;
}

/* Strength meter */
.strength-meter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}
.strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 99px;
  background: #e2e8f0;
  transition: background 0.3s;
}
.bar-1 {
  background: #ef4444;
}
.bar-2 {
  background: #72B800;
}
.bar-3 {
  background: #eab308;
}
.bar-4 {
  background: #16a34a;
}
.strength-label {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 44px;
  text-align: right;
}
.label-1 {
  color: #ef4444;
}
.label-2 {
  color: #72B800;
}
.label-3 {
  color: #eab308;
}
.label-4 {
  color: #16a34a;
}

.pass-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.rule-ok,
.rule-fail {
  font-size: 0.75rem;
}
.rule-ok {
  color: #16a34a;
}
.rule-fail {
  color: #94a3b8;
}

/* -- Checkbox ---------------------------------------------- */
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.5;
  cursor: pointer;
}
.checkbox {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #16a34a;
  flex-shrink: 0;
}
.link {
  color: #16a34a;
  text-decoration: underline;
}

/* -- Summary chip ------------------------------------------ */
.summary-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  margin-bottom: 24px;
}
.summary-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #16a34a, #8BE000);
  color: #fff;
  font-weight: 800;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.summary-info {
  display: flex;
  flex-direction: column;
}
.summary-name {
  font-weight: 700;
  color: #166534;
  font-size: 0.95rem;
}
.summary-location {
  font-size: 0.8rem;
  color: #16a34a;
}

/* -- Actions ----------------------------------------------- */
.actions {
  margin-bottom: 16px;
}
.btn-next {
  width: 100%;
  padding: 15px;
  border-radius: 50px;
  font-size: 0.97rem;
  font-weight: 700;
  border: none;
  background: #ccc;
  color: #888;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-next.active {
  background: #0B0C10;
  color: #fff;
  cursor: pointer;
}
.btn-next.active:hover {
  background: #162f58;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(11, 12, 16, 0.25);
}
.btn-partner.active {
  background: #16a34a;
}
.btn-partner.active:hover {
  background: #15803d;
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.3);
}

.review-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.82rem;
  color: #888;
  background: #f9f7f5;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}
.signin-link {
  font-size: 0.88rem;
  color: #888;
  text-align: center;
}
.signin-link a {
  color: #16a34a;
  font-weight: 600;
  text-decoration: none;
}
.signin-link a:hover {
  text-decoration: underline;
}

.error-msg {
  font-size: 0.88rem;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* -- Footer ------------------------------------------------ */
.signup-footer {
  padding: 20px 0 32px;
  text-align: center;
}
.footer-notice {
  font-size: 0.8rem;
  color: #aaa;
}
.footer-notice a {
  color: #888;
  text-decoration: underline;
}

/* -- Responsive -------------------------------------------- */
@media (max-width: 620px) {
  .signup-card {
    padding: 28px 20px 36px;
  }
  .field-row {
    grid-template-columns: 1fr;
  }
  .category-grid {
    grid-template-columns: 1fr;
  }
  .amenities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .heading {
    font-size: 1.5rem;
  }
  .step-label {
    display: none;
  }
}

.branches-box { margin-top: 8px; padding-top: 18px; border-top: 1px solid #e2e8f0; gap: 12px; }
.branch-choice { display: flex; gap: 8px; flex-wrap: wrap; }
.branch-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  background: #f8fafc;
}
.branch-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.branch-card-title { font-weight: 700; font-size: 14px; color: #0f172a; }
.branch-remove { background: none; border: none; color: #ef4444; font-size: 13px; font-weight: 600; cursor: pointer; }
.branch-add {
  padding: 12px;
  border: 1.5px dashed #94a3b8;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.branch-add:hover { background: #f1f5f9; }

.step-missing { margin: 12px 0 0; text-align: center; }
</style>
