<script setup lang="ts">
</script>

<template>
  <section id="hero" class="hero">
    <!-- Background shapes -->
    <div class="hero-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="container hero-inner">
      <!-- Left Content -->
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Ethiopia's #1 Corporate Wellness Platform
        </div>

        <h1 class="hero-title">
          Addis Ababa's premier
          <span class="hero-title-accent">employee wellness</span>
          platform
        </h1>

        <p class="hero-description">
          Give your team access to the best gyms, wellness clinics, and fitness centres
          across Addis Ababa — one unified platform, paid in ETB, built for Ethiopian organisations.
        </p>

        <div class="hero-ctas">
          <a href="#plans" class="btn btn-primary hero-btn">
            Find Your Plan
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="#how-it-works" class="btn btn-white hero-btn-outline">
            Request a Quote
          </a>
        </div>

        <div class="hero-stats">
          <div class="hero-stat">
            <strong>120+</strong>
            <span>Partner Gyms in Addis</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <strong>500+</strong>
            <span>Enrolled Companies</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <strong>ETB</strong>
            <span>Local Currency Billing</span>
          </div>
        </div>
      </div>

      <!-- Right Visual -->
      <div class="hero-visual">
        <div class="hero-card main-card">
          <div class="card-header">
            <div class="card-avatar card-avatar-1">💪</div>
            <div>
              <div class="card-name">Tigist A.</div>
              <div class="card-role">Marketing Director</div>
            </div>
            <div class="card-badge-green">Active</div>
          </div>
          <div class="card-progress-label">
            <span>Monthly goal</span><span>68%</span>
          </div>
          <div class="card-progress-bar">
            <div class="card-progress-fill" style="width: 68%"></div>
          </div>
          <div class="card-activities">
            <div class="activity-chip">🏋️ Gym</div>
            <div class="activity-chip">🧘 Yoga</div>
            <div class="activity-chip">🏃 Run</div>
          </div>
        </div>

        <div class="hero-card stats-card">
          <div class="stats-card-icon">📈</div>
          <div class="stats-card-value">35%</div>
          <div class="stats-card-label">Reduction in<br>healthcare costs</div>
        </div>

        <div class="hero-card rating-card">
          <div class="rating-stars">★★★★★</div>
          <div class="rating-text">"Best employee benefit we've ever offered in Ethiopia"</div>
          <div class="rating-author">— HR Director, Commercial Bank of Ethiopia</div>
        </div>

        <div class="floating-chip chip-1">🔥 #1 in Addis Ababa</div>
        <div class="floating-chip chip-2">✓ Billed in ETB</div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="scroll-indicator">
      <div class="scroll-dot"></div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f2447 0%, #1b3a6b 50%, #1e4080 100%);
  display: flex;
  align-items: center;
  overflow: hidden;
  padding-top: 80px;
}

.hero-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}
.blob-1 {
  width: 600px; height: 600px;
  background: #2563eb;
  top: -200px; right: -100px;
}
.blob-2 {
  width: 400px; height: 400px;
  background: #00c896;
  bottom: -100px; left: 20%;
}
.blob-3 {
  width: 300px; height: 300px;
  background: #7c3aed;
  top: 30%; left: -50px;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  padding-top: 40px;
  padding-bottom: 60px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-full);
  color: rgba(255,255,255,0.9);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 24px;
  backdrop-filter: blur(8px);
}
.badge-dot {
  width: 8px; height: 8px;
  background: var(--color-green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--color-white);
  line-height: 1.15;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}
.hero-title-accent {
  display: block;
  background: linear-gradient(135deg, #00c896, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.15rem;
  color: rgba(255,255,255,0.75);
  max-width: 500px;
  line-height: 1.75;
  margin-bottom: 36px;
}

.hero-ctas {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 48px;
}
.hero-btn { padding: 16px 32px; font-size: 1rem; }
.hero-btn-outline {
  background: rgba(255,255,255,0.1);
  color: var(--color-white);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-full);
  padding: 16px 32px;
  font-size: 1rem;
  font-weight: 600;
  transition: var(--transition);
  backdrop-filter: blur(8px);
}
.hero-btn-outline:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-1px);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}
.hero-stat strong {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-white);
}
.hero-stat span {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
}
.hero-stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.2);
}

/* Hero Visual */
.hero-visual {
  position: relative;
  height: 480px;
}

.hero-card {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  position: absolute;
}

.main-card {
  width: 300px;
  top: 40px; left: 0;
  animation: floatCard 4s ease-in-out infinite;
}
@keyframes floatCard {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.card-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
  background: var(--color-bg-light);
}
.card-name { font-weight: 600; font-size: 0.9rem; color: var(--color-primary); }
.card-role { font-size: 0.75rem; color: var(--color-text-muted); }
.card-badge-green {
  margin-left: auto;
  padding: 3px 10px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}
.card-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}
.card-progress-bar {
  background: var(--color-bg-gray);
  border-radius: var(--radius-full);
  height: 8px;
  margin-bottom: 14px;
}
.card-progress-fill {
  background: linear-gradient(90deg, var(--color-green), var(--color-accent));
  height: 100%;
  border-radius: var(--radius-full);
}
.card-activities {
  display: flex;
  gap: 8px;
}
.activity-chip {
  padding: 5px 12px;
  background: var(--color-bg-light);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  color: var(--color-primary);
  font-weight: 500;
}

.stats-card {
  width: 160px;
  text-align: center;
  bottom: 100px;
  right: 20px;
  animation: floatCard 4s ease-in-out infinite 1.5s;
}
.stats-card-icon { font-size: 1.8rem; margin-bottom: 6px; }
.stats-card-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
}
.stats-card-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.rating-card {
  width: 240px;
  bottom: 20px;
  left: 30px;
  animation: floatCard 4s ease-in-out infinite 2.5s;
}
.rating-stars { color: #f59e0b; font-size: 1rem; margin-bottom: 8px; }
.rating-text {
  font-size: 0.82rem;
  color: var(--color-text);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 6px;
}
.rating-author { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; }

.floating-chip {
  position: absolute;
  padding: 8px 16px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: var(--radius-full);
  color: var(--color-white);
  font-size: 0.82rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
  animation: floatChip 3s ease-in-out infinite;
}
@keyframes floatChip {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.chip-1 { top: 10px; right: 10px; animation-delay: 0.5s; }
.chip-2 { top: 140px; right: 0px; animation-delay: 1.5s; }

.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.scroll-dot {
  width: 6px; height: 6px;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
  animation: scrollBounce 1.5s ease-in-out infinite;
}
@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(8px); opacity: 1; }
}

@media (max-width: 1024px) {
  .hero-title { font-size: 2.75rem; }
}

@media (max-width: 768px) {
  .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 40px;
  }
  .hero-title { font-size: 2.25rem; }
  .hero-description { margin: 0 auto 32px; }
  .hero-ctas { justify-content: center; }
  .hero-stats { justify-content: center; }
  .hero-visual { display: none; }
  .hero-badge { justify-content: center; }
}
</style>
