import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, IconButton } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";

const drawerWidth = 240;

const AdminLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar />
      <List>
        <ListItemButton component={NavLink} to="/admin/sections" selected={location.pathname.startsWith('/admin/sections')}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Sections" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/admin/posts" selected={location.pathname.startsWith('/admin/posts')}>
          <ListItemIcon><ListAltIcon /></ListItemIcon>
          <ListItemText primary="Posts" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/admin/vlogs" selected={location.pathname.startsWith('/admin/vlogs')}>
          <ListItemIcon><OndemandVideoIcon /></ListItemIcon>
          <ListItemText primary="Vlogs" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/admin/settings" selected={location.pathname.startsWith('/admin/settings')}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="admin navigation">
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
