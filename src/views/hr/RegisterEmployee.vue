<template>
  <div class="page">

    <!-- Success banner -->
    <div v-if="success" class="banner-success">
      ✓ {{ success }}
    </div>

    <!-- Error banner -->
    <div v-if="error" class="banner-error">{{ error }}</div>

    <form @submit.prevent="submit" class="form-body">

      <!-- ── Personal Information ──────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title">PERSONAL INFORMATION</h2>
        <div class="name-row">
          <div class="field">
            <label class="field-label">FIRST NAME</label>
            <input v-model="form.first_name" class="input" :class="{ 'input-error': errors.first_name }" placeholder="Abebe" />
            <p v-if="errors.first_name" class="err-msg">{{ errors.first_name }}</p>
          </div>
          <div class="field">
            <label class="field-label">MIDDLE NAME</label>
            <input v-model="form.middle_name" class="input" :class="{ 'input-error': errors.middle_name }" placeholder="Girma" />
            <p v-if="errors.middle_name" class="err-msg">{{ errors.middle_name }}</p>
          </div>
          <div class="field">
            <label class="field-label">LAST NAME</label>
            <input v-model="form.last_name" class="input" :class="{ 'input-error': errors.last_name }" placeholder="Haile" />
            <p v-if="errors.last_name" class="err-msg">{{ errors.last_name }}</p>
          </div>
        </div>

        <div class="field">
          <label class="field-label">FAN NUMBER (ETHIOPIAN NATIONAL ID — 13 DIGITS)</label>
          <input
            v-model="form.fan_number"
            class="input input-full"
            :class="{ 'input-error': errors.fan_number }"
            placeholder="1234567890123"
            maxlength="13"
            @input="form.fan_number = form.fan_number.replace(/\D/g, '')"
          />
          <p v-if="errors.fan_number" class="err-msg">{{ errors.fan_number }}</p>
        </div>

        <div class="field">
          <label class="field-label">DATE JOINED COMPANY</label>
          <div class="date-wrap">
            <input v-model="form.joined_at" type="date" class="input input-full date-input-styled" />
            <svg class="date-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
      </div>

      <!-- ── Employee Photo ────────────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title">EMPLOYEE PHOTO</h2>
        <div
          class="photo-zone"
          :class="{ 'photo-zone--over': isDragging, 'photo-zone--filled': photoPreview }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="photoInput?.click()"
        >
          <img v-if="photoPreview" :src="photoPreview" class="photo-preview" />
          <template v-else>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M20.45 5.65A2 2 0 0 0 18.5 4H5.5a2 2 0 0 0-1.95 1.65L3 7H1v2h1l-1 10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2L22 9h1V7h-2l-.55-1.35z"/></svg>
            <p class="photo-label">Drop photo here or <span class="browse-link">browse</span></p>
            <p class="photo-hint">JPG or PNG, max 5MB</p>
          </template>
        </div>
        <button v-if="photoPreview" type="button" class="remove-photo" @click="removePhoto">Remove photo</button>
        <input ref="photoInput" type="file" accept="image/jpg,image/jpeg,image/png" class="hidden" @change="handlePhotoSelect" />
      </div>

      <!-- ── Work Details ──────────────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title">WORK DETAILS</h2>
        <div class="two-col">
          <div class="field">
            <label class="field-label">PACKAGE</label>
            <select v-model="form.package" class="input" :class="{ 'input-error': errors.package }">
              <option value="">Select package…</option>
              <option value="basic">Basic</option>
              <option value="basic_plus">Basic Plus</option>
              <option value="platinum">Platinum</option>
            </select>
            <p v-if="errors.package" class="err-msg">{{ errors.package }}</p>
          </div>
          <div class="field">
            <label class="field-label">PHONE (OPTIONAL)</label>
            <input v-model="form.phone" class="input" placeholder="+251 9xx xxx xxxx" />
          </div>
        </div>
        <div class="two-col">
          <div class="field">
            <label class="field-label">JOB TITLE (OPTIONAL)</label>
            <input v-model="form.job_title" class="input" placeholder="Software Engineer" />
          </div>
          <div class="field">
            <label class="field-label">DEPARTMENT (OPTIONAL)</label>
            <input v-model="form.department" class="input" placeholder="IT Department" />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="reset">Clear Form</button>
        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading">Registering…</span>
          <span v-else>Register Employee</span>
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const form = reactive({
  first_name:  '',
  middle_name: '',
  last_name:   '',
  fan_number:  '',
  package:     '',
  job_title:   '',
  department:  '',
  phone:       '',
  joined_at:   new Date().toISOString().slice(0, 10),
})

const errors     = reactive<Record<string, string>>({})
const loading    = ref(false)
const success    = ref('')
const error      = ref('')
const isDragging = ref(false)
const photoFile  = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoInput   = ref<HTMLInputElement | null>(null)

function handlePhotoSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setPhoto(file)
}
function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setPhoto(file)
}
function setPhoto(file: File) {
  photoFile.value    = file
  photoPreview.value = URL.createObjectURL(file)
}
function removePhoto() {
  photoFile.value    = null
  photoPreview.value = null
  if (photoInput.value) photoInput.value.value = ''
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.first_name)  errors.first_name  = 'First name is required.'
  if (!form.middle_name) errors.middle_name = 'Middle name is required.'
  if (!form.last_name)   errors.last_name   = 'Last name is required.'
  if (!form.fan_number)  errors.fan_number  = 'FAN number is required.'
  else if (form.fan_number.length !== 13) errors.fan_number = 'FAN number must be exactly 13 digits.'
  if (!form.package)     errors.package     = 'Please select a package.'
  return Object.keys(errors).length === 0
}

async function submit() {
  success.value = ''
  error.value   = ''
  if (!validate()) return

  loading.value = true
  try {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, String(v)) })
    if (photoFile.value) fd.append('photo', photoFile.value)

    const res = await fetch('http://localhost:8000/api/v1/hr/employees', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: fd,
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 422 && data.errors) {
        Object.entries(data.errors).forEach(([k, msgs]) => {
          errors[k] = (msgs as string[])[0]
        })
        error.value = 'Please fix the errors above.'
      } else {
        error.value = data.message ?? 'Registration failed.'
      }
      return
    }

    success.value = data.message ?? 'Employee registered successfully.'
    reset()
  } catch {
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(form, {
    first_name: '', middle_name: '', last_name: '',
    fan_number: '', package: '', job_title: '',
    department: '', phone: '',
    joined_at: new Date().toISOString().slice(0, 10),
  })
  Object.keys(errors).forEach(k => delete errors[k])
  removePhoto()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; max-width: 760px; }

.banner-success {
  padding: 12px 16px; background: #d1fae5; border: 1px solid #a7f3d0;
  border-radius: 10px; color: #059669; font-size: 0.88rem; font-weight: 500;
}
.banner-error {
  padding: 12px 16px; background: #fee2e2; border: 1px solid #fecaca;
  border-radius: 10px; color: #dc2626; font-size: 0.88rem;
}

/* Form cards */
.form-card {
  background: white; border-radius: 14px; padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 0.72rem; font-weight: 700; color: #94a3b8;
  letter-spacing: 0.1em; margin: 0 0 20px;
}

.name-row  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
.two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
.two-col:last-child, .name-row:last-child { margin-bottom: 0; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 0.68rem; font-weight: 600; color: #94a3b8;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.input {
  padding: 10px 14px; background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: 0.875rem; color: #0f172a; outline: none;
  transition: border-color .15s;
}
.input:focus     { border-color: #14b8a6; background: white; }
.input-error     { border-color: #ef4444; }
.input-full      { width: 100%; box-sizing: border-box; }
.err-msg         { font-size: 0.72rem; color: #ef4444; margin: 0; }

/* Styled date input */
.date-wrap { position: relative; width: 100%; }
.date-input-styled {
  padding-right: 40px !important; cursor: pointer;
  color-scheme: light;
}
.date-icon {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.date-input-styled::-webkit-calendar-picker-indicator {
  opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 40px; height: 100%;
}

/* Photo zone */
.photo-zone {
  border: 2px dashed #e2e8f0; border-radius: 12px;
  padding: 40px 20px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  cursor: pointer; transition: border-color .15s, background .15s;
  min-height: 160px;
}
.photo-zone:hover         { border-color: #14b8a6; background: #f0fdf9; }
.photo-zone--over         { border-color: #14b8a6; background: #f0fdf9; }
.photo-zone--filled       { padding: 12px; }
.photo-label  { font-size: 0.88rem; color: #64748b; margin: 0; }
.browse-link  { color: #14b8a6; font-weight: 600; }
.photo-hint   { font-size: 0.72rem; color: #94a3b8; margin: 0; }
.photo-preview { max-height: 180px; border-radius: 10px; object-fit: cover; }
.remove-photo {
  margin-top: 8px; background: none; border: none;
  color: #ef4444; font-size: 0.78rem; cursor: pointer;
}
.remove-photo:hover { text-decoration: underline; }
.hidden { display: none; }

.form-actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-cancel {
  padding: 10px 20px; background: white; border: 1.5px solid #e2e8f0;
  border-radius: 10px; color: #64748b; font-size: 0.875rem; font-weight: 500;
  cursor: pointer; transition: border-color .15s;
}
.btn-cancel:hover { border-color: #94a3b8; }
.btn-submit {
  padding: 10px 28px; background: #14b8a6; border: none;
  border-radius: 10px; color: white; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-submit:disabled { opacity: .6; cursor: default; }
.btn-submit:not(:disabled):hover { opacity: .85; }

.form-body { display: flex; flex-direction: column; gap: 16px; }

@media (max-width: 600px) {
  .name-row { grid-template-columns: 1fr; }
  .two-col  { grid-template-columns: 1fr; }
}
</style>
