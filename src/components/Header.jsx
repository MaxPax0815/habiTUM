import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { colors } from '../styles/tokens'
import { outlinedPillButtonSx, pillButtonSx } from '../styles/recipes'

// Source of truth for the landing page's in-page navigation.
// Each `href` is an anchor (#features, #habits, #challenges) that scrolls to the
// element with the matching `id` in LandingPage.jsx. Consumed by <SectionNav />.
const sectionLinks = [
    { label: "Habits", href: "#habits" },
    { label: "Features", href: "#features" },
    { label: "Challenges", href: "#challenges" },
];

// Shared style object that strips the default anchor styling (underline, borders,
// visited color) and adds a consistent keyboard focus ring. Spread into every
// clickable link below (<LogoLink /> and <SectionNav />) so they behave uniformly.
const linkResetSx = {
  textDecoration: "none",
  border: "none",
  borderBottom: "none",
  backgroundColor: "transparent",
  boxShadow: "none",

  "&:focus-visible": {
    outline: `2px solid ${colors.primary}`,
    outlineOffset: 4,
    borderRadius: 8,
  },
};

// Brand logo + "HabiTUM" wordmark, rendered on the left of every header.
// The whole logo is a router link back to "/" (the landing page).
// When `showBackArrow` is true (i.e. we're NOT on the landing page), an extra
// back-arrow IconButton is shown so users can return home from sub-pages.
// Used by <Header /> via `showBackArrow={!isLandingPage}`.
const LogoLink = ({ showBackArrow = false}) => {


    return (
        <Stack 
            direction="row" 
            spacing={1.5}
            sx={{
                alignItems: "center", 
            }}>
            {showBackArrow && (
                <IconButton
                    component={RouterLink}
                    to="/"
                    aria-label="Back to landing page"
                    sx={{
                        ...linkResetSx,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 0,
                        m: 0,
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        borderRadius: 0,
                        color: colors.textSecondary,

                        "&:hover": {
                        color: colors.textPrimary,
                        backgroundColor: "transparent",
                        textDecoration: "none",
                        },
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
            )}

            <Box
                component={RouterLink}
                to="/"
                sx={{
                ...linkResetSx,  
                display: "flex",
                alignItems: "center",
                gap: 1,

                "&:hover": {
                    textDecoration: "none",
                    backgroundColor: "transparent",
                }
                }}
            >
                <Box
                component="img"
                src="/logo.png"
                alt="HabiTUM logo"
                sx={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    display: "block",
                }}
                />

                <Typography
                variant="h6"
                component="span"
                sx={{
                    fontWeight: 800,
                    lineHeight: 1,
                    color: colors.textPrimary,
                }}
                >
                    Habi
                    <Box 
                        component="span" 
                        sx={{
                            color: colors.primary,
                            fontSize: "inherit",
                            fontWeight: "inherit",
                            lineHeight: "inherit",
                        }}
                    >
                        TUM
                    </Box>
                </Typography>
            </Box>
        </Stack>
    );
};

// Center navigation menu for the landing page. Maps over `sectionLinks` to
// render one anchor per section as a semantic <ul>/<li> list. Clicking an item
// jumps to the matching `id` in LandingPage.jsx. Rendered by <Header /> only when
// `isLandingPage` is true (sub-pages have no in-page sections to scroll to).
const SectionNav = () => {
  return (
    <Stack
      component="ul"
      direction="row"
      spacing={2.5}
      sx={{
        listStyle: "none",
        p: 0,
        m: 0,
      }}
    >
      {sectionLinks.map((link) => (
        <Box component="li" key={link.href}>
          <Box
            component="a"
            href={link.href}
            sx={{
              ...linkResetSx,  
              color: colors.textSecondary,
              fontWeight: 600,

              "&:hover": {
                color: colors.textPrimary,
              },
            }}
          >
            {link.label}
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

// Top-level header shown across the app. It's context-aware: it reads the current
// route and adapts which pieces it renders.
//   - Composes the helpers above: always <LogoLink />, plus <SectionNav /> and the
//     Login/Get-Started buttons only on the landing page.
//   - On the auth pages it swaps in a single cross-link (Login <-> Sign up).
//   - On any non-landing page it can render an optional `title`/`subtitle` banner.
// Props: `title`, `subtitle` — heading text for sub-pages (ignored on landing).
const Header = () => {
    const location = useLocation()

    // Route flags drive all the conditional rendering below.
    const isSignupPage = location.pathname === '/signup'
    const isLoginPage = location.pathname === '/login'
    const isLandingPage = location.pathname === '/'

    return (  
        <Box
            component="header"
            sx={{
                width: '100%',
                backgroundColor: colors.surface,
                borderBottom: "1px solid",
                borderColor: colors.border,

                position: isLandingPage ? "sticky" : "static",
                top: 0,
                zIndex: 1100,
            }}
        >
            <Box
                component="nav"
                aria-label="Main navigation"
                sx={{
                    maxWidth: "1400px",
                    mx: "auto",
                    px: 2,
                    py: 1,
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                }}
            >
                {/* Left */}
                <Box sx={{ justifySelf: "start" }}>
                    <LogoLink showBackArrow={!isLandingPage} />
                </Box>

                {/* Center */}
                <Box sx={{ justifySelf: "center" }}>
                    {isLandingPage && <SectionNav />}
                </Box>

                {/* Right */}
                <Stack direction="row" spacing={2} sx={{ justifySelf: "end"}}>
                    {isLandingPage && (
                        <>
                            <Button
                                component={RouterLink}
                                to="/login"
                                variant="text"
                                size="small"
                                sx={{
                                    ...outlinedPillButtonSx,
                                    color: colors.textPrimary,
                                }}
                            >
                                Login
                            </Button>

                            <Button
                                component={RouterLink}
                                to="/signup"
                                variant="contained"
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    ...pillButtonSx,
                                    backgroundColor: colors.primary,
                                    color: colors.surface,
                                    "&:hover": {
                                        backgroundColor: colors.primaryDark,
                                    }
                                }}
                                
                            >
                                Get Started
                            </Button>
                        </>
                    )}

                    {isSignupPage && (
                        <Button
                            component={RouterLink}
                            to="/login"
                            variant="outlined"
                            size="small"
                            sx={outlinedPillButtonSx}
                        >
                            Login
                        </Button>
                    )}

                    {isLoginPage && (
                        <Button
                            component={RouterLink}
                            to="/signup"
                            variant="outlined"
                            size="small"
                            sx={outlinedPillButtonSx}
                        >
                            Sign up
                        </Button>
                    )}
                </Stack>
            </Box>
        </Box>
  )
};

export default Header
