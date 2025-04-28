import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CreateNewFolder as CreateFolderIcon,
  Refresh as RefreshIcon,
  SelectAll as SelectIcon,
  Delete as DeleteIcon,
  ContentCut as CutIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  FormatSize as SizeIcon,
  Apps as OrganizeIcon,
  Save as SaveIcon,
  Close as CancelIcon
} from '@mui/icons-material';

const Toolbar = ({
  onCreateFolder,
  onRefresh,
  isMultiSelectMode,
  onToggleMultiSelect,
  selectedCount,
  onDeleteSelected,
  onCutSelected,
  onCopySelected,
  onPaste,
  darkMode,
  iconSize = 'medium',
  onIconSizeChange,
  isOrganizeMode = false,
  onToggleOrganizeMode,
  onSaveOrganizedItems
}) => {
  const [sizeMenu, setSizeMenu] = React.useState(null);

  const handleSizeMenuOpen = (event) => {
    setSizeMenu(event.currentTarget);
  };

  const handleSizeMenuClose = () => {
    setSizeMenu(null);
  };

  const handleSizeSelect = (size) => {
    if (onIconSizeChange) {
      onIconSizeChange(size);
    }
    handleSizeMenuClose();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: 1,
        borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`
      }}
    >
      <Tooltip title="Create New Folder">
        <IconButton onClick={onCreateFolder} size="medium">
          <CreateFolderIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Refresh">
        <IconButton onClick={onRefresh} size="medium">
          <RefreshIcon />
        </IconButton>
      </Tooltip>
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      <Tooltip title="Change Icon Size">
        <IconButton onClick={handleSizeMenuOpen} size="medium">
          <SizeIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={sizeMenu}
        open={Boolean(sizeMenu)}
        onClose={handleSizeMenuClose}
      >
        <MenuItem 
          onClick={() => handleSizeSelect('small')}
          selected={iconSize === 'small'}
        >
          <ListItemText primary="Small" />
        </MenuItem>
        <MenuItem 
          onClick={() => handleSizeSelect('medium')}
          selected={iconSize === 'medium'}
        >
          <ListItemText primary="Medium" />
        </MenuItem>
        <MenuItem 
          onClick={() => handleSizeSelect('large')}
          selected={iconSize === 'large'}
        >
          <ListItemText primary="Large" />
        </MenuItem>
      </Menu>

      {/* Organize Mode Controls */}
      <Tooltip title={isOrganizeMode ? "Exit Organize Mode" : "Enter Organize Mode"}>
        <IconButton 
          onClick={onToggleOrganizeMode} 
          color={isOrganizeMode ? "primary" : "default"}
          size="medium"
        >
          <OrganizeIcon />
        </IconButton>
      </Tooltip>
      
      {isOrganizeMode && (
        <>
          <Tooltip title="Save Order">
            <IconButton 
              onClick={onSaveOrganizedItems}
              color="success"
              size="medium"
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Cancel Changes">
            <IconButton 
              onClick={onToggleOrganizeMode}
              color="error"
              size="medium"
            >
              <CancelIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      <Tooltip title="Cut">
        <span>
          <IconButton 
            onClick={onCutSelected}
            disabled={!isMultiSelectMode || selectedCount === 0}
            size="medium"
          >
            <CutIcon />
          </IconButton>
        </span>
      </Tooltip>
      
      <Tooltip title="Copy">
        <span>
          <IconButton 
            onClick={onCopySelected}
            disabled={!isMultiSelectMode || selectedCount === 0}
            size="medium"
          >
            <CopyIcon />
          </IconButton>
        </span>
      </Tooltip>
      
      <Tooltip title="Paste">
        <IconButton 
          onClick={onPaste}
          size="medium"
        >
          <PasteIcon />
        </IconButton>
      </Tooltip>
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      <Tooltip title={isMultiSelectMode ? "Exit Selection Mode" : "Enter Selection Mode"}>
        <IconButton 
          onClick={onToggleMultiSelect} 
          size="medium"
          color={isMultiSelectMode ? "primary" : "default"}
          disabled={isOrganizeMode} // Disable if in organize mode
        >
          <SelectIcon />
        </IconButton>
      </Tooltip>
      
      {isMultiSelectMode && (
        <>
          <Tooltip title="Delete Selected Items">
            <IconButton 
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              size="medium"
              color="error"
              sx={{ ml: 1 }}
            >
              <Badge 
                badgeContent={selectedCount} 
                color="error"
                invisible={selectedCount === 0}
              >
                <DeleteIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </>
      )}
      
      {/* Spacer to push any additional controls to the right */}
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Visual indicator for active mode */}
      {(isMultiSelectMode || isOrganizeMode) && (
        <Box 
          sx={{ 
            bgcolor: isMultiSelectMode ? 'primary.main' : 'success.main',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.875rem'
          }}
        >
          {isMultiSelectMode ? 'Selection Mode' : 'Organize Mode'}
        </Box>
      )}
    </Box>
  );
};

export default Toolbar;