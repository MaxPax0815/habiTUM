import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";

import { colors } from '../styles/tokens'
import { outlinedPillButtonSx, pillButtonSx } from '../styles/recipes'
import { useAuthContext } from '../auth/useAuthContext'
import { useCancelManagerSignup } from '../auth/useCancelManagerSignup'

// Source of truth for the landing page's in-page navigation.
// Each `href` is an anchor (#features, #habits, #challenges) that scrolls to the
// element with the matching `id` in LandingPage.jsx. Consumed by <SectionNav />.
const sectionLinks = [
    { label: "Habits", href: "#habits" },
    { label: "Features", href: "#features" },
    { label: "Communities", href: "#communities" },
    { label: "Challenges", href: "#challenges" },
    { label: "Plans", href: "#plans" },
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
const LogoLink = ({ showBackArrow = false, scrollToHabits = false}) => {
    const handleLogoClick = (event) => {
        if (!scrollToHabits) return 

        event.preventDefault()

        const habitsSection = document.getElementById("habits")
        if (habitsSection) {
            habitsSection.scrollIntoView({ behavior: "smooth", block: "start" })
        }

        window.history.replaceState(null, "", "/#habits") // Update URL without reloading the page
    }

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
                onClick={handleLogoClick}
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

// Mobile-only section navigation for the landing page. It reuses `sectionLinks`
// so the burger menu and desktop nav always point to the same page sections.
const LandingSectionMenu = () => {
    const [isOpen, setIsOpen] = useState(false)

    const closeMenu = () => setIsOpen(false)

    return (
        <>
            <IconButton
                aria-label="Open section navigation"
                aria-controls="landing-section-menu"
                aria-expanded={isOpen ? "true" : undefined}
                onClick={() => setIsOpen(true)}
                sx={{
                    ...linkResetSx,
                    display: { xs: "inline-flex", md: "none" },
                    color: colors.textPrimary,
                    p: 1,
                    mr: 0.5,

                    "&:hover": {
                        backgroundColor: colors.softBlue,
                    },
                }}
            >
                <MenuIcon />
            </IconButton>

            <Drawer
                id="landing-section-menu"
                anchor="left"
                open={isOpen}
                onClose={closeMenu}
                PaperProps={{
                    sx: {
                        width: 280,
                        borderRadius: 0,
                        borderRight: `1px solid ${colors.border}`,
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Stack
                        direction="row"
                        sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1,
                        }}
                    >
                        <Typography sx={{ fontWeight: 900, color: colors.textPrimary }}>
                            Habi
                            <Box component="span" sx={{ color: colors.primary }}>
                                TUM
                            </Box>
                        </Typography>

                        <IconButton
                            aria-label="Close section navigation"
                            onClick={closeMenu}
                            sx={{ color: colors.textSecondary }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>

                    <List component="nav" aria-label="Landing page sections" sx={{ py: 0 }}>
                        {sectionLinks.map((link) => (
                            <ListItemButton
                                key={link.href}
                                component="a"
                                href={link.href}
                                onClick={closeMenu}
                                sx={{
                                    borderRadius: 2,
                                    px: 1.5,
                                    py: 1.25,
                                    color: colors.textSecondary,

                                    "&:hover": {
                                        color: colors.textPrimary,
                                        backgroundColor: colors.softBlue,
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={link.label}
                                    primaryTypographyProps={{
                                        fontWeight: 800,
                                    }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    )
}

// Top-level header shown across the app. It's context-aware: it reads the current
// route and adapts which pieces it renders.
//   - Composes the helpers above: always <LogoLink />, plus <SectionNav /> and the
//     Login/Get-Started buttons only on the landing page.
//   - On the auth pages it swaps in a single cross-link (Login <-> Sign up).
//   - On any non-landing page it can render an optional `title`/`subtitle` banner.
// Props: `title`, `subtitle` — heading text for sub-pages (ignored on landing).
const Header = () => {
    const location = useLocation()
    const { user } = useAuthContext()
    const { cancelManagerSignup, isCancelling, error: cancelError } = useCancelManagerSignup()

    // Route flags drive all the conditional rendering below.
    const isSignupPage = location.pathname === '/signup' || location.pathname === '/signup/manager'
    const isLoginPage = location.pathname === '/login'
    const isLandingPage = location.pathname === '/'
    const isConfigurePlanPage = location.pathname === '/configure-manager-plan'

    // A pending manager is logged in but hasn't paid yet. The header must not
    // offer the normal auth CTAs (they'd only bounce off the route guards) —
    // instead it offers exactly two actions: continue setup or cancel the signup.
    const isPendingManager = user?.accountType === 'manager' && user?.subscription === 'manager_pending'

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
                    gridTemplateColumns: { xs: "auto 1fr auto", md: "1fr auto 1fr" },
                    alignItems: "center",
                }}
            >
                {/* Left — no back arrow for pending managers: they should not be
                    steered back to the landing page mid-signup (the logo still
                    points to "/", which itself renders the pending-manager state) */}
                <Box sx={{ justifySelf: "start", display: "flex", alignItems: "center", minWidth: 0 }}>
                    {isLandingPage && !isPendingManager && <LandingSectionMenu />}
                    <LogoLink 
                        showBackArrow={!isLandingPage && !isPendingManager} 
                        scrollToHabits={isLandingPage && !isPendingManager}
                    />
                </Box>

                {/* Center — section anchors only exist on the normal landing page */}
                <Box sx={{ justifySelf: "center", display: { xs: "none", md: "block" } }}>
                    {isLandingPage && !isPendingManager && <SectionNav />}
                </Box>

                {/* Right */}
                <Stack
                    direction="row"
                    spacing={{ xs: 1, sm: 2 }}
                    sx={{
                        justifySelf: "end",
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    {isPendingManager && (
                        <>
                            <Button
                                onClick={cancelManagerSignup}
                                disabled={isCancelling}
                                variant="outlined"
                                size="small"
                                sx={{
                                    ...outlinedPillButtonSx,
                                    color: 'error.main',
                                    borderColor: 'error.main',
                                    "&:hover": {
                                        border: '1px solid',
                                        borderColor: 'error.main',
                                        backgroundColor: '#FDECEA', // light red fill on hover
                                    },
                                }}
                            >
                                {isCancelling ? 'Cancelling…' : 'Cancel manager signup'}
                            </Button>

                            {/* Hidden on the configure page itself — the page's own
                                CTA is the way forward there */}
                            {!isConfigurePlanPage && (
                                <Button
                                    component={RouterLink}
                                    to="/configure-manager-plan"
                                    variant="contained"
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        ...pillButtonSx,
                                        backgroundColor: colors.primary,
                                        color: colors.surface,
                                        "&:hover": { backgroundColor: colors.primaryDark },
                                    }}
                                >
                                    Continue setup
                                </Button>
                            )}
                        </>
                    )}

                    {!isPendingManager && isLandingPage && (
                        <>
                            <Button
                                component={RouterLink}
                                to="/login"
                                variant="text"
                                size="small"
                                sx={{
                                    ...outlinedPillButtonSx,
                                    color: colors.textPrimary,
                                    display: { xs: "none", sm: "inline-flex" },
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

                    {!isPendingManager && isSignupPage && (
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

                    {!isPendingManager && isLoginPage && (
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

            {/* Surface backend errors from the cancel flow (e.g. server down) */}
            <Snackbar
                open={Boolean(cancelError)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" variant="filled">{cancelError}</Alert>
            </Snackbar>
        </Box>
  )
};

export default Header
