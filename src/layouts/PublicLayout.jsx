import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { colors } from '../styles/tokens'

const PublicLayout = () => {
  const { pathname } = useLocation()
  const shouldShowFooter = ['/', '/impressum', '/datenschutz', '/terms'].includes(pathname)

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: colors.background }}>
      <Header />

      <Box component="main">
        <Outlet />
      </Box>

      {shouldShowFooter && <Footer />}
    </Box>
  );
};

export default PublicLayout;
