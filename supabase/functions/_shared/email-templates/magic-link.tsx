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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Ton lien de connexion pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>Ton lien de connexion</Heading>
          <Text style={text}>
            Clique sur le bouton ci-dessous pour te connecter à {siteName}. Ce lien expire
            rapidement.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Me connecter
          </Button>
          <Text style={footer}>
            Si tu n'as pas demandé ce lien, tu peux ignorer cet email en toute tranquillité.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
