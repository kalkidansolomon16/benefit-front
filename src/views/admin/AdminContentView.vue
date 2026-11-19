<script setup lang="ts">
// FitAccess admin: News and Trainings shown on the employee portal.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { confirmDialog } from '@/composables/useDialog'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { TRAINING_LABELS } from '@/composables/useEmployeePortal'

type Tab = 'news' | 'trainings'

interface NewsRow {
  id: number; title: string; category: string; excerpt: string | null; body: string | null
  image_url: string | null; link_url: string | null; link_label: string | null
  company_id: number | null; company_name: string | null
  is_featured: boolean; is_published: boolean; published_at: string | null; created_at: string | null
}
interface TrainingRow {
  id: number; title: string; description: string | null; category: string; image_url: string | null
  video_url: string | null; duration_minutes: number | null; provider: string | null; provider_contact: string | null
  location: string | null; is_online: boolean; start_date: string | null; end_date: string | null
  max_participants: number | null; is_active: boolean; participants: number | null
}

const api = useApi()
const auth = useAuthStore()
const canManage = computed(() => auth.hasPermission('content.manage'))

const tab = ref<Tab>('news')
const loading = ref(false)
const error = ref('')
const toast = ref('')
const search = ref('')
const news = ref<NewsRow[]>([])
const trainings = ref<TrainingRow[]>([])
const categories = ref<string[]>(Object.keys(TRAINING_LABELS))
const companies = ref<{ id: number; name: string }[]>([])

const NEWS_CATEGORIES = ['News', 'Exercises', 'Challenge', 'Nutrition', 'Offer', 'Event', 'Wellbeing']

async function load() {
  loading.value = true
  error.value = ''
  const qs = search.value.trim() ? `?search=${encodeURIComponent(search.value.trim())}` : ''
  try {
    if (tab.value === 'news') {
      news.value = (await api.get<{ data: NewsRow[] }>(`admin/content/news${qs}`)).data
    } else {
      const res = await api.get<{ data: TrainingRow[]; categories: string[] }>(`admin/content/trainings${qs}`)
      trainings.value = res.data
      categories.value = res.categories
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load content.'
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  load()
  try {
    companies.value = await api.get<{ id: number; name: string }[]>('admin/content/companies')
  } catch {
    /* targeting stays "All companies" */
  }
})
watch(tab, () => {
  search.value = ''
  load()
})
let t: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (t) clearTimeout(t)
  t = setTimeout(load, 350)
})

function flash(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 3000)
}

// ── Editor ──
const editing = ref<number | null>(null)
const show = ref(false)
const saving = ref(false)
const formError = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const removeImage = ref(false)

const nf = reactive({
  title: '', category: 'News', excerpt: '', body: '', link_url: '', link_label: '',
  company_id: '' as number | '', is_featured: false, is_published: true, published_at: '',
})
const tf = reactive({
  title: '', category: 'fitness', description: '', video_url: '', duration_minutes: '' as number | '',
  provider: '', provider_contact: '', location: '', is_online: true, start_date: '', end_date: '',
  max_participants: '' as number | '', is_active: true,
})

function resetImage(url: string | null = null) {
  imageFile.value = null
  imagePreview.value = url
  removeImage.value = false
}

function openNew() {
  editing.value = null
  formError.value = ''
  if (tab.value === 'news') {
    Object.assign(nf, { title: '', category: 'News', excerpt: '', body: '', link_url: '', link_label: '', company_id: '', is_featured: false, is_published: true, published_at: '' })
  } else {
    Object.assign(tf, { title: '', category: 'fitness', description: '', video_url: '', duration_minutes: '', provider: '', provider_contact: '', location: '', is_online: true, start_date: '', end_date: '', max_participants: '', is_active: true })
  }
  resetImage()
  show.value = true
}

function openEditNews(n: NewsRow) {
  editing.value = n.id
  formError.value = ''
  Object.assign(nf, {
    title: n.title, category: n.category, excerpt: n.excerpt ?? '', body: n.body ?? '', link_url: n.link_url ?? '',
    link_label: n.link_label ?? '', company_id: n.company_id ?? '', is_featured: n.is_featured,
    is_published: n.is_published, published_at: n.published_at ?? '',
  })
  resetImage(n.image_url)
  show.value = true
}

function openEditTraining(r: TrainingRow) {
  editing.value = r.id
  formError.value = ''
  Object.assign(tf, {
    title: r.title, category: r.category, description: r.description ?? '', video_url: r.video_url ?? '',
    duration_minutes: r.duration_minutes ?? '', provider: r.provider ?? '', provider_contact: r.provider_contact ?? '',
    location: r.location ?? '', is_online: r.is_online, start_date: r.start_date ?? '', end_date: r.end_date ?? '',
    max_participants: r.max_participants ?? '', is_active: r.is_active,
  })
  resetImage(r.image_url)
  show.value = true
}

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  if (f && f.size > 4 * 1024 * 1024) {
    formError.value = 'The image must be 4 MB or smaller.'
    return
  }
  imageFile.value = f
  imagePreview.value = f ? URL.createObjectURL(f) : null
  removeImage.value = false
}
function clearImage() {
  imageFile.value = null
  imagePreview.value = null
  removeImage.value = true
}

function toForm(values: Record<string, unknown>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(values)) {
    // Empty strings are sent too: Laravel turns them into null, so a cleared
    // field is really cleared when editing.
    if (typeof v === 'boolean') fd.append(k, v ? '1' : '0')
    else if (v !== null && v !== undefined) fd.append(k, String(v))
  }
  if (imageFile.value) fd.append('image', imageFile.value)
  if (removeImage.value) fd.append('remove_image', '1')
  return fd
}

async function save() {
  formError.value = ''
  const isNews = tab.value === 'news'
  const values = isNews ? { ...nf } : { ...tf }
  if (!values.title.trim()) {
    formError.value = 'Please add a title.'
    return
  }
  saving.value = true
  try {
    const base = isNews ? 'admin/content/news' : 'admin/content/trainings'
    const res = await api.upload<{ message: string }>(editing.value ? `${base}/${editing.value}` : base, toForm(values))
    show.value = false
    flash(res.message)
    load()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Could not save.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number, title: string) {
  if (!(await confirmDialog({ title: 'Delete?', message: `Delete "${title}"? Employees will no longer see it.`, confirmText: 'Delete', danger: true }))) return
  try {
    const res = await api.delete<{ message: string }>(`admin/content/${tab.value}/${id}`)
    flash(res.message)
    load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not delete.'
  }
}

async function togglePublished(n: NewsRow) {
  try {
    const fd = new FormData()
    fd.append('is_published', n.is_published ? '0' : '1')
    await api.upload(`admin/content/news/${n.id}`, fd)
    n.is_published = !n.is_published
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not update.'
  }
}
async function toggleActive(r: TrainingRow) {
  try {
    const fd = new FormData()
    fd.append('is_active', r.is_active ? '0' : '1')
    await api.upload(`admin/content/trainings/${r.id}`, fd)
    r.is_active = !r.is_active
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not update.'
  }
}
</script>

<template>
  <div class="ac">
    <div class="ac-top">
      <div class="ac-tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'news'" :class="{ on: tab === 'news' }" @click="tab = 'news'">News</button>
        <button type="button" role="tab" :aria-selected="tab === 'trainings'" :class="{ on: tab === 'trainings' }" @click="tab = 'trainings'">Trainings</button>
      </div>
      <div class="ac-actions">
        <input v-model="search" type="search" class="ac-search" :placeholder="`Search ${tab}…`" />
        <button v-if="canManage" type="button" class="ac-btn" @click="openNew">
          + {{ tab === 'news' ? 'New post' : 'New training' }}
        </button>
      </div>
    </div>

    <p class="ac-hint">
      {{ tab === 'news'
        ? 'Posts appear on every employee’s Start page and News page. Featured posts also rotate in the Start page banner.'
        : 'Trainings appear on the employee portal. Employees with an activated card can open and join them.' }}
    </p>

    <p v-if="error" class="ac-error">{{ error }}</p>
    <p v-if="loading" class="ac-muted">Loading…</p>

    <!-- News list -->
    <div v-else-if="tab === 'news'" class="ac-grid">
      <p v-if="!news.length" class="ac-muted">No news yet. Create the first post.</p>
      <article v-for="n in news" :key="n.id" class="ac-item">
        <div class="ac-thumb">
          <img v-if="n.image_url" :src="n.image_url" alt="" />
          <span v-else>No image</span>
        </div>
        <div class="ac-info">
          <p class="ac-meta">
            {{ n.category }} · {{ n.published_at ?? n.created_at }}
            <span v-if="n.is_featured" class="ac-tag lime">Banner</span>
            <span class="ac-tag" :class="n.is_published ? 'green' : 'grey'">{{ n.is_published ? 'Published' : 'Hidden' }}</span>
          </p>
          <h3>{{ n.title }}</h3>
          <p class="ac-sub">{{ n.company_name ? `Only ${n.company_name}` : 'All companies' }}</p>
        </div>
        <div v-if="canManage" class="ac-row-actions">
          <button type="button" @click="openEditNews(n)">Edit</button>
          <button type="button" @click="togglePublished(n)">{{ n.is_published ? 'Hide' : 'Publish' }}</button>
          <button type="button" class="danger" @click="remove(n.id, n.title)">Delete</button>
        </div>
      </article>
    </div>

    <!-- Trainings list -->
    <div v-else class="ac-grid">
      <p v-if="!trainings.length" class="ac-muted">No trainings yet. Create the first one.</p>
      <article v-for="r in trainings" :key="r.id" class="ac-item">
        <div class="ac-thumb">
          <img v-if="r.image_url" :src="r.image_url" alt="" />
          <span v-else>No image</span>
        </div>
        <div class="ac-info">
          <p class="ac-meta">
            {{ TRAINING_LABELS[r.category] ?? r.category }}
            <template v-if="r.duration_minutes"> · {{ r.duration_minutes }} min</template>
            <span class="ac-tag" :class="r.is_active ? 'green' : 'grey'">{{ r.is_active ? 'Active' : 'Hidden' }}</span>
          </p>
          <h3>{{ r.title }}</h3>
          <p class="ac-sub">
            {{ r.is_online ? 'Online' : r.location || 'In person' }} ·
            {{ r.participants ?? 0 }}{{ r.max_participants ? ` / ${r.max_participants}` : '' }} joined
          </p>
        </div>
        <div v-if="canManage" class="ac-row-actions">
          <button type="button" @click="openEditTraining(r)">Edit</button>
          <button type="button" @click="toggleActive(r)">{{ r.is_active ? 'Hide' : 'Show' }}</button>
          <button type="button" class="danger" @click="remove(r.id, r.title)">Delete</button>
        </div>
      </article>
    </div>

    <!-- Editor -->
    <div v-if="show" class="ac-modal" @click.self="show = false">
      <form class="ac-card" @submit.prevent="save">
        <h2>{{ editing ? 'Edit' : 'New' }} {{ tab === 'news' ? 'news post' : 'training' }}</h2>

        <div class="ac-image">
          <div class="ac-image-prev">
            <img v-if="imagePreview" :src="imagePreview" alt="" />
            <span v-else>16:9 cover image</span>
          </div>
          <div class="ac-image-btns">
            <label class="ac-btn ghost">
              Upload image
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onFile" />
            </label>
            <button v-if="imagePreview" type="button" class="ac-link" @click="clearImage">Remove</button>
            <small>JPG, PNG or WebP, max 4 MB</small>
          </div>
        </div>

        <template v-if="tab === 'news'">
          <label>Title<input v-model="nf.title" maxlength="200" required /></label>
          <div class="ac-two">
            <label>Category
              <input v-model="nf.category" list="news-cats" maxlength="50" />
              <datalist id="news-cats"><option v-for="c in NEWS_CATEGORIES" :key="c" :value="c" /></datalist>
            </label>
            <label>Show to
              <select v-model="nf.company_id">
                <option value="">All companies</option>
                <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
          </div>
          <label>Short summary<textarea v-model="nf.excerpt" rows="2" maxlength="300"></textarea></label>
          <label>Full text<textarea v-model="nf.body" rows="6"></textarea></label>
          <div class="ac-two">
            <label>Button link (optional)<input v-model="nf.link_url" type="url" placeholder="https://…" /></label>
            <label>Button text<input v-model="nf.link_label" maxlength="60" placeholder="Learn more" /></label>
          </div>
          <div class="ac-two">
            <label>Publish date<input v-model="nf.published_at" type="date" /></label>
            <div class="ac-checks">
              <label class="ac-check"><input v-model="nf.is_featured" type="checkbox" /> Show in Start page banner</label>
              <label class="ac-check"><input v-model="nf.is_published" type="checkbox" /> Published</label>
            </div>
          </div>
        </template>

        <template v-else>
          <label>Title<input v-model="tf.title" maxlength="255" required /></label>
          <div class="ac-two">
            <label>Category
              <select v-model="tf.category">
                <option v-for="c in categories" :key="c" :value="c">{{ TRAINING_LABELS[c] ?? c }}</option>
              </select>
            </label>
            <label>Duration (minutes)<input v-model.number="tf.duration_minutes" type="number" min="1" max="1440" /></label>
          </div>
          <label>Description<textarea v-model="tf.description" rows="5"></textarea></label>
          <label>Video link (optional)<input v-model="tf.video_url" type="url" placeholder="https://youtube.com/…" /></label>
          <div class="ac-two">
            <label>Trainer / provider<input v-model="tf.provider" maxlength="255" /></label>
            <label>Provider contact<input v-model="tf.provider_contact" maxlength="255" /></label>
          </div>
          <div class="ac-two">
            <label class="ac-check"><input v-model="tf.is_online" type="checkbox" /> Online training</label>
            <label v-if="!tf.is_online">Location<input v-model="tf.location" maxlength="255" /></label>
          </div>
          <div class="ac-three">
            <label>Starts<input v-model="tf.start_date" type="date" /></label>
            <label>Ends<input v-model="tf.end_date" type="date" /></label>
            <label>Max participants<input v-model.number="tf.max_participants" type="number" min="1" /></label>
          </div>
          <label class="ac-check"><input v-model="tf.is_active" type="checkbox" /> Visible to employees</label>
        </template>

        <p v-if="formError" class="ac-error">{{ formError }}</p>
        <div class="ac-foot">
          <button type="button" class="ac-btn ghost" :disabled="saving" @click="show = false">Cancel</button>
          <button type="submit" class="ac-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>

    <div v-if="toast" class="ac-toast" role="status">{{ toast }}</div>
  </div>
</template>

<style scoped>
.ac { display: flex; flex-direction: column; gap: 16px; }
.ac-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.ac-tabs { display: inline-flex; background: #f1f5f9; border-radius: 12px; padding: 4px; }
.ac-tabs button { border: none; background: none; padding: 9px 18px; border-radius: 9px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
.ac-tabs button.on { background: #fff; color: #0b0c10; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.ac-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ac-search { padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; min-width: 220px; font-family: inherit; }
.ac-btn {
  display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 10px;
  border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit;
}
.ac-btn:hover:not(:disabled) { background: #8be000; border-color: #8be000; color: #0b0c10; }
.ac-btn.ghost { background: #fff; color: #0b0c10; border-color: #e2e8f0; }
.ac-btn:disabled { opacity: 0.6; cursor: default; }
.ac-hint { margin: 0; font-size: 13px; color: #64748b; }
.ac-muted { margin: 0; color: #94a3b8; }
.ac-error { margin: 0; color: #dc2626; font-size: 13px; }
.ac-grid { display: flex; flex-direction: column; gap: 10px; }
.ac-item { display: grid; grid-template-columns: 140px minmax(0, 1fr) auto; gap: 16px; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
.ac-thumb { aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; }
.ac-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ac-meta { margin: 0 0 4px; font-size: 12px; color: #64748b; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ac-info h3 { margin: 0 0 2px; font-size: 15px; color: #0f172a; }
.ac-sub { margin: 0; font-size: 12px; color: #94a3b8; }
.ac-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.ac-tag.green { background: #dcfce7; color: #166534; }
.ac-tag.grey { background: #f1f5f9; color: #64748b; }
.ac-tag.lime { background: #eef9dc; color: #3f6212; }
.ac-row-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.ac-row-actions button { border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 7px 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.ac-row-actions button:hover { border-color: #0b0c10; }
.ac-row-actions button.danger { color: #dc2626; }
.ac-modal { position: fixed; inset: 0; z-index: 500; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 16px; }
.ac-card {
  width: 100%; max-width: 680px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box;
  background: #fff; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 12px;
}
.ac-card h2 { margin: 0 0 4px; font-size: 18px; }
.ac-card label { display: flex; flex-direction: column; gap: 5px; font-size: 13px; font-weight: 600; color: #334155; }
.ac-card input:not([type='checkbox']):not([type='file']), .ac-card select, .ac-card textarea {
  padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; font-weight: 400; color: #0f172a;
}
.ac-card textarea { resize: vertical; }
.ac-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
.ac-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.ac-checks { display: flex; flex-direction: column; gap: 8px; }
.ac-card .ac-check { flex-direction: row; align-items: center; gap: 8px; font-weight: 500; }
.ac-image { display: flex; gap: 14px; align-items: center; }
.ac-image-prev { width: 200px; aspect-ratio: 16 / 9; border-radius: 10px; background: #f1f5f9; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #94a3b8; flex-shrink: 0; }
.ac-image-prev img { width: 100%; height: 100%; object-fit: cover; }
.ac-image-btns { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.ac-image-btns .ac-btn { cursor: pointer; }
.ac-image-btns small { color: #94a3b8; font-size: 12px; }
.ac-link { border: none; background: none; color: #dc2626; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; }
.ac-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.ac-toast { position: fixed; bottom: 24px; right: 24px; z-index: 600; background: #0b0c10; color: #fff; padding: 12px 18px; border-radius: 12px; font-size: 14px; }
@media (max-width: 700px) {
  .ac-item { grid-template-columns: 96px minmax(0, 1fr); }
  .ac-row-actions { grid-column: 1 / -1; justify-content: flex-start; }
  .ac-two, .ac-three { grid-template-columns: 1fr; }
  .ac-image { flex-direction: column; align-items: flex-start; }
}
</style>
