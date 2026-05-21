<template>
  <div class="page">

    <!-- Pending receipts banner -->
    <div v-if="pendingPayments.length > 0 || negotiations.length > 0" class="pending-banner">
      <div class="pending-banner-left">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span v-if="pendingPayments.length > 0">
          <strong>{{ pendingPayments.length }}</strong> payment receipt{{ pendingPayments.length > 1 ? 's' : '' }} awaiting review
        </span>
        <span v-if="pendingPayments.length > 0 && negotiations.length > 0"> · </span>
        <span v-if="negotiations.length > 0">
          <strong>{{ negotiations.length }}</strong> extension request{{ negotiations.length > 1 ? 's' : '' }} pending
        </span>
      </div>
      <div style="display:flex;gap:8px;">
        <button v-if="pendingPayments.length" class="banner-btn" @click="activeSection = 'receipts'">Receipts</button>
        <button v-if="negotiations.length" class="banner-btn" style="background:#f59e0b" @click="activeSection = 'negotiations'">Negotiations</button>
      </div>
    </div>

    <!-- Section tabs -->
    <div class="section-tabs">
      <button class="stab" :class="{ 'stab--active': activeSection === 'invoices' }" @click="activeSection = 'invoices'">
        Invoices
      </button>
      <button class="stab" :class="{ 'stab--active': activeSection === 'receipts' }" @click="activeSection = 'receipts'">
        Payment Receipts
        <span v-if="pendingPayments.length" class="stab-badge">{{ pendingPayments.length }}</span>
      </button>
      <button class="stab" :class="{ 'stab--active': activeSection === 'negotiations' }" @click="activeSection = 'negotiations'">
        Negotiations
        <span v-if="negotiations.length" class="stab-badge stab-badge--amber">{{ negotiations.length }}</span>
      </button>
    </div>

    <!-- ════════════════ INVOICES SECTION ════════════════ -->
    <template v-if="activeSection === 'invoices'">

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="invSearch" class="search-input" placeholder="Search company or invoice #…" />
        </div>
        <select v-model="invStatusFilter" class="filter-select">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <button class="btn-generate" @click="openGenerate">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Generate Invoice
        </button>
      </div>

      <div v-if="invLoading" class="state-msg">Loading invoices…</div>
      <div v-else-if="filteredInvoices.length === 0" class="empty-state">
        <div class="empty-icon">🧾</div>
        <p class="empty-title">No invoices found</p>
        <p class="empty-sub">Generate an invoice for a company to get started.</p>
      </div>

      <div v-else class="invoices-list">
        <div v-for="inv in filteredInvoices" :key="inv.id" class="invoice-card" @click="openDetail(inv)">
          <div class="inv-left">
            <div class="inv-avatar">{{ (inv.company?.name ?? '?').slice(0, 2).toUpperCase() }}</div>
            <div>
              <p class="inv-company">{{ inv.company?.name }}</p>
              <p class="inv-meta">{{ inv.invoice_number }} · {{ inv.billing_period }}</p>
            </div>
          </div>
          <div class="inv-right">
            <p class="inv-amount">ETB {{ Number(inv.total_amount).toLocaleString() }}</p>
            <span class="inv-badge" :class="'inv-' + inv.status">{{ invStatusLabel(inv.status) }}</span>
          </div>
        </div>
      </div>

    </template>

    <!-- ════════════════ RECEIPTS SECTION ════════════════ -->
    <template v-if="activeSection === 'receipts'">

      <div v-if="rcptLoading" class="state-msg">Loading receipts…</div>
      <div v-else-if="pendingPayments.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <p class="empty-title">All receipts reviewed</p>
        <p class="empty-sub">No pending payment receipts at this time.</p>
      </div>

      <div v-else class="receipts-list">
        <div v-for="p in pendingPayments" :key="p.id" class="receipt-card">
          <div class="rcpt-header">
            <div>
              <p class="rcpt-company">{{ p.company?.name }}</p>
              <p class="rcpt-meta">{{ p.invoice_number }} · {{ p.billing_period }} · ETB {{ Number(p.invoice_total).toLocaleString() }}</p>
            </div>
            <span class="rcpt-time">{{ formatDate(p.submitted_at) }}</span>
          </div>

          <div class="rcpt-bank-row">
            <svg width="14" height="14" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span>{{ p.payment_method_bank }} — {{ p.payment_method_account_number }}</span>
            <span class="rcpt-amount">ETB {{ Number(p.amount).toLocaleString() }}</span>
          </div>

          <!-- Receipt image / PDF -->
          <div v-if="p.receipt_path" class="rcpt-preview">
            <a :href="p.receipt_path" target="_blank" class="rcpt-view-btn">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View Receipt
            </a>
          </div>

          <div class="rcpt-actions">
            <button class="btn-verify" @click="verifyPayment(p)">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              Verify & Mark Paid
            </button>
            <button class="btn-reject-pay" @click="openRejectModal(p)">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Reject
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- ════════════════ NEGOTIATIONS SECTION ════════════════ -->
    <template v-if="activeSection === 'negotiations'">

      <div v-if="negLoading" class="state-msg">Loading negotiations…</div>
      <div v-else-if="negotiations.length === 0" class="empty-state">
        <div class="empty-icon">🤝</div>
        <p class="empty-title">No pending negotiations</p>
        <p class="empty-sub">Companies with overdue invoices can request payment extensions here.</p>
      </div>

      <div v-else class="neg-list">
        <div v-for="n in negotiations" :key="n.id" class="neg-card">
          <div class="neg-card-header">
            <div class="neg-avatar">{{ (n.company?.name ?? '?').slice(0,2).toUpperCase() }}</div>
            <div class="neg-company-info">
              <p class="neg-company-name">{{ n.company?.name }}</p>
              <p class="neg-invoice-meta">
                {{ n.invoice?.invoice_number }} · {{ n.invoice?.billing_period }} ·
                <strong>ETB {{ Number(n.invoice?.total_amount ?? 0).toLocaleString() }}</strong>
              </p>
            </div>
            <div class="neg-card-right">
              <span class="neg-due-label">Due</span>
              <span class="neg-due-val" :class="{ 'neg-due-val--over': n.invoice?.due_date && new Date(n.invoice.due_date) < new Date() }">
                {{ n.invoice?.due_date ?? '—' }}
              </span>
            </div>
          </div>

          <div class="neg-reason-box">
            <p class="neg-reason-label">Company's reason</p>
            <p class="neg-reason-text">{{ n.reason }}</p>
          </div>

          <p class="neg-submitted">Submitted {{ formatDate(n.submitted_at) }}</p>

          <div class="neg-card-actions">
            <button class="btn-approve-neg" @click="openApproveNeg(n)">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              Approve Extension
            </button>
            <button class="btn-reject-neg" @click="openRejectNeg(n)">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Reject
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- ════════════════ GENERATE INVOICE MODAL ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="genModal.show" class="modal-backdrop" @click.self="genModal.show = false">
          <div class="modal modal--wide">
            <div class="modal-header">
              <p class="modal-title">Generate Invoice</p>
              <button class="modal-close" @click="genModal.show = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="field-row">
                <div class="field">
                  <label>Company <span class="req">*</span></label>
                  <select v-model="genForm.company_id" @change="previewInvoice">
                    <option value="">Select company</option>
                    <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
                <div class="field">
                  <label>Billing Period <span class="req">*</span></label>
                  <div class="date-wrap">
                    <input class="date-input" :class="{ 'date-empty': !genForm.billing_month }" type="month" v-model="genForm.billing_month" @change="previewInvoice" />
                    <span v-if="!genForm.billing_month" class="date-ph">Select billing month</span>
                    <svg class="date-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                </div>
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Due Date</label>
                  <div class="date-wrap">
                    <input class="date-input" type="date" v-model="genForm.due_date" />
                    <svg class="date-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                </div>
                <div class="field">
                  <label>Notes</label>
                  <input v-model="genForm.notes" placeholder="Optional note to the company" />
                </div>
              </div>

              <!-- Preview -->
              <div v-if="genPreview" class="gen-preview">
                <p class="preview-title">Invoice Preview</p>
                <table class="preview-table">
                  <thead>
                    <tr><th>Plan</th><th>Employees</th><th>Unit Price (ETB)</th><th>Subtotal (ETB)</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in genPreview.items" :key="item.plan_tier">
                      <td>{{ item.plan_name }}</td>
                      <td class="tc">{{ item.employee_count }}</td>
                      <td class="tc">{{ Number(item.unit_price).toLocaleString() }}</td>
                      <td class="tc fw">{{ Number(item.subtotal).toLocaleString() }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="total-label">Total</td>
                      <td class="tc fw total-val">ETB {{ Number(genPreview.total).toLocaleString() }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div v-if="previewLoading" class="preview-loading">Calculating…</div>
              <p v-if="genError" class="form-error">{{ genError }}</p>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="genModal.show = false">Cancel</button>
              <button class="btn-save" :disabled="genSaving || !genForm.company_id || !genForm.billing_month" @click="generateInvoice">
                {{ genSaving ? 'Generating…' : 'Generate Invoice' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ INVOICE DETAIL MODAL ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailModal.show" class="modal-backdrop" @click.self="detailModal.show = false">
          <div class="modal modal--wide">
            <div class="modal-header">
              <div>
                <p class="modal-title">{{ detailModal.inv?.invoice_number }}</p>
                <p class="modal-sub">{{ detailModal.inv?.company?.name }} · {{ detailModal.inv?.billing_period }}</p>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <span class="inv-badge" :class="'inv-' + detailModal.inv?.status">{{ invStatusLabel(detailModal.inv?.status ?? '') }}</span>
                <button class="modal-close" @click="detailModal.show = false">✕</button>
              </div>
            </div>

            <div v-if="detailModal.inv" class="modal-body">
              <!-- Items table -->
              <table class="preview-table">
                <thead><tr><th>Plan</th><th>Employees</th><th>Unit Price (ETB)</th><th>Subtotal (ETB)</th></tr></thead>
                <tbody>
                  <tr v-for="item in detailModal.inv.items" :key="item.plan_tier">
                    <td>{{ item.plan_name }}</td>
                    <td class="tc">{{ item.employee_count }}</td>
                    <td class="tc">{{ Number(item.unit_price).toLocaleString() }}</td>
                    <td class="tc fw">{{ Number(item.subtotal).toLocaleString() }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="total-label">Total</td>
                    <td class="tc fw total-val">ETB {{ Number(detailModal.inv.total_amount).toLocaleString() }}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Due date / notes -->
              <div class="detail-meta">
                <span v-if="detailModal.inv.due_date">Due: <strong>{{ detailModal.inv.due_date }}</strong></span>
                <span v-if="detailModal.inv.notes" class="detail-note">{{ detailModal.inv.notes }}</span>
              </div>

              <!-- Latest payment if any -->
              <div v-if="detailModal.inv.latest_payment" class="latest-pay">
                <p class="lp-title">Latest Payment Submission</p>
                <div class="lp-row">
                  <span class="lp-bank">{{ detailModal.inv.latest_payment.payment_method_bank }}</span>
                  <span class="lp-status" :class="'ps-' + detailModal.inv.latest_payment.status">
                    {{ detailModal.inv.latest_payment.status }}
                  </span>
                </div>
                <p class="lp-date">{{ formatDate(detailModal.inv.latest_payment.submitted_at) }}</p>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="detailModal.show = false">Close</button>
              <button
                v-if="detailModal.inv?.status === 'draft'"
                class="btn-save"
                :disabled="detailSending"
                @click="sendInvoice"
              >
                {{ detailSending ? 'Sending…' : '📤 Send to Company' }}
              </button>
              <button
                v-if="detailModal.inv?.status === 'draft'"
                class="btn-del"
                @click="deleteInvoice"
              >Delete Draft</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ VERIFY CONFIRM MODAL ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="verifyModal.show" class="modal-backdrop" @click.self="verifyModal.show = false">
          <div class="modal modal--confirm">
            <div class="confirm-icon">✅</div>
            <p class="confirm-title">Verify Payment</p>
            <p class="confirm-body">
              Confirm payment from <strong>{{ verifyModal.payment?.company?.name }}</strong> and mark
              all their enrolled employees as <strong>Paid</strong>?
            </p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="verifyModal.show = false">Cancel</button>
              <button class="btn-verify-confirm" :disabled="verifyModal.loading" @click="confirmVerify">
                {{ verifyModal.loading ? 'Verifying…' : 'Yes, Verify & Mark Paid' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ REJECT MODAL ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="rejectModal.show" class="modal-backdrop" @click.self="rejectModal.show = false">
          <div class="modal">
            <div class="modal-header">
              <p class="modal-title">Reject Payment</p>
              <button class="modal-close" @click="rejectModal.show = false">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size:.87rem;color:#64748b;margin:0 0 12px">
                Tell the company why their payment was rejected so they can resubmit correctly.
              </p>
              <div class="field">
                <label>Rejection Reason <span class="req">*</span></label>
                <textarea v-model="rejectModal.notes" rows="3" placeholder="e.g. Receipt is unclear, amount doesn't match, wrong account…" />
              </div>
              <p v-if="rejectModal.error" class="form-error">{{ rejectModal.error }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="rejectModal.show = false">Cancel</button>
              <button class="btn-reject-confirm" :disabled="rejectModal.saving" @click="confirmReject">
                {{ rejectModal.saving ? 'Rejecting…' : 'Reject Payment' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ APPROVE NEGOTIATION MODAL ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="approveNegModal.show" class="modal-backdrop" @click.self="approveNegModal.show = false">
          <div class="modal modal--confirm">
            <div class="confirm-icon">🤝</div>
            <p class="confirm-title">Approve Extension</p>
            <p class="confirm-body">
              Approve the extension request from <strong>{{ approveNegModal.neg?.company?.name }}</strong>?
              The invoice will revert to <em>Sent</em> so they can proceed to payment.
            </p>
            <div class="field" style="width:100%;text-align:left;">
              <label>Message to company <span style="color:#94a3b8;font-weight:400">(optional)</span></label>
              <textarea v-model="approveNegModal.notes" rows="2" placeholder="e.g. Extension granted until end of month…" />
            </div>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="approveNegModal.show = false">Cancel</button>
              <button class="btn-verify-confirm" :disabled="approveNegModal.loading" @click="confirmApproveNeg">
                {{ approveNegModal.loading ? 'Approving…' : 'Yes, Approve' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ REJECT NEGOTIATION MODAL ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="rejectNegModal.show" class="modal-backdrop" @click.self="rejectNegModal.show = false">
          <div class="modal">
            <div class="modal-header">
              <p class="modal-title">Reject Extension Request</p>
              <button class="modal-close" @click="rejectNegModal.show = false">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size:.87rem;color:#64748b;margin:0 0 4px">
                Tell <strong>{{ rejectNegModal.neg?.company?.name }}</strong> why their extension was denied.
              </p>
              <div class="field">
                <label>Rejection Reason <span class="req">*</span></label>
                <textarea v-model="rejectNegModal.notes" rows="3" placeholder="e.g. Repeated late payments, insufficient explanation…" />
              </div>
              <p v-if="rejectNegModal.error" class="form-error">{{ rejectNegModal.error }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="rejectNegModal.show = false">Cancel</button>
              <button class="btn-reject-confirm" :disabled="rejectNegModal.saving" @click="confirmRejectNeg">
                {{ rejectNegModal.saving ? 'Rejecting…' : 'Reject Extension' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ COMPANY ACTION MODAL (after rejection) ════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="companyActionModal.show" class="modal-backdrop">
          <div class="modal modal--action">
            <div class="action-modal-top">
              <div class="action-modal-icon">⚠️</div>
              <p class="action-modal-title">What action do you want to take?</p>
              <p class="action-modal-sub">
                Extension request from <strong>{{ companyActionModal.companyName }}</strong> was rejected.
                Choose what happens to this company account.
              </p>
            </div>

            <div class="action-options">
              <button
                class="action-option"
                :class="{ 'action-option--selected': companyActionModal.action === 'suspend' }"
                @click="companyActionModal.action = 'suspend'"
              >
                <div class="action-opt-check">
                  <svg v-if="companyActionModal.action === 'suspend'" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p class="action-opt-title">🔒 Suspend Company</p>
                  <p class="action-opt-desc">Temporarily disable the account. Can be reactivated later.</p>
                </div>
              </button>
              <button
                class="action-option action-option--danger"
                :class="{ 'action-option--selected': companyActionModal.action === 'ban' }"
                @click="companyActionModal.action = 'ban'"
              >
                <div class="action-opt-check">
                  <svg v-if="companyActionModal.action === 'ban'" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p class="action-opt-title">🚫 Permanently Ban</p>
                  <p class="action-opt-desc">Block this company from the platform permanently.</p>
                </div>
              </button>
              <button
                class="action-option"
                :class="{ 'action-option--selected': companyActionModal.action === 'none' }"
                @click="companyActionModal.action = 'none'"
              >
                <div class="action-opt-check">
                  <svg v-if="companyActionModal.action === 'none'" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p class="action-opt-title">⏩ No Action Now</p>
                  <p class="action-opt-desc">Leave the account active. Decide later.</p>
                </div>
              </button>
            </div>

            <div v-if="companyActionModal.action && companyActionModal.action !== 'none'" class="field" style="padding: 0 24px;">
              <label>Reason <span class="req">*</span></label>
              <textarea v-model="companyActionModal.reason" rows="3"
                :placeholder="companyActionModal.action === 'ban'
                  ? 'e.g. Repeated non-payment, policy violations…'
                  : 'e.g. Overdue invoice not settled after extension denial…'" />
            </div>

            <p v-if="companyActionModal.error" class="form-error" style="padding: 0 24px;">{{ companyActionModal.error }}</p>

            <div class="modal-footer">
              <button class="btn-cancel" @click="companyActionModal.show = false">Close</button>
              <button
                v-if="companyActionModal.action && companyActionModal.action !== 'none'"
                class="btn-action-confirm"
                :class="companyActionModal.action === 'ban' ? 'btn-ban' : 'btn-suspend'"
                :disabled="companyActionModal.loading"
                @click="confirmCompanyAction"
              >
                {{ companyActionModal.loading ? 'Processing…'
                   : companyActionModal.action === 'ban' ? 'Ban Company'
                   : 'Suspend Company' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">{{ toast.message }}</div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

interface InvoiceItem { plan_tier: string; plan_name: string; employee_count: number; unit_price: number; subtotal: number }
interface LatestPayment { status: string; submitted_at: string; payment_method_bank: string; admin_notes: string | null }
interface Invoice {
  id: number; invoice_number: string; billing_period: string; total_amount: number
  due_date: string | null; notes: string | null; status: string
  sent_at: string | null; paid_at: string | null; created_at: string
  company: { id: number; name: string; contact_email: string; contact_phone: string } | null
  items: InvoiceItem[]; latest_payment: LatestPayment | null
}
interface Payment {
  id: number; billing_invoice_id: number; invoice_number: string; billing_period: string; invoice_total: number
  company: { id: number; name: string } | null
  amount: number; payment_method_bank: string; payment_method_account_number: string
  receipt_path: string | null; status: string; submitted_at: string
  admin_notes: string | null
}
interface Company { id: number; name: string }
interface Negotiation {
  id: number; billing_invoice_id: number; status: string; reason: string
  admin_notes: string | null; submitted_at: string; reviewed_at: string | null
  company: { id: number; name: string } | null
  invoice: { id: number; invoice_number: string; billing_period: string; total_amount: number; due_date: string | null } | null
}

const api = useApi()

const activeSection    = ref<'invoices' | 'receipts' | 'negotiations'>('invoices')
const reviewTab        = ref(false)
const invoices         = ref<Invoice[]>([])
const pendingPayments  = ref<Payment[]>([])
const negotiations     = ref<Negotiation[]>([])
const companies        = ref<Company[]>([])
const invLoading       = ref(true)
const rcptLoading      = ref(true)
const negLoading       = ref(true)
const invSearch        = ref('')
const invStatusFilter  = ref('')

const genModal   = reactive({ show: false })
const genForm    = reactive({ company_id: '' as string | number, billing_month: '', due_date: '', notes: '' })
const genPreview = ref<{ items: InvoiceItem[]; total: number } | null>(null)
const previewLoading = ref(false)
const genSaving  = ref(false)
const genError   = ref('')

const detailModal = reactive({ show: false, inv: null as Invoice | null })
const detailSending = ref(false)

const rejectModal  = reactive({ show: false, payment: null as Payment | null, notes: '', saving: false, error: '' })
const verifyModal  = reactive({ show: false, payment: null as Payment | null, loading: false })

const approveNegModal    = reactive({ show: false, neg: null as Negotiation | null, notes: '', loading: false })
const rejectNegModal     = reactive({ show: false, neg: null as Negotiation | null, notes: '', saving: false, error: '' })
const companyActionModal = reactive({
  show: false, companyId: null as number | null, companyName: '',
  action: 'none' as 'suspend' | 'ban' | 'none',
  reason: '', loading: false, error: '',
})

const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message: msg })
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    const matchSearch = !invSearch.value ||
      inv.company?.name?.toLowerCase().includes(invSearch.value.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(invSearch.value.toLowerCase())
    const matchStatus = !invStatusFilter.value || inv.status === invStatusFilter.value
    return matchSearch && matchStatus
  })
})

async function loadInvoices() {
  invLoading.value = true
  try {
    invoices.value = await api.get<Invoice[]>('admin/billing/invoices')
  } finally {
    invLoading.value = false
  }
}

async function loadPendingPayments() {
  rcptLoading.value = true
  try {
    pendingPayments.value = await api.get<Payment[]>('admin/billing/pending-payments')
  } finally {
    rcptLoading.value = false
  }
}

async function loadCompanies() {
  try {
    const res = await api.get<{ data: Company[] }>('companies')
    companies.value = Array.isArray(res) ? res : (res as any).data ?? []
  } catch {}
}

async function loadNegotiations() {
  negLoading.value = true
  try { negotiations.value = await api.get<Negotiation[]>('admin/billing/negotiations') }
  finally { negLoading.value = false }
}

onMounted(() => { loadInvoices(); loadPendingPayments(); loadNegotiations(); loadCompanies() })

// ── Generate invoice ───────────────────────────────────────────
function openGenerate() {
  Object.assign(genForm, { company_id: '', billing_month: '', due_date: '', notes: '' })
  genPreview.value = null
  genError.value   = ''
  genModal.show    = true
}

function formatBillingPeriod(ym: string): string {
  if (!ym) return ''
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

async function previewInvoice() {
  if (!genForm.company_id) { genPreview.value = null; return }
  previewLoading.value = true
  genPreview.value = null
  try {
    // Quick preview: generate with dry_run flag (we'll actually generate on submit)
    // Instead: just fetch the company's employees to show the breakdown
    const res = await api.get<{ data: any[] }>(`employees?company_id=${genForm.company_id}&status=approved`)
    const employees: any[] = Array.isArray(res) ? res : (res as any).data ?? []
    const plans = await api.get<any[]>('membership-plans?all=true')

    const levelTier: Record<string, string> = { chief: 'platinum', director: 'basic_plus', manager: 'basic', staff: 'basic' }
    const planMap: Record<string, any> = {}
    for (const p of (Array.isArray(plans) ? plans : [])) planMap[p.tier] = p

    const groups: Record<string, number> = {}
    for (const e of employees) {
      const tier = levelTier[e.level ?? 'staff'] ?? 'basic'
      groups[tier] = (groups[tier] ?? 0) + 1
    }

    let total = 0
    const items: InvoiceItem[] = Object.entries(groups).map(([tier, count]) => {
      const plan = planMap[tier]
      const price = plan ? Number(plan.monthly_fee_etb) : 0
      const sub = count * price
      total += sub
      return { plan_tier: tier, plan_name: plan?.name ?? tier, employee_count: count, unit_price: price, subtotal: sub }
    })
    genPreview.value = { items, total }
  } catch {
    genPreview.value = null
  } finally {
    previewLoading.value = false
  }
}

async function generateInvoice() {
  genError.value = ''
  if (!genForm.company_id || !genForm.billing_month) {
    genError.value = 'Company and billing period are required.'; return
  }
  genSaving.value = true
  try {
    await api.post('admin/billing/invoices/generate', {
      company_id:     genForm.company_id,
      billing_period: formatBillingPeriod(genForm.billing_month),
      due_date:       genForm.due_date || undefined,
      notes:          genForm.notes   || undefined,
    })
    genModal.show = false
    showToast('Invoice generated successfully.')
    await loadInvoices()
  } catch (e: unknown) {
    genError.value = e instanceof Error ? e.message : 'Failed to generate invoice.'
  } finally {
    genSaving.value = false
  }
}

// ── Invoice detail ─────────────────────────────────────────────
async function openDetail(inv: Invoice) {
  const full = await api.get<Invoice>(`admin/billing/invoices/${inv.id}`)
  detailModal.inv  = full
  detailModal.show = true
}

async function sendInvoice() {
  if (!detailModal.inv) return
  detailSending.value = true
  try {
    await api.post(`admin/billing/invoices/${detailModal.inv.id}/send`)
    showToast('Invoice sent to company.')
    detailModal.show = false
    await loadInvoices()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Failed to send invoice.', 'error')
  } finally {
    detailSending.value = false
  }
}

async function deleteInvoice() {
  if (!detailModal.inv) return
  try {
    await api.delete(`admin/billing/invoices/${detailModal.inv.id}`)
    showToast('Draft invoice deleted.')
    detailModal.show = false
    await loadInvoices()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Failed to delete.', 'error')
  }
}

// ── Payment verification ───────────────────────────────────────
function verifyPayment(p: Payment) {
  verifyModal.payment = p
  verifyModal.loading = false
  verifyModal.show    = true
}

async function confirmVerify() {
  if (!verifyModal.payment) return
  verifyModal.loading = true
  try {
    await api.post(`admin/billing/payments/${verifyModal.payment.id}/verify`)
    verifyModal.show = false
    showToast('Payment verified. Employees marked as paid.')
    await Promise.all([loadInvoices(), loadPendingPayments()])
  } catch (e: unknown) {
    verifyModal.show = false
    showToast(e instanceof Error ? e.message : 'Failed to verify.', 'error')
  } finally {
    verifyModal.loading = false
  }
}

function openRejectModal(p: Payment) {
  rejectModal.payment = p
  rejectModal.notes   = ''
  rejectModal.error   = ''
  rejectModal.saving  = false
  rejectModal.show    = true
}

async function confirmReject() {
  if (!rejectModal.notes.trim()) { rejectModal.error = 'Please provide a rejection reason.'; return }
  rejectModal.saving = true
  try {
    await api.post(`admin/billing/payments/${rejectModal.payment!.id}/reject`, { notes: rejectModal.notes })
    showToast('Payment rejected. Company can resubmit.')
    rejectModal.show = false
    await loadPendingPayments()
  } catch (e: unknown) {
    rejectModal.error = e instanceof Error ? e.message : 'Failed to reject.'
  } finally {
    rejectModal.saving = false
  }
}

// ── Negotiations ───────────────────────────────────────────────
function openApproveNeg(n: Negotiation) {
  approveNegModal.neg   = n
  approveNegModal.notes = ''
  approveNegModal.loading = false
  approveNegModal.show  = true
}

async function confirmApproveNeg() {
  if (!approveNegModal.neg) return
  approveNegModal.loading = true
  try {
    await api.post(`admin/billing/negotiations/${approveNegModal.neg.id}/approve`, { admin_notes: approveNegModal.notes || undefined })
    approveNegModal.show = false
    showToast('Extension approved. Company can now proceed to payment.')
    await Promise.all([loadNegotiations(), loadInvoices()])
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Failed to approve.', 'error')
  } finally { approveNegModal.loading = false }
}

function openRejectNeg(n: Negotiation) {
  rejectNegModal.neg   = n
  rejectNegModal.notes = ''
  rejectNegModal.error  = ''
  rejectNegModal.saving = false
  rejectNegModal.show  = true
}

async function confirmRejectNeg() {
  if (!rejectNegModal.notes.trim()) { rejectNegModal.error = 'Please provide a rejection reason.'; return }
  rejectNegModal.saving = true
  try {
    await api.post(`admin/billing/negotiations/${rejectNegModal.neg!.id}/reject`, { admin_notes: rejectNegModal.notes })
    rejectNegModal.show = false
    showToast('Extension rejected.')
    await loadNegotiations()
    // Open company action modal
    companyActionModal.companyId   = rejectNegModal.neg!.company?.id ?? null
    companyActionModal.companyName = rejectNegModal.neg!.company?.name ?? ''
    companyActionModal.action      = 'none'
    companyActionModal.reason      = ''
    companyActionModal.error       = ''
    companyActionModal.show        = true
  } catch (e: unknown) {
    rejectNegModal.error = e instanceof Error ? e.message : 'Failed to reject.'
  } finally { rejectNegModal.saving = false }
}

async function confirmCompanyAction() {
  if (companyActionModal.action === 'none') { companyActionModal.show = false; return }
  if (!companyActionModal.reason.trim()) { companyActionModal.error = 'Please provide a reason.'; return }
  companyActionModal.loading = true
  try {
    await api.post(`companies/${companyActionModal.companyId}/deactivate`, {
      action: companyActionModal.action,
      reason: companyActionModal.reason,
    })
    companyActionModal.show = false
    const label = companyActionModal.action === 'ban' ? 'banned' : 'suspended'
    showToast(`Company has been ${label}. All employee access revoked.`)
  } catch (e: unknown) {
    companyActionModal.error = e instanceof Error ? e.message : 'Failed to update company.'
  } finally { companyActionModal.loading = false }
}

// ── Helpers ────────────────────────────────────────────────────
function invStatusLabel(s: string) {
  return { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' }[s] ?? s
}
function formatDate(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 18px; }

/* Pending banner */
.pending-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px;
  padding: 14px 18px; gap: 12px; flex-wrap: wrap;
}
.pending-banner-left { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: #92400e; }
.banner-btn { padding: 7px 16px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.banner-btn:hover { opacity: .85; }

/* Section tabs */
.section-tabs { display: flex; gap: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; width: fit-content; }
.stab { padding: 7px 18px; border-radius: 7px; font-size: 0.82rem; font-weight: 500; border: none; background: none; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.stab:hover { background: #f8fafc; color: #0f172a; }
.stab--active { background: #0f172a; color: #fff; font-weight: 600; }
.stab-badge { background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 20px; }

/* Toolbar */
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input { width: 100%; padding: 10px 12px 10px 36px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.88rem; color: #0f172a; outline: none; font-family: inherit; }
.search-input:focus { border-color: #14b8a6; }
.filter-select { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.84rem; color: #0f172a; background: white; outline: none; cursor: pointer; font-family: inherit; }
.filter-select:focus { border-color: #14b8a6; }
.btn-generate { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: #0f172a; color: white; border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: opacity .15s; white-space: nowrap; }
.btn-generate:hover { opacity: .85; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }
.empty-state { background: white; border-radius: 14px; padding: 56px 24px; text-align: center; }
.empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
.empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.empty-sub   { font-size: 0.85rem; color: #94a3b8; margin: 0; }

/* Invoice cards */
.invoices-list { display: flex; flex-direction: column; gap: 10px; }
.invoice-card {
  background: white; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: box-shadow .15s, border-color .15s; gap: 12px;
}
.invoice-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.07); border-color: #cbd5e1; }
.inv-left { display: flex; align-items: center; gap: 14px; }
.inv-avatar { width: 40px; height: 40px; border-radius: 10px; background: #0f172a; color: white; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.inv-company { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.inv-meta    { font-size: 0.76rem; color: #94a3b8; margin: 0; }
.inv-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.inv-amount  { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.inv-badge   { padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.inv-draft   { background: #f1f5f9; color: #64748b; }
.inv-sent    { background: #dbeafe; color: #1d4ed8; }
.inv-paid    { background: #d1fae5; color: #059669; }
.inv-overdue { background: #fee2e2; color: #dc2626; }

/* Receipt cards */
.receipts-list { display: flex; flex-direction: column; gap: 14px; }
.receipt-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; border-left: 4px solid #f59e0b; }
.rcpt-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.rcpt-company { font-size: 0.97rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.rcpt-meta    { font-size: 0.76rem; color: #64748b; margin: 0; }
.rcpt-time    { font-size: 0.75rem; color: #94a3b8; flex-shrink: 0; }
.rcpt-bank-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #374151; }
.rcpt-amount  { margin-left: auto; font-weight: 700; color: #0f172a; }
.rcpt-preview { }
.rcpt-view-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; background: #f1f5f9; color: #0f172a; border-radius: 8px; font-size: 0.8rem; font-weight: 600; text-decoration: none; transition: background .15s; }
.rcpt-view-btn:hover { background: #e2e8f0; }
.rcpt-actions { display: flex; gap: 10px; }
.btn-verify { display: flex; align-items: center; gap: 5px; padding: 8px 18px; background: #d1fae5; color: #059669; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background .15s; }
.btn-verify:hover { background: #059669; color: white; }
.btn-reject-pay { display: flex; align-items: center; gap: 5px; padding: 8px 18px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background .15s; }
.btn-reject-pay:hover { background: #dc2626; color: white; }

/* Generate / Detail modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 16px; }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,.18); max-height: 90vh; overflow-y: auto; }
.modal--wide { max-width: 640px; }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 24px 16px; border-bottom: 1px solid #f1f5f9; gap: 10px; }
.modal-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.modal-sub   { font-size: 0.82rem; color: #64748b; margin: 0; }
.modal-close { width: 28px; height: 28px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; font-size: 0.75rem; flex-shrink: 0; }
.modal-close:hover { background: #e2e8f0; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 520px) { .field-row { grid-template-columns: 1fr; } }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.req { color: #ef4444; }
.field input, .field select, .field textarea {
  padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.88rem; color: #0f172a; background: white; font-family: inherit; outline: none;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: #14b8a6; }

/* Styled date inputs */
.date-wrap {
  position: relative; width: 100%;
}
.date-input {
  width: 100%; padding: 10px 40px 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.88rem; color: #0f172a; background: white;
  font-family: inherit; outline: none; cursor: pointer;
  color-scheme: light; transition: border-color .15s, box-shadow .15s;
}
.date-input:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,0.1); }
.date-icon {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.date-input::-webkit-calendar-picker-indicator {
  opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 40px; height: 100%;
}
.date-empty { color: transparent !important; }
.date-ph {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; font-size: 0.88rem; pointer-events: none; white-space: nowrap;
}

/* Invoice preview table */
.gen-preview { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.preview-title { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin: 0; padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.preview-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.preview-table th { padding: 10px 14px; text-align: left; font-size: 0.7rem; font-weight: 600; color: #94a3b8; letter-spacing: .06em; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
.preview-table td { padding: 11px 14px; border-bottom: 1px solid #f8fafc; color: #374151; }
.preview-table tbody tr:last-child td { border-bottom: none; }
.preview-table tfoot td { padding: 12px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.tc { text-align: right; }
.fw { font-weight: 700; }
.total-label { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.total-val   { font-size: 1rem; color: #14b8a6; }
.preview-loading { text-align: center; font-size: 0.84rem; color: #94a3b8; }

/* Detail meta */
.detail-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.84rem; color: #64748b; }
.detail-note { font-style: italic; }

/* Latest payment */
.latest-pay { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
.lp-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 0 0 8px; }
.lp-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.lp-bank { font-size: 0.88rem; font-weight: 600; color: #0f172a; }
.lp-status { padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.ps-pending  { background: #fef9c3; color: #a16207; }
.ps-verified { background: #d1fae5; color: #059669; }
.ps-rejected { background: #fee2e2; color: #dc2626; }
.lp-date { font-size: 0.76rem; color: #94a3b8; margin: 4px 0 0; }

.form-error { font-size: 0.8rem; color: #ef4444; margin: 0; }

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
.btn-cancel { padding: 9px 20px; background: white; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.84rem; font-weight: 500; cursor: pointer; }
.btn-cancel:hover { background: #f8fafc; }
.btn-save { padding: 9px 22px; background: #0f172a; color: white; border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-save:hover:not(:disabled) { opacity: .85; }
.btn-save:disabled { opacity: .45; cursor: default; }
.btn-del { padding: 9px 20px; background: #fee2e2; color: #dc2626; border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600; cursor: pointer; }
.btn-del:hover { background: #dc2626; color: white; }
.btn-reject-confirm { padding: 9px 22px; background: #dc2626; color: white; border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600; cursor: pointer; }
.btn-reject-confirm:disabled { opacity: .5; cursor: default; }

/* Verify confirm modal */
.modal--confirm { max-width: 400px; padding: 32px 28px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.confirm-icon  { font-size: 2.4rem; }
.confirm-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
.confirm-body  { font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.6; }
.confirm-body strong { color: #0f172a; }
.confirm-actions { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }
.btn-verify-confirm { padding: 10px 24px; background: #059669; color: white; border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-verify-confirm:hover:not(:disabled) { opacity: .85; }
.btn-verify-confirm:disabled { opacity: .5; cursor: default; }

/* Negotiations section */
.stab-badge--amber { background: #f59e0b !important; }
.neg-list { display: flex; flex-direction: column; gap: 14px; }
.neg-card {
  background: white; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;
  border-left: 4px solid #f59e0b;
}
.neg-card-header { display: flex; align-items: flex-start; gap: 12px; }
.neg-avatar { width: 40px; height: 40px; border-radius: 10px; background: #f59e0b; color: white; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.neg-company-info { flex: 1; }
.neg-company-name  { font-size: 0.97rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.neg-invoice-meta  { font-size: 0.76rem; color: #64748b; margin: 0; }
.neg-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.neg-due-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; font-weight: 600; }
.neg-due-val   { font-size: 0.84rem; font-weight: 600; color: #374151; }
.neg-due-val--over { color: #dc2626; }
.neg-reason-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px; }
.neg-reason-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #a16207; margin: 0 0 5px; }
.neg-reason-text  { font-size: 0.87rem; color: #0f172a; margin: 0; line-height: 1.55; }
.neg-submitted { font-size: 0.74rem; color: #94a3b8; margin: 0; }
.neg-card-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.btn-approve-neg { display: flex; align-items: center; gap: 5px; padding: 8px 18px; background: #d1fae5; color: #059669; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background .15s; }
.btn-approve-neg:hover { background: #059669; color: white; }
.btn-reject-neg  { display: flex; align-items: center; gap: 5px; padding: 8px 18px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background .15s; }
.btn-reject-neg:hover { background: #dc2626; color: white; }

/* Approve neg modal */
.modal--confirm textarea { width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.86rem; font-family: inherit; outline: none; resize: vertical; min-height: 60px; box-sizing: border-box; }
.modal--confirm textarea:focus { border-color: #14b8a6; }
.modal--confirm .field label { font-size: 0.8rem; font-weight: 600; color: #374151; margin-bottom: 5px; display: block; }

/* Company action modal */
.modal--action { max-width: 520px; overflow: hidden; }
.action-modal-top { padding: 28px 24px 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.action-modal-icon  { font-size: 2.4rem; }
.action-modal-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
.action-modal-sub   { font-size: 0.86rem; color: #64748b; margin: 0; line-height: 1.5; }
.action-modal-sub strong { color: #0f172a; }
.action-options { display: flex; flex-direction: column; gap: 10px; padding: 20px 24px 4px; }
.action-option {
  display: flex; align-items: flex-start; gap: 12px; text-align: left;
  padding: 13px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px;
  background: white; cursor: pointer; transition: all .15s;
}
.action-option:hover { border-color: #94a3b8; background: #f8fafc; }
.action-option--selected { border-color: #0f172a; background: #f8fafc; }
.action-option--danger.action-option--selected { border-color: #dc2626; background: #fef2f2; }
.action-opt-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.action-option--selected .action-opt-check { background: #0f172a; border-color: #0f172a; color: white; }
.action-option--danger.action-option--selected .action-opt-check { background: #dc2626; border-color: #dc2626; }
.action-opt-title { font-size: 0.88rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.action-option--danger .action-opt-title { color: #dc2626; }
.action-opt-desc  { font-size: 0.77rem; color: #64748b; margin: 0; }
.action-options + .field { margin-top: 8px; }
.action-options + .field label { font-size: 0.8rem; font-weight: 600; color: #374151; margin-bottom: 5px; display: block; }
.action-options + .field textarea { width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.86rem; font-family: inherit; outline: none; resize: vertical; min-height: 80px; box-sizing: border-box; }
.action-options + .field textarea:focus { border-color: #14b8a6; }
.btn-action-confirm { padding: 9px 22px; color: white; border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-action-confirm:disabled { opacity: .5; cursor: default; }
.btn-suspend { background: #f59e0b; }
.btn-ban     { background: #dc2626; }
.btn-action-confirm:hover:not(:disabled) { opacity: .85; }

/* Transitions */
.modal-enter-active { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
.modal-leave-active { transition: all .18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(.94); }
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 13px 22px; border-radius: 12px; font-size: 0.88rem; font-weight: 500; z-index: 999; box-shadow: 0 8px 28px rgba(0,0,0,.14); white-space: nowrap; pointer-events: none; }
.toast-success { background: #0f172a; color: #fff; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>
