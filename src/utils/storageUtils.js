export function createEmptyDraft() {
  return {
    id: null,
    sessionId: '',
    type: 'revenue_sharing',
    parties: {
      partyA: { name: '', role: '', address: '' },
      partyB: { name: '', role: '', address: '' },
      additional: [],
    },
    financial: {
      grossOrNet: 'gross',
      partyAPercent: 50,
      partyBPercent: 50,
      paymentFrequency: 'monthly',
      minimumThreshold: '',
      commissionRate: 10,
      commissionBasis: '',
    },
    duration: {
      startDate: '',
      endDate: '',
      autoRenewal: false,
      renewalPeriod: '12 months',
      terminationNoticeDays: 30,
      terminationConditions: '',
    },
    dispute: {
      method: 'arbitration',
      arbitrationRules: 'AAA Commercial Arbitration Rules',
      mediationStep: false,
      governingState: '',
      governingCountry: 'United States',
    },
    customClauses: [],
    signatures: {},
    shareToken: null,
    isShared: false,
  }
}

export const DRAFT_KEY = 'dealdraft_current_draft'
export const VERSIONS_KEY = 'dealdraft_versions'
export const AUDIT_KEY = 'dealdraft_audit_log'
export const NOTES_KEY = 'dealdraft_notes'

export function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function addAuditEntry(type, message, detail = '') {
  const log = loadFromStorage(AUDIT_KEY, [])
  log.unshift({
    id: crypto.randomUUID(),
    type,
    message,
    detail,
    timestamp: new Date().toISOString(),
  })
  saveToStorage(AUDIT_KEY, log.slice(0, 50))
}

export function saveVersion(name, draft) {
  const versions = loadFromStorage(VERSIONS_KEY, [])
  versions.unshift({
    id: crypto.randomUUID(),
    name,
    timestamp: new Date().toISOString(),
    agreementType: draft.type,
    data: draft,
  })
  saveToStorage(VERSIONS_KEY, versions.slice(0, 10))
}

export function getVersions() {
  return loadFromStorage(VERSIONS_KEY, [])
}

export function deleteVersion(id) {
  const versions = getVersions().filter((v) => v.id !== id)
  saveToStorage(VERSIONS_KEY, versions)
}

export function getNotes() {
  return loadFromStorage(NOTES_KEY, [])
}

export function saveNotes(notes) {
  saveToStorage(NOTES_KEY, notes)
}

export function getAuditLog() {
  return loadFromStorage(AUDIT_KEY, [])
}

export function clearAuditLog() {
  saveToStorage(AUDIT_KEY, [])
}
