import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material'

const emptyPostForm = {
  title: '',
  body: '',
  imageUrl: '',
  challenge: '',
  eventDate: '',
  pinned: false,
}

const CommunityPostDialog = ({ challenges = [], onClose, onSubmit, open, submitting }) => {
  const [postForm, setPostForm] = useState(emptyPostForm)

  useEffect(() => {
    if (!open) setPostForm(emptyPostForm)
  }, [open])

  const handlePostFormChange = (field) => (event) => {
    const value = field === 'pinned' ? event.target.checked : event.target.value
    setPostForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit({
      title: postForm.title.trim(),
      body: postForm.body.trim() || undefined,
      imageUrl: postForm.imageUrl.trim() || undefined,
      challenge: postForm.challenge || null,
      eventDate: postForm.eventDate || null,
      pinned: postForm.pinned,
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>New community post</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <TextField
          label="Title"
          value={postForm.title}
          onChange={handlePostFormChange('title')}
          required
          fullWidth
        />
        <TextField
          label="Body"
          value={postForm.body}
          onChange={handlePostFormChange('body')}
          multiline
          minRows={4}
          fullWidth
        />
        <TextField
          label="Image URL"
          value={postForm.imageUrl}
          onChange={handlePostFormChange('imageUrl')}
          fullWidth
        />
        <TextField
          label="Related challenge"
          value={postForm.challenge}
          onChange={handlePostFormChange('challenge')}
          select
          fullWidth
        >
          <MenuItem value="">None</MenuItem>
          {challenges.map((challenge) => (
            <MenuItem key={challenge._id} value={challenge._id}>
              {challenge.title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Gathering date"
          value={postForm.eventDate}
          onChange={handlePostFormChange('eventDate')}
          type="datetime-local"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <FormControlLabel
          control={<Checkbox checked={postForm.pinned} onChange={handlePostFormChange('pinned')} />}
          label="Pin this post"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!postForm.title.trim() || submitting}>
          Post
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CommunityPostDialog
