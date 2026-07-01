import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";

import { useAuthContext } from "../auth/useAuthContext";
import { ExtendedChallengeCard } from "./Challenges";
import Leaderboard from "./Leaderboard";

// ---------------------------------------------------------------------------
// ChallengePage.jsx
// Detail page for one challenge: challenge header plus progress leaderboard.
// ---------------------------------------------------------------------------

const ChallengePage = () => {
  const { challengeId } = useParams();
  const { user } = useAuthContext();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(challengeId));
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

  const challenge = useMemo(() => {
    if (!data?.challenge) return null;

    return {
      ...data.challenge,
      participantCount: data.participantCount,
      isJoined: data.challenge.isJoined ?? data.isJoined ?? false,
    };
  }, [data]);

  const handleJoinChallenge = async () => {
    if (!challengeId || !user || challenge?.isJoined) return;

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

      const response = await fetch(`/api/challenges/${challengeId}/leaderboard`, {
        headers: authHeader,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Could not refresh challenge.");
      }

      setData(json);
    } catch (joinError) {
      setError(joinError.message || "Could not join challenge.");
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
    <Box
      sx={{
        width: "100%",
        maxWidth: 980,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <ExtendedChallengeCard
        challenge={challenge}
        currentUserRank={data.currentUserRank}
        isJoined={challenge.isJoined}
        onJoin={handleJoinChallenge}
      />

      <Leaderboard challengeId={challengeId} initialData={data} />
    </Box>
  );
};

export default ChallengePage;
