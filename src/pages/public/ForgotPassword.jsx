import {
    Box,
    Button,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'

import { useForgotPassword } from '../../auth/useForgotPassword'
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

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const { forgotPassword, isLoading, error, success } = useForgotPassword()

    const handleSubmit = async (e) => {
        e.preventDefault()
        await forgotPassword(email)
    }

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
                        Forgot Password
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                        Enter your email and we'll send you a reset link.
                    </Typography>
                </Box>

                {success ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: colors.green, fontSize: 14, mb: 3 }}>
                            If that email is registered, a reset link has been sent. Check your inbox.
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
                            ← Back to login
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        <Box>
                            <FieldLabel>Email address</FieldLabel>
                            <TextField
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                size="small"
                                required
                                autoComplete="email"
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

                        {error && (
                            <Typography variant="body2" sx={{ color: 'error.main', fontSize: 13 }}>
                                {error}
                            </Typography>
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
                            {isLoading ? 'Sending…' : 'Send reset link'}
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

export default ForgotPassword
