import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
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
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import ChallengePreview from "../../challenges/ChallengePreview";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";

import mockupDashboard from '../../assets/mockup_dashboard.png';
import AppCard from "../../components/AppCard";
import { colors, radii, shadows } from '../../styles/tokens'
import { useAuthContext } from '../../auth/useAuthContext'
import { useCancelManagerSignup } from '../../auth/useCancelManagerSignup'

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
// Challenges section — the three most trending challenges (live from the public
// API) on the left, a marketing card explaining challenges on the right.
// ------------------------------------------------------

const DIFFICULTY_STYLES = {
  easy: { label: "Easy", bg: colors.softGreen, color: colors.green },
  medium: { label: "Medium", bg: colors.softBlue, color: colors.primary },
  hard: { label: "Hard", bg: colors.softOrange, color: colors.orange },
};

// Right-side card that markets the idea behind challenges.
function ChallengesInfoCard() {
  const highlights = [
    { title: "Live leaderboards", text: "See exactly where you rank as everyone's streaks grow." },
    { title: "Real-time trackers", text: "Watch progress update as your community checks in." },
    { title: "Friendly competition", text: "A little rivalry that makes habits actually stick." },
  ];

  return (
    <AppCard
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      contentSx={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      <IconBadge bg={colors.softOrange} color={colors.orange}>
        <EmojiEventsIcon fontSize="small" />
      </IconBadge>

      <Typography
        variant="overline"
        sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.18em" }}
      >
        Why challenges?
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 1.5, lineHeight: 1.2 }}>
        Push each other to the next level
      </Typography>

      <Typography sx={{ color: "text.secondary", lineHeight: 1.7, mb: 3 }}>
        Challenges turn solo habits into a team effort — motivate and push each
        other inside your community.
      </Typography>

      <Stack spacing={2} sx={{ flex: 1 }}>
        {highlights.map((item) => (
          <Box key={item.title} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
            <CheckCircleOutlinedIcon
              sx={{ fontSize: 20, color: colors.orange, mt: "2px", flexShrink: 0 }}
            />
            <Box>
              <Typography sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.3 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
                {item.text}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Box sx={{ mt: "auto", pt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
          Hit{" "}
          <Box component="span" sx={{ fontWeight: 800, color: colors.orange }}>
            View
          </Box>{" "}
          on any challenge to explore its leaderboard yourself.
        </Typography>
      </Box>
    </AppCard>
  );
}

function TrendingChallengeCard({ challenge, onView }) {
  const difficulty = DIFFICULTY_STYLES[challenge.difficulty] || DIFFICULTY_STYLES.medium;

  return (
    <AppCard>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}
      >
        <Typography sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.3 }}>
          {challenge.title}
        </Typography>
        <Chip
          label={difficulty.label}
          size="small"
          sx={{
            bgcolor: difficulty.bg,
            color: difficulty.color,
            fontWeight: 800,
            flexShrink: 0,
          }}
        />
      </Stack>

      {challenge.community?.name && (
        <Typography variant="body2" sx={{ color: colors.muted, fontWeight: 700, mb: 1 }}>
          {challenge.community.name}
        </Typography>
      )}

      {challenge.description && (
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 1.5 }}>
          {challenge.description}
        </Typography>
      )}

      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between", mt: 0.5 }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <GroupsIcon sx={{ fontSize: 18, color: colors.primary }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}>
              {challenge.participantCount}
            </Box>{" "}
            {challenge.participantCount === 1 ? "participant" : "participants"}
          </Typography>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={() => onView(challenge)}
          sx={{ fontWeight: 800, flexShrink: 0 }}
        >
          View
        </Button>
      </Stack>
    </AppCard>
  );
}

function TrendingChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchTrending = async () => {
      try {
        // Public endpoint — no auth header. Registered before requireAuth so
        // logged-out visitors can load it.
        const response = await fetch("/api/challenges/trending");
        if (!response.ok) throw new Error("Could not load trending challenges.");
        const data = await response.json();
        if (active) setChallenges(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTrending();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (challenges.length === 0) {
    return (
      <AppCard sx={{ textAlign: "center", py: 5 }}>
        <Typography sx={{ fontSize: 34, mb: 1 }}>🏆</Typography>
        <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
          No trending challenges yet
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Join a community and be the first to start one.
        </Typography>
      </AppCard>
    );
  }

  return (
    <>
      <Stack spacing={2} sx={{ height: "100%" }}>
        {challenges.slice(0, 3).map((challenge) => (
          <TrendingChallengeCard
            key={challenge._id}
            challenge={challenge}
            onView={(selected) => setPreviewId(selected._id)}
          />
        ))}
      </Stack>

      <ChallengePreview
        challengeId={previewId}
        open={Boolean(previewId)}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}

// ------------------------------------------------------
// Main page
// ------------------------------------------------------

export default function LandingPage() {
  const { user } = useAuthContext()
  const { cancelManagerSignup, isCancelling, error: cancelError } = useCancelManagerSignup()

  // A logged-in pending manager must not see the normal marketing CTAs
  // (Login / Signup / Go Premium / Create manager account) — every one of them
  // would just bounce off the route guards back to /configure-manager-plan.
  // Show an explicit "finish or cancel your signup" state instead.
  const isPendingManager = user?.accountType === 'manager' && user?.subscription === 'manager_pending'

  if (isPendingManager) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <BusinessCenterOutlinedIcon sx={{ fontSize: 64, color: colors.primary, mb: 2 }} />

        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5 }}>
          Complete your manager signup
        </Typography>

        <Typography sx={{ color: colors.textSecondary, mb: 4, lineHeight: 1.6 }}>
          Your manager account has been created, but your subscription is not
          active yet. Please continue the setup or cancel the manager signup.
        </Typography>

        {cancelError && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{cancelError}</Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={RouterLink}
            to="/configure-manager-plan"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
          >
            Continue manager setup
          </Button>

          <Button
            variant="outlined"
            color="error"
            size="large"
            onClick={cancelManagerSignup}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling…' : 'Cancel manager signup'}
          </Button>
        </Stack>

        <Typography variant="caption" sx={{ color: colors.muted, display: 'block', mt: 3 }}>
          Cancelling deletes your pending account — you can sign up again anytime.
        </Typography>
      </Container>
    )
  }

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

        {/* Communities Section */}
        <Container id="communities" maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
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
                    <Typography sx={{ fontSize: 34, mb: 1 }}>🤝</Typography>

                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.muted,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                      }}
                    >
                      Stay accountable
                    </Typography>

                    <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      Share progress, cheer each other on, and keep your streaks alive with a
                      group that has your back — public groups or invite-only circles.
                    </Typography>
                  </AppCard>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Challenges Section — trending challenges (live) + info card */}
        <Container id="challenges" maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              variant="overline"
              sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.18em" }}
            >
              Compete & stay motivated
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: 30, md: 38 }, letterSpacing: "-0.035em" }}
            >
              Trending challenges
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 1, maxWidth: 520, mx: "auto" }}>
              Jump into what the community is doing right now and climb the leaderboard.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ alignItems: "stretch" }}>
            {/* Left — trending challenges, live from the backend */}
            <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 2, md: 1 } }}>
              <TrendingChallenges />
            </Grid>

            {/* Right — marketing card explaining challenges */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", order: { xs: 1, md: 2 } }}>
              <ChallengesInfoCard />
            </Grid>
          </Grid>
        </Container>

        {/* Plans / Pricing Section */}
        <Container id="plans" maxWidth="lg" sx={{ pb: { xs: 7, md: 10 } }}>
          <Box sx={{ mb: 1, textAlign: "center" }}>
            <Typography
              variant="overline"
              sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.18em" }}
            >
              PRICING
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: 30, md: 38 }, letterSpacing: "-0.035em" }}
            >
              Choose your plan
            </Typography>
            <Typography
              sx={{ color: "text.secondary", mt: 1, maxWidth: 480, mx: "auto" }}
            >
              Start for free. Upgrade when you're ready to go further.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mt: 3 }} alignItems="stretch">
            {/* ── Free ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <AppCard
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                contentSx={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <IconBadge bg={colors.softNeutral} color={colors.textSecondary} sx={{ mb: 0 }}>
                      <TrackChangesIcon fontSize="small" />
                    </IconBadge>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Free</Typography>
                    <Typography
                      sx={{
                        ml: "auto",
                        px: 1.4,
                        py: 0.4,
                        borderRadius: "999px",
                        fontSize: "0.875rem",
                        fontWeight: 800,
                        color: colors.textSecondary,
                        bgcolor: colors.softNeutral,
                      }}
                    >
                      0 €
                    </Typography>
                  </Box>

                  <Typography sx={{ color: "text.secondary", mb: 2, minHeight: 48 }}>
                    Everything you need to build lasting habits — no credit card required.
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1}>
                    {["Track unlimited personal habits", "Daily & weekly habit frequency", "Join communities & challenges"].map((f) => (
                      <Box key={f} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: colors.green, mt: "3px", flexShrink: 0 }} />
                        <Typography sx={{ color: "text.secondary", lineHeight: 1.5 }}>{f}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mt: "auto", pt: 3 }}>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    variant="outlined"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ height: 52, whiteSpace: "nowrap" }}
                  >
                    Start for free
                  </Button>
                </Box>
              </AppCard>
            </Grid>

            {/* ── Premium ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <AppCard
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${colors.primary}`,
                  boxShadow: `inset 0 0 0 1px ${colors.primary}`,
                  bgcolor: colors.softBlue,
                }}
                contentSx={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <IconBadge bg={colors.primary} color="#fff" sx={{ mb: 0 }}>
                      <WorkspacePremiumOutlinedIcon fontSize="small" />
                    </IconBadge>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Premium</Typography>
                    <Typography
                      sx={{
                        ml: "auto",
                        px: 1.4,
                        py: 0.4,
                        borderRadius: "999px",
                        fontSize: "0.875rem",
                        fontWeight: 800,
                        color: "#fff",
                        bgcolor: colors.primary,
                        whiteSpace: "nowrap",
                      }}
                    >
                      3.99 € / month
                    </Typography>
                  </Box>

                  <Typography sx={{ color: "text.secondary", mb: 2, minHeight: 48 }}>
                    Unlock advanced analytics and deepen your habit insights.
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1}>
                    {[
                      "Everything in Free",
                      "Progress analytics dashboard",
                      "Streak recovery stats & heatmaps",
                      "Create your own private Communities & Challenges",
                    ].map((f) => (
                      <Box key={f} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: colors.primary, mt: "3px", flexShrink: 0 }} />
                        <Typography sx={{ color: "text.secondary", lineHeight: 1.5 }}>{f}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mt: "auto", pt: 3 }}>
                  <Button
                    component={RouterLink}
                    to="/signup?plan=premium"
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ height: 52, whiteSpace: "nowrap" }}
                  >
                    Go Premium
                  </Button>
                </Box>
              </AppCard>
            </Grid>

            {/* ── Manager ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <AppCard
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                contentSx={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <IconBadge bg={colors.softOrange} color={colors.orange} sx={{ mb: 0 }}>
                      <BusinessCenterOutlinedIcon fontSize="small" />
                    </IconBadge>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Manager</Typography>
                    <Typography
                      sx={{
                        ml: "auto",
                        px: 1.4,
                        py: 0.4,
                        borderRadius: "999px",
                        fontSize: "0.875rem",
                        fontWeight: 800,
                        color: colors.orange,
                        bgcolor: colors.softOrange,
                        whiteSpace: "nowrap",
                      }}
                    >
                      from 50 €
                    </Typography>
                  </Box>

                  <Typography sx={{ color: "text.secondary", mb: 2, minHeight: 48 }}>
                    Host branded communities and run challenges for your institution.
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1}>
                    {[
                      "Everything in Premium",
                      "Create branded public communities",
                      "Launch challenges & leaderboards",
                      "50 € base with 1 community already included",
                      "Add up to 15 additional communities for 5€ each",
                    ].map((f) => (
                      <Box key={f} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: colors.orange, mt: "3px", flexShrink: 0 }} />
                        <Typography sx={{ color: "text.secondary", lineHeight: 1.5 }}>{f}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mt: "auto", pt: 3 }}>
                  <Button
                    component={RouterLink}
                    to="/signup/manager"
                    variant="outlined"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ height: 52, whiteSpace: "nowrap", borderColor: colors.orange, color: colors.orange, "&:hover": { borderColor: colors.orange, bgcolor: colors.softOrange } }}
                  >
                    Create manager account
                  </Button>
                </Box>
              </AppCard>
            </Grid>
          </Grid>
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
