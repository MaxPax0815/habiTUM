import { NavLink, useNavigate } from 'react-router-dom'
// UI components
import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'

// ICONS 
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import { colors } from "../theme";
import { useLogout } from '../auth/useLogout'

const navItems = [
  { 
    label: "Today", 
    icon: <HomeOutlinedIcon />, 
    path: "/today" 
  },
  { 
    label: "Communities", 
    icon: <GroupsOutlinedIcon />, 
    path: "/communities" 
  },
  { 
    label: "Progress", 
    icon: <BarChartOutlinedIcon />, 
    path: "/progress" 
  },
];

// user als prop nutzbar, da const { user } = useAuthContext() in AppLayout.jsx 
const Sidebar = ({ user }) => {
  const { logout } = useLogout() 
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.email 
    ? user.email[0].toUpperCase()
    : "U";

  console.log("Sidebar user: ", user)

  // ternary opreator: checks if user.name exists
   /* const initials = user?.name */

  // erstellt einen String-Array aus dem Namen des Users, greift sich dann von dem Vor- u. Nachnamen jeweils den ersten Buchstaben
  // und joined diese zusammen, dabei werden max. zwei Buchstaben verwendet 
  /*   ? (() => {
      const nameParts = String(user.name)
        .trim()
        .split(" ")
        .filter(Boolean)

      const firstName = nameParts[0]
      const lastName = nameParts[nameParts.length - 1]

      if (nameParts.length === 1) {
        return firstName[0].toUpperCase()
      }

      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    })()
  : "U";*/

  return (
    <Box
      component="aside"
      sx={{
        width: 230,
        minHeight: "100vh",
        backgroundColor: colors.primaryDark,
        color: colors.surface,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <Box sx={{ px: 3, pt: 4, pb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="HabiTUM logo"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
            Habi
            <Box component="span" sx={{ color: colors.primary }}>
              TUM
            </Box>
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 1,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.35,
          }}
        >
          Turn goals into lasting routines.
        </Typography>
      </Box>

      <List sx={{ px: 1.5, py: 2 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            end={item.path === "/today"}
            sx={{
              mb: 1,
              borderRadius: 2,
              color: "rgba(255,255,255,0.65)",
              minHeight: 48,
              px: 1.5,

              "& .MuiListItemIcon-root": {
                color: "inherit",
                minWidth: 36,
              },

              "&.active": {
                backgroundColor: colors.primary,
                color: colors.surface,
                fontWeight: 800,
              },

              "&.active .MuiListItemText-primary": {
                fontWeight: 800,
              },

              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.10)",
              },

              "&.active:hover": {
                backgroundColor: colors.primary,
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />

      <Box sx={{ p: 1.5 }}>
        <Box
          component={NavLink}
          to="/profile"
          aria-label="Go to profile"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.10)",
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",

            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.15)",
            },

            "&.active": {
              backgroundColor: "rgba(255,255,255,0.15)",
            },
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: colors.primary,
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {initials}
          </Avatar>
        
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                color: colors.surface,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 120,
              }}
            >
              {user?.email || "User"}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 12 }} />
              {user?.plan || "Free"} 
            </Typography>           
          </Box>
        </Box>

        <Button
          fullWidth
          onClick={handleLogout}
          startIcon={<LogoutOutlinedIcon />}
          sx={{
            mt: 1,
            py: 1,
            borderRadius: 2,
            justifyContent: "center",
            color: "rgba(255,255,255,0.65)",
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.20)",
            fontWeight: 800,
            textTransform: "none",

            "&:hover": {
              color: "#F43F5E",
              backgroundColor: "rgba(244,63,94,0.08)",
              borderColor: "rgba(244,63,94,0.55)",
            },
          }}
        >
          Logout
        </Button>

      </Box>
    </Box>
  )
}

export default Sidebar