/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { main, container, card, h1, text, button, footer, brand } from './_styles.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Réinitialise ton mot de passe pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>Réinitialise ton mot de passe</Heading>
          <Text style={text}>
            Tu as demandé à réinitialiser ton mot de passe pour {siteName}. Clique sur le bouton
            ci-dessous pour en choisir un nouveau.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Choisir un nouveau mot de passe
          </Button>
          <Text style={footer}>
            Si tu n'es pas à l'origine de cette demande, tu peux ignorer cet email. Ton mot de
            passe restera inchangé.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
