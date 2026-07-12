import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'

import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { useResetPassword } from '../../auth/useResetPassword'
import AppCard from '../../components/AppCard'
import { fieldLabelSx, finePrintSx } from '../../styles/recipes'
import { colors } from '../../styles/tokens'

const FieldLabel = ({ children }) => (
    <Typography
        variant="body2"
        sx={fieldLabelSx}
    >
        {children}
    </Typography>
)

const ResetPassword = () => {
    const { token } = useParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [clientError, setClientError] = useState(null)
    const { resetPassword, isLoading, error, success } = useResetPassword()

    // Validate client-only confirmation, then send URL token + new password to backend.
    const handleSubmit = async (e) => {
        e.preventDefault()
        setClientError(null)

        if (!token) {
            setClientError('The reset link is invalid.')
            return
        }

        if (password !== confirmPassword) {
            setClientError('Passwords do not match.')
            return
        }

        const didReset = await resetPassword(token, password)
        if (didReset) {
            setPassword('')
            setConfirmPassword('')
        }
    }

    // Small render helper for the two password fields; only the first gets visibility toggle.
    const passwordField = (label, value, setter, autocomplete) => (
        <Box>
            <FieldLabel>{label}</FieldLabel>
            <TextField
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(e) => setter(e.target.value)}
                fullWidth
                size="small"
                required
                autoComplete={autocomplete}
                placeholder="••••••••"
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <LockOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                            </InputAdornment>
                        ),
                        endAdornment: label === 'New password' ? (
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
                        ) : null,
                    },
                }}
            />
        </Box>
    )

    return (
        <Box>
            <AppCard
                sx={{
                    width: '100%',
                    maxWidth: 440,
                    mx: 'auto',
                    mb: 6,
                    height: 'auto',
                    border: 'none',
                }}
                contentSx={{
                    p: { xs: 4, sm: 6 },
                    '&:last-child': { pb: { xs: 4, sm: 6 } },
                }}
            >
                <Box
                    sx={{
                        textAlign: 'center',
                        pb: 3,
                        mb: 3,
                        borderBottom: `1px solid ${colors.border}`,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 900, color: colors.primary, mb: 1 }}
                    >
                        New Password
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                        Choose a strong password for your account.
                    </Typography>
                </Box>

                {success ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: colors.green, mb: 3 }}>
                            Password reset successful! You can now log in with your new password.
                        </Typography>
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
                            Go to login →
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        {passwordField('New password', password, setPassword, 'new-password')}
                        {passwordField('Confirm new password', confirmPassword, setConfirmPassword, 'new-password')}
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Use at least 4 characters, including a lowercase letter and a number.
                        </Typography>

                        {(clientError || error) && (
                            <Box>
                                <Typography variant="body2" sx={{ ...finePrintSx, color: 'error.main' }}>
                                    {clientError || error}
                                </Typography>
                                {error && error.includes('expired') && (
                                    <Typography variant="body2" sx={{ ...finePrintSx, mt: 0.5 }}>
                                        <Typography
                                            component={RouterLink}
                                            to="/forgot-password"
                                            variant="body2"
                                            sx={{
                                                ...finePrintSx,
                                                color: colors.primary,
                                                fontWeight: 700,
                                                textDecoration: 'none',
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                        >
                                            Request a new reset link
                                        </Typography>
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={isLoading}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ mt: 0.5 }}
                        >
                            {isLoading ? 'Saving…' : 'Set new password'}
                        </Button>

                        <Typography
                            variant="body2"
                            sx={{ textAlign: 'center', mt: 0.5, color: colors.textSecondary }}
                        >
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
                                ← Back to login
                            </Typography>
                        </Typography>
                    </Box>
                )}
            </AppCard>
        </Box>
    )
}

export default ResetPassword
