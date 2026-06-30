import { Card, CardContent } from "@mui/material";
import { colors } from '../styles/tokens'

const AppCard = ({ children, sx = {}, contentSx = {} }) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        boxShadow: "0 10px 24px rgba(7, 29, 53, 0.06)",
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default AppCard;
