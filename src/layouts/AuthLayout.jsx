import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const authPageSx = {
  minHeight: "calc(100vh - 72px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  px: { xs: 2, sm: 3 },
  pt: { xs: 4, md: 6 },
  pb: 6,
};

const AuthLayout = () => {
  return (
    <Box sx={authPageSx}>
      <Outlet />
    </Box>
  );
};

export default AuthLayout;