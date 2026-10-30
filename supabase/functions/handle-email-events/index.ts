import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.4.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const STATUS = { bounce: 'bounced', complaint: 'complained', unsubscribe: 'suppressed' } as const
const MESSAGE = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
} as const

// Notification-only mirror of delivery outcomes into the kept tables; never gates sends.
async function record(reason: 'bounce' | 'complaint' | 'unsubscribe', event: any) {
  const supabase = admin()
  const email = String(event.data.recipient || '').toLowerCase()
  if (!email) return
  const { error: sErr } = await supabase.from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (sErr) {
    console.error('suppressed_emails write failed', { code: sErr.code, message: sErr.message, event_id: event.event_id })
    throw new Error('suppression write failed')
  }
  const { error: lErr } = await supabase.from('email_send_log').insert({
    message_id: event.data.message_id ?? null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (lErr) {
    console.error('email_send_log write failed', { code: lErr.code, message: lErr.message, event_id: event.event_id })
    throw new Error('log write failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': (event) => record('bounce', event),
    'email.complaint': (event) => record('complaint', event),
    'email.unsubscribed': (event) => record('unsubscribe', event),
  },
})

Deno.serve((req) => handler(req))
