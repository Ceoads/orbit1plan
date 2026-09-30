import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brand, card, h1 } from '../email-templates/_styles.ts'

interface Props { title?: string; dueLabel?: string; subject?: string; semester?: string }

const TaskReminder = ({ title, dueLabel, subject, semester }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{`Rappel : ${title || 'une tâche'} arrive à échéance`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>{title || 'Ta tâche'} arrive bientôt</Heading>
          <Text style={text}>Échéance : <strong>{dueLabel || 'dans moins de 24 h'}</strong></Text>
          {subject ? <Text style={muted}>Matière : {subject}</Text> : null}
          {semester ? <Text style={muted}>Semestre : {semester}</Text> : null}
          <Button href="https://orbit-plan.com/?tab=tasks" style={button}>Ouvrir mes tâches</Button>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TaskReminder,
  subject: (d: Record<string, any>) => `Rappel : ${d?.title || 'tâche'} à rendre bientôt`,
  displayName: 'Rappel de tâche',
  previewData: { title: 'Rendu TP Réseaux', dueLabel: 'demain à 18:00', subject: 'Réseaux', semester: 'Semestre 1' },
} satisfies TemplateEntry

const text = { fontSize: '15px', color: 'hsl(20, 15%, 22%)', margin: '0 0 8px', lineHeight: '1.5' }
const muted = { fontSize: '13px', color: 'hsl(20, 8%, 45%)', margin: '0 0 4px' }
const button = { backgroundColor: 'hsl(16, 85%, 60%)', color: '#ffffff', borderRadius: '16px', padding: '12px 22px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: '20px' }
