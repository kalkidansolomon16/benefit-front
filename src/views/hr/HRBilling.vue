<template>
  <div class="page">
    <!-- Coverage + billing preference -->
    <section v-if="coverage && !detailInv" class="cov-card" :class="coverageTone">
      <div class="cov-main">
        <p class="cov-kicker">Employee access</p>
        <h2 class="cov-title">{{ coverageHeadline }}</h2>
        <p class="cov-text">{{ coverageDetail }}</p>
        <ul class="cov-stats">
          <li><strong>{{ coverage.covered }}</strong> covered</li>
          <li v-if="coverage.expiring_soon"><strong>{{ coverage.expiring_soon }}</strong> ending within a week</li>
          <li v-if="coverage.expired"><strong>{{ coverage.expired }}</strong> access ended</li>
          <li v-if="coverage.not_paid_yet"><strong>{{ coverage.not_paid_yet }}</strong> not paid yet</li>
        </ul>
      </div>
      <div class="cov-pref">
        <label class="cov-pref-label" for="bill-cycle">We prefer to pay</label>
        <div class="cov-pref-row">
          <select
            id="bill-cycle"
            v-model.number="prefMonths"
            class="cov-select"
            :disabled="!coverage.can_change || prefSaving"
          >
            <option v-for="c in coverage.cycles" :key="c.months" :value="c.months">{{ c.label }}</option>
          </select>
          <button
            v-if="coverage.can_change"
            type="button"
            class="cov-save"
            :disabled="prefSaving || prefMonths === coverage.billing_cycle_months"
            @click="savePreference"
          >{{ prefSaving ? 'Saving…' : 'Save' }}</button>
        </div>
        <p class="cov-pref-hint">
          {{ coverage.can_change
            ? 'Your next invoice from FitAccess will cover this many months.'
            : 'Set by your head office.' }}
        </p>
      </div>
    </section>

    <!-- Branch filter (head office only, when the company has branches) -->
    <div v-if="branchOptions.length && !detailInv" class="branch-filter">
      <label class="branch-filter-label" for="bill-branch">Branch</label>
      <select id="bill-branch" v-model="branchFilter" class="branch-filter-select" @change="load">
        <option value="">All branches</option>
        <option value="main">Head office</option>
        <option v-for="b in branchOptions" :key="b.id" :value="String(b.id)">{{ b.name }}</option>
      </select>
    </div>
    <p v-else-if="myBranchId && !detailInv" class="branch-note">
      Showing the invoices issued to your branch. Each branch is invoiced and pays separately.
    </p>

    <!-- Loading -->
    <div v-if="loading" class="state-msg">Loading invoices…</div>

    <!-- No invoices -->
    <div v-else-if="!detailInv && invoices.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg
          width="32"
          height="32"
          fill="none"
          stroke="#94a3b8"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <p class="empty-title">No invoices yet</p>
      <p class="empty-sub">Your invoices will appear here once the admin sends them.</p>
    </div>

    <!-- ------------------- INVOICE LIST ------------------- -->
    <template v-else-if="!detailInv">
      <div class="inv-list">
        <div
          v-for="inv in paginatedInvoices"
          :key="inv.id"
          class="inv-card"
          :class="{ 'inv-card--overdue': isOverdue(inv) }"
          @click="openDetail(inv)"
        >
          <div class="inv-card-left">
            <div class="period-badge">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              {{ inv.billing_period }}
            </div>
            <div>
              <p class="inv-number">{{ inv.invoice_number }}</p>
              <p v-if="inv.period_end" class="inv-cover">
                {{ inv.status === 'paid' ? 'Paid: access until' : 'Pays for access until' }} {{ fmtDay(inv.period_end) }}
                · {{ inv.period_months }} month{{ inv.period_months === 1 ? '' : 's' }}
              </p>
              <p v-if="inv.branch" class="inv-branch">📍 {{ inv.branch.name }}</p>
              <p class="inv-employees">
                {{ totalEmployees(inv) }} employee{{ totalEmployees(inv) !== 1 ? 's' : '' }} across
                {{ inv.items.length }} plan{{ inv.items.length !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>
          <div class="inv-card-right">
            <p class="inv-amount">ETB {{ Number(inv.total_amount).toLocaleString() }}</p>
            <span class="inv-badge" :class="'inv-' + inv.status">{{
              statusLabel(inv.status)
            }}</span>
            <p v-if="inv.due_date" class="inv-due" :class="{ 'inv-due--over': isOverdue(inv) }">
              {{ isOverdue(inv) ? 'Overdue since' : 'Due' }} {{ inv.due_date }}
            </p>
          </div>
        </div>
      </div>

      <AppPagination
        v-model:page="billPage"
        :total-pages="billTotalPages"
        :total="invoices.length"
        :per-page="billPerPage"
      />
    </template>

    <!-- ------------------- INVOICE DETAIL ------------------- -->
    <template v-else>
      <!-- Back -->
      <button class="back-btn" @click="detailInv = null">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Invoices
      </button>

      <!-- OVERDUE ALERT BANNER -->
      <div v-if="detailInv.status === 'overdue'" class="overdue-banner">
        <div class="overdue-banner-icon">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div class="overdue-banner-body">
          <p class="overdue-banner-title">Payment Overdue</p>
          <p class="overdue-banner-text">
            The due date for invoice <strong>{{ detailInv.invoice_number }}</strong> passed on
            <strong>{{ detailInv.due_date }}</strong
            >. Please proceed with payment immediately or request an extension below.
          </p>
        </div>
      </div>

      <div class="detail-card">
        <!-- Header -->
        <div class="detail-header">
          <div>
            <p class="detail-period">{{ detailInv.billing_period }}</p>
            <p class="detail-inv-num">{{ detailInv.invoice_number }}</p>
            <p v-if="detailInv.branch" class="inv-branch">📍 {{ detailInv.branch.name }}</p>
          </div>
          <span class="inv-badge" :class="'inv-' + detailInv.status">{{
            statusLabel(detailInv.status)
          }}</span>
        </div>

        <!-- What this invoice pays for -->
        <div v-if="detailInv.period_start && detailInv.period_end" class="cov-box">
          <p class="cov-box-title">Coverage period</p>
          <p class="cov-box-range">
            {{ fmtDay(detailInv.period_start) }} – {{ fmtDay(detailInv.period_end) }}
            <span>({{ detailInv.period_months }} month{{ detailInv.period_months === 1 ? '' : 's' }})</span>
          </p>
          <p class="cov-box-text">
            <template v-if="detailInv.status === 'paid'">
              Paid. The employees on this invoice can use FitAccess until {{ fmtDay(detailInv.period_end) }}.
            </template>
            <template v-else>
              Once this invoice is paid, the employees on it can use FitAccess until {{ fmtDay(detailInv.period_end) }}.
              If it is not paid, their access stops when their current period ends.
            </template>
          </p>
        </div>

        <!-- Breakdown table -->
        <div class="breakdown-wrap">
          <p class="section-label">Plan Breakdown</p>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th class="tr">Employees</th>
                <th class="tr">Monthly price (ETB)</th>
                <th class="tr">Months</th>
                <th class="tr">Subtotal (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detailInv.items" :key="item.plan_tier">
                <td>
                  <span class="plan-chip" :class="'chip-' + item.plan_tier">{{
                    item.plan_name
                  }}</span>
                </td>
                <td class="tr">{{ item.employee_count }}</td>
                <td class="tr">{{ Number(item.unit_price).toLocaleString() }}</td>
                <td class="tr">{{ item.months ?? 1 }}</td>
                <td class="tr fw">{{ Number(item.subtotal).toLocaleString() }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="total-label">Total Amount</td>
                <td class="tr total-val">
                  ETB {{ Number(detailInv.total_amount).toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Meta -->
        <div class="detail-meta-row">
          <div v-if="detailInv.due_date" class="meta-item">
            <span class="meta-label">Due Date</span>
            <span
              class="meta-val"
              :class="{ 'meta-val--danger': detailInv.status === 'overdue' }"
              >{{ detailInv.due_date }}</span
            >
          </div>
          <div v-if="detailInv.sent_at" class="meta-item">
            <span class="meta-label">Invoice Date</span>
            <span class="meta-val">{{ detailInv.sent_at }}</span>
          </div>
          <div v-if="detailInv.notes" class="meta-item meta-item--note">
            <span class="meta-label">Note from Admin</span>
            <span class="meta-val">{{ detailInv.notes }}</span>
          </div>
        </div>

        <!-- Negotiation status panel -->
        <div
          v-if="detailInv.negotiation"
          class="neg-status-panel"
          :class="'neg-' + detailInv.negotiation.status"
        >
          <div class="neg-status-header">
            <span class="neg-status-icon">
              <template v-if="detailInv.negotiation.status === 'pending'">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </template>
              <template v-else-if="detailInv.negotiation.status === 'approved'">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#16a34a"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </template>
              <template v-else>
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#dc2626"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </template>
            </span>
            <div>
              <p class="neg-status-title">
                Extension Request
                <span class="neg-badge" :class="'neg-badge-' + detailInv.negotiation.status">
                  {{
                    { pending: 'Under Review', approved: 'Approved', rejected: 'Rejected' }[
                      detailInv.negotiation.status
                    ]
                  }}
                </span>
              </p>
              <p class="neg-status-date">
                Submitted {{ formatDate(detailInv.negotiation.submitted_at) }}
              </p>
            </div>
          </div>
          <p class="neg-reason-text">"{{ detailInv.negotiation.reason }}"</p>
          <div v-if="detailInv.negotiation.admin_notes" class="neg-admin-notes">
            <p class="neg-admin-label">Admin Response</p>
            <p class="neg-admin-text">{{ detailInv.negotiation.admin_notes }}</p>
          </div>
          <p v-if="detailInv.negotiation.status === 'rejected'" class="neg-rejected-hint">
            Your extension request was rejected. Contact the admin or proceed to payment immediately
            to avoid account suspension.
          </p>
        </div>

        <!-- Previous payments -->
        <div v-if="detailInv.payments && detailInv.payments.length > 0" class="prev-payments">
          <p class="section-label">Payment History</p>
          <div v-for="p in detailInv.payments" :key="p.id" class="pay-row">
            <div class="pay-row-left">
              <p class="pay-bank">{{ p.payment_method_bank }}</p>
              <p class="pay-date">Submitted {{ formatDate(p.submitted_at) }}</p>
            </div>
            <div class="pay-row-right">
              <span class="ps-badge" :class="'ps-' + p.status">{{ p.status }}</span>
              <p v-if="p.admin_notes" class="pay-note">{{ p.admin_notes }}</p>
            </div>
          </div>
        </div>

        <!-- BOTTOM CTA SECTION -->
        <div class="cta-area">
          <!-- Pending payment notice -->
          <div v-if="hasPendingPayment" class="notice notice--amber">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Your payment receipt has been submitted and is under review.
          </div>

          <!-- Paid notice -->
          <div v-else-if="detailInv.status === 'paid'" class="notice notice--green">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            This invoice has been paid and verified. Your employees have full service access.
          </div>

          <!-- Normal sent: pay now -->
          <template v-else-if="detailInv.status === 'sent'">
            <div class="pay-options">
              <!-- Chapa online payment -->
              <button class="btn-chapa" :disabled="chapaLoading" @click="payWithChapa">
                <span v-if="chapaLoading" class="spinner-sm"></span>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                {{ chapaLoading ? 'Redirecting to Chapa…' : 'Pay Online with Chapa' }}
              </button>
              <p class="pay-or">— or pay by bank transfer —</p>
              <!-- Manual bank transfer -->
              <button class="btn-proceed btn-proceed--outline" @click="payModal.show = true">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Bank Receipt
              </button>
            </div>
            <p v-if="chapaError" class="form-error" style="margin-top:8px">{{ chapaError }}</p>
          </template>

          <!-- OVERDUE state — Pay Now is locked until admin re-issues the invoice -->
          <template v-else-if="detailInv.status === 'overdue'">
            <div class="overdue-actions">
              <!-- No negotiation yet: Pay Now disabled, must request extension -->
              <template v-if="!detailInv.negotiation">
                <div class="locked-pay-wrap">
                  <button class="btn-proceed btn-proceed--locked" disabled>
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Pay Now
                  </button>
                  <p class="locked-hint">
                    Payment is locked. Submit an extension request and wait for the admin to
                    re-issue your invoice before paying.
                  </p>
                </div>
                <button class="btn-negotiate" @click="negModal.show = true">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Request Extension
                </button>
              </template>

              <!-- Pending negotiation: Pay Now locked, waiting for admin -->
              <template v-else-if="detailInv.negotiation.status === 'pending'">
                <div class="locked-pay-wrap">
                  <button class="btn-proceed btn-proceed--locked" disabled>
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Pay Now
                  </button>
                  <p class="locked-hint">
                    Your extension request is under admin review. Payment will be unlocked once the
                    admin approves and re-issues the invoice.
                  </p>
                </div>
              </template>

              <!-- Approved: Pay Now still locked — admin must re-send invoice first (status changes to 'sent') -->
              <template v-else-if="detailInv.negotiation.status === 'approved'">
                <div class="locked-pay-wrap">
                  <button class="btn-proceed btn-proceed--locked" disabled>
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Pay Now
                  </button>
                  <div class="approved-hint">
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="#15803d"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <p>
                      Extension approved! Waiting for the admin to re-issue the invoice. You will be
                      able to pay once the new invoice is sent.
                    </p>
                  </div>
                </div>
              </template>

              <!-- Rejected: Pay Now locked, allow re-submitting negotiation -->
              <template v-else-if="detailInv.negotiation.status === 'rejected'">
                <div class="locked-pay-wrap">
                  <button class="btn-proceed btn-proceed--locked" disabled>
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Pay Now
                  </button>
                  <p class="locked-hint locked-hint--danger">
                    Your extension request was rejected. Contact the admin directly or submit a new
                    request with more details.
                  </p>
                </div>
                <button class="btn-negotiate" @click="negModal.show = true">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Re-submit Request
                </button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- ------------------- NEGOTIATION MODAL ------------------- -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="negModal.show" class="modal-backdrop" @click.self="negModal.show = false">
          <div class="modal">
            <div class="modal-header">
              <div>
                <p class="modal-title">Request Payment Extension</p>
                <p class="modal-sub">Explain why you need more time to pay this invoice.</p>
              </div>
              <button class="modal-close" @click="negModal.show = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="notice notice--amber" style="margin-bottom: 4px">
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                The admin will review your request and decide whether to grant an extension.
              </div>
              <div class="field">
                <label>Reason for Extension <span class="req">*</span></label>
                <textarea
                  v-model="negModal.reason"
                  rows="5"
                  placeholder="Describe your situation in detail — e.g. cash flow delays, pending transfer approval, bank processing issues—"
                />
                <p class="char-hint">{{ negModal.reason.length }} / 2000 characters (minimum 20)</p>
              </div>
              <p v-if="negModal.error" class="form-error">{{ negModal.error }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="negModal.show = false">Cancel</button>
              <button
                class="btn-submit-neg"
                :disabled="negModal.submitting || negModal.reason.length < 20"
                @click="submitNegotiation"
              >
                {{ negModal.submitting ? 'Submitting…' : 'Submit Request' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ------------------- PAYMENT MODAL ------------------- -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="payModal.show" class="modal-backdrop" @click.self="payModal.show = false">
          <div class="modal">
            <div class="modal-header">
              <div>
                <p class="modal-title">Submit Payment</p>
                <p class="modal-sub">
                  Invoice {{ detailInv?.invoice_number }} — ETB
                  {{ Number(detailInv?.total_amount).toLocaleString() }}
                </p>
              </div>
              <button class="modal-close" @click="payModal.show = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="field">
                <label>Payment Method <span class="req">*</span></label>
                <p class="field-hint">Select the bank account you transferred to.</p>
                <div v-if="methodsLoading" class="methods-loading">Loading payment methods…</div>
                <div v-else-if="paymentMethods.length === 0" class="methods-empty">
                  No payment methods available. Contact the admin.
                </div>
                <div v-else class="method-cards">
                  <button
                    v-for="m in paymentMethods"
                    :key="m.id"
                    class="method-select-card"
                    :class="{ 'method-select-card--selected': payModal.methodId === m.id }"
                    @click="payModal.methodId = m.id"
                  >
                    <div class="msc-check">
                      <svg
                        v-if="payModal.methodId === m.id"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div class="msc-info">
                      <p class="msc-bank">{{ m.bank_name }}</p>
                      <p class="msc-holder">{{ m.account_name }}</p>
                      <p class="msc-acct">
                        Acct: <strong>{{ m.account_number }}</strong>
                      </p>
                      <p v-if="m.instructions" class="msc-note">{{ m.instructions }}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div class="field">
                <label>Payment Receipt <span class="req">*</span></label>
                <p class="field-hint">
                  Attach the transfer confirmation screenshot or PDF (max 5 MB).
                </p>
                <div
                  class="upload-zone"
                  :class="{ 'upload-zone--has': payModal.file }"
                  @click="triggerFileInput"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    style="display: none"
                    @change="onFileChange"
                  />
                  <template v-if="!payModal.file">
                    <svg
                      width="28"
                      height="28"
                      fill="none"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p class="upload-text">Click to upload</p>
                    <p class="upload-hint">JPG, PNG or PDF, max 5 MB</p>
                  </template>
                  <template v-else>
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="#72B800"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <p class="upload-text upload-text--ok">{{ payModal.file.name }}</p>
                    <p class="upload-hint">Click to change</p>
                  </template>
                </div>
              </div>
              <p v-if="payModal.error" class="form-error">{{ payModal.error }}</p>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="payModal.show = false">Cancel</button>
              <button
                class="btn-submit-pay"
                :disabled="payModal.submitting || !payModal.methodId || !payModal.file"
                @click="submitPayment"
              >
                {{ payModal.submitting ? 'Submitting…' : 'Submit Payment' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

interface InvoiceItem {
  plan_tier: string
  plan_name: string
  employee_count: number
  unit_price: number
  months?: number
  subtotal: number
}
interface Coverage {
  billing_cycle_months: number
  billing_cycle_label: string
  cycles: { months: number; label: string }[]
  can_change: boolean
  employees: number
  covered: number
  expired: number
  not_paid_yet: number
  expiring_soon: number
  covered_until: string | null
  covered_until_latest: string | null
  grace_days: number
}
interface Negotiation {
  id: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  admin_notes: string | null
  submitted_at: string
  reviewed_at: string | null
}
interface PaymentRecord {
  id: number
  amount: number
  payment_method_bank: string
  payment_method_account_number: string
  receipt_url: string | null
  status: string
  submitted_at: string
  admin_notes: string | null
}
interface Invoice {
  id: number
  invoice_number: string
  billing_period: string
  period_months?: number
  period_start?: string | null
  period_end?: string | null
  total_amount: number
  due_date: string | null
  notes: string | null
  status: string
  sent_at: string | null
  paid_at: string | null
  items: InvoiceItem[]
  branch_scoped?: boolean
  branch?: { id: number | null; name: string } | null
  latest_payment: { status: string } | null
  negotiation: Negotiation | null
  payments?: PaymentRecord[]
}
interface PaymentMethod {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  instructions: string | null
}

const api = useApi()
const loading = ref(true)
const invoices = ref<Invoice[]>([])
const detailInv = ref<Invoice | null>(null)

const billPage = ref(1)
const billPerPage = 10
const billTotalPages = computed(() => Math.max(1, Math.ceil(invoices.value.length / billPerPage)))
const paginatedInvoices = computed(() =>
  invoices.value.slice((billPage.value - 1) * billPerPage, billPage.value * billPerPage)
)
const paymentMethods = ref<PaymentMethod[]>([])
const methodsLoading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const payModal = reactive({
  show: false,
  methodId: null as number | null,
  file: null as File | null,
  submitting: false,
  error: '',
})
const negModal = reactive({ show: false, reason: '', submitting: false, error: '' })
const toast = reactive({ show: false, type: 'success', message: '' })

// ── Chapa ─────────────────────────────────────────────────────
const chapaLoading = ref(false)
const chapaError   = ref('')

async function payWithChapa() {
  if (!detailInv.value) return
  chapaLoading.value = true
  chapaError.value   = ''
  try {
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    const res  = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/hr/billing/invoices/${detailInv.value.id}/chapa/initialize`,
      {
        method:  'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${auth.token}` },
      }
    )
    const data = await res.json()
    if (!res.ok) {
      chapaError.value = data.message || 'Failed to initialize Chapa payment.'
      return
    }
    // Redirect the browser to Chapa's hosted checkout page
    window.location.href = data.checkout_url
  } catch {
    chapaError.value = 'Network error. Please try again.'
  } finally {
    chapaLoading.value = false
  }
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message: msg })
  toastTimer = setTimeout(() => {
    toast.show = false
  }, 4000)
}

async function load() {
  loading.value = true
  billPage.value = 1
  loadCoverage()
  try {
    const qs = branchFilter.value ? `?company_branch_id=${encodeURIComponent(branchFilter.value)}` : ''
    invoices.value = await api.get<Invoice[]>(`hr/billing/invoices${qs}`)
  } finally {
    loading.value = false
  }
}

// Head office can narrow the list to one branch; a branch login only ever sees its own invoices
const auth = useAuthStore()
const myBranchId = auth.user?.company_branch_id ?? null
const branchOptions = ref<{ id: number; name: string }[]>([])
const branchFilter = ref('')

// ── Coverage + preference ─────────────────────────────────────
const coverage   = ref<Coverage | null>(null)
const prefMonths = ref(1)
const prefSaving = ref(false)

function fmtDay(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadCoverage() {
  try {
    coverage.value = await api.get<Coverage>('hr/billing/coverage')
    prefMonths.value = coverage.value.billing_cycle_months
  } catch { /* the card is optional */ }
}

async function savePreference() {
  prefSaving.value = true
  try {
    const res = await api.put<{ message: string; billing_cycle_months: number }>('hr/billing/preference', {
      billing_cycle_months: prefMonths.value,
    })
    if (coverage.value) coverage.value.billing_cycle_months = res.billing_cycle_months
    showToast(res.message)
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Could not save your preference.', 'error')
  } finally {
    prefSaving.value = false
  }
}

const coverageTone = computed(() => {
  const c = coverage.value
  if (!c || !c.employees) return 'cov--neutral'
  if (c.expired || c.not_paid_yet) return 'cov--alert'
  if (c.expiring_soon) return 'cov--warn'
  return 'cov--ok'
})
const coverageHeadline = computed(() => {
  const c = coverage.value
  if (!c) return ''
  if (!c.employees) return 'No enrolled employees yet'
  if (!c.covered) return c.expired ? 'Employee access has ended' : 'Waiting for your first payment'
  if (c.covered_until === c.covered_until_latest) return `Covered until ${fmtDay(c.covered_until)}`
  return `Covered until ${fmtDay(c.covered_until)} – ${fmtDay(c.covered_until_latest)}`
})
const coverageDetail = computed(() => {
  const c = coverage.value
  if (!c || !c.employees) return 'Employees appear here once they are approved and enrolled.'
  const stop = c.grace_days
    ? `${c.grace_days} day${c.grace_days === 1 ? '' : 's'} after their paid period ends`
    : 'the day after their paid period ends'
  const blocked = c.expired + c.not_paid_yet
  return blocked
    ? `${blocked} employee${blocked === 1 ? ' cannot' : 's cannot'} check in until the open invoice is paid. Access always stops ${stop}.`
    : `Employees can check in at partner facilities until then. Access stops ${stop} unless the next invoice is paid.`
})

onMounted(async () => {
  loadCoverage()
  if (!myBranchId) {
    try {
      branchOptions.value = (await api.get<{ branches: { id: number; name: string }[] }>('hr/branches')).branches
    } catch { /* the filter is optional */ }
  }
  await load()
})

async function openDetail(inv: Invoice) {
  const full = await api.get<Invoice>(`hr/billing/invoices/${inv.id}`)
  detailInv.value = full
  methodsLoading.value = true
  try {
    paymentMethods.value = await api.get<PaymentMethod[]>('hr/billing/payment-methods')
  } finally {
    methodsLoading.value = false
  }
}

function isOverdue(inv: Invoice): boolean {
  return (
    inv.status === 'overdue' ||
    (inv.status === 'sent' && !!inv.due_date && new Date(inv.due_date) < new Date())
  )
}

const hasPendingPayment = computed(
  () =>
    detailInv.value?.latest_payment?.status === 'pending' ||
    detailInv.value?.payments?.some((p) => p.status === 'pending') === true
)

function totalEmployees(inv: Invoice): number {
  return inv.items.reduce((sum, i) => sum + i.employee_count, 0)
}

function triggerFileInput() {
  fileInput.value?.click()
}
function onFileChange(e: Event) {
  payModal.file = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submitPayment() {
  payModal.error = ''
  if (!payModal.methodId || !payModal.file) {
    payModal.error = 'Please select a payment method and attach a receipt.'
    return
  }
  payModal.submitting = true
  try {
    const fd = new FormData()
    fd.append('payment_method_id', String(payModal.methodId))
    fd.append('receipt', payModal.file)
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/hr/billing/invoices/${detailInv.value!.id}/pay`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: fd,
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).message || `HTTP ${res.status}`)
    }
    payModal.show = false
    showToast('Payment submitted. Admin will verify within 1—2 business days.')
    detailInv.value = await api.get<Invoice>(`hr/billing/invoices/${detailInv.value!.id}`)
  } catch (e: unknown) {
    payModal.error = e instanceof Error ? e.message : 'Failed to submit payment.'
  } finally {
    payModal.submitting = false
  }
}

async function submitNegotiation() {
  negModal.error = ''
  if (negModal.reason.length < 20) {
    negModal.error = 'Please provide a detailed reason (at least 20 characters).'
    return
  }
  negModal.submitting = true
  try {
    await api.post(`hr/billing/invoices/${detailInv.value!.id}/negotiate`, {
      reason: negModal.reason,
    })
    negModal.show = false
    negModal.reason = ''
    showToast('Extension request submitted. Admin will review shortly.')
    detailInv.value = await api.get<Invoice>(`hr/billing/invoices/${detailInv.value!.id}`)
  } catch (e: unknown) {
    negModal.error = e instanceof Error ? e.message : 'Failed to submit request.'
  } finally {
    negModal.submitting = false
  }
}

function statusLabel(s: string) {
  return { draft: 'Draft', sent: 'Awaiting Payment', paid: 'Paid', overdue: 'Overdue' }[s] ?? s
}
function formatDate(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.state-msg {
  text-align: center;
  color: #94a3b8;
  padding: 48px;
  background: white;
  border-radius: 14px;
}
.empty-state {
  background: white;
  border-radius: 14px;
  padding: 64px 24px;
  text-align: center;
}
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
}
.empty-sub {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

/* Invoice list */
.inv-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inv-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  gap: 16px;
  flex-wrap: wrap;
}
.inv-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
  border-color: #cbd5e1;
}
.inv-card--overdue {
  border-left: 4px solid #ef4444;
}
.inv-card-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.period-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #f1f5f9;
  color: #475569;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.inv-number {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
  font-family: monospace;
}
.inv-employees {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}
.inv-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.inv-amount {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.inv-due {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0;
}
.inv-due--over {
  color: #ef4444;
  font-weight: 600;
}
.inv-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}
.inv-draft {
  background: #f1f5f9;
  color: #64748b;
}
.inv-sent {
  background: #ebfaee;
  color: #72B800;
}
.inv-paid {
  background: #d1fae5;
  color: #72B800;
}
.inv-overdue {
  background: #fee2e2;
  color: #dc2626;
}

/* Back button */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.84rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
}
.back-btn:hover {
  color: #0f172a;
}

/* Overdue banner */
.overdue-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  border-radius: 14px;
  padding: 16px 20px;
}
.overdue-banner-icon {
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 2px;
}
.overdue-banner-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #dc2626;
  margin: 0 0 4px;
}
.overdue-banner-text {
  font-size: 0.85rem;
  color: #7f1d1d;
  margin: 0;
  line-height: 1.55;
}
.overdue-banner-text strong {
  color: #dc2626;
}

/* Detail card */
.detail-card {
  background: white;
  border-radius: 18px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.detail-period {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
}
.detail-inv-num {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  font-family: monospace;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  margin: 0 0 10px;
}

/* Breakdown table */
.breakdown-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.breakdown-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.breakdown-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f8fafc;
  color: #374151;
}
.breakdown-table tbody tr:last-child td {
  border-bottom: none;
}
.breakdown-table tfoot td {
  padding: 13px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
.tr {
  text-align: right;
}
.fw {
  font-weight: 700;
}
.total-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}
.total-val {
  font-size: 1.1rem;
  color: #8BE000;
  font-weight: 700;
}
.plan-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
}
.chip-platinum {
  background: #ebfaee;
  color: #72B800;
}
.chip-basic_plus {
  background: #EEF9DC;
  color: #72B800;
}
.chip-basic {
  background: #f1f5f9;
  color: #64748b;
}

/* Meta row */
.detail-meta-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.meta-item--note {
  flex: 1;
}
.meta-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}
.meta-val {
  font-size: 0.88rem;
  color: #0f172a;
}
.meta-val--danger {
  color: #dc2626;
  font-weight: 600;
}

/* Negotiation status panel */
.neg-status-panel {
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1.5px solid;
}
.neg-pending {
  background: #fffbeb;
  border-color: #fde68a;
}
.neg-approved {
  background: #f0fdf4;
  border-color: #a7f3d0;
}
.neg-rejected {
  background: #fef2f2;
  border-color: #fecaca;
}
.neg-status-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.neg-status-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  line-height: 1;
}
.neg-status-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.neg-status-date {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}
.neg-badge {
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
}
.neg-badge-pending {
  background: #fef9c3;
  color: #a16207;
}
.neg-badge-approved {
  background: #d1fae5;
  color: #72B800;
}
.neg-badge-rejected {
  background: #fee2e2;
  color: #dc2626;
}
.neg-reason-text {
  font-size: 0.84rem;
  color: #374151;
  font-style: italic;
  margin: 0;
  padding: 10px 14px;
  background: white;
  border-radius: 8px;
  line-height: 1.55;
}
.neg-admin-notes {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.neg-admin-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin: 0;
}
.neg-admin-text {
  font-size: 0.84rem;
  color: #0f172a;
  margin: 0;
}
.neg-rejected-hint {
  font-size: 0.8rem;
  color: #dc2626;
  font-weight: 500;
  margin: 0;
}

/* Previous payments */
.prev-payments {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pay-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.pay-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.pay-bank {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 2px;
}
.pay-date {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}
.pay-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.ps-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}
.ps-pending {
  background: #fef9c3;
  color: #a16207;
}
.ps-verified {
  background: #d1fae5;
  color: #72B800;
}
.ps-rejected {
  background: #fee2e2;
  color: #dc2626;
}
.pay-note {
  font-size: 0.75rem;
  color: #ef4444;
  margin: 0;
  max-width: 200px;
  text-align: right;
}

/* CTA area */
.cta-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.overdue-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.neg-pending-note {
  font-size: 0.8rem;
  color: #a16207;
  margin: 0;
  font-style: italic;
}

/* Notices */
.notice {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 13px 16px;
  border-radius: 10px;
  font-size: 0.87rem;
  font-weight: 500;
}
.notice--amber {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}
.notice--green {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

/* Chapa payment */
.pay-options {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}
.btn-chapa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  width: 100%;
}
.btn-chapa:hover { opacity: 0.85; }
.btn-chapa:disabled { opacity: 0.6; cursor: not-allowed; }
.pay-or {
  text-align: center;
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
}
.btn-proceed--outline {
  background: #fff;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}
.btn-proceed--outline:hover { border-color: #94a3b8; opacity: 1; }
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Buttons */
.btn-proceed {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #8BE000;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-proceed:hover {
  opacity: 0.9;
}
.btn-proceed--sm {
  padding: 9px 18px;
  font-size: 0.84rem;
}
.btn-proceed--danger {
  background: #dc2626;
}
.btn-proceed--locked {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}
.btn-proceed--locked:hover {
  opacity: 0.7;
}
.locked-pay-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.locked-hint {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  max-width: 420px;
  line-height: 1.5;
}
.locked-hint--danger {
  color: #dc2626;
}
.approved-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 0.8rem;
  color: #15803d;
  line-height: 1.5;
}
.approved-hint p {
  margin: 0;
}
.btn-negotiate {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 12px 22px;
  background: white;
  color: #0f172a;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-negotiate:hover {
  border-color: #0f172a;
  background: #f8fafc;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 16px;
}
.modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  max-height: 92vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  gap: 10px;
}
.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
}
.modal-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}
.modal-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.modal-close:hover {
  background: #e2e8f0;
}
.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}
.field textarea {
  padding: 10px 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 0.88rem;
  color: #0f172a;
  font-family: inherit;
  outline: none;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.15s;
}
.field textarea:focus {
  border-color: #8BE000;
}
.req {
  color: #ef4444;
}
.field-hint {
  font-size: 0.76rem;
  color: #94a3b8;
  margin: 0;
}
.char-hint {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0;
  text-align: right;
}

/* Method cards */
.methods-loading,
.methods-empty {
  font-size: 0.84rem;
  color: #94a3b8;
  padding: 12px 0;
}
.method-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.method-select-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.method-select-card:hover {
  border-color: #8BE000;
  background: #f0fdfa;
}
.method-select-card--selected {
  border-color: #8BE000;
  background: #f0fdfa;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
}
.msc-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.method-select-card--selected .msc-check {
  background: #8BE000;
  color: white;
}
.msc-bank {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
}
.msc-holder {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0 0 3px;
}
.msc-acct {
  font-size: 0.78rem;
  color: #374151;
  margin: 0;
  font-family: monospace;
}
.msc-acct strong {
  color: #0f172a;
}
.msc-note {
  font-size: 0.73rem;
  color: #94a3b8;
  margin: 4px 0 0;
  font-style: italic;
}

/* Upload zone */
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.upload-zone:hover {
  border-color: #8BE000;
  background: #f0fdfa;
}
.upload-zone--has {
  border-color: #8BE000;
  background: #f0fdf4;
}
.upload-text {
  font-size: 0.88rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
}
.upload-text--ok {
  color: #72B800;
}
.upload-hint {
  font-size: 0.74rem;
  color: #94a3b8;
  margin: 0;
}

.form-error {
  font-size: 0.8rem;
  color: #ef4444;
  margin: 0;
}
.btn-cancel {
  padding: 9px 20px;
  background: white;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #f8fafc;
}
.btn-submit-pay {
  padding: 9px 22px;
  background: #8BE000;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-submit-pay:hover:not(:disabled) {
  opacity: 0.85;
}
.btn-submit-pay:disabled {
  opacity: 0.45;
  cursor: default;
}
.btn-submit-neg {
  padding: 9px 22px;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-submit-neg:hover:not(:disabled) {
  opacity: 0.85;
}
.btn-submit-neg:disabled {
  opacity: 0.45;
  cursor: default;
}

/* Transitions */
.modal-enter-active {
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: all 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 13px 22px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 500;
  z-index: 999;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  white-space: nowrap;
  pointer-events: none;
}
.toast-success {
  background: #0f172a;
  color: #fff;
}
.toast-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.inv-branch { margin: 2px 0 0; font-size: 0.78rem; font-weight: 600; color: #4D7C0F; }
.cov-card {
  display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: start;
  padding: 18px 20px; margin-bottom: 18px; border-radius: 16px;
  border: 1.5px solid #e2e8f0; background: #fff;
}
.cov--ok    { border-color: #c8ec8a; background: #f7fdee; }
.cov--warn  { border-color: #f5d27a; background: #fffbeb; }
.cov--alert { border-color: #fca5a5; background: #fef2f2; }
.cov-kicker { margin: 0 0 4px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
.cov-title  { margin: 0 0 6px; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
.cov-text   { margin: 0; font-size: 0.84rem; color: #334155; line-height: 1.5; max-width: 560px; }
.cov-stats  { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
.cov-stats li { padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.8); border: 1px solid #e2e8f0; font-size: 0.76rem; color: #334155; }
.cov-stats strong { color: #0f172a; }
.cov-pref { min-width: 240px; }
.cov-pref-label { display: block; margin-bottom: 6px; font-size: 0.78rem; font-weight: 700; color: #0f172a; }
.cov-pref-row { display: flex; gap: 8px; }
.cov-select { flex: 1; padding: 9px 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font: inherit; font-size: 0.85rem; background: #fff; }
.cov-save { padding: 9px 16px; border: none; border-radius: 10px; background: #0f172a; color: #fff; font: inherit; font-size: 0.84rem; font-weight: 700; cursor: pointer; }
.cov-save:disabled { opacity: 0.4; cursor: default; }
.cov-pref-hint { margin: 6px 0 0; font-size: 0.74rem; color: #64748b; }
.inv-cover { margin: 2px 0 0; font-size: 0.76rem; font-weight: 600; color: #4d7c0f; }
.cov-box { margin: 0 0 18px; padding: 14px 16px; border-radius: 12px; background: #EEF9DC; }
.cov-box-title { margin: 0 0 4px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #4d7c0f; }
.cov-box-range { margin: 0 0 6px; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
.cov-box-range span { font-size: 0.85rem; font-weight: 600; color: #475569; }
.cov-box-text { margin: 0; font-size: 0.84rem; color: #334155; line-height: 1.5; }
@media (max-width: 720px) {
  .cov-card { grid-template-columns: 1fr; }
  .cov-pref { min-width: 0; }
}
.branch-filter { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.branch-filter-label { font-size: 0.82rem; font-weight: 600; color: #475569; }
.branch-filter-select { padding: 8px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; font-size: 0.85rem; }
.branch-note { margin: 0 0 14px; padding: 10px 14px; border-radius: 10px; background: #EEF9DC; color: #4D7C0F; font-size: 0.82rem; }
</style>
