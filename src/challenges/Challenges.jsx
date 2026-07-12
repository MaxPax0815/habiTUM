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
import { compactCardBodySx, compactCardMetaSx, compactCardTitleSx } from '../styles/recipes'

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

const ChallengeJoinButton = ({ compact = false, isJoined = false, label, sx = {}, ...buttonProps }) => {
  const joined = Boolean(isJoined);
  const { "&:hover": hoverSx, ...buttonSx } = sx;

  return (
    <Button
      variant={joined ? "outlined" : "contained"}
      startIcon={joined ? <CheckIcon /> : undefined}
      sx={{
        px: compact ? 2 : 3,
        py: compact ? 0.9 : 1.2,
        borderRadius: 2,
        typography: compact ? "body2" : "subtitle1",
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
const ChallengeCard = ({ challenge, isJoined, onJoin, canManage = false, onEdit, onDelete }) => {
  const daysLeft = getDaysLeft(challenge?.ends);
  const participantCount = getParticipantCount(challenge);
  const challengeId = challenge?._id || challenge?.id;
  const joined = Boolean(isJoined ?? challenge?.isJoined);
  const showJoinAction = joined || Boolean(onJoin);
  const showManageActions = Boolean(canManage && (onEdit || onDelete));

  const category = getChallengeCategory(challenge);
  const difficulty = getChallengeDifficulty(challenge);

  return (
    <AppCard
      sx={{
        minHeight: 250,
      }}
      contentSx={{
        height: "100%",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          sx={{ ...compactCardMetaSx, fontWeight: 800 }}
        >
          {category}
        </Typography>

        <Chip
          label={difficulty}
          size="small"
          sx={{
            bgcolor: colors.softOrange,
            color: colors.orange,
            typography: "caption",
            fontWeight: 800,
            textTransform: "capitalize",
          }}
        />
      </Stack>

      <Typography
        component="h3"
        sx={{
          ...compactCardTitleSx,
          mt: 1.5,
        }}
      >
        {challenge?.title || "Untitled challenge"}
      </Typography>

      <Typography
        sx={{
          ...compactCardBodySx,
          mt: 1,
          display: "-webkit-box",
          overflow: "hidden",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 3,
        }}
      >
        {challenge?.description || "No description yet."}
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ mt: 2.5, color: colors.muted, flexWrap: "wrap" }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ ...compactCardMetaSx, fontWeight: 700 }}>
            {formatParticipants(participantCount)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ ...compactCardMetaSx, fontWeight: 700 }}>
            {daysLeft === null ? "No end date" : `${daysLeft}d left`}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ mt: "auto", pt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Creator-only management row, on one line directly above the Join button.
            Styled to match the community page's Invite/Delete buttons. */}
        {showManageActions && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => onEdit?.(challenge)}
              startIcon={<span className="material-symbols-outlined">edit</span>}
              sx={{ flex: 1, py: 0.9, typography: "body2", fontWeight: 800 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => onDelete?.(challenge)}
              startIcon={<span className="material-symbols-outlined">delete</span>}
              sx={{ flex: 1, py: 0.9, typography: "body2", fontWeight: 800 }}
            >
              Delete
            </Button>
          </Stack>
        )}

        <Box
          sx={{
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
              px: 2,
              py: 0.9,
              color: colors.textSecondary,
              typography: "body2",
              fontWeight: 800,
              flex: showJoinAction ? "1 1 150px" : "0 0 auto",
              minWidth: 120,
            }}
          >
            View
          </Button>

          {showJoinAction && (
            <ChallengeJoinButton
              compact
              isJoined={joined}
              onClick={joined ? undefined : onJoin}
              sx={{
                flex: "1 1 220px",
                minWidth: { xs: "100%", sm: 220 },
              }}
            />
          )}
        </Box>
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
  // Creator-only edit/delete controls, shown in the card header next to the chips.
  // Separate from canManageChallenge/onManageChallenge (the joined-user action menu).
  canManage = false,
  onEdit,
  onDelete,
  showHeading = true,
  readOnly = false,
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
  const showManageActions = Boolean(canManage && (onEdit || onDelete));
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
        border: isJoined && !readOnly ? `2px solid ${colors.primary}` : undefined,
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
                typography: "subtitle2",
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
                typography: "subtitle2",
                fontWeight: 800,
                textTransform: "capitalize",
                "& .MuiChip-label": { px: 1.5 },
              }}
            />
          </Box>

          {(showManageActions || hasActionMenu) && (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center" }}>
              {/* Creator-only edit/delete, aligned with the community/difficulty chips. */}
              {showManageActions && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onEdit?.(challenge)}
                    startIcon={<span className="material-symbols-outlined">edit</span>}
                    sx={{ fontWeight: 800 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => onDelete?.(challenge)}
                    startIcon={<span className="material-symbols-outlined">delete</span>}
                    sx={{ fontWeight: 800 }}
                  >
                    Delete
                  </Button>
                </>
              )}

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
            </Stack>
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

        {showHeading && (
          <>
            <Typography
              variant="h4"
              sx={{
                mt: 2.5,
                color: colors.textPrimary,
                fontWeight: 900,
                lineHeight: 1.15,
                typography: "landingSectionTitle",
              }}
            >
              {challenge?.title || "Untitled challenge"}
            </Typography>

            <Typography
              sx={{
                mt: 2.5,
                color: colors.textSecondary,
                typography: { xs: "subtitle1", md: "h5" },
                lineHeight: 1.45,
              }}
            >
              {challenge?.description || "No description yet."}
            </Typography>
          </>
        )}

        {!isJoined && !readOnly && (
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
            // sit a little lower below the divider rather than hugging it
            pt: 2,
            pb: 1,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <GroupsOutlinedIcon sx={{ fontSize: 24, color: colors.muted }} />
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ color: colors.textPrimary, typography: "metricValue" }}>
                {participants.toLocaleString()}
              </Typography>
              <Typography sx={{ color: colors.muted, typography: "metricLabel" }}>
                {participants === 1 ? "participant" : "participants"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <AccessTimeOutlinedIcon sx={{ fontSize: 24, color: colors.muted }} />
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ color: colors.textPrimary, typography: "metricValue" }}>
                {daysLeft === null ? "--" : daysLeft}
              </Typography>
              <Typography sx={{ color: colors.muted, typography: "metricLabel" }}>
                days left
              </Typography>
            </Box>
          </Stack>

          {hasCurrentUserRank && (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <EmojiEventsOutlinedIcon sx={{ fontSize: 24, color: colors.primary }} />
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                <Typography sx={{ color: colors.primary, typography: "metricValue" }}>
                  #{rank}
                </Typography>
                <Typography sx={{ color: colors.muted, typography: "metricLabel" }}>
                  your rank
                </Typography>
              </Box>
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
