import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { colors } from '../styles/tokens'

const PublicLayout = () => {
  const { pathname } = useLocation()
  const shouldShowFooter = ['/', '/impressum', '/datenschutz', '/terms'].includes(pathname)

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: colors.background }}>
      <Header />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {shouldShowFooter && <Footer />}
    </Box>
  );
};

export default PublicLayout;
