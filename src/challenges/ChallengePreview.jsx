import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import AppDialog from "../components/AppDialog";
import HabitDetails from "../components/HabitDetails";
import { ExtendedChallengeCard } from "./Challenges";
import Leaderboard from "./Leaderboard";
import { sectionTitleSx } from "../styles/recipes";

// ---------------------------------------------------------------------------
// ChallengePreview.jsx
// Public, read-only challenge view for logged-out visitors (landing page).
// Mirrors the in-app ChallengePage (header + habits + leaderboard) but has no
// join or check-in actions. Data comes from the PUBLIC endpoint
// GET /api/challenges/:id/preview, so no auth token is needed.
// ---------------------------------------------------------------------------

const ChallengePreview = ({ challengeId, open, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !challengeId) return undefined;

    const controller = new AbortController();
    let active = true;

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/challenges/${challengeId}/preview`, {
          signal: controller.signal,
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Could not load challenge.");
        }

        if (active) setData(json);
      } catch (fetchError) {
        if (fetchError.name === "AbortError" || !active) return;
        setData(null);
        setError(fetchError.message || "Could not load challenge.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, challengeId]);

  const challenge = data?.challenge
    ? { ...data.challenge, participantCount: data.participantCount }
    : null;
  const habits = data?.habits || [];
  const buildHabits = habits.filter((habit) => habit.habitType === "build");
  const breakHabits = habits.filter((habit) => habit.habitType === "break");

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="md">
      {loading ? (
        <Box sx={{ display: "grid", minHeight: 240, placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : challenge ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Same header card as the app, but read-only (no Join button). */}
          <ExtendedChallengeCard challenge={challenge} readOnly showHeading />

          <Box>
            <Typography component="h2" sx={sectionTitleSx}>
              Challenge habits
            </Typography>

            {habits.length > 0 ? (
              <Box sx={{ mt: 1.5 }}>
                {buildHabits.map((habit) => (
                  <HabitDetails
                    key={habit._id}
                    habit={habit}
                    actionsDisabled
                    showDelete={false}
                  />
                ))}

                {breakHabits.length > 0 && (
                  <>
                    <Box sx={{ mt: 3 }}>
                      <Typography component="h2" sx={sectionTitleSx}>
                        Break habits
                      </Typography>
                    </Box>
                    {breakHabits.map((habit) => (
                      <HabitDetails
                        key={habit._id}
                        habit={habit}
                        actionsDisabled
                        showDelete={false}
                      />
                    ))}
                  </>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No habits have been added to this challenge yet.
              </Typography>
            )}
          </Box>

          {/* initialData set → Leaderboard renders read-only without refetching. */}
          <Leaderboard challengeId={challengeId} initialData={data} />
        </Box>
      ) : null}
    </AppDialog>
  );
};

export default ChallengePreview;
