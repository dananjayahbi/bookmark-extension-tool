import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Box,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Home as HomeIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';

const NavigationBar = ({
  breadcrumbs,
  onNavigate,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onGoHome,
  darkMode,
  onToggleDarkMode
}) => {
  // Handle breadcrumb click
  const handleBreadcrumbClick = (event, folder) => {
    event.preventDefault();
    if (folder) {
      onNavigate(folder);
    }
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="back"
          onClick={onGoBack}
          disabled={!canGoBack}
          sx={{ mr: 1 }}
        >
          <BackIcon />
        </IconButton>
        
        <IconButton
          color="inherit"
          aria-label="forward"
          onClick={onGoForward}
          disabled={!canGoForward}
          sx={{ mr: 1 }}
        >
          <ForwardIcon />
        </IconButton>
        
        <IconButton
          color="inherit"
          aria-label="home"
          onClick={onGoHome}
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>
        
        <Breadcrumbs
          aria-label="breadcrumb"
          separator="›"
          sx={{
            color: 'white',
            flexGrow: 1,
            '& .MuiBreadcrumbs-separator': {
              color: 'rgba(255,255,255,0.7)',
              mx: 0.5
            }
          }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography key={crumb.id} color="inherit" variant="subtitle1">
                {crumb.title}
              </Typography>
            ) : (
              <Link
                key={crumb.id}
                component="button"
                variant="subtitle1"
                color="inherit"
                underline="hover"
                onClick={(e) => handleBreadcrumbClick(e, crumb)}
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  '&:hover': {
                    color: 'white'
                  }
                }}
              >
                {crumb.title}
              </Link>
            );
          })}
        </Breadcrumbs>
        
        <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <IconButton 
            color="inherit" 
            onClick={onToggleDarkMode}
            edge="end"
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;