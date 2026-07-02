import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { useLogin } from '../../auth/useLogin'
import AppCard from '../../components/AppCard'
import { colors } from '../../styles/tokens'

const FieldLabel = ({ children }) => (
    <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, mb: 0.5, textAlign: 'left' }}
    >
        {children}
    </Typography>
)

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const { login, error, isLoading } = useLogin()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const ok = await login(email, password)
        if (ok) {
            setSuccess(true)
            // Manager redirects to manager dashboard, regular users to today's habits page
            // setTimeout(() => navigate(user.role === 'manager' ? '/manager-dashboard' : '/today'), 1000)
            setTimeout(() => navigate('/today'), 1000)
        }
    }

    return (
        <Box> 

            {/* Card */}
            <AppCard
                sx={{
                    width: "100%",
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
                        textAlign: "center",
                        pb: 3,
                        mb: 3,
                        borderBottom: `1px solid ${colors.border}`,
                    }}
                    >
                    <Typography
                        variant="h4"
                        sx={{
                        fontWeight: 900,
                        color: colors.primary,
                        mb: 1,
                        }}
                    >
                        Welcome Back
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                        color: colors.textSecondary,
                        lineHeight: 1.6,
                        }}
                    >
                        Continue building your habits. 
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

                    <Box>
                        <FieldLabel>Password</FieldLabel>
                        <TextField
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            size="small"
                            required
                            autoComplete="current-password"
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

                    {error && (
                        <Typography variant="body2" sx={{ color: 'error.main', fontSize: 13 }}>
                            {error}
                        </Typography>
                    )}
                    {success && (
                        <Typography variant="body2" sx={{ color: colors.green, fontSize: 13 }}>
                            Login successful! Redirecting…
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={isLoading}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            mt: 0.5,
                        }}
                    >
                        {isLoading ? 'Logging in…' : 'Log in'}
                    </Button>

                    {/* Bottom link */}
                    <Typography
                        variant="body2"
                        sx={{ textAlign: 'center', mt: 0.5, color: colors.textSecondary, fontSize: 14 }}
                    >
                        Don't have an account?{' '}
                        <Typography
                            component={RouterLink}
                            to="/signup"
                            variant="body2"
                            sx={{
                                color: colors.primary,
                                fontWeight: 700,
                                fontSize: 14,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            Sign up
                        </Typography>
                    </Typography>
                </Box>
            </AppCard>
        </Box>
    )
}

export default Login
