<script setup lang="ts">
import { computed, ref } from 'vue'
import LocationPicker from '@/components/LocationPicker.vue'
import { passwordRules, type BranchForm, type BranchKind } from '@/utils/branches'
import { CITIES, mapsLink, type LatLng, type PlaceAddress } from '@/utils/geo'

const props = withDefaults(
  defineProps<{
    modelValue: BranchForm
    kind?: BranchKind
    /** Main location pin: the branch map opens there and warns if left on top of it */
    reference?: (LatLng & { label?: string }) | null
    /** false on public applications: the login gets a temporary password on approval */
    withPassword?: boolean
  }>(),
  { kind: 'gym', reference: null, withPassword: true },
)

const b = props.modelValue
const isGym = computed(() => props.kind === 'gym')
const showPw = ref(false)

const cities = [
  'Addis Ababa', 'Hawassa', 'Adama (Nazret)', 'Dire Dawa', 'Bahir Dar',
  'Mekelle', 'Gondar', 'Jimma', 'Dessie', 'Jijiga',
]

const subCitiesMap: Record<string, string[]> = {
  'Addis Ababa': [
    'Arada', 'Addis Ketema', 'Akaki Kality', 'Bole', 'Gullele', 'Kirkos',
    'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura',
  ],
}

const subCities = computed(() => subCitiesMap[b.city] ?? [])
const rules = computed(() => passwordRules(b.password))

function onCityChange() {
  b.sub_city = ''
}

// The pin decides city / sub-city; landmark is only suggested when empty
function onAddress(a: PlaceAddress) {
  if (a.city && CITIES.includes(a.city) && b.city !== a.city) {
    b.city = a.city
    b.sub_city = ''
  }
  if (a.sub_city && subCities.value.includes(a.sub_city)) b.sub_city = a.sub_city
  if (a.landmark && !b.landmark.trim()) b.landmark = a.landmark
}

// lat is emitted before lng, so both are known here
function onPin(lng: number | null) {
  if (isGym.value) {
    b.google_maps_link = b.latitude != null && lng != null ? mapsLink({ lat: b.latitude, lng }) : ''
  }
}
</script>

<template>
  <div class="bf">
    <!-- Login for this branch -->
    <div class="bf-login">
      <p class="bf-login-title">Branch login</p>
      <p v-if="withPassword" class="bf-login-sub">
        This branch signs in with its own email and password and can only manage its own data.
        It can view the other branches, read-only.
      </p>
      <p v-else class="bf-login-sub">
        Once your application is approved, this branch gets its own login. The sign-in details
        (with a temporary password) will be emailed to the login email below.
      </p>

      <div class="bf-group">
        <label class="bf-label">Manager / contact name <span class="bf-req">*</span></label>
        <input v-model="b.contact_person" type="text" class="bf-input" placeholder="Full name" maxlength="255" autocomplete="off" />
      </div>

      <div class="bf-group">
        <label class="bf-label">Login email <span class="bf-req">*</span></label>
        <input v-model="b.email" type="email" class="bf-input" placeholder="branch@example.com" maxlength="255" autocomplete="off" />
      </div>

      <div v-if="withPassword" class="bf-group">
        <label class="bf-label">Password <span class="bf-req">*</span></label>
        <div class="bf-pw">
          <input
            v-model="b.password"
            :type="showPw ? 'text' : 'password'"
            class="bf-input"
            placeholder="Choose a strong password"
            autocomplete="new-password"
          />
          <button type="button" class="bf-pw-toggle" @click="showPw = !showPw">{{ showPw ? 'Hide' : 'Show' }}</button>
        </div>
        <ul v-if="b.password" class="bf-rules">
          <li v-for="r in rules" :key="r.id" :class="{ ok: r.ok }">{{ r.ok ? '✓' : '○' }} {{ r.label }}</li>
        </ul>
      </div>
    </div>

    <div class="bf-group">
      <label class="bf-label">Branch name <span class="bf-req">*</span></label>
      <input v-model="b.branch_name" type="text" class="bf-input" placeholder="e.g. Piassa, Bole Atlas" maxlength="100" />
    </div>

    <div class="bf-group">
      <label class="bf-label">Branch location on the map <span class="bf-opt">(recommended)</span></label>
      <p class="bf-help">
        Search for the branch or drag the pin to its entrance. Only use "My location" if you are
        at this branch right now.
      </p>
      <LocationPicker
        v-model:lat="b.latitude"
        v-model:lng="b.longitude"
        :reference="reference"
        :auto-locate="false"
        locate-label="I'm at this branch now"
        height="240px"
        @address="onAddress"
        @update:lng="onPin"
      />
    </div>

    <div class="bf-row">
      <div class="bf-group">
        <label class="bf-label">City <span class="bf-req">*</span></label>
        <select v-model="b.city" class="bf-input" @change="onCityChange">
          <option value="" disabled>Select city</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="bf-group">
        <label class="bf-label">Sub-City <span class="bf-opt">(optional)</span></label>
        <select v-model="b.sub_city" class="bf-input" :disabled="!subCities.length">
          <option value="">{{ subCities.length ? 'Select sub-city' : 'Not applicable' }}</option>
          <option v-for="sc in subCities" :key="sc" :value="sc">{{ sc }}</option>
        </select>
      </div>
    </div>

    <div class="bf-group">
      <label class="bf-label">{{ isGym ? 'Woreda & House Number' : 'Address' }} <span class="bf-req">*</span></label>
      <input v-model="b.woreda" type="text" class="bf-input" :placeholder="isGym ? 'e.g. Woreda 03, House No. 247' : 'e.g. Bole Road, next to Edna Mall'" />
    </div>

    <div class="bf-group">
      <label class="bf-label">Landmark <span class="bf-opt">(optional)</span></label>
      <input v-model="b.landmark" type="text" class="bf-input" placeholder="e.g. Behind Edna Mall" />
    </div>

    <div class="bf-group">
      <label class="bf-label">Branch phone <span class="bf-opt">(optional)</span></label>
      <div class="bf-phone">
        <span class="bf-prefix">+251</span>
        <input v-model="b.contact_phone" type="tel" class="bf-input" placeholder="9XX XXX XXX" maxlength="12" />
      </div>
    </div>

    <template v-if="isGym">
      <div class="bf-group">
        <label class="bf-label">Weekdays (Mon – Fri) <span class="bf-req">*</span></label>
        <div class="bf-hours">
          <input v-model="b.weekday_open" type="time" class="bf-input" />
          <span>—</span>
          <input v-model="b.weekday_close" type="time" class="bf-input" />
        </div>
        <p v-if="b.weekday_open && b.weekday_close && b.weekday_close <= b.weekday_open" class="bf-error">
          Closing time must be after opening time.
        </p>
      </div>

      <div class="bf-group">
        <div class="bf-label-row">
          <label class="bf-label">Weekends (Sat – Sun)</label>
          <label class="bf-closed">
            <input v-model="b.weekend_closed" type="checkbox" />
            <span>Closed on weekends</span>
          </label>
        </div>
        <div v-if="!b.weekend_closed" class="bf-hours">
          <input v-model="b.weekend_open" type="time" class="bf-input" />
          <span>—</span>
          <input v-model="b.weekend_close" type="time" class="bf-input" />
        </div>
        <p v-if="!b.weekend_closed && b.weekend_open && b.weekend_close && b.weekend_close <= b.weekend_open" class="bf-error">
          Closing time must be after opening time.
        </p>
      </div>

      <div class="bf-group">
        <label class="bf-label">Maximum hourly capacity <span class="bf-req">*</span></label>
        <div class="bf-phone">
          <input v-model="b.max_capacity" type="number" min="1" max="9999" class="bf-input" placeholder="e.g. 80" />
          <span class="bf-suffix">members / hour</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bf { display: flex; flex-direction: column; gap: 14px; }
.bf-login { padding: 14px; border: 1.5px solid #bbf7d0; border-radius: 12px; background: #f0fdf4; display: flex; flex-direction: column; gap: 12px; }
.bf-login-title { margin: 0; font-weight: 700; font-size: 14px; color: #166534; }
.bf-login-sub { margin: 0; font-size: 12px; color: #4b5563; line-height: 1.45; }
.bf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bf-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.bf-label { font-size: 13px; font-weight: 600; color: #334155; }
.bf-label-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.bf-req { color: #ef4444; }
.bf-opt { font-weight: 400; color: #94a3b8; font-size: 12px; }
.bf-help { margin: 0; font-size: 12px; color: #64748b; line-height: 1.45; }
.bf-input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: #0f172a;
}
.bf-input:focus { outline: none; border-color: #0f172a; }
.bf-input:disabled { background: #f8fafc; color: #94a3b8; }
.bf-pw { display: flex; gap: 8px; align-items: center; }
.bf-pw-toggle { background: none; border: none; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.bf-rules { list-style: none; margin: 2px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; font-size: 12px; color: #94a3b8; }
.bf-rules li.ok { color: #16a34a; }
.bf-phone { display: flex; align-items: center; gap: 8px; }
.bf-prefix, .bf-suffix { font-size: 13px; color: #64748b; white-space: nowrap; }
.bf-hours { display: flex; align-items: center; gap: 10px; }
.bf-closed { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; cursor: pointer; }
.bf-error { font-size: 12px; color: #ef4444; margin: 0; }
@media (max-width: 520px) { .bf-row, .bf-rules { grid-template-columns: 1fr; } }
</style>
