import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

import { useAuthContext } from "../auth/useAuthContext";
import { ExtendedChallengeCard } from "./Challenges";
import Leaderboard from "./Leaderboard";
import PageHeader from "../components/layout/PageHeader";
import { sectionTitleSx } from "../styles/recipes";
import HabitDetails from "../components/HabitDetails";
import BackButton from "../components/BackButton";

// ---------------------------------------------------------------------------
// ChallengePage.jsx
// Detail page for one challenge: challenge header plus progress leaderboard.
// ---------------------------------------------------------------------------

const ChallengePage = () => {
  const { challengeId } = useParams();
  const { user } = useAuthContext();

  const [data, setData] = useState(null);
  const [challengeHabits, setChallengeHabits] = useState([]);
  const [habitsError, setHabitsError] = useState(null);
  const [habitsLoading, setHabitsLoading] = useState(Boolean(challengeId));
  const [isLoading, setIsLoading] = useState(Boolean(challengeId));
  const [communityMembershipStatus, setCommunityMembershipStatus] = useState(null);
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
  const isCommunityMember = communityMembershipStatus === "accepted";

  useEffect(() => {
    if (!communityId || !user) {
      setCommunityMembershipStatus(null);
      return undefined;
    }

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
        }
      } catch (fetchError) {
        if (fetchError.name === "AbortError" || !isActive) return;
        setCommunityMembershipStatus(null);
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

  const handleChallengeHabitUpdated = (updatedHabit) => {
    setChallengeHabits((currentHabits) =>
      currentHabits.map((habit) => habit._id === updatedHabit._id ? updatedHabit : habit)
    );

    refreshChallengeData().catch((refreshError) => {
      setError(refreshError.message || "Could not refresh challenge.");
    });
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

        <PageHeader
          title={challenge.title || "Challenge"}
          description={challenge.description || "No description yet."}
        />

        <ExtendedChallengeCard
          challenge={challenge}
          currentUserRank={data.currentUserRank}
          isJoined={challenge.isJoined}
          isCommunityMember={isCommunityMember}
          onJoin={handleJoinChallenge}
          onLeaveChallenge={handleLeaveChallenge}
          showHeading={false}
        />
      </Box>

      <Box>
        <Typography component="h2" sx={sectionTitleSx}>
          Challenge habits
        </Typography>

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
    </Box>
  );
};

export default ChallengePage;
