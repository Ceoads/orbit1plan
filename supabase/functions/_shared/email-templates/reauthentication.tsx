/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { main, container, card, h1, text, code, footer, brand } from './_styles.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Ton code de vérification Orbit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Orbit</Text>
        <Section style={card}>
          <Heading style={h1}>Confirme ton identité</Heading>
          <Text style={text}>Utilise le code ci-dessous pour confirmer ton identité :</Text>
          <Text style={code}>{token}</Text>
          <Text style={footer}>
            Ce code expire rapidement. Si tu n'es pas à l'origine de cette demande, ignore cet
            email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
