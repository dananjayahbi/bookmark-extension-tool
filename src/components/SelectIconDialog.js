import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  Favorite as HeartIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Warning as ImportantIcon,
  MusicNote as MusicIcon,
  ShoppingCart as ShoppingIcon,
  Flight as TravelIcon,
  School as EducationIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { getBookmarkIconUrl } from '../utils/bookmarkUtils';

// Predefined icon components
const PREDEFINED_ICONS = {
  default: { icon: <DescriptionIcon color="primary" />, label: 'Default' },
  folder: { icon: <FolderIcon color="primary" />, label: 'Folder' },
  star: { icon: <StarIcon style={{ color: '#FFD700' }} />, label: 'Star' },
  heart: { icon: <HeartIcon style={{ color: '#FF4081' }} />, label: 'Heart' },
  work: { icon: <WorkIcon style={{ color: '#795548' }} />, label: 'Work' },
  home: { icon: <HomeIcon style={{ color: '#2196F3' }} />, label: 'Home' },
  important: { icon: <ImportantIcon style={{ color: '#FF5722' }} />, label: 'Important' },
  music: { icon: <MusicIcon style={{ color: '#9C27B0' }} />, label: 'Music' },
  shopping: { icon: <ShoppingIcon style={{ color: '#4CAF50' }} />, label: 'Shopping' },
  travel: { icon: <TravelIcon style={{ color: '#00BCD4' }} />, label: 'Travel' },
  education: { icon: <EducationIcon style={{ color: '#3F51B5' }} />, label: 'Education' }
};

const SelectIconDialog = ({ open, item, onClose, onSelectIcon }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState('');
  const [customIconData, setCustomIconData] = useState(null);
  const [customIconPreview, setCustomIconPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const isFolder = item && !item.url;
  const websiteFaviconUrl = item && item.url ? getBookmarkIconUrl(item.url) : null;
  
  // Handle tab changes
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    // Reset selections when changing tabs
    setSelectedIcon('');
    setCustomIconData(null);
    setCustomIconPreview(null);
  };

  // Handle predefined icon selection
  const handleSelectPredefined = (iconKey) => {
    setSelectedIcon(iconKey);
    setCustomIconData(null);
    setCustomIconPreview(null);
  };

  // Handle file input change for custom icon
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomIconData(event.target.result);
      setCustomIconPreview(event.target.result);
      setSelectedIcon('');
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Handle applying the selected icon
  const handleApply = () => {
    if (customIconData) {
      onSelectIcon(item, null, customIconData);
    } else if (selectedIcon) {
      onSelectIcon(item, selectedIcon, null);
    } else {
      onClose();
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setSelectedIcon('');
    setCustomIconData(null);
    setCustomIconPreview(null);
    setTabValue(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md">
      <DialogTitle>
        Select Icon for {isFolder ? 'Folder' : 'Bookmark'}: {item?.title}
      </DialogTitle>
      
      <Tabs
        value={tabValue}
        onChange={handleChangeTab}
        centered
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Predefined Icons" />
        <Tab label="Custom Icon" />
        {!isFolder && <Tab label="Website Favicon" disabled={!websiteFaviconUrl} />}
      </Tabs>
      
      <DialogContent sx={{ width: 500, maxHeight: 400 }}>
        {/* Predefined Icons Tab */}
        {tabValue === 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(PREDEFINED_ICONS).map(([key, { icon, label }]) => (
              <Grid item xs={3} key={key}>
                <Tooltip title={label}>
                  <Paper 
                    elevation={selectedIcon === key ? 4 : 1}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: selectedIcon === key ? '2px solid #2196F3' : '2px solid transparent',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                    onClick={() => handleSelectPredefined(key)}
                  >
                    <Box sx={{ fontSize: 36, mb: 1 }}>{icon}</Box>
                    <Typography variant="caption">{label}</Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Custom Icon Upload Tab */}
        {tabValue === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileInputChange}
            />
            
            {!customIconPreview ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  p: 4,
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  cursor: 'pointer',
                  width: '100%',
                  '&:hover': {
                    borderColor: '#2196F3'
                  }
                }}
                onClick={handleUploadClick}
              >
                <UploadIcon fontSize="large" sx={{ mb: 2, color: 'text.secondary' }} />
                <Typography variant="body1" gutterBottom>
                  Click to upload a custom icon
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports PNG, JPG, SVG (max 64KB)
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 120,
                    height: 120,
                    m: 'auto',
                    mb: 2,
                    border: '1px solid #ddd',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5'
                  }}
                >
                  <img 
                    src={customIconPreview} 
                    alt="Custom icon preview" 
                    style={{ maxWidth: '100%', maxHeight: '100%' }} 
                  />
                </Box>
                <Typography variant="body2" gutterBottom>
                  Custom icon preview
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleUploadClick} 
                  sx={{ mt: 1 }}
                >
                  Choose a different icon
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* Website Favicon Tab */}
        {tabValue === 2 && !isFolder && websiteFaviconUrl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <Box 
              sx={{ 
                width: 120,
                height: 120,
                m: 'auto',
                mb: 2,
                border: '1px solid #ddd',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5'
              }}
            >
              <img 
                src={websiteFaviconUrl} 
                alt="Website favicon" 
                style={{ maxWidth: '100%', maxHeight: '100%' }} 
              />
            </Box>
            <Typography variant="body2" gutterBottom>
              This is the favicon for {item?.url ? new URL(item.url).hostname : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Favicons are automatically used by default for bookmarks
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleApply} 
          variant="contained" 
          color="primary"
          disabled={!selectedIcon && !customIconData && tabValue !== 2}
        >
          {tabValue === 2 ? 'Use Website Favicon' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectIconDialog;