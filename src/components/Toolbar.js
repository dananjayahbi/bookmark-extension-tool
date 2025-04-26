import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import {
  CreateNewFolder as CreateFolderIcon,
  Refresh as RefreshIcon,
  ViewModule as GridViewIcon,
  ViewQuilt as DesktopViewIcon,
  SelectAll as SelectIcon,
  Delete as DeleteIcon,
  ContentCut as CutIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';

const Toolbar = ({
  onCreateFolder,
  onRefresh,
  isDesktopView,
  onToggleView,
  isMultiSelectMode,
  onToggleMultiSelect,
  selectedCount,
  onDeleteSelected,
  onCutSelected,
  onCopySelected,
  onPaste,
  darkMode
}) => {
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
      
      <Tooltip title={isDesktopView ? "Switch to Grid View" : "Switch to Desktop View"}>
        <IconButton onClick={onToggleView} size="medium">
          {isDesktopView ? <GridViewIcon /> : <DesktopViewIcon />}
        </IconButton>
      </Tooltip>
      
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
    </Box>
  );
};

export default Toolbar;