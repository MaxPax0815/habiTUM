import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useAuthContext } from "../auth/useAuthContext";
import AppCard from "../components/AppCard";
import { colors } from '../styles/tokens'

// ---------------------------------------------------------------------------
// ChallengeForm.jsx
// Creates the challenge container only.
// Challenge habits/tasks will be added from the challenge detail flow later.
// ---------------------------------------------------------------------------

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const toApiDate = (dateValue) => `${dateValue}T00:00:00.000Z`;

const ChallengeForm = ({
  communityId,
  onChallengeCreated,
  onClose,
}) => {
  const { user } = useAuthContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [starts, setStarts] = useState(formatDateInput(new Date()));
  const [ends, setEnds] = useState(formatDateInput(addDays(new Date(), 30)));
  const [emptyFields, setEmptyFields] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = Boolean(communityId && title && starts && ends && !isLoading);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setError("You must be logged in to create a challenge.");
      return;
    }

    if (!communityId) {
      setError("A community is required to create a challenge.");
      setEmptyFields(["community"]);
      return;
    }

    if (new Date(toApiDate(ends)) <= new Date(toApiDate(starts))) {
      setError("End date must be after start date.");
      setEmptyFields(["ends"]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        community: communityId,
        title,
        description,
        starts: toApiDate(starts),
        ends: toApiDate(ends),
        difficulty,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    });

    const json = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(json.error);
      setEmptyFields(json.emptyFields || []);
      return;
    }

    setEmptyFields([]);
    setTitle("");
    setDescription("");
    setDifficulty("medium");
    setStarts(formatDateInput(new Date()));
    setEnds(formatDateInput(addDays(new Date(), 30)));
    onChallengeCreated?.(json);
    onClose?.();
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 900 }}>
        New Challenge
      </Typography>
      <Typography sx={{ mt: 0.5, mb: 3, color: colors.muted, fontWeight: 700 }}>
        Create a challenge to share with your communities.
      </Typography>

      <AppCard sx={{ boxShadow: "none" }} contentSx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.16em" }}
            >
              Challenge
            </Typography>
            <TextField
              placeholder="e.g. 30-Day Morning Run"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={emptyFields.includes("title")}
              fullWidth
            />
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.16em" }}
            >
              Short description
            </Typography>
            <TextField
              placeholder="Describe what participants need to do."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.16em" }}
            >
              Difficulty
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="challenge-difficulty-label">Difficulty</InputLabel>
              <Select
                labelId="challenge-difficulty-label"
                label="Difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                {DIFFICULTIES.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{ color: colors.muted, fontWeight: 900, letterSpacing: "0.16em" }}
            >
              Duration
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={starts}
                onChange={(event) => setStarts(event.target.value)}
                error={emptyFields.includes("starts")}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />

              <TextField
                label="End date"
                type="date"
                value={ends}
                onChange={(event) => setEnds(event.target.value)}
                error={emptyFields.includes("ends")}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Stack>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={1.5}>
            <Button type="submit" variant="contained" disabled={!canSubmit} fullWidth>
              {isLoading ? "Creating..." : "Create Challenge"}
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </AppCard>
    </Box>
  );
};

export default ChallengeForm;
