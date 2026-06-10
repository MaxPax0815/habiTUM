import { NavLink } from 'react-router-dom'
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'

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
  const initials = user?.name 
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .join("")
        .slice(0, 2)
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
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.06)",
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