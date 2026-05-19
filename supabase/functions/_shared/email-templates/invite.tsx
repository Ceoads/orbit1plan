/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { main, container, card, h1, text, link, button, footer, brand } from './_styles.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Tu es invité·e à rejoindre {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>Tu es invité·e 🎉</Heading>
          <Text style={text}>
            Tu as été invité·e à rejoindre{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . Accepte l'invitation pour créer ton compte.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accepter l'invitation
          </Button>
          <Text style={footer}>
            Si tu n'attendais pas cette invitation, tu peux ignorer cet email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
