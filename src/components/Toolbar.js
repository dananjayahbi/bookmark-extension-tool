import React from 'react';
import { Button, Paper, Box } from '@mui/material';
import { 
  CreateNewFolder as CreateNewFolderIcon,
  Refresh as RefreshIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon
} from '@mui/icons-material';

const Toolbar = ({ onCreateFolder, onRefresh, isDesktopView, onToggleView }) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 1.5, 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        gap: 1
      }}
    >
      <Button
        variant="contained"
        color="primary"
        startIcon={<CreateNewFolderIcon />}
        onClick={onCreateFolder}
        size="small"
      >
        New Folder
      </Button>
      
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        size="small"
      >
        Refresh
      </Button>

      <Box sx={{ flexGrow: 1 }} />
      
      <Button
        variant="outlined"
        startIcon={isDesktopView ? <ViewModuleIcon /> : <ViewComfyIcon />}
        onClick={onToggleView}
        size="small"
      >
        {isDesktopView ? 'Grid View' : 'Desktop View'}
      </Button>
    </Paper>
  );
};

export default Toolbar;