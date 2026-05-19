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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirme ton adresse pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>Bienvenue sur Orbit 🪐</Heading>
          <Text style={text}>
            Merci de t'être inscrit à{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . Confirme ton adresse (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) pour commencer à organiser ton année.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirmer mon email
          </Button>
          <Text style={footer}>
            Si tu n'as pas créé de compte, tu peux ignorer cet email en toute tranquillité.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
