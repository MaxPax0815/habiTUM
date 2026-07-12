import { useState } from 'react'
import {
    Box,
    Button,
    Divider,
    Link,
    Slider,
    Stack,
    Typography,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import GroupsIcon from '@mui/icons-material/Groups'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'

import { useAuthContext } from '../../auth/useAuthContext'
import { useCancelManagerSignup } from '../../auth/useCancelManagerSignup'
import { useBilling } from '../../billing/useBillings'
import AppCard from '../../components/AppCard'
import { finePrintSx } from '../../styles/recipes'
import { colors, radii } from '../../styles/tokens'

// Pricing mirror for the pending-manager checkout UI; backend config is final source.
const MANAGER_BASE_EUR = 50
const COMMUNITY_PRICE_EUR = 5
const BASE_COMMUNITIES = 1
const MAX_ADDITIONAL_COMMUNITIES = 15

const PlanFeature = ({ icon, text }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {icon}
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>{text}</Typography>
    </Box>
)

export default function ConfigureManagerPlan() {
    const { user } = useAuthContext()
    const { cancelManagerSignup, isCancelling, error: cancelError } = useCancelManagerSignup()
    const { createManagerCheckoutSession, isLoading, error } = useBilling()

    const [numAdditional, setNumAdditional] = useState(0)

    const totalCommunities = BASE_COMMUNITIES + numAdditional
    const totalEur = MANAGER_BASE_EUR + numAdditional * COMMUNITY_PRICE_EUR

    // Starts a fresh Stripe Checkout for the chosen community count.
    const handleSubmit = async () => {
        try {
            const url = await createManagerCheckoutSession(numAdditional)
            window.location.href = url
        } catch {
            // useBilling exposes the error for rendering below.
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
                    Configure Your Plan
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    Step 2 of 2 — Choose how many communities you need
                    {user?.institutionName ? ` for ${user.institutionName}` : ''}, then continue to payment.
                </Typography>
            </Box>

            <Stack spacing={3}>
                {/* Base fee */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>Base fee</Typography>
                        <Typography variant="caption" sx={{ color: colors.muted }}>
                            Includes 1 community + unlimited challenges
                        </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, flexShrink: 0, ml: 2 }}>{MANAGER_BASE_EUR} €</Typography>
                </Box>

                {/* Slider */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <GroupsIcon sx={{ fontSize: 16, color: colors.muted }} />
                            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                Additional communities
                            </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700 }}>
                            {numAdditional} × {COMMUNITY_PRICE_EUR} € = {numAdditional * COMMUNITY_PRICE_EUR} €
                        </Typography>
                    </Box>
                    <Slider
                        value={numAdditional}
                        onChange={(_, v) => setNumAdditional(v)}
                        min={0}
                        max={MAX_ADDITIONAL_COMMUNITIES}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        size="small"
                    />
                    <Typography variant="caption" sx={{ color: colors.muted }}>
                        1 community included in base · {COMMUNITY_PRICE_EUR} € each additional · max {MAX_ADDITIONAL_COMMUNITIES} additional
                    </Typography>
                </Box>

                {/* Features */}
                <Stack spacing={1}>
                    <PlanFeature
                        icon={<CheckCircleOutlinedIcon sx={{ color: colors.primary, fontSize: 16, mt: '2px', flexShrink: 0 }} />}
                        text={`${totalCommunities} communit${totalCommunities === 1 ? 'y' : 'ies'} total (${BASE_COMMUNITIES} base + ${numAdditional} additional)`}
                    />
                    <PlanFeature
                        icon={<EmojiEventsOutlinedIcon sx={{ color: colors.primary, fontSize: 16, mt: '2px', flexShrink: 0 }} />}
                        text="Unlimited challenges in each community"
                    />
                </Stack>

                <Divider />

                {/* Total */}
                <Box sx={{ bgcolor: colors.softBlue, borderRadius: radii.small, p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                        Total per month
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: colors.primary }}>
                        {totalEur} €
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.muted }}>
                        {MANAGER_BASE_EUR} € base + {numAdditional}×{COMMUNITY_PRICE_EUR} € additional
                    </Typography>
                </Box>

                {error && (
                    <Typography variant="body2" sx={{ ...finePrintSx, color: 'error.main', textAlign: 'center' }}>
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={isLoading}
                    endIcon={<ArrowForwardIcon />}
                >
                    {isLoading ? 'Preparing checkout…' : `Continue to payment — ${totalEur} €/month`}
                </Button>

                <Typography variant="caption" sx={{ color: colors.muted, display: 'block', textAlign: 'center' }}>
                    You'll be redirected to Stripe to pay securely. Cancelling brings you back here.
                    You can change your community count anytime from your profile.
                </Typography>

                {cancelError && (
                    <Typography variant="body2" sx={{ ...finePrintSx, color: 'error.main', textAlign: 'center' }}>
                        {cancelError}
                    </Typography>
                )}

                {/* Pending managers cannot enter the app; cancel deletes the pending account. */}
                <Typography variant="body2" sx={{ ...finePrintSx, textAlign: 'center', color: colors.textSecondary }}>
                    Changed your mind?{' '}
                    <Link
                        component="button"
                        type="button"
                        onClick={cancelManagerSignup}
                        disabled={isCancelling}
                        sx={{ typography: 'finePrint', color: 'error.main', fontWeight: 700, verticalAlign: 'baseline' }}
                    >
                        {isCancelling ? 'Cancelling…' : 'Cancel manager signup'}
                    </Link>
                    {' '}— this deletes your pending account.
                </Typography>
            </Stack>
        </AppCard>
    )
}
