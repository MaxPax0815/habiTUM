import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "../components/Header";
import { colors } from "../theme";

const PublicLayout = () => {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: colors.background }}>
      <Header />

      <Box component="main">
        <Outlet />
      </Box>
    </Box>
  );
};

export default PublicLayout;