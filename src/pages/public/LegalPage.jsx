import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import AppCard from '../../components/AppCard'
import { colors } from '../../styles/tokens'

const supportEmail = 'habitumsupport@gmail.com'

const legalPages = {
  impressum: {
    eyebrow: 'Legal notice',
    title: 'Impressum',
    updated: 'Mock version for the HabiTUM project',
    intro:
      'This page contains placeholder provider information for HabiTUM. Replace the mock data with the legally required information before publishing the app.',
    sections: [
      {
        title: 'Provider',
        body: [
          'HabiTUM',
          'Student project for habit tracking, communities, and challenges',
          'Technical University of Munich context',
          'Munich, Germany',
        ],
      },
      {
        title: 'Contact',
        body: [
          `Email: ${supportEmail}`,
          'For support requests, questions about accounts, or concerns about community content, please contact the HabiTUM support team.',
        ],
      },
      {
        title: 'Responsible for content',
        body: [
          'Mock contact person: HabiTUM Project Team',
          'Mock address: Arcisstrasse 21, 80333 Munich, Germany',
        ],
      },
      {
        title: 'Disclaimer',
        body: [
          'HabiTUM is provided as a university project prototype. The content on this page is sample text and does not replace legal review.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Datenschutz',
    updated: 'Mock privacy notice for the HabiTUM project',
    intro:
      'This privacy notice is sample text tailored to HabiTUM. It describes the kind of data the app may process for accounts, habits, communities, challenges, and billing.',
    sections: [
      {
        title: 'Data we process',
        body: [
          'Account data such as name, username, email address, password credentials, account type, and subscription status.',
          'Habit data such as habit titles, descriptions, frequency, check-ins, streaks, and progress statistics.',
          'Community and challenge data such as memberships, posts, participation, leaderboard entries, and challenge progress.',
          'Technical data such as request timestamps, authentication tokens, and basic error logs required to operate the service.',
        ],
      },
      {
        title: 'Why we use this data',
        body: [
          'To create and secure user accounts.',
          'To show habit progress, streaks, analytics, communities, challenges, and leaderboards.',
          'To support premium and manager features, including billing-related account status.',
          'To respond to support requests sent to the HabiTUM support email address.',
        ],
      },
      {
        title: 'Payments',
        body: [
          'Premium and manager subscriptions are handled through Stripe. HabiTUM stores subscription status and related identifiers, but payment card details are processed by Stripe.',
        ],
      },
      {
        title: 'Your choices',
        body: [
          'Users can update account details, manage habits, leave communities and challenges, or contact support for account-related questions.',
          `For privacy requests, contact ${supportEmail}.`,
        ],
      },
      {
        title: 'Retention',
        body: [
          'Mock policy: HabiTUM keeps account and habit data while the account is active. Deleted content should be removed or anonymized where technically feasible.',
        ],
      },
      {
        title: 'Important note',
        body: [
          'This is placeholder text for a student project and should be reviewed before any real public launch.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Usage rules',
    title: 'Terms of Use',
    updated: 'Mock terms for the HabiTUM project',
    intro:
      'These mock terms describe how HabiTUM should be used by people who track habits, join communities, create challenges, or manage institution-focused spaces.',
    sections: [
      {
        title: 'Using HabiTUM',
        body: [
          'HabiTUM helps users track habits, participate in communities, join challenges, and view progress analytics where available.',
          'Users are responsible for keeping their account credentials secure and for using the app in a respectful way.',
        ],
      },
      {
        title: 'Community behavior',
        body: [
          'Community posts, challenge titles, descriptions, and shared content should be respectful, lawful, and relevant to habit building.',
          'Users should not post harassment, spam, misleading content, or private information about other people.',
        ],
      },
      {
        title: 'Premium and manager features',
        body: [
          'Premium users may access additional analytics and creation features.',
          'Manager accounts may create institution-oriented communities and manage challenge spaces according to the plan configuration.',
        ],
      },
      {
        title: 'Availability',
        body: [
          'HabiTUM is a project prototype. Features may change, be unavailable, or contain incomplete behavior during development.',
        ],
      },
      {
        title: 'Support',
        body: [
          `For account, billing, or community concerns, contact ${supportEmail}.`,
        ],
      },
      {
        title: 'Important note',
        body: [
          'These terms are placeholder text and should be replaced with legally reviewed terms before a production launch.',
        ],
      },
    ],
  },
}

const LegalPage = ({ page }) => {
  const content = legalPages[page]

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, fontWeight: 800 }}
      >
        Back To HabiTUM
      </Button>

      <AppCard contentSx={{ p: { xs: 3, md: 5 } }}>
        <Typography
          variant="overline"
          sx={{ color: colors.muted, fontWeight: 900, letterSpacing: '0.18em' }}
        >
          {content.eyebrow}
        </Typography>

        <Typography variant="h3" sx={{ mt: 0.5, mb: 1, fontWeight: 900 }}>
          {content.title}
        </Typography>

        <Typography variant="body2" sx={{ color: colors.muted, mb: 3 }}>
          {content.updated}
        </Typography>

        <Typography sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 3 }}>
          {content.intro}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          {content.sections.map((section) => (
            <Box key={section.title}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                {section.title}
              </Typography>

              <Stack spacing={1}>
                {section.body.map((item) => (
                  <Typography key={item} sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </AppCard>
    </Container>
  )
}

export const ImpressumPage = () => <LegalPage page="impressum" />
export const PrivacyPage = () => <LegalPage page="privacy" />
export const TermsPage = () => <LegalPage page="terms" />

export default LegalPage
