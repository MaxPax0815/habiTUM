import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
    Box,
    Button,
    Divider,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import GroupsIcon from '@mui/icons-material/Groups'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import AppCard from '../../components/AppCard'
import { colors } from '../../styles/tokens'
import { useAuthContext } from '../../auth/useAuthContext'

const FieldLabel = ({ children }) => (
    <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, mb: 0.5, textAlign: 'left' }}
    >
        {children}
    </Typography>
)

export default function ManagerSignup() {
    const navigate = useNavigate()
    const { dispatch } = useAuthContext()

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [institutionName, setInstitutionName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password

    // Creates a manager_pending account, stores its JWT, then sends the user to plan config.
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (passwordMismatch) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/user/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName, lastName, username, email, password,
                    plan: 'manager',
                    institutionName,
                })
            })
            const data = await response.json()

            if (!response.ok) {
                // Duplicate email can be an unfinished manager signup; login can resume it.
                if (data.error === 'The email is already in use.') {
                    setError('An account already exists for this email. Please log in to complete your manager subscription.')
                } else {
                    setError(data.error)
                }
                setIsLoading(false)
                return
            }

            // replace keeps the filled signup form out of browser history.
            localStorage.setItem('user', JSON.stringify(data))
            dispatch({ type: 'LOGIN', payload: data })
            navigate('/configure-manager-plan', { replace: true })
        } catch {
            setError('Something went wrong. Please try again.')
            setIsLoading(false)
        }
    }

    return (
        <AppCard
            sx={{
                width: '100%',
                maxWidth: 480,
                mx: 'auto',
                mb: 6,
                height: 'auto',
                border: 'none',
            }}
            contentSx={{
                p: { xs: 4, sm: 5 },
                '&:last-child': { pb: { xs: 4, sm: 5 } },
            }}
        >
            {/* Header */}
            <Box sx={{ textAlign: 'center', pb: 3, mb: 3, borderBottom: `1px solid ${colors.border}` }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: colors.primary, mb: 1 }}>
                    Create Manager Account
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    Step 1 of 2 — Set up your institution profile and account details.
                </Typography>
            </Box>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
                {/* Institution name */}
                <Box>
                    <FieldLabel>Institution / Brand name</FieldLabel>
                    <TextField
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        fullWidth size="small" required
                        placeholder="TU München Sports Club"
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BusinessOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>

                <Divider sx={{ my: 0.5 }}>
                    <Typography variant="caption" sx={{ color: colors.muted }}>Account details</Typography>
                </Divider>

                {/* Name row */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                        <FieldLabel>First name</FieldLabel>
                        <TextField
                            value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            fullWidth size="small" required placeholder="Tom"
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} /></InputAdornment> } }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <FieldLabel>Last name</FieldLabel>
                        <TextField
                            value={lastName} onChange={(e) => setLastName(e.target.value)}
                            fullWidth size="small" required placeholder="Müller"
                        />
                    </Box>
                </Box>

                {/* Username */}
                <Box>
                    <FieldLabel>Username</FieldLabel>
                    <TextField
                        value={username} onChange={(e) => setUsername(e.target.value)}
                        fullWidth size="small" required placeholder="tumSportsManager"
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><GroupsIcon sx={{ fontSize: 18, color: colors.muted }} /></InputAdornment> } }}
                    />
                </Box>

                {/* Email */}
                <Box>
                    <FieldLabel>Email address</FieldLabel>
                    <TextField
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        fullWidth size="small" required placeholder="manager@tum.de"
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} /></InputAdornment> } }}
                    />
                </Box>

                {/* Password */}
                <Box>
                    <FieldLabel>Password</FieldLabel>
                    <TextField
                        type={showPassword ? 'text' : 'password'}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        fullWidth size="small" required placeholder="••••••••"
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPassword(v => !v)} edge="end">
                                            {showPassword ? <VisibilityOff sx={{ fontSize: 18, color: colors.muted }} /> : <Visibility sx={{ fontSize: 18, color: colors.muted }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>

                {/* Confirm password */}
                <Box>
                    <FieldLabel>Confirm password</FieldLabel>
                    <TextField
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth size="small" required placeholder="••••••••"
                        error={passwordMismatch}
                        helperText={passwordMismatch ? 'Passwords do not match' : ''}
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowConfirm(v => !v)} edge="end">
                                            {showConfirm ? <VisibilityOff sx={{ fontSize: 18, color: colors.muted }} /> : <Visibility sx={{ fontSize: 18, color: colors.muted }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>

                {error && (
                    <Typography variant="body2" sx={{ color: 'error.main', fontSize: 13 }}>
                        {error}
                    </Typography>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isLoading || passwordMismatch}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ mt: 0.5 }}
                >
                    {isLoading ? 'Creating account…' : 'Continue — choose your plan'}
                </Button>

                <Typography variant="body2" sx={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>
                    Already have an account?{' '}
                    <Typography
                        component={RouterLink} to="/login" variant="body2"
                        sx={{ color: colors.primary, fontWeight: 700, fontSize: 14, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                        Log in
                    </Typography>
                </Typography>
            </Box>
        </AppCard>
    )
}
