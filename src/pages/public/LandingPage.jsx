import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";

import mockupDashboard from '../../assets/mockup_dashboard.png';
import AppCard from "../../components/AppCard";
import { colors, radii, shadows } from '../../styles/tokens'

// ------------------------------------------------------
// Small helper components
// ------------------------------------------------------

function IconBadge({ children, bg = colors.softBlue, color = colors.primary, sx = {} }) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: radii.small,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: bg,
        color,
        mb: 2,
        ...sx,
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
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <IconBadge bg={bg} color={color} sx={{ mb: 0 }}>
        {icon}
      </IconBadge>

      <Box>
        <Typography sx={{ fontWeight: 800, color: "text.primary" }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
        borderRadius: radii.card,
        overflow: "hidden",
        boxShadow: shadows.dialog,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
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
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        {/* Hero Section */}
        <Container id="habits" maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 7, md: 10 } }}>
          <Grid
            container
            spacing={{ xs: 5, md: 7 }}
            sx={{ alignItems: "center", justifyContent: "center" }}
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
                  color: colors.primaryDark,
                }}
              >
                Turn goals into{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  Lasting Routines.
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
                sx={{
                  mt: 4,
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                >
                  Get started — it’s free
                </Button>

                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                >
                  Login
                </Button>
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                sx={{
                  mt: 4,
                  alignItems: "center",
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
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
        <Container id="features" maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box sx={{ mb: 1, textAlign: "center" }}>
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

          <Grid container spacing={3} sx={{ mt: 3}}>
            <Grid size={{ xs: 12, md: 4 }}>
              <AppCard>
                <IconBadge>
                  <TrackChangesIcon fontSize="small" />
                </IconBadge>

                <Typography sx={{ color: colors.muted,
                      fontWeight: 900,
                      letterSpacing: "0.18em",
                      mb: 1,
                 }} 
                >
                  BUILD BETTER HABITS
                </Typography>

                <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                  Define daily habits, track your streaks, and watch your consistency grow day
                  by day with clear progress indicators.
                </Typography>
              </AppCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <AppCard>
                <IconBadge bg={colors.softOrange} color={colors.orange}>
                  <WhatshotIcon fontSize="small" />
                </IconBadge>

                <Typography sx={{ color: colors.muted,
                      fontWeight: 900,
                      letterSpacing: "0.18em",
                      mb: 1,
                 }}
                >
                  BREAK BAD HABITS
                </Typography>

                <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                  HabiTUM’s break-habit mode helps you reduce and eliminate habits you want
                  to quit, with the same tracking power.
                </Typography>
              </AppCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <AppCard>
                <IconBadge bg={colors.softGreen} color={colors.green}>
                  <GroupsIcon fontSize="small" />
                </IconBadge>

                <Typography 
                sx={{ color: colors.muted,
                      fontWeight: 900,
                      letterSpacing: "0.18em",
                      mb: 1,
                 }}
                >
                  STAY ACCOUNTABLE
                </Typography>

                <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                  Join student communities, take on shared challenges, and keep each other
                  accountable — together you go further.
                </Typography>
              </AppCard>
            </Grid>
          </Grid>
        </Container>

        {/* Community Section */}
        <Container id="challenges" maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box
            sx={{
              bgcolor: colors.primaryDark,
              color: "#fff",
              borderRadius: radii.card,
              p: { xs: 3, sm: 4, md: 5 }
            }}
            
          >
            <Grid container spacing={4} sx={{ alignItems: "center", justifyContent: "center" }}>
              <Grid
                size={{ xs: 12, md: 5 }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
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

              <Grid
                size={{ xs: 12, md: 7 }}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Stack spacing={2} sx={{ width: "100%", maxWidth: 560 }}>
                  <AppCard sx={{ textAlign: "center" }}>
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

                    <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      Find your people and build routines together — from fitness groups to
                      study accountability circles.
                    </Typography>
                  </AppCard>

                  <AppCard sx={{ textAlign: "center" }}>
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

                    <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      30-day sprints, reading goals, detox weeks — take on challenges and earn
                      your place on the leaderboard.
                    </Typography>
                  </AppCard>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Stats Section */}
        <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 7 } }}>
          <AppCard>
            <Grid container spacing={3}
            sx={{
              justifyContent: "space-around",
            }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <MiniStat
                  value="820+"
                  label="Active users"
                  icon={<GroupsIcon fontSize="small" />}
                  bg={colors.softBlue}
                  color={colors.primary}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <MiniStat
                  value="12k+"
                  label="Habits tracked"
                  icon={<TrendingUpIcon fontSize="small" />}
                  bg={colors.softGreen}
                  color={colors.green}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <MiniStat
                  value="48"
                  label="Active challenges"
                  icon={<MilitaryTechIcon fontSize="small" />}
                  bg={colors.softOrange}
                  color={colors.orange}
                />
              </Grid>
            </Grid>
          </AppCard>
        </Container>

        {/* Call to Action Section */}
        <Container maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
            variant="overline"
            sx={{
              color: colors.muted,
              fontWeight: 900,
              letterSpacing: "0.18em",
            }}
            >
              READY TO START?
            </Typography>
            <Typography              variant="h2"
              sx={{
                fontSize: { xs: 30, md: 38 },
                letterSpacing: "-0.035em",
                textAlign: "center",
              }}
            >
              Your first habit starts today.
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
                Free to use no credit card required.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                  mt: 4,
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "center",
                }}
              >
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                >
                  Get started — it’s free
                </Button>

                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                >
                  Login
                </Button>
              </Stack>
          </Box>
        </Container>
    </Box>
  );
}
