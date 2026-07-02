import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Link as RouterLink } from "react-router-dom";

import AppCard from "../components/AppCard";
import { colors } from '../styles/tokens'

// ---------------------------------------------------------------------------
// Challenges.jsx
// Components in this file:
// - ChallengeCard: compact challenge card for grid/list previews.
// - ExtendedChallengeCard: full-width challenge card for detailed views.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helper methods
// ---------------------------------------------------------------------------

const getDaysLeft = (ends) => {
  if (!ends) return null;

  const endDate = new Date(ends);
  if (Number.isNaN(endDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  return Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
};

const formatParticipants = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return "0 participants";

  return `${value.toLocaleString()} ${value === 1 ? "participant" : "participants"}`;
};

const getParticipantCount = (challenge) =>
  challenge?.participantCount ??
  challenge?.participantsCount ??
  challenge?.participants?.length ??
  0;

const getChallengeCategory = (challenge) =>
  challenge?.category || challenge?.community?.category || "Challenge";

const getChallengeCommunity = (challenge) =>
  challenge?.communityName || challenge?.community?.name || "Community";

const getChallengeDifficulty = (challenge) =>
  challenge?.difficulty || "medium";

// ---------------------------------------------------------------------------
// Compact challenge card
// ---------------------------------------------------------------------------
const ChallengeCard = ({ challenge }) => {
  const daysLeft = getDaysLeft(challenge?.ends);
  const participantCount = getParticipantCount(challenge);
  const challengeId = challenge?._id || challenge?.id;

  const category = getChallengeCategory(challenge);
  const difficulty = getChallengeDifficulty(challenge);

  return (
    <AppCard
      sx={{
        minHeight: 280,
      }}
      contentSx={{
        height: "100%",
        p: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          variant="body1"
          sx={{ color: colors.muted, fontWeight: 700, fontSize: { xs: 18, md: 20 } }}
        >
          {category}
        </Typography>

        <Chip
          label={difficulty}
          size="small"
          sx={{
            height: 34,
            px: 1,
            bgcolor: colors.softOrange,
            color: colors.orange,
            fontSize: 18,
            fontWeight: 800,
            textTransform: "capitalize",
            "& .MuiChip-label": { px: 1 },
          }}
        />
      </Stack>

      <Typography
        variant="h5"
        sx={{
          mt: 3,
          color: colors.textPrimary,
          fontWeight: 800,
          lineHeight: 1.2,
        }}
      >
        {challenge?.title || "Untitled challenge"}
      </Typography>

      <Typography
        sx={{
          mt: 2,
          color: colors.textSecondary,
          fontSize: { xs: 18, md: 20 },
          lineHeight: 1.5,
        }}
      >
        {challenge?.description || "No description yet."}
      </Typography>

      <Stack
        direction="row"
        spacing={2.5}
        useFlexGap
        sx={{ mt: 3.5, color: colors.muted, flexWrap: "wrap" }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <GroupsOutlinedIcon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 700 }}>
            {formatParticipants(participantCount)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 700 }}>
            {daysLeft === null ? "No end date" : `${daysLeft}d left`}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ mt: "auto", pt: 4, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          {...(challengeId
            ? {
              component: RouterLink,
              to: `/challenges/${challengeId}`,
            }
            : {})}
          startIcon={<VisibilityOutlinedIcon />}
          sx={{
            px: 2.5,
            py: 1.2,
            color: colors.textSecondary,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          View
        </Button>

        <Button
          variant="contained"
          sx={{
            minWidth: { xs: "100%", sm: 280 },
            px: 3,
            py: 1.2,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          Join Challenge
        </Button>
      </Stack>
    </AppCard>
  );
};

// ---------------------------------------------------------------------------
// Extended full-width challenge card
// ---------------------------------------------------------------------------
export const ExtendedChallengeCard = ({ challenge, currentUserRank, isJoined = false }) => {
  const daysLeft = getDaysLeft(challenge?.ends);
  const participantCount = Number(getParticipantCount(challenge));
  const participants = Number.isFinite(participantCount) ? participantCount : 0;
  const rank = Number(currentUserRank);
  const hasCurrentUserRank = Number.isFinite(rank) && rank > 0;

  const community = getChallengeCommunity(challenge);
  const category = getChallengeCategory(challenge);
  const difficulty = getChallengeDifficulty(challenge);

  return (
    <AppCard
      sx={{
        width: "100%",
        minHeight: 260,
        border: isJoined ? `2px solid ${colors.primary}` : undefined,
      }}
      contentSx={{
        p: { xs: 3, md: 4 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "flex-start" },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip
              label={community}
              sx={{
                height: 32,
                bgcolor: colors.softBlue,
                color: colors.primary,
                fontSize: 15,
                fontWeight: 800,
                "& .MuiChip-label": { px: 1.5 },
              }}
            />

            <Chip
              label={difficulty}
              sx={{
                height: 32,
                bgcolor: colors.softOrange,
                color: colors.orange,
                fontSize: 15,
                fontWeight: 800,
                textTransform: "capitalize",
                "& .MuiChip-label": { px: 1.5 },
              }}
            />

            <Chip
              label={category}
              sx={{
                height: 32,
                bgcolor: "#F3F4F6",
                color: colors.muted,
                fontSize: 15,
                fontWeight: 800,
                "& .MuiChip-label": { px: 1.5 },
              }}
            />
          </Stack>

          <Typography
            variant="h4"
            sx={{
              mt: 2.5,
              color: colors.textPrimary,
              fontWeight: 900,
              lineHeight: 1.15,
              fontSize: { xs: 28, md: 34 },
            }}
          >
            {challenge?.title || "Untitled challenge"}
          </Typography>

          <Typography
            sx={{
              mt: 2.5,
              color: colors.textSecondary,
              fontSize: { xs: 18, md: 20 },
              lineHeight: 1.45,
            }}
          >
            {challenge?.description || "No description yet."}
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Stack direction="row" spacing={{ xs: 3, md: 6 }} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <GroupsOutlinedIcon sx={{ fontSize: 28, color: colors.muted }} />
              <Typography sx={{ color: colors.textPrimary, fontSize: 20, fontWeight: 900 }}>
                {participants.toLocaleString()}
              </Typography>
              <Typography sx={{ color: colors.muted, fontSize: 18, fontWeight: 700 }}>
                {participants === 1 ? "participant" : "participants"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <AccessTimeOutlinedIcon sx={{ fontSize: 28, color: colors.muted }} />
              <Typography sx={{ color: colors.textPrimary, fontSize: 20, fontWeight: 900 }}>
                {daysLeft === null ? "--" : daysLeft}
              </Typography>
              <Typography sx={{ color: colors.muted, fontSize: 18, fontWeight: 700 }}>
                days left
              </Typography>
            </Stack>

            {hasCurrentUserRank && (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <EmojiEventsOutlinedIcon sx={{ fontSize: 26, color: colors.primary }} />
                <Typography sx={{ color: colors.primary, fontSize: 20, fontWeight: 900 }}>
                  #{rank}
                </Typography>
                <Typography sx={{ color: colors.muted, fontSize: 18, fontWeight: 700 }}>
                  your rank
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Button
          variant={isJoined ? "outlined" : "contained"}
          startIcon={isJoined ? <CheckIcon /> : undefined}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-start" },
            minWidth: { md: 280 },
            px: 3,
            py: 1.5,
            fontSize: 18,
            fontWeight: 900,
            borderColor: colors.primary,
            bgcolor: isJoined ? colors.softBlue : colors.primary,
            color: isJoined ? colors.primary : colors.surface,
            "&:hover": {
              borderColor: colors.primary,
              bgcolor: isJoined ? colors.softBlue : colors.primary,
            },
          }}
        >
          {isJoined ? "Joined" : "Join Challenge"}
        </Button>
      </Stack>
    </AppCard>
  );
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default ChallengeCard;
