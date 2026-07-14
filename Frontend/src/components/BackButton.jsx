import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const BackButton = ({ text, to, sx = {} }) => {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => navigate(to)}
      sx={{ color: 'text.secondary', mb: 2, px: 0, alignSelf: 'flex-start', ...sx }}
      startIcon={<span className="material-symbols-outlined">arrow_back</span>}
    >
      {text}
    </Button>
  )
}

export default BackButton
