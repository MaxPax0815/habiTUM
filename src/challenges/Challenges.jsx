import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
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

const ChallengeJoinButton = ({ isJoined = false, label, sx = {}, ...buttonProps }) => {
  const joined = Boolean(isJoined);
  const { "&:hover": hoverSx, ...buttonSx } = sx;

  return (
    <Button
      variant={joined ? "outlined" : "contained"}
      startIcon={joined ? <CheckIcon /> : undefined}
      sx={{
        px: 3,
        py: 1.2,
        borderRadius: 2,
        fontSize: 18,
        fontWeight: 800,
        borderColor: colors.primary,
        bgcolor: joined ? colors.softBlue : colors.primary,
        color: joined ? colors.primary : colors.surface,
        ...buttonSx,
        "&:hover": {
          borderColor: colors.primary,
          bgcolor: joined ? colors.softBlue : colors.primary,
          ...hoverSx,
        },
      }}
      {...buttonProps}
    >
      {label || (joined ? "Joined" : "Join Challenge")}
    </Button>
  );
};

// ---------------------------------------------------------------------------
// Compact challenge card
// ---------------------------------------------------------------------------
const ChallengeCard = ({ challenge, isJoined, onJoin }) => {
  const daysLeft = getDaysLeft(challenge?.ends);
  const participantCount = getParticipantCount(challenge);
  const challengeId = challenge?._id || challenge?.id;
  const joined = Boolean(isJoined ?? challenge?.isJoined);
  const showJoinAction = joined || Boolean(onJoin);

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

      <Box
        sx={{
          mt: "auto",
          pt: 4,
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "stretch",
          justifyContent: showJoinAction ? "flex-start" : "center",
        }}
      >
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
            flex: showJoinAction ? "1 1 150px" : "0 0 auto",
            minWidth: 120,
          }}
        >
          View
        </Button>

        {showJoinAction && (
          <ChallengeJoinButton
            isJoined={joined}
            onClick={joined ? undefined : onJoin}
            sx={{
              flex: "1 1 220px",
              minWidth: { xs: "100%", sm: 220 },
            }}
          />
        )}
      </Box>
    </AppCard>
  );
};

// ---------------------------------------------------------------------------
// Extended full-width challenge card
// ---------------------------------------------------------------------------
export const ExtendedChallengeCard = ({
  challenge,
  currentUserRank,
  isJoined = false,
  isCommunityMember = true,
  onJoin,
  canManageChallenge = false,
  onManageChallenge,
  onLeaveChallenge,
}) => {
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const daysLeft = getDaysLeft(challenge?.ends);
  const participantCount = Number(getParticipantCount(challenge));
  const participants = Number.isFinite(participantCount) ? participantCount : 0;
  const rank = Number(currentUserRank);
  const hasCurrentUserRank = Number.isFinite(rank) && rank > 0;
  const hasManageAction = Boolean(canManageChallenge && onManageChallenge);
  const hasLeaveAction = Boolean(isJoined && onLeaveChallenge);
  const hasActionMenu = Boolean(isJoined && (hasManageAction || hasLeaveAction));
  const isActionMenuOpen = Boolean(actionAnchorEl);
  const canJoinChallenge = Boolean(isCommunityMember);

  const community = getChallengeCommunity(challenge);
  const difficulty = getChallengeDifficulty(challenge);

  const handleActionMenuOpen = (event) => {
    setActionAnchorEl(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
  };

  const handleManageChallenge = () => {
    handleActionMenuClose();
    onManageChallenge?.();
  };

  const handleLeaveChallenge = () => {
    handleActionMenuClose();
    onLeaveChallenge?.();
  };

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
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              minWidth: 0,
            }}
          >
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
          </Box>

          {hasActionMenu && (
            <IconButton
              aria-label="Challenge actions"
              aria-controls={isActionMenuOpen ? "challenge-actions-menu" : undefined}
              aria-haspopup="menu"
              aria-expanded={isActionMenuOpen ? "true" : undefined}
              onClick={handleActionMenuOpen}
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                bgcolor: colors.surface,
                "&:hover": {
                  borderColor: colors.primary,
                  bgcolor: colors.softBlue,
                  color: colors.primary,
                },
              }}
            >
              <MoreHorizIcon />
            </IconButton>
          )}
        </Box>

        <Menu
          id="challenge-actions-menu"
          anchorEl={actionAnchorEl}
          open={isActionMenuOpen}
          onClose={handleActionMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: 2,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 14px 32px rgba(7, 29, 53, 0.14)",
              },
            },
          }}
        >
          {hasManageAction && (
            <MenuItem onClick={handleManageChallenge}>
              <ListItemIcon sx={{ minWidth: 36, color: colors.textSecondary }}>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Manage challenge" />
            </MenuItem>
          )}

          {hasLeaveAction && (
            <MenuItem
              onClick={handleLeaveChallenge}
              sx={{
                color: "#DC2626",
                "& .MuiListItemIcon-root": { color: "inherit" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Leave challenge" />
            </MenuItem>
          )}
        </Menu>

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

        {!isJoined && (
          <ChallengeJoinButton
            isJoined={false}
            disabled={!canJoinChallenge}
            label={canJoinChallenge ? undefined : "Join community first"}
            onClick={canJoinChallenge ? onJoin : undefined}
            sx={{
              mt: 3,
              minWidth: { xs: "100%", sm: 260 },
            }}
          />
        )}

        <Divider sx={{ my: 4, borderColor: colors.border }} />

        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            gap: { xs: 3, md: 6 },
            flexWrap: "wrap",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <GroupsOutlinedIcon sx={{ fontSize: 28, color: colors.muted }} />
            <Typography sx={{ color: colors.textPrimary, fontSize: 20, fontWeight: 900 }}>
              {participants.toLocaleString()}
            </Typography>
            <Typography sx={{ color: colors.muted, fontSize: 18, fontWeight: 700 }}>
              {participants === 1 ? "participant" : "participants"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccessTimeOutlinedIcon sx={{ fontSize: 28, color: colors.muted }} />
            <Typography sx={{ color: colors.textPrimary, fontSize: 20, fontWeight: 900 }}>
              {daysLeft === null ? "--" : daysLeft}
            </Typography>
            <Typography sx={{ color: colors.muted, fontSize: 18, fontWeight: 700 }}>
              days left
            </Typography>
          </Stack>

          {hasCurrentUserRank && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EmojiEventsOutlinedIcon sx={{ fontSize: 26, color: colors.primary }} />
              <Typography sx={{ color: colors.primary, fontSize: 20, fontWeight: 900 }}>
                #{rank}
              </Typography>
              <Typography sx={{ color: colors.muted, fontSize: 18, fontWeight: 700 }}>
                your rank
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>
    </AppCard>
  );
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default ChallengeCard;
