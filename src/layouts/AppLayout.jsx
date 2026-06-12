import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

import Sidebar from '../components/Sidebar'
import { colors } from '../theme'

const AppLayout = () => {
  // sobald auth steht kommt hier der user aus MongoDB rein, aktuell hardcoded für die sidebar
  const user = {
    name: 'Tom Müller',
    plan: 'Premium',
    role: 'Student',
  }

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
          minHeight: '100vh',
          px: { xs: 3, md: 8 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppLayout