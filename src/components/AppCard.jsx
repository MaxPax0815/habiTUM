import { Card, CardContent } from '@mui/material'

const AppCard = ({ children, sx = {}, contentSx = {} }) => {
  return (
    <Card
      sx={{
        height: '100%',
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}

export default AppCard
