import { buildAgreementText, buildEmailSummary, extractEmailsFromDraft } from './agreementUtils'

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY

async function sendViaResend(to, subject, body) {
  if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_your')) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true, simulated: true }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'QuickDraft <notifications@aquickdraft.com>',
      to: [to],
      subject,
      text: body,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || 'Failed to send email')
  }
  return { success: true }
}

export async function sendSignatureEmails(draft, signatures) {
  const emails = extractEmailsFromDraft(draft)
  const fullText = buildAgreementText(draft)
  const subject = `Signed Agreement: ${draft.type?.replace(/_/g, ' ')}`

  let sent = 0
  for (const email of emails) {
    try {
      await sendViaResend(
        email,
        subject,
        `Your agreement has been signed.\n\n${fullText}\n\nSignatures recorded: ${Object.keys(signatures).length}`
      )
      sent++
    } catch {
      // continue to next
    }
  }

  return { sent, total: emails.length }
}

export async function sendManualEmails(recipients, draft) {
  const summary = buildEmailSummary(draft)
  const subject = `Agreement Summary: ${draft.type?.replace(/_/g, ' ')}`
  const results = []

  for (const email of recipients) {
    try {
      await sendViaResend(email, subject, `Agreement Summary\n\n${summary}`)
      results.push({ email, success: true })
    } catch (err) {
      results.push({ email, success: false, error: err.message })
    }
  }

  return results
}

export async function sendNotificationEmail(to, subject, body) {
  return sendViaResend(to, subject, body)
}
