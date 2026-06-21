import {
    Box,
    Button,
    Divider,
    InputAdornment,
    TextField,
    Typography,
    IconButton,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import GroupsIcon from '@mui/icons-material/Groups'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'



import { colors } from '../../theme'

import { useSignup } from '../../auth/useSignup'
import Header from '../../components/Header'

const BENEFITS = [
    'Track unlimited habits for free',
    'Join habit communities & challenges',
    'Visualise your progress over time',
]

const FieldLabel = ({ children }) => (
    <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, mb: 0.5, textAlign: 'left' }}
    >
        {children}
    </Typography>
)

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        fontSize: 15,
        '& fieldset': { borderColor: colors.border },
        '&:hover fieldset': { borderColor: colors.primary },
        '&.Mui-focused fieldset': { borderColor: colors.primary, borderWidth: 2 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: colors.primary },
}

const Signup = () => {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [success, setSuccess] = useState(false)
    const { signup, error, isLoading } = useSignup()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const ok = await signup(firstName, lastName, username, email, password)
        if (ok) {
            setSuccess(true)
            setTimeout(() => navigate('/today'), 1000)
        }
    }

    const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password

    return (
        <Box>
            <Header />  
            <form className="signup" onSubmit={handleSubmit}>
                <h3>Sign Up</h3>
            {/* Card */}
            <Box
                sx={{
                    maxWidth: 480,
                    mx: 'auto',
                    mb: 6,
                    bgcolor: colors.surface,
                    borderRadius: 3,
                    boxShadow: '0 4px 32px rgba(7,29,53,0.08)',
                    p: { xs: 3, sm: 4 },
                }}
            >
                {/* Benefits */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    {BENEFITS.map((text) => (
                        <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <CheckCircleOutlinedIcon sx={{ color: colors.green, fontSize: 18, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>
                                {text}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ mb: 3, borderColor: colors.border }} />

                {/* Form */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Box sx={{ flex: 1 }}>
                            <FieldLabel>First name</FieldLabel>
                            <TextField
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                fullWidth
                                size="small"
                                required
                                placeholder="Tom"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FieldLabel>Last name</FieldLabel>
                            <TextField
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                fullWidth
                                size="small"
                                required
                                placeholder="Müller"
                                sx={fieldSx}
                            />
                        </Box>
                    </Box>

                    <Box>
                        <FieldLabel>Username</FieldLabel>
                        <TextField
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            size="small"
                            required
                            placeholder="tommueller"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <GroupsIcon sx={{ fontSize: 18, color: colors.muted }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={fieldSx}
                        />
                    </Box>

                    <Box>
                        <FieldLabel>Email address</FieldLabel>
                        <TextField
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            size="small"
                            required
                            placeholder="tom.mueller@tum.de"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={fieldSx}
                        />
                    </Box>

                    <Box>
                        <FieldLabel>Password</FieldLabel>
                        <TextField
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            size="small"
                            required
                            placeholder="••••••••"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowPassword((v) => !v)}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            {showPassword
                                                ? <VisibilityOff sx={{ fontSize: 18, color: colors.muted }} />
                                                : <Visibility sx={{ fontSize: 18, color: colors.muted }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={fieldSx}
                        />
                    </Box>

                    <Box>
                        <FieldLabel>Confirm password</FieldLabel>
                        <TextField
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            fullWidth
                            size="small"
                            required
                            placeholder="••••••••"
                            error={passwordMismatch}
                            helperText={passwordMismatch ? 'Passwords do not match' : ''}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            edge="end"
                                            aria-label="toggle confirm password visibility"
                                        >
                                            {showConfirm
                                                ? <VisibilityOff sx={{ fontSize: 18, color: colors.muted }} />
                                                : <Visibility sx={{ fontSize: 18, color: colors.muted }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={fieldSx}
                        />
                    </Box>

                    {error && (
                        <Typography variant="body2" sx={{ color: 'error.main', fontSize: 13 }}>
                            {error}
                        </Typography>
                    )}
                    {success && (
                        <Typography variant="body2" sx={{ color: colors.green, fontSize: 13 }}>
                            Account created! Redirecting…
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isLoading || passwordMismatch}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            mt: 0.5,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: 15,
                            bgcolor: colors.primary,
                            boxShadow: '0 2px 12px rgba(0,102,255,0.25)',
                            '&:hover': {
                                bgcolor: '#0052CC',
                                boxShadow: '0 4px 18px rgba(0,102,255,0.35)',
                            },
                            '&:active': { transform: 'scale(0.99)' },
                        }}
                    >
                        {isLoading ? 'Creating account…' : 'Create account'}
                    </Button>

                    {/* Bottom link */}
                    <Typography
                        variant="body2"
                        sx={{ textAlign: 'center', mt: 0.5, color: colors.textSecondary, fontSize: 14 }}
                    >
                        Already have an account?{' '}
                        <Typography
                            component={RouterLink}
                            to="/login"
                            variant="body2"
                            sx={{
                                color: colors.primary,
                                fontWeight: 700,
                                fontSize: 14,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            Log in
                        </Typography>
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default Signup
