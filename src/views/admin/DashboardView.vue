<template>
  <div class="dashboard">

    <!-- -- Stats cards ------------------------------------------- -->
    <section class="stats-grid">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg, color: s.color }">
          <span v-html="s.icon"></span>
        </div>
        <div>
          <p class="stat-value">{{ loading ? '…' : s.value }}</p>
          <p class="stat-label">{{ s.label }}</p>
          <p class="stat-sub">{{ s.sub }}</p>
        </div>
      </div>
    </section>

    <!-- -- Row 2: Donut + Bar ------------------------------------- -->
    <section class="row-2">
      <!-- Donut -->
      <div class="card donut-card">
        <h3 class="card-title">Package Distribution</h3>
        <div v-if="loadingPkg" class="loading-msg">Loading…</div>
        <div v-else class="donut-wrap">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <template v-for="(seg, i) in donutSegments" :key="i">
              <circle
                cx="80" cy="80" r="58"
                fill="none"
                :stroke="seg.color"
                stroke-width="24"
                :stroke-dasharray="`${seg.dash} ${circumference - seg.dash}`"
                :stroke-dashoffset="-seg.offset"
                transform="rotate(-90 80 80)"
              />
            </template>
            <text x="80" y="75" text-anchor="middle" fill="#0f172a" font-size="22" font-weight="700">{{ totalPkg }}</text>
            <text x="80" y="92" text-anchor="middle" fill="#94a3b8" font-size="11">Companies</text>
          </svg>
          <div class="donut-legend">
            <div v-for="(seg, i) in donutSegments" :key="i" class="legend-row">
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-label">{{ seg.label }}</span>
              <span class="legend-val">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bar: revenue -->
      <div class="card bar-card">
        <h3 class="card-title">Revenue by Company <span class="card-unit">ETB</span></h3>
        <div v-if="loadingRev" class="loading-msg">Loading…</div>
        <div v-else-if="!revenueData.length" class="empty-msg">No active subscriptions yet.</div>
        <div v-else class="bar-scroll">
          <svg :width="barSvgW" height="220" :viewBox="`0 0 ${barSvgW} 220`">
            <!-- Y gridlines -->
            <line v-for="y in [0,50,100,150]" :key="y"
              x1="0" :y1="200 - y" :x2="barSvgW" :y2="200 - y"
              stroke="#f1f5f9" stroke-width="1"/>
            <g v-for="(d, i) in revenueData" :key="i">
              <rect
                :x="i * barStep + barPad"
                :y="200 - barH(d.revenue)"
                :width="barW"
                :height="barH(d.revenue)"
                :fill="barPalette[i % barPalette.length]"
                rx="4" opacity="0.85"
              />
              <text :x="i * barStep + barPad + barW/2" :y="200 - barH(d.revenue) - 5"
                text-anchor="middle" fill="#64748b" font-size="9">{{ shortN(d.revenue) }}</text>
              <text :x="i * barStep + barPad + barW/2" y="216"
                text-anchor="middle" fill="#94a3b8" font-size="9">{{ d.name.split(' ')[0] }}</text>
            </g>
          </svg>
        </div>
      </div>
    </section>

    <!-- -- Line chart — 30-day trend ----------------------------- -->
    <div class="card trend-card">
      <h3 class="card-title">30-Day Check-in Trend</h3>
      <div v-if="loadingTrend" class="loading-msg">Loading…</div>
      <div v-else class="trend-wrap" ref="trendWrap">
        <svg
          class="trend-svg"
          :viewBox="`0 0 ${LW} ${LH + 40}`"
          preserveAspectRatio="none"
          @mousemove="onTrendMove"
          @mouseleave="hoverIdx = -1"
        >
          <!-- Y-axis grid + labels -->
          <template v-for="tick in yTicks" :key="tick">
            <line :x1="Y_LABEL_W" :y1="ly(tick)" :x2="LW" :y2="ly(tick)" stroke="#f1f5f9" stroke-width="1"/>
            <text :x="Y_LABEL_W - 6" :y="ly(tick) + 4" text-anchor="end" fill="#94a3b8" font-size="10">{{ tick }}</text>
          </template>
          <!-- X-axis labels (every 5 days) -->
          <template v-for="(d, i) in trendData" :key="'xl'+i">
            <text
              v-if="i % 5 === 0 || i === trendData.length - 1"
              :x="lx(i)"
              :y="LH + 34"
              text-anchor="middle"
              fill="#94a3b8"
              font-size="10"
            >{{ d.date.slice(5) }}</text>
          </template>
          <!-- Area fill -->
          <polygon v-if="trendData.length" :points="areaPoints" fill="#2EB84B" fill-opacity="0.07"/>
          <!-- Line -->
          <polyline v-if="trendData.length" :points="linePoints" fill="none" stroke="#2EB84B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          <!-- Hover -->
          <template v-if="hoverIdx >= 0">
            <line :x1="lx(hoverIdx)" y1="0" :x2="lx(hoverIdx)" :y2="LH" stroke="#2EB84B" stroke-width="1" stroke-dasharray="4,3"/>
            <circle :cx="lx(hoverIdx)" :cy="ly(trendData[hoverIdx]?.count ?? 0)" r="5" fill="#2EB84B" stroke="white" stroke-width="2"/>
            <!-- Tooltip box -->
            <rect :x="tooltipX" :y="tooltipY" width="110" height="38" rx="6" fill="white" filter="url(#shadow)"/>
            <text :x="tooltipX + 8" :y="tooltipY + 15" fill="#0f172a" font-size="11" font-weight="600">{{ trendData[hoverIdx]?.date }}</text>
            <text :x="tooltipX + 8" :y="tooltipY + 29" fill="#2EB84B" font-size="11">Check-ins: {{ trendData[hoverIdx]?.count }}</text>
          </template>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0002"/>
            </filter>
          </defs>
        </svg>
      </div>
    </div>

    <!-- -- Recent Registrations ----------------------------------- -->
    <div class="card">
      <h3 class="card-title">Recent Registrations</h3>
      <div v-if="loadingReg" class="loading-msg">Loading…</div>
      <div v-else-if="!recentRegs.length" class="empty-msg">No enrolled employees yet.</div>
      <ul v-else class="reg-list">
        <li v-for="r in recentRegs" :key="r.id" class="reg-row">
          <div class="reg-avatar" :style="{ background: avatarBg(r.name) }">{{ initials(r.name) }}</div>
          <div class="reg-info">
            <p class="reg-name">{{ r.name }}</p>
            <p class="reg-company">{{ r.company }}</p>
          </div>
          <div class="reg-right">
            <span class="tier-badge" :class="'tier-' + r.tier">{{ tierLabel(r.tier) }}</span>
            <span class="reg-date">{{ r.enrolled_at }}</span>
          </div>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

/* -- Types ------------------------------------------------------ */
interface Stats {
  overview: { total_companies: number; active_companies: number; total_employees: number; enrolled_employees: number; total_gyms: number; partner_gyms: number; active_memberships: number }
  revenue:  { paid_invoices_etb: number; total_subscriptions_etb: number }
  activity: { checkins_today: number; checkins_week: number; checkins_month: number }
}
interface Pkg   { basic: number; basic_plus: number; platinum: number }
interface Rev   { name: string; revenue: number }
interface Trend { date: string; count: number }
interface Reg   { id: number; name: string; company: string; tier: string; enrolled_at: string }

/* -- Data ------------------------------------------------------- */
const stats       = ref<Stats | null>(null)
const pkgDist     = ref<Pkg>({ basic: 0, basic_plus: 0, platinum: 0 })
const revenueData = ref<Rev[]>([])
const trendData   = ref<Trend[]>([])
const recentRegs  = ref<Reg[]>([])

const loading       = ref(true)
const loadingPkg    = ref(true)
const loadingRev    = ref(true)
const loadingTrend  = ref(true)
const loadingReg    = ref(true)

onMounted(() => {
  Promise.allSettled([
    api.get<Stats>('dashboard/stats').then(d => { stats.value = d }).finally(() => { loading.value = false }),
    api.get<Pkg>('dashboard/package-distribution').then(d => { pkgDist.value = d }).finally(() => { loadingPkg.value = false }),
    api.get<Rev[]>('dashboard/revenue-by-company').then(d => { revenueData.value = d }).finally(() => { loadingRev.value = false }),
    api.get<Trend[]>('dashboard/checkin-trend').then(d => { trendData.value = d }).finally(() => { loadingTrend.value = false }),
    api.get<Reg[]>('dashboard/recent-registrations').then(d => { recentRegs.value = d }).finally(() => { loadingReg.value = false }),
  ])
})

/* -- Stat cards ------------------------------------------------- */
const statCards = computed(() => [
  { label: 'Total Companies',    value: stats.value?.overview.total_companies   ?? 0, sub: `${stats.value?.overview.active_companies ?? 0} active`,       bg: '#EBFAEE', color: '#3b82f6', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { label: 'Partner Gyms',       value: stats.value?.overview.total_gyms        ?? 0, sub: `${stats.value?.overview.partner_gyms ?? 0} partners`,         bg: '#EBFAEE', color: '#2EB84B', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` },
  { label: 'Total Employees',    value: stats.value?.overview.total_employees   ?? 0, sub: `${stats.value?.overview.enrolled_employees ?? 0} enrolled`,  bg: '#f0fdf4', color: '#4CD964', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { label: "Today's Check-ins",  value: stats.value?.activity.checkins_today    ?? 0, sub: `${stats.value?.activity.checkins_month ?? 0} this month`,    bg: '#fff7ed', color: '#f59e0b', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>` },
])

/* -- Donut chart ------------------------------------------------ */
const circumference = 2 * Math.PI * 58
const donutPalette  = ['#3b82f6', '#2EB84B', '#f59e0b']
const donutLabels   = ['Basic', 'Basic Plus', 'Platinum']
const totalPkg      = computed(() => pkgDist.value.basic + pkgDist.value.basic_plus + pkgDist.value.platinum)

const donutSegments = computed(() => {
  const counts = [pkgDist.value.basic, pkgDist.value.basic_plus, pkgDist.value.platinum]
  const total  = totalPkg.value || 1
  let offset   = 0
  return counts.map((c, i) => {
    const dash = (c / total) * circumference
    const s    = { color: donutPalette[i], label: donutLabels[i], count: c, dash, offset }
    offset += dash
    return s
  })
})

/* -- Bar chart -------------------------------------------------- */
const barPalette = ['#4CD964','#2EB84B','#3b82f6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16']
const barStep = 58; const barPad = 12; const barW = 36
const barSvgW = computed(() => Math.max(revenueData.value.length * barStep + barPad * 2, 300))
const maxRev  = computed(() => Math.max(...revenueData.value.map(d => d.revenue), 1))
function barH(v: number) { return (v / maxRev.value) * 160 }
function shortN(v: number) { return v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'K' : String(v) }

/* -- Line chart ------------------------------------------------- */
const LW = 700; const LH = 160; const Y_LABEL_W = 28

const yMax   = computed(() => Math.max(...trendData.value.map(d => d.count), 4))
const yTicks = computed(() => {
  const step = Math.ceil(yMax.value / 4)
  return [0, step, step * 2, step * 3, step * 4]
})

function lx(i: number) {
  const n = trendData.value.length
  return n < 2 ? Y_LABEL_W : Y_LABEL_W + (i / (n - 1)) * (LW - Y_LABEL_W)
}
function ly(count: number) {
  return LH - (count / (yMax.value || 1)) * (LH - 10) + 5
}

const linePoints = computed(() =>
  trendData.value.map((d, i) => `${lx(i)},${ly(d.count)}`).join(' ')
)
const areaPoints = computed(() => {
  if (!trendData.value.length) return ''
  const pts  = trendData.value.map((d, i) => `${lx(i)},${ly(d.count)}`).join(' ')
  const last = lx(trendData.value.length - 1)
  return `${Y_LABEL_W},${LH + 5} ${pts} ${last},${LH + 5}`
})

/* Hover */
const hoverIdx   = ref(-1)
const trendWrap  = ref<HTMLElement | null>(null)

const tooltipX = computed(() => {
  if (hoverIdx.value < 0) return 0
  const x = lx(hoverIdx.value)
  return x + 115 > LW ? x - 120 : x + 8
})
const tooltipY = computed(() => {
  if (hoverIdx.value < 0) return 0
  return Math.max(0, ly(trendData.value[hoverIdx.value]?.count ?? 0) - 45)
})

function onTrendMove(e: MouseEvent) {
  if (!trendData.value.length) return
  const el   = e.currentTarget as SVGSVGElement
  const rect = el.getBoundingClientRect()
  const svgX = ((e.clientX - rect.left) / rect.width) * LW
  const usable = LW - Y_LABEL_W
  const n      = trendData.value.length
  let idx      = Math.round(((svgX - Y_LABEL_W) / usable) * (n - 1))
  idx = Math.max(0, Math.min(n - 1, idx))
  hoverIdx.value = idx
}

/* -- Recent Registrations helpers ------------------------------ */
const AVATAR_COLORS = ['#3b82f6','#2EB84B','#4CD964','#f59e0b','#ef4444','#06b6d4','#ec4899']
function avatarBg(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
function initials(name: string) {
  return (name ?? '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function tierLabel(t: string) {
  return { basic: 'Basic', basic_plus: 'Basic Plus', platinum: 'Platinum' }[t] ?? t
}
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-value { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.stat-label { font-size: 0.78rem; color: #64748b; margin: 0; }
.stat-sub   { font-size: 0.72rem; color: #4CD964; margin: 2px 0 0; }

/* Cards */
.card {
  background: white;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 18px;
}
.card-unit { font-size: 0.75rem; color: #94a3b8; font-weight: 400; }
.loading-msg, .empty-msg { color: #94a3b8; font-size: 0.85rem; padding: 24px 0; text-align: center; }

/* Row 2 */
.row-2 { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }

/* Donut */
.donut-wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.donut-legend { display: flex; flex-direction: column; gap: 12px; }
.legend-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-label { color: #64748b; flex: 1; }
.legend-val   { color: #0f172a; font-weight: 600; }

/* Bar */
.bar-scroll { overflow-x: auto; }

/* Line trend */
.trend-svg {
  display: block;
  width: 100%;
  height: 200px;
  cursor: crosshair;
  overflow: visible;
}

/* Recent Registrations */
.reg-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
.reg-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f1f5f9;
}
.reg-row:last-child { border-bottom: none; }
.reg-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.reg-info { flex: 1; min-width: 0; }
.reg-name    { font-size: 0.88rem; font-weight: 600; color: #0f172a; margin: 0; }
.reg-company { font-size: 0.75rem; color: #94a3b8; margin: 2px 0 0; }
.reg-right   { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.reg-date    { font-size: 0.75rem; color: #94a3b8; }

/* Tier badges */
.tier-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600;
}
.tier-basic      { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.tier-basic_plus { background: #d1fae5; color: #2EB84B; border: 1px solid #a7f3d0; }
.tier-platinum   { background: #ede9fe; color: #2EB84B; border: 1px solid #B8F0C0; }

@media (max-width: 900px) {
  .row-2 { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
