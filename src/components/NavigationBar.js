import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Breadcrumbs,
  Link,
  Box
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon
} from '@mui/icons-material';

const NavigationBar = ({ 
  breadcrumbs, 
  onNavigate, 
  canGoBack, 
  canGoForward, 
  onGoBack, 
  onGoForward, 
  onGoHome 
}) => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="back"
            onClick={onGoBack}
            disabled={!canGoBack}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton 
            color="inherit" 
            aria-label="forward"
            onClick={onGoForward}
            disabled={!canGoForward}
            sx={{ mr: 1 }}
          >
            <ArrowForwardIcon />
          </IconButton>
          <IconButton 
            color="inherit" 
            aria-label="home"
            onClick={onGoHome}
          >
            <HomeIcon />
          </IconButton>
        </Box>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ flexGrow: 1 }}>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography key={item.id} color="text.primary" fontWeight="bold">
                {item.title || 'Bookmarks Bar'}
              </Typography>
            ) : (
              <Link
                key={item.id}
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => onNavigate(item)}
              >
                {item.title || 'Bookmarks Bar'}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;