import { NavLink, useLocation } from 'react-router-dom'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'

import { colors } from '../styles/tokens'

const navItems = [
  { label: 'Today', path: '/today', icon: <HomeOutlinedIcon /> },
  { label: 'Communities', path: '/communities', icon: <GroupsOutlinedIcon /> },
  { label: 'Progress', path: '/progress', icon: <BarChartOutlinedIcon /> },
  { label: 'Profile', path: '/profile', icon: <AccountCircleOutlinedIcon /> },
]

// Community detail and challenge pages belong to the Communities section.
const getActiveSection = (pathname) => {
  if (pathname.startsWith('/communities') || pathname.startsWith('/challenges')) {
    return '/communities'
  }

  return navItems.find(({ path }) => pathname.startsWith(path))?.path || false
}

const MobileNav = () => {
  const { pathname } = useLocation()

  return (
    <Paper
      component="nav"
      aria-label="Main navigation"
      square
      sx={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        border: 0,
        borderTop: `1px solid ${colors.border}`,
        borderRadius: 0,
        backgroundColor: colors.surface,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={getActiveSection(pathname)}
        showLabels
        sx={{
          height: 64,
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            color: colors.textSecondary,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 700,
          },
          '& .Mui-selected': {
            color: colors.primary,
          },
          '& .Mui-selected .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 900,
          },
        }}
      >
        {navItems.map(({ icon, label, path }) => (
          <BottomNavigationAction
            key={path}
            component={NavLink}
            to={path}
            value={path}
            label={label}
            icon={icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}

export default MobileNav
