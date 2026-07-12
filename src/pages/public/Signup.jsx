import {
    Box,
    Button,
    Chip,
    Divider,
    InputAdornment,
    TextField,
    Typography,
    IconButton,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import GroupsIcon from '@mui/icons-material/Groups'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { colors } from '../../styles/tokens'
import { fieldLabelSx, finePrintSx } from '../../styles/recipes'
import { useSignup } from '../../auth/useSignup'
import AppCard from '../../components/AppCard'

const FREE_BENEFITS = [
    'Track unlimited habits for free',
    'Join habit communities & challenges',
    'Visualise your progress over time',
]

const PREMIUM_BENEFITS = [
    'Everything in the Free plan',
    'Advanced progress analytics dashboard',
    'Coach insights & habit pulse score',
    'Priority streak recovery stats',
]

const FieldLabel = ({ children }) => (
    <Typography
        variant="body2"
        sx={fieldLabelSx}
    >
        {children}
    </Typography>
)

const Signup = () => {
    const [searchParams] = useSearchParams()
    // Read ?plan=premium from the URL; every other value stays on free signup.
    const plan = searchParams.get('plan') === 'premium' ? 'premium' : 'free'
    const isPremiumSignup = plan === 'premium'

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

    // Creates the account; premium gets a Stripe URL, free enters /today after success.
    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await signup(firstName, lastName, username, email, password, plan)
        if (result?.checkoutUrl) {
            window.location.href = result.checkoutUrl
        } else if (result) {
            setSuccess(true)
            setTimeout(() => navigate('/today'), 1000)
        }
    }

    const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password
    const benefits = isPremiumSignup ? PREMIUM_BENEFITS : FREE_BENEFITS

    return (
        <Box>
            {/* Card */}
            <AppCard
                sx={{
                    maxWidth: 480,
                    mx: 'auto',
                    mb: 6,
                    height: 'auto',
                    border: 'none',
                }}
                contentSx={{
                    p: { xs: 3, sm: 4 },
                    '&:last-child': { pb: { xs: 3, sm: 4 } },
                }}
            >
                <Box
                    sx={{
                        textAlign: "center",
                        pb: 3,
                        mb: 3,
                        borderBottom: `1px solid ${colors.border}`,
                    }}
                    >

                    {isPremiumSignup && (
                        <Chip
                            icon={<WorkspacePremiumOutlinedIcon sx={{ fontSize: 16 }} />}
                            label="Premium Plan"
                            sx={{
                                mb: 1.5,
                                bgcolor: colors.softBlue,
                                color: colors.primary,
                                fontWeight: 800,
                                border: `1px solid ${colors.primary}20`,
                            }}
                        />
                    )}

                    <Typography
                        variant="h4"
                        sx={{
                        fontWeight: 900,
                        color: isPremiumSignup ? colors.primary : colors.primaryDark,
                        mb: 1,
                        }}
                    >
                        {isPremiumSignup ? 'Create your Premium account' : 'Create your account'}
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                        color: colors.textSecondary,
                        lineHeight: 1.6,
                        }}
                    >
                        {isPremiumSignup
                            ? 'One step away from unlocking advanced analytics.'
                            : 'Start building better routines today.'}
                    </Typography>
                </Box>

                {/* Benefits */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    {benefits.map((text) => (
                        <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <CheckCircleOutlinedIcon sx={{ color: isPremiumSignup ? colors.primary : colors.green, fontSize: 18, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                {text}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {isPremiumSignup && (
                    <Box sx={{ bgcolor: colors.softBlue, borderRadius: 2, p: 1.5, mb: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 700 }}>
                            3.99 € / month — billed monthly via Stripe
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                            You'll be redirected to Stripe to complete payment after creating your account.
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ mb: 3 }} />

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
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
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
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <GroupsIcon sx={{ fontSize: 18, color: colors.muted }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
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
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
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
                            slotProps={{
                                input: {
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
                                },
                            }}
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
                            slotProps={{
                                input: {
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
                                },
                            }}
                        />
                    </Box>

                    {error && (
                        <Typography variant="body2" sx={{ ...finePrintSx, color: 'error.main' }}>
                            {error}
                        </Typography>
                    )}
                    {success && (
                        <Typography variant="body2" sx={{ ...finePrintSx, color: colors.green }}>
                            Account created! Redirecting…
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
                        {isLoading
                            ? (isPremiumSignup ? 'Setting up…' : 'Creating account…')
                            : (isPremiumSignup ? 'Continue to payment' : 'Create account')}
                    </Button>

                    {/* Bottom link */}
                    <Typography
                        variant="body2"
                        sx={{ textAlign: 'center', mt: 0.5, color: colors.textSecondary }}
                    >
                        Already have an account?{' '}
                        <Typography
                            component={RouterLink}
                            to="/login"
                            variant="body2"
                            sx={{
                                color: colors.primary,
                                fontWeight: 700,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            Log in
                        </Typography>
                    </Typography>
                </Box>
            </AppCard>
        </Box>
    )
}

export default Signup
