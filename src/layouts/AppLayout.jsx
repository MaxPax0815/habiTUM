import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

import Sidebar from '../components/Sidebar'
import { colors } from '../theme'
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
          minHeight: '100vh',
          py: { xs: 3, md: 4 },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {/* every page is constrained to 80% of the content area (excluding the sidebar) and centered */}
        <Box sx={{ width: { xs: '100%', md: '80%' }, px: { xs: 3, md: 0 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout