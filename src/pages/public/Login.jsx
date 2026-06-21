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
import Header from '../../components/Header'


import { useLogin } from '../../auth/useLogin'
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
    '& .MuiInputLabel-root.Mui-focused': { color: colors.primary },
}
>>>>>>> dev

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
            setTimeout(() => navigate(user.role === 'manager' ? '/manager-dashboard' : '/today'), 1000)
        }
    }

    return (
    <Box> 
        <Header />

            <label>Email:</label>
            <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}

            {/* Card */}
            <Box
                sx={{
                    maxWidth: 440,
                    mx: 'auto',
                    mb: 6,
                    bgcolor: colors.surface,
                    borderRadius: 3,
                    boxShadow: '0 4px 32px rgba(7,29,53,0.08)',
                    p: { xs: 3, sm: 4 },
                }}
            >
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
            </Box>
        </Box>
    )
}

export default Login
