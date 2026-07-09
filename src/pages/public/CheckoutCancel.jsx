import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { colors } from '../../styles/tokens'

// Stripe redirects here when the user cancels the checkout.
// No charges were made. We offer them a way back.
export default function CheckoutCancel() {
    const navigate = useNavigate()

    return (
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
            <CancelOutlinedIcon sx={{ fontSize: 72, color: colors.muted, mb: 2 }} />

            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                Payment cancelled
            </Typography>

            <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                No charges were made. You can try again whenever you're ready.
            </Typography>

            <Typography variant="body2" sx={{ color: colors.muted, mb: 4 }}>
                If you already created an account, you can upgrade from your profile page at any time.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button variant="outlined" size="large" onClick={() => navigate('/')}>
                    Back to home
                </Button>
                <Button variant="contained" size="large" onClick={() => navigate('/#plans')}>
                    View plans
                </Button>
            </Stack>
        </Container>
    )
}
