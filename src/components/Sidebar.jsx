import { NavLink } from 'react-router-dom'

// UI components
import {
  // runder Profil-Kreis
  Avatar,
  // flexibler container
  Box,
  // Trennlinie
  Divider,
  // Lister für Navigation
  List,
  // klickbarer Listeneintrag
  ListItemButton,
  // Breich für Icon 
  ListItemIcon,
  // Breich für Text
  ListItemText,
  // Text-Komponente
  Typography,
} from '@mui/material'

// ICONS 
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import { colors } from "../theme";


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

const Sidebar = ({ user }) => {
  // ternary opreator: checks if user.name exists
  const initials = user?.name 
  // erstellt einen String-Array aus dem Namen des Users, greift sich dann von dem Vor- u. Nachnamen jeweils den ersten Buchstaben
  // und joined diese zusammen, dabei werden max. zwei Buchstaben verwendet 
    ? user.name
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

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
              width: 28,
              height: 28,
              borderRadius: 1,
              backgroundColor: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ▰
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
            color: "rgba(255,255,255,0.35)",
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
              color: "rgba(255,255,255,0.45)",
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
                backgroundColor: "rgba(255,255,255,0.08)",
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

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

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
            backgroundColor: "rgba(255,255,255,0.06)",
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",

            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.10)",
            },

            "&.active": {
              backgroundColor: "rgba(255,255,255,0.12)",
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
              }}
            >
              {user?.name || "User"}
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
              {user?.plan || "Free"} · {user?.role || "Member"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Sidebar