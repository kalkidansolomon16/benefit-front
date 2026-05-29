<script setup lang="ts">
const footerLinks = [
  {
    heading: 'Product',
    links: ['Plans & Pricing', 'For Companies', 'For Employees', 'For Partners', 'Mobile App', 'Integrations'],
  },
  {
    heading: 'Resources',
    links: ['Blog', 'Case Studies', 'ROI Calculator', 'Enrollment Guide', 'Wellness Report', 'Help Center'],
  },
  {
    heading: 'Company',
    links: ['About Us', 'Careers', 'Press', 'Contact', 'Partners', 'Investors'],
  },
  {
    heading: 'Support',
    links: ['FAQ', 'Customer Support', 'System Status', 'Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  },
]

const socials = [
  { name: 'LinkedIn', icon: '💼', href: '#' },
  { name: 'Twitter', icon: '🐦', href: '#' },
  { name: 'Instagram', icon: '📸', href: '#' },
  { name: 'Facebook', icon: '👥', href: '#' },
]
</script>

<template>
  <footer class="footer">
    <!-- Top CTA Band -->
    <div class="footer-cta-band">
      <div class="container footer-cta-inner">
        <div class="footer-cta-text">
          <h3>Start your wellness journey today</h3>
          <p>Join 500+ Ethiopian organisations improving their employees' health and happiness with FitAccess.</p>
        </div>
        <div class="footer-cta-actions">
          <a href="#hero" class="btn btn-primary">Get Free Quote</a>
          <a href="#plans" class="btn btn-white">See Plans</a>
        </div>
      </div>
    </div>

    <!-- Main Footer -->
    <div class="footer-main">
      <div class="container footer-main-inner">
        <!-- Brand column -->
        <div class="footer-brand">
          <div class="footer-logo">
            <span class="logo-icon">✦</span>
            <span class="logo-text">FitAccess</span>
          </div>
          <p class="footer-tagline">
            Ethiopia's #1 corporate wellness platform — connecting Addis Ababa's workforce
            to premium gyms, clinics, and coaches, billed in ETB.
          </p>
          <div class="footer-contact">
            <div class="footer-contact-item">📍 Bole Road, Addis Ababa, Ethiopia</div>
            <div class="footer-contact-item">📞 +251 911 000 000</div>
            <div class="footer-contact-item">✉️ hello@fitaccess.et</div>
          </div>
          <div class="footer-socials">
            <a
              v-for="social in socials"
              :key="social.name"
              :href="social.href"
              class="social-btn"
              :aria-label="social.name"
            >{{ social.icon }}</a>
          </div>
          <div class="footer-app-badges">
            <a href="#" class="app-badge">
              <span class="app-badge-icon">🍎</span>
              <div>
                <div class="badge-small">Download on the</div>
                <div class="badge-store">App Store</div>
              </div>
            </a>
            <a href="#" class="app-badge">
              <span class="app-badge-icon">▶️</span>
              <div>
                <div class="badge-small">Get it on</div>
                <div class="badge-store">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        <!-- Link columns -->
        <div class="footer-links-grid">
          <div v-for="col in footerLinks" :key="col.heading" class="footer-col">
            <h4 class="footer-col-heading">{{ col.heading }}</h4>
            <ul class="footer-col-links">
              <li v-for="link in col.links" :key="link">
                <a href="#" class="footer-link">{{ link }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p class="footer-copy">© 2024 FitAccess Ethiopia. All rights reserved. Registered in Addis Ababa, Ethiopia.</p>
        <div class="footer-bottom-badges">
          <span class="trust-badge">🔒 Secure Platform</span>
          <span class="trust-badge">✅ ETB Billing</span>
          <span class="trust-badge">🇪🇹 Made for Ethiopia</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer { background: var(--color-primary-dark, #0f2447); }

/* CTA Band */
.footer-cta-band {
  background: linear-gradient(135deg, #1b3a6b, #4CD964);
  padding: 56px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.footer-cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}
.footer-cta-text h3 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-white);
  margin-bottom: 8px;
}
.footer-cta-text p {
  font-size: 1rem;
  color: rgba(255,255,255,0.7);
}
.footer-cta-actions { display: flex; gap: 14px; flex-shrink: 0; }

/* Main Footer */
.footer-main {
  padding: 72px 0 48px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.footer-main-inner {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 80px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-white);
  margin-bottom: 16px;
}
.logo-icon { color: var(--color-green); }

.footer-tagline {
  font-size: 0.92rem;
  color: rgba(255,255,255,0.55);
  line-height: 1.7;
  margin-bottom: 24px;
}

.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
}
.footer-contact-item {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
}

.footer-socials {
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
}
.social-btn {
  width: 40px; height: 40px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  transition: var(--transition);
}
.social-btn:hover {
  background: rgba(255,255,255,0.16);
  border-color: rgba(255,255,255,0.25);
  transform: translateY(-2px);
}

.footer-app-badges { display: flex; gap: 12px; }
.app-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-md);
  transition: var(--transition);
}
.app-badge:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
.app-badge-icon { font-size: 1.4rem; }
.badge-small { font-size: 0.65rem; color: rgba(255,255,255,0.55); }
.badge-store { font-size: 0.9rem; font-weight: 700; color: var(--color-white); }

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
.footer-col-heading {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.9);
  margin-bottom: 20px;
}
.footer-col-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-link {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.5);
  transition: var(--transition);
}
.footer-link:hover { color: rgba(255,255,255,0.9); padding-left: 4px; }

/* Bottom */
.footer-bottom {
  padding: 20px 0;
}
.footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.footer-copy {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.35);
}
.footer-bottom-badges { display: flex; gap: 16px; flex-wrap: wrap; }
.trust-badge {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.4);
  padding: 4px 12px;
  background: rgba(255,255,255,0.06);
  border-radius: var(--radius-full);
  border: 1px solid rgba(255,255,255,0.1);
}

@media (max-width: 1024px) {
  .footer-main-inner { grid-template-columns: 1fr; gap: 48px; }
  .footer-links-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .footer-cta-inner { flex-direction: column; text-align: center; }
  .footer-cta-actions { flex-direction: column; width: 100%; }
  .footer-links-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-bottom-inner { flex-direction: column; text-align: center; }
  .footer-app-badges { flex-direction: column; }
}
</style>
