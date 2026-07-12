import {
    Box,
    Button,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'

import { useForgotPassword } from '../../auth/useForgotPassword'
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

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const { forgotPassword, isLoading, error } = useForgotPassword()

    // Request reset; navigate only when backend returns a demo token for an existing account.
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(false)
        const result = await forgotPassword(email)

        if (result?.resetToken) {
            navigate(`/reset-password/${encodeURIComponent(result.resetToken)}`, { replace: true })
        } else if (result) {
            setSubmitted(true)
        }
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
                        Enter your email to continue to the password reset form.
                    </Typography>
                </Box>

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

                    {error && (
                        <Typography variant="body2" sx={{ ...finePrintSx, color: 'error.main' }}>
                            {error}
                        </Typography>
                    )}

                    {submitted && !error && (
                        <Typography variant="body2" sx={{ ...finePrintSx, color: colors.textSecondary }}>
                            If an account exists for this email, the password reset has been prepared.
                        </Typography>
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
                        {isLoading ? 'Checking…' : 'Continue'}
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
            </AppCard>
        </Box>
    )
}

export default ForgotPassword
