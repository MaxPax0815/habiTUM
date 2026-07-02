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
import { colors } from '../../theme'

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
}

const ResetPassword = () => {
    const { token } = useParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [clientError, setClientError] = useState(null)
    const { resetPassword, isLoading, error, success } = useResetPassword()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setClientError(null)

        if (password !== confirmPassword) {
            setClientError('Passwords do not match.')
            return
        }

        await resetPassword(token, password)
    }

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
                InputProps={{
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
                }}
                sx={fieldSx}
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
                        <Typography variant="body2" sx={{ color: colors.green, fontSize: 14, mb: 3 }}>
                            Password reset successful! You can now log in with your new password.
                        </Typography>
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

                        {(clientError || error) && (
                            <Box>
                                <Typography variant="body2" sx={{ color: 'error.main', fontSize: 13 }}>
                                    {clientError || error}
                                </Typography>
                                {error && error.includes('expired') && (
                                    <Typography variant="body2" sx={{ fontSize: 13, mt: 0.5 }}>
                                        <Typography
                                            component={RouterLink}
                                            to="/forgot-password"
                                            variant="body2"
                                            sx={{
                                                color: colors.primary,
                                                fontWeight: 700,
                                                fontSize: 13,
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
                            fullWidth
                            disabled={isLoading}
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
                            {isLoading ? 'Saving…' : 'Set new password'}
                        </Button>

                        <Typography
                            variant="body2"
                            sx={{ textAlign: 'center', mt: 0.5, color: colors.textSecondary, fontSize: 14 }}
                        >
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
