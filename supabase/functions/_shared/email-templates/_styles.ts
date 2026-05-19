// Shared Orbit-branded styles for auth emails.
// Body background stays white per email best practices.

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Outfit, "Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

export const container = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '32px 24px',
}

export const brand = {
  fontSize: '20px',
  fontWeight: 700 as const,
  color: 'hsl(16, 85%, 60%)',
  letterSpacing: '-0.01em',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

export const card = {
  backgroundColor: 'hsl(36, 38%, 98%)',
  border: '1px solid hsl(16, 70%, 94%)',
  borderRadius: '28px',
  padding: '36px 32px',
  boxShadow: '0 8px 30px hsl(16, 60%, 75%, 0.12)',
}

export const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: 'hsl(20, 15%, 22%)',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}

export const text = {
  fontSize: '15px',
  color: 'hsl(20, 12%, 38%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

export const link = {
  color: 'hsl(16, 85%, 58%)',
  textDecoration: 'underline',
}

export const button = {
  backgroundColor: 'hsl(16, 85%, 62%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const code = {
  fontFamily: '"SF Mono", Menlo, monospace',
  fontSize: '28px',
  fontWeight: 700 as const,
  color: 'hsl(20, 15%, 22%)',
  backgroundColor: 'hsl(16, 70%, 94%)',
  borderRadius: '16px',
  padding: '16px 20px',
  textAlign: 'center' as const,
  letterSpacing: '0.2em',
  margin: '0 0 24px',
}

export const footer = {
  fontSize: '12px',
  color: 'hsl(20, 12%, 55%)',
  lineHeight: '1.5',
  margin: '28px 0 0',
}
