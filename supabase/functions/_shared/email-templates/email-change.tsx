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

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirme le changement d'adresse pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>Confirme ton nouvel email</Heading>
          <Text style={text}>
            Tu as demandé à changer ton adresse email sur {siteName}, de{' '}
            <Link href={`mailto:${oldEmail}`} style={link}>
              {oldEmail}
            </Link>{' '}
            vers{' '}
            <Link href={`mailto:${newEmail}`} style={link}>
              {newEmail}
            </Link>
            .
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirmer le changement
          </Button>
          <Text style={footer}>
            Si tu n'es pas à l'origine de cette demande, sécurise ton compte immédiatement.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
