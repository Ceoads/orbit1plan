// Hourly cron: emails each user one reminder per task due within the next 24h.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!bearer) return json({ error: 'unauthorized' }, 401)
  // Only callers holding a service-role key may trigger reminders.
  if (bearer !== key) {
    const probe = await createClient(url, bearer).auth.admin.listUsers({ perPage: 1 })
    if (probe.error) return json({ error: 'unauthorized' }, 401)
  }
  const admin = createClient(url, key)

  const now = new Date()
  const until = new Date(now.getTime() + 24 * 3600 * 1000)
  const { data: tasks, error } = await admin.from('tasks')
    .select('id, user_id, title, due_date, subject_id')
    .eq('status', 'todo').eq('reminder_enabled', true).is('reminder_sent_at', null)
    .gt('due_date', now.toISOString()).lte('due_date', until.toISOString()).limit(200)
  if (error) return json({ error: 'Internal error' }, 500)

  let sent = 0
  for (const t of tasks ?? []) {
    try {
      const { data: u } = await admin.auth.admin.getUserById(t.user_id)
      const email = u?.user?.email
      if (!email) continue
      const [{ data: subj }, { data: sem }] = await Promise.all([
        t.subject_id ? admin.from('subjects').select('name').eq('id', t.subject_id).maybeSingle() : Promise.resolve({ data: null }),
        admin.from('semesters').select('name').eq('user_id', t.user_id).lte('start_date', t.due_date.slice(0, 10)).gte('end_date', t.due_date.slice(0, 10)).limit(1).maybeSingle(),
      ])
      const dueLabel = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(t.due_date))
      const res = await fetch(`${url}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'task-reminder', recipientEmail: email, idempotencyKey: `task-reminder-${t.id}`,
          templateData: { title: t.title, dueLabel, subject: (subj as any)?.name, semester: (sem as any)?.name },
        }),
      })
      if (!res.ok) { console.error('send failed', res.status, await res.text()); continue }
      await admin.from('tasks').update({ reminder_sent_at: new Date().toISOString() }).eq('id', t.id)
      sent++
    } catch (e) { console.error('reminder error', t.id, e) }
  }
  return json({ checked: tasks?.length ?? 0, sent })
})
