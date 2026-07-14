import { Box } from '@mui/material'

// Centers page content within a consistent responsive maximum width.
const PageContainer = ({ children, component = 'div', maxWidth = 1120, sx = {} }) => (
  <Box
    component={component}
    sx={{
      width: '100%',
      maxWidth,
      mx: 'auto',
      ...sx,
    }}
  >
    {children}
  </Box>
)

export default PageContainer
