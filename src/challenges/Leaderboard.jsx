import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import WhatshotIcon from "@mui/icons-material/Whatshot";

import { useAuthContext } from "../auth/useAuthContext";
import { avatarColors, colors, radii } from '../styles/tokens'
import { sectionTitleSx } from '../styles/recipes'

// ---------------------------------------------------------------------------
// Leaderboard.jsx
// Shows active challenge participants ranked by progress-backed streak.
// Data comes from GET /api/challenges/:id/leaderboard.
// ---------------------------------------------------------------------------

const getDisplayName = (entry) => {
  const firstName = entry?.user?.firstName || "";
  const lastName = entry?.user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || entry?.user?.username || "Participant";
};

const getInitial = (name) => name.trim().charAt(0).toUpperCase() || "U";

const getAvatarColor = (rank) => avatarColors[(rank - 1) % avatarColors.length];

const getRankMarker = (rank) => {
  if (rank <= 3) {
    return (
      <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>
        👑
      </Box>
    );
  }

  return (
    <Typography sx={{ color: colors.muted, fontWeight: 900, fontSize: 18 }}>
      {rank}
    </Typography>
  );
};

const normalizeLeaderboard = (entries) => {
  return [...entries].sort((a, b) => (a.rank || 0) - (b.rank || 0));
};

const Leaderboard = ({ challengeId, initialData }) => {
  const { user } = useAuthContext();
  const [data, setData] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(Boolean(challengeId && !initialData));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData || !challengeId || !user) return;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/challenges/${challengeId}/leaderboard`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Could not load leaderboard.");
        setData(null);
      } else {
        setData(json);
      }

      setIsLoading(false);
    };

    if (user) fetchLeaderboard();
  }, [challengeId, initialData, user]);

  const displayData = initialData || data;
  const displayError = !challengeId && !initialData
    ? "A challenge is required to show the leaderboard."
    : error;

  const entries = useMemo(
    () => normalizeLeaderboard(displayData?.leaderboard || []),
    [displayData]
  );

  if (isLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (displayError) {
    return <Alert severity="error">{displayError}</Alert>;
  }

  return (
    <Box>
      <Typography component="h2" sx={sectionTitleSx}>
        Leaderboard — Ranked by Streak
      </Typography>

      <TableContainer
        sx={{
          border: `1px solid ${colors.border}`,
          borderRadius: radii.card,
          bgcolor: 'background.paper',
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
              <TableCell
                sx={{
                  width: 76,
                  borderColor: colors.border,
                  color: colors.muted,
                  fontWeight: 900,
                }}
              />
              <TableCell
                sx={{
                  borderColor: colors.border,
                  color: colors.muted,
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                Participant
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  borderColor: colors.border,
                  color: colors.muted,
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                🔥 Streak
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 5, textAlign: "center", color: colors.muted }}>
                  No participants yet.
                </TableCell>
              </TableRow>
            )}

            {entries.map((entry) => {
              const name = getDisplayName(entry);
              const rank = entry.rank || 0;
              const isTopRank = rank <= 3;
              const rowBg = entry.isCurrentUser
                ? "#EAF2FF"
                : isTopRank
                  ? "#FFFAEA"
                  : colors.surface;

              return (
                <TableRow
                  key={entry.user?._id || `${name}-${rank}`}
                  sx={{
                    bgcolor: rowBg,
                    "& td": {
                      borderColor: colors.border,
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      width: 76,
                      py: 2,
                      textAlign: "center",
                    }}
                  >
                    {getRankMarker(rank)}
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: getAvatarColor(rank || 1),
                          color: colors.surface,
                          fontWeight: 900,
                          fontSize: 18,
                        }}
                      >
                        {getInitial(name)}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: entry.isCurrentUser ? colors.primary : colors.textPrimary,
                            fontWeight: 900,
                            fontSize: 18,
                            lineHeight: 1.2,
                          }}
                        >
                          {name}
                          {entry.isCurrentUser ? " (you)" : ""}
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                          {entry.doneToday && (
                            <CheckIcon sx={{ fontSize: 18, color: colors.green }} />
                          )}
                          <Typography
                            sx={{
                              color: entry.doneToday ? colors.green : colors.muted,
                              fontWeight: 700,
                              fontSize: 17,
                              lineHeight: 1.2,
                            }}
                          >
                            {entry.doneToday ? "Done today" : "Not yet today"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell align="right" sx={{ py: 2 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: colors.textPrimary,
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      <WhatshotIcon sx={{ fontSize: 17, color: colors.orange }} />
                      {entry.streak || 0}d
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Leaderboard;
