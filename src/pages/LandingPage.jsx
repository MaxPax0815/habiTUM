import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Grid,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";

import mockupDashboard from "../assets/mockup_dashboard.png";

// ------------------------------------------------------
// Global color variables
// Easy to replace later when the final palette is defined
// ------------------------------------------------------

const colors = {
  primary: "#0066FF",
  primaryDark: "#00213D",
  secondary: "#00B894",
  background: "#F4F7FB",
  surface: "#FFFFFF",
  textPrimary: "#071D35",
  textSecondary: "#5B6B7F",
  muted: "#94A3B8",
  border: "#DDE5EF",
  softBlue: "#EAF2FF",
  softOrange: "#FFF1E8",
  softGreen: "#E9FFF5",
  orange: "#FF7A1A",
  green: "#00A86B",
};

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.secondary,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 800,
    },
    h3: {
      fontWeight: 800,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
});

// ------------------------------------------------------
// Reusable card component
// ------------------------------------------------------
//! Consider making this a reusable component in the future
//! if we find ourselves using it in multiple places
function GrayCard({ children, sx = {} }) {
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
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>{children}</CardContent>
    </Card>
  );
}

// ------------------------------------------------------
// Small helper components
// ------------------------------------------------------

function IconBadge({ children, bg = colors.softBlue, color = colors.primary }) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: 2.2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: bg,
        color,
        mb: 2,
      }}
    >
      {children}
    </Box>
  );
}

function AvatarDot({ label, color }) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        bgcolor: color,
        color: "#fff",
        fontSize: 13,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid white",
        ml: -0.6,
      }}
    >
      {label}
    </Box>
  );
}

function MiniStat({ value, label, icon, bg, color }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <IconBadge bg={bg} color={color} sx={{ mb: 0 }}>
        {icon}
      </IconBadge>

      <Box>
        <Typography fontWeight={800} color="text.primary">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}

// ------------------------------------------------------
// Hero mockup card
// ------------------------------------------------------

function DashboardMockup() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 560,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 24px 56px rgba(7, 29, 53, 0.18)",
        border: `1px solid ${colors.border}`,
        bgcolor: colors.surface,
      }}
    >
      <Box
        component="img"
        src={mockupDashboard}
        alt="HabiTUM dashboard preview"
        sx={{
          display: "block",
          width: "100%",
          height: "auto",
        }}
      />
    </Box>
  );
}

// ------------------------------------------------------
// Main page
// ------------------------------------------------------

export default function LandingPage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 7, md: 10 } }}>
          <Grid
            container
            spacing={{ xs: 5, md: 7 }}
            alignItems="center"
            justifyContent="center"
          >
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                textAlign: { xs: "center", md: "left" },
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "center", md: "flex-start" },
              }}
            >
              <Chip
                label="Build lasting habits"
                color="primary"
                variant="outlined"
                sx={{
                  mb: 2,
                  bgcolor: colors.softBlue,
                  borderColor: "transparent",
                  fontWeight: 800,
                }}
              />

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: 42, sm: 56, md: 68 },
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                  maxWidth: 620,
                }}
              >
                Turn goals into{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  lasting routines.
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 500,
                  fontSize: { xs: 16, md: 18 },
                  color: "text.secondary",
                  lineHeight: 1.7,
                }}
              >
                HabiTUM helps you build better habits, break bad ones, and stay accountable
                through communities and challenges.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 4 }}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent={{ xs: "center", md: "flex-start" }}
              >
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 3,
                    py: 1.4,
                    borderRadius: 2,
                    boxShadow: "0 12px 24px rgba(0, 102, 255, 0.28)",
                  }}
                >
                  Get started — it’s free
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 3,
                    py: 1.4,
                    borderRadius: 2,
                    borderColor: colors.border,
                    color: "text.primary",
                    bgcolor: colors.surface,
                  }}
                >
                  Login
                </Button>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                justifyContent={{ xs: "center", md: "flex-start" }}
                spacing={2}
                sx={{ mt: 4 }}
              >
                <Stack direction="row">
                  <AvatarDot label="M" color={colors.primary} />
                  <AvatarDot label="J" color="#7C3AED" />
                  <AvatarDot label="L" color={colors.orange} />
                  <AvatarDot label="S" color={colors.green} />
                </Stack>

                <Typography color="text.secondary">
                  <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                    820+
                  </Box>{" "}
                  people building better habits
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" } }}>
                <DashboardMockup />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Why HabiTUM */}
        <Container maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box textAlign="center" mb={5}>
            <Typography
              variant="overline"
              sx={{
                color: colors.muted,
                fontWeight: 900,
                letterSpacing: "0.18em",
              }}
            >
              Why HabiTUM
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: 30, md: 38 },
                letterSpacing: "-0.035em",
              }}
            >
              Everything you need to grow
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GrayCard>
                <IconBadge>
                  <TrackChangesIcon fontSize="small" />
                </IconBadge>

                <Typography fontWeight={900} mb={1}>
                  Build better habits
                </Typography>

                <Typography color="text.secondary" lineHeight={1.7}>
                  Define daily habits, track your streaks, and watch your consistency grow day
                  by day with clear progress indicators.
                </Typography>
              </GrayCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <GrayCard>
                <IconBadge bg={colors.softOrange} color={colors.orange}>
                  <WhatshotIcon fontSize="small" />
                </IconBadge>

                <Typography fontWeight={900} mb={1}>
                  Break bad habits
                </Typography>

                <Typography color="text.secondary" lineHeight={1.7}>
                  HabiTUM’s break-habit mode helps you reduce and eliminate habits you want
                  to quit, with the same tracking power.
                </Typography>
              </GrayCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <GrayCard>
                <IconBadge bg={colors.softGreen} color={colors.green}>
                  <GroupsIcon fontSize="small" />
                </IconBadge>

                <Typography fontWeight={900} mb={1}>
                  Stay accountable
                </Typography>

                <Typography color="text.secondary" lineHeight={1.7}>
                  Join student communities, take on shared challenges, and keep each other
                  accountable — together you go further.
                </Typography>
              </GrayCard>
            </Grid>
          </Grid>
        </Container>

        {/* Community Section */}
        <Container maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box
            sx={{
              bgcolor: colors.primaryDark,
              color: "#fff",
              borderRadius: 3,
              p: { xs: 3, sm: 4, md: 5 },
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={5}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "#7F9AB7",
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                  }}
                >
                  Social habit-building
                </Typography>

                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: 30, md: 38 },
                    lineHeight: 1.05,
                    mb: 3,
                  }}
                >
                  Habits are easier with your community.
                </Typography>

                <Typography sx={{ color: "#A9BED3", lineHeight: 1.8, maxWidth: 520 }}>
                  Join communities of people who share your goals. Participate in challenges,
                  compare streaks, and celebrate wins together.
                </Typography>
              </Grid>

              <Grid item xs={12} md={7}>
                <Stack spacing={2}>
                  <GrayCard sx={{ boxShadow: "none" }}>
                    <Typography sx={{ fontSize: 34, mb: 1 }}>👥</Typography>

                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.muted,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                      }}
                    >
                      Communities
                    </Typography>

                    <Typography fontWeight={900} mb={1}>
                      Communities
                    </Typography>

                    <Typography color="text.secondary" lineHeight={1.7}>
                      Find your people and build routines together — from fitness groups to
                      study accountability circles.
                    </Typography>
                  </GrayCard>

                  <GrayCard sx={{ boxShadow: "none" }}>
                    <Typography sx={{ fontSize: 34, mb: 1 }}>🏆</Typography>

                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.muted,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                      }}
                    >
                      Challenges
                    </Typography>

                    <Typography fontWeight={900} mb={1}>
                      Active Challenges
                    </Typography>

                    <Typography color="text.secondary" lineHeight={1.7}>
                      30-day sprints, reading goals, detox weeks — take on challenges and earn
                      your place on the leaderboard.
                    </Typography>
                  </GrayCard>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Stats Section */}
        <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 7 } }}>
          <GrayCard>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <MiniStat
                  value="820+"
                  label="Active users"
                  icon={<GroupsIcon fontSize="small" />}
                  bg={colors.softBlue}
                  color={colors.primary}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <MiniStat
                  value="12k+"
                  label="Habits tracked"
                  icon={<TrendingUpIcon fontSize="small" />}
                  bg={colors.softGreen}
                  color={colors.green}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <MiniStat
                  value="48"
                  label="Active challenges"
                  icon={<MilitaryTechIcon fontSize="small" />}
                  bg={colors.softOrange}
                  color={colors.orange}
                />
              </Grid>
            </Grid>
          </GrayCard>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
