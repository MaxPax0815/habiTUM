import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

import { centeredPageSx } from '../theme'

const AuthLayout = () => {
  return (
    <Box sx={centeredPageSx}>
      <Outlet />
    </Box>
  )
}

export default AuthLayout