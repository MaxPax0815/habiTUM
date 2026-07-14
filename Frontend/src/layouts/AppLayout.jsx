import { Outlet } from 'react-router-dom'
import { Box, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import MobileNav from '../components/MobileNav'
import Sidebar from '../components/Sidebar'
import SupportHelpButton from '../components/SupportHelpButton'
import PageContainer from '../components/layout/PageContainer'
import { colors } from '../styles/tokens'
import { useAuthContext } from '../auth/useAuthContext'

const AppLayout = () => {
  // AppLayout is only rendered behind App.jsx's auth wall, so user should exist here.
  const { user } = useAuthContext()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.background,
      }}
    >
      {!isMobile && <Sidebar user={user} />}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          px: { xs: 2, sm: 3, md: 8, lg: 6 },
          pt: { xs: 3, md: 4 },
          pb: isMobile
            ? 'calc(88px + env(safe-area-inset-bottom))'
            : { sm: 3, md: 4 },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <PageContainer>
          {/* React Router renders the matched protected child route here. */}
          <Outlet />
        </PageContainer>
      </Box>

      {isMobile && <MobileNav />}
      <SupportHelpButton isMobile={isMobile} />
    </Box>
  )
}

export default AppLayout
