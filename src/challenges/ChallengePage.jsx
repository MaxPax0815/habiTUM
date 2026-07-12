import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "../auth/useAuthContext";
import { ExtendedChallengeCard } from "./Challenges";
import ChallengeForm from "./ChallengeForm";
import Leaderboard from "./Leaderboard";
import { sectionTitleSx } from "../styles/recipes";
import AppDialog from "../components/AppDialog";
import HabitDetails from "../components/HabitDetails";
import HabitForm from "../components/HabitForm";
import BackButton from "../components/BackButton";
import ActivityFeed from "../feed/ActivityFeed";
import FeedRailLayout from "../feed/FeedRailLayout";

// ---------------------------------------------------------------------------
// ChallengePage.jsx
// Detail page for one challenge: challenge header plus progress leaderboard.
// ---------------------------------------------------------------------------

const ChallengePage = () => {
  const { challengeId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [challengeHabits, setChallengeHabits] = useState([]);
  const [habitsError, setHabitsError] = useState(null);
  const [habitsLoading, setHabitsLoading] = useState(Boolean(challengeId));
  const [isLoading, setIsLoading] = useState(Boolean(challengeId));
  const [communityMembershipStatus, setCommunityMembershipStatus] = useState(null);
  const [communityRole, setCommunityRole] = useState(null);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!challengeId || !user) return undefined;

    const controller = new AbortController();
    let isActive = true;

    const fetchChallenge = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/challenges/${challengeId}/leaderboard`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          signal: controller.signal,
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Could not load challenge.");
        }

        if (isActive) {
          setData(json);
        }
      } catch (fetchError) {
        if (fetchError.name === "AbortError" || !isActive) return;
        setData(null);
        setError(fetchError.message || "Could not load challenge.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchChallenge();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [challengeId, user]);

  useEffect(() => {
    if (!challengeId || !user) return undefined;

    const controller = new AbortController();
    let isActive = true;

    const fetchChallengeHabits = async () => {
      setHabitsLoading(true);
      setHabitsError(null);

      try {
        const response = await fetch(`/api/challenges/${challengeId}/habits`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          signal: controller.signal,
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Could not load challenge habits.");
        }

        if (isActive) {
          setChallengeHabits(json);
        }
      } catch (fetchError) {
        if (fetchError.name === "AbortError" || !isActive) return;
        setChallengeHabits([]);
        setHabitsError(fetchError.message || "Could not load challenge habits.");
      } finally {
        if (isActive) {
          setHabitsLoading(false);
        }
      }
    };

    fetchChallengeHabits();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [challengeId, user]);

  const challenge = useMemo(() => {
    if (!data?.challenge) return null;

    return {
      ...data.challenge,
      participantCount: data.participantCount,
      isJoined: data.challenge.isJoined ?? data.isJoined ?? false,
    };
  }, [data]);

  const communityId = challenge?.community?._id || challenge?.community;
  // Derived from communityId so no state reset is needed when it goes away —
  // without a community, both flags are simply false.
  const isCommunityMember = Boolean(communityId) && communityMembershipStatus === "accepted";
  // Only the community's creator gets the "Add habit" button — the backend
  // enforces the same rule on POST /api/challenges/:id/habits.
  const isCommunityCreator = Boolean(communityId) && communityRole === "creator";

  useEffect(() => {
    if (!communityId || !user) return undefined;

    const controller = new AbortController();
    let isActive = true;

    const fetchCommunityMembership = async () => {
      try {
        const response = await fetch(`/api/communities/${communityId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          signal: controller.signal,
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Could not load community membership.");
        }

        if (isActive) {
          setCommunityMembershipStatus(json.membershipStatus || null);
          setCommunityRole(json.myRole || null);
        }
      } catch (fetchError) {
        if (fetchError.name === "AbortError" || !isActive) return;
        setCommunityMembershipStatus(null);
        setCommunityRole(null);
      }
    };

    fetchCommunityMembership();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [communityId, user]);

  const buildChallengeHabits = challengeHabits.filter((habit) => habit.habitType === "build");
  const breakChallengeHabits = challengeHabits.filter((habit) => habit.habitType === "break");

  const refreshChallengeData = async () => {
    if (!challengeId || !user) return null;

    const response = await fetch(`/api/challenges/${challengeId}/leaderboard`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "Could not refresh challenge.");
    }

    setData(json);
    return json;
  };

  const handleJoinChallenge = async () => {
    if (!challengeId || !user || challenge?.isJoined) return;
    if (!isCommunityMember) {
      setError("Join this community before joining its challenges.");
      return;
    }

    setError(null);

    try {
      const authHeader = {
        Authorization: `Bearer ${user.token}`,
      };
      const joinResponse = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
        headers: authHeader,
      });
      const joinJson = await joinResponse.json();

      if (!joinResponse.ok) {
        throw new Error(joinJson.error || "Could not join challenge.");
      }

      await refreshChallengeData();
    } catch (joinError) {
      setError(joinError.message || "Could not join challenge.");
    }
  };

  const handleLeaveChallenge = async () => {
    if (!challengeId || !user || !challenge?.isJoined) return;

    setError(null);

    try {
      const authHeader = {
        Authorization: `Bearer ${user.token}`,
      };
      const leaveResponse = await fetch(`/api/challenges/${challengeId}/leave`, {
        method: "DELETE",
        headers: authHeader,
      });
      const leaveJson = await leaveResponse.json();

      if (!leaveResponse.ok) {
        throw new Error(leaveJson.error || "Could not leave challenge.");
      }

      await refreshChallengeData();
    } catch (leaveError) {
      setError(leaveError.message || "Could not leave challenge.");
    }
  };

  // A newly created habit comes back in the same enriched shape as the
  // fetched list (empty checkins, zeroed progress), so it can be appended.
  const handleChallengeHabitCreated = (newHabit) => {
    setChallengeHabits((currentHabits) => [...currentHabits, newHabit]);
  };

  const handleChallengeHabitUpdated = (updatedHabit) => {
    setChallengeHabits((currentHabits) =>
      currentHabits.map((habit) => habit._id === updatedHabit._id ? updatedHabit : habit)
    );

    refreshChallengeData().catch((refreshError) => {
      setError(refreshError.message || "Could not refresh challenge.");
    });
  };

  // Refresh the challenge header after an edit so the new title/dates show.
  const handleChallengeUpdated = () => {
    setShowEditForm(false);
    refreshChallengeData().catch((refreshError) => {
      setError(refreshError.message || "Could not refresh challenge.");
    });
  };

  const handleDeleteChallenge = async () => {
    if (!window.confirm(`Delete "${challenge?.title}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "Could not delete challenge.");
      }

      navigate(`/communities/${communityId}`);
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete challenge.");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "grid", minHeight: 360, placeItems: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!challengeId) {
    return <Alert severity="error">A challenge id is required.</Alert>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!challenge) {
    return <Alert severity="info">Challenge data is not available.</Alert>;
  }

  return (
    // key={challengeId} remounts the challenge-scoped feed so cursor/list state resets.
    <FeedRailLayout
      feedKey={challengeId}
      feed={isCommunityMember && challenge.community?._id && (({ onClose }) => (
        <ActivityFeed
          key={challengeId}
          communityId={challenge.community._id}
          challengeId={challengeId}
          title="Challenge feed"
          onClose={onClose}
        />
      ))}
    >
      {({ showFeedButton }) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <BackButton
              text={`Back to ${challenge.community?.name || "Community"}`}
              to={`/communities/${challenge.community?._id || challenge.community}`}
              sx={{ mb: 0 }}
            />

            {/* Title + description live inside the card (showHeading), above the
                participants/days-left/rank row — see ExtendedChallengeCard.
                Creator-only Edit/Delete render in the card header next to the chips. */}
            <ExtendedChallengeCard
              challenge={challenge}
              currentUserRank={data.currentUserRank}
              isJoined={challenge.isJoined}
              isCommunityMember={isCommunityMember}
              onJoin={handleJoinChallenge}
              onLeaveChallenge={handleLeaveChallenge}
              canManage={isCommunityCreator}
              onEdit={() => setShowEditForm(true)}
              onDelete={handleDeleteChallenge}
              showHeading
            />
          </Box>

      <Box>
        {/* Section heading with the creator-only "Add habit" action on the right */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Typography component="h2" sx={sectionTitleSx}>
            Challenge habits
          </Typography>
          {(showFeedButton || isCommunityCreator) && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
              {showFeedButton}
              {isCommunityCreator && (
                <Button variant="outlined" size="small" onClick={() => setShowHabitForm(true)}>
                  + Add habit
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {!challenge.isJoined && challengeHabits.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Join this challenge to check in to these habits.
          </Typography>
        )}

        {habitsLoading ? (
          <Box sx={{ display: "grid", minHeight: 120, placeItems: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : habitsError ? (
          <Alert severity="error" sx={{ mt: 1.5 }}>{habitsError}</Alert>
        ) : challengeHabits.length > 0 ? (
          <Box sx={{ mt: 1.5 }}>
            {buildChallengeHabits.map((habit) => (
              <HabitDetails
                key={habit._id}
                habit={habit}
                actionsDisabled={!challenge.isJoined}
                showDelete={false}
                onHabitUpdated={handleChallengeHabitUpdated}
              />
            ))}

            {breakChallengeHabits.length > 0 && (
              <>
                <Box sx={{ mt: 3 }}>
                  <Typography component="h2" sx={sectionTitleSx}>Break habits</Typography>
                </Box>
                {breakChallengeHabits.map((habit) => (
                  <HabitDetails
                    key={habit._id}
                    habit={habit}
                    actionsDisabled={!challenge.isJoined}
                    showDelete={false}
                    onHabitUpdated={handleChallengeHabitUpdated}
                  />
                ))}
              </>
            )}
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, mt: 1.5, borderRadius: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No habits have been added to this challenge yet.
            </Typography>
          </Paper>
        )}
      </Box>

      <Leaderboard challengeId={challengeId} initialData={data} />

      {/* Creator-only: add a habit to this challenge. Reuses the personal
          HabitForm in challenge mode (POSTs to /api/challenges/:id/habits). */}
      <AppDialog open={showHabitForm} onClose={() => setShowHabitForm(false)} maxWidth="sm">
        <HabitForm
          challengeId={challengeId}
          onHabitCreated={handleChallengeHabitCreated}
          onClose={() => setShowHabitForm(false)}
        />
      </AppDialog>

      {/* Creator-only: edit this challenge's details in the shared form. */}
      <AppDialog open={showEditForm} onClose={() => setShowEditForm(false)} maxWidth="sm">
        <ChallengeForm
          challenge={challenge}
          onChallengeUpdated={handleChallengeUpdated}
          onClose={() => setShowEditForm(false)}
        />
      </AppDialog>
        </Box>
      )}
    </FeedRailLayout>
  );
};

export default ChallengePage;
