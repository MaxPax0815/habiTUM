import { Link as RouterLink } from 'react-router-dom'
import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'

import { colors } from '../styles/tokens'

const supportEmail = 'habitumsupport@gmail.com'

const legalLinks = [
  { label: 'Impressum', to: '/impressum' },
  { label: 'Datenschutz', to: '/datenschutz' },
  { label: 'Terms of Use', to: '/terms' },
]

const footerLinkSx = {
  color: colors.textSecondary,
  fontWeight: 800,
  textDecoration: 'none',
  '&:hover': {
    color: colors.textPrimary,
  },
}

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: colors.surface,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                color: colors.textPrimary,
                textDecoration: 'none',
                mb: 1,
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="HabiTUM logo"
                sx={{ width: 36, height: 36, objectFit: 'contain' }}
              />

              <Typography variant="h6" component="span" sx={{ fontWeight: 900, lineHeight: 1 }}>
                Habi
                <Box component="span" sx={{ color: colors.primary }}>
                  TUM
                </Box>
              </Typography>
            </Box>

            <Typography sx={{ color: colors.textSecondary, maxWidth: 360, lineHeight: 1.6 }}>
              Build better habits, join supportive communities, and stay motivated through
              shared challenges.
            </Typography>
          </Box>

          <Stack spacing={1.5} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2.5 }}
              component="nav"
              aria-label="Legal navigation"
            >
              {legalLinks.map((link) => (
                <Box key={link.to} component={RouterLink} to={link.to} sx={footerLinkSx}>
                  {link.label}
                </Box>
              ))}
            </Stack>

            <Box
              component="a"
              href={`mailto:${supportEmail}`}
              sx={{
                ...footerLinkSx,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <EmailOutlinedIcon sx={{ fontSize: 18 }} />
              Contact Us: {supportEmail}
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" sx={{ color: colors.muted }}>
          © 2026 HabiTUM. All rights reserved.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
