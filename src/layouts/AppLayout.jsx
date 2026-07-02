import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

import Sidebar from '../components/Sidebar'
import PageContainer from '../components/layout/PageContainer'
import { colors } from '../styles/tokens'
import { useAuthContext } from '../auth/useAuthContext'

const AppLayout = () => {
  const { user } = useAuthContext() 

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.background,
      }}
    >
      <Sidebar user={user} />

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          px: { xs: 3, md: 8, lg: 6 },
          py: { xs: 3, md: 4 },
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <PageContainer>
          <Outlet />
        </PageContainer>
      </Box>
    </Box>
  )
}

export default AppLayout
