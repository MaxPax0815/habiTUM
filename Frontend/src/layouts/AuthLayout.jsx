import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

import { centeredPageSx } from '../styles/recipes'

const AuthLayout = () => {
  return (
    <Box sx={centeredPageSx}>
      <Outlet />
    </Box>
  )
}

export default AuthLayout
