import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getCustomIcon, getBookmarkIconUrl, getCustomIconData } from '../utils/bookmarkUtils';
import { Paper, Typography, Box, Checkbox } from '@mui/material';
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
  CheckBox as SelectedIcon,
  CheckBoxOutlineBlank as UnselectedIcon
} from '@mui/icons-material';

// Predefined icon components with Material UI
const PREDEFINED_ICONS = {
  default: <DescriptionIcon color="primary" />,
  folder: <FolderIcon color="primary" />,
  star: <StarIcon style={{ color: '#FFD700' }} />,
  heart: <HeartIcon style={{ color: '#FF4081' }} />,
  work: <WorkIcon style={{ color: '#795548' }} />,
  home: <HomeIcon style={{ color: '#2196F3' }} />,
  important: <ImportantIcon style={{ color: '#FF5722' }} />,
  music: <MusicIcon style={{ color: '#9C27B0' }} />,
  shopping: <ShoppingIcon style={{ color: '#4CAF50' }} />,
  travel: <TravelIcon style={{ color: '#00BCD4' }} />,
  education: <EducationIcon style={{ color: '#3F51B5' }} />
};

const BookmarkItem = ({ 
  item, 
  onOpen, 
  onContextMenu, 
  position,
  isDesktopView, 
  onPositionChange,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelect,
  darkMode = false
}) => {
  const [customIcon, setCustomIcon] = useState(null);
  const [customIconData, setCustomIconData] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [itemPosition, setItemPosition] = useState(position || { x: 0, y: 0 });
  const isFolder = !item.url;
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'BOOKMARK_ITEM',
    item: () => ({ 
      id: item.id, 
      isFolder, 
      position: itemPosition,
      originalPosition: itemPosition
    }),
    canDrag: !isMultiSelectMode, // Disable dragging in multi-select mode
    end: (draggedItem, monitor) => {
      const dropResult = monitor.getDropResult();
      
      if (dropResult) {
        if (dropResult.desktop && isDesktopView) {
          // Update position on desktop view
          const newPosition = { 
            x: dropResult.x - monitor.getInitialClientOffset().x + draggedItem.originalPosition.x,
            y: dropResult.y - monitor.getInitialClientOffset().y + draggedItem.originalPosition.y
          };
          
          setItemPosition(newPosition);
          if (onPositionChange) {
            onPositionChange(item.id, newPosition);
          }
        }
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [item.id, itemPosition, isDesktopView, isMultiSelectMode]);

  useEffect(() => {
    const loadIconData = async () => {
      // Get custom icon type (from predefined list)
      const icon = await getCustomIcon(item.id);
      setCustomIcon(icon);
      
      // Get custom icon data (uploaded by user)
      const iconData = await getCustomIconData(item.id);
      setCustomIconData(iconData);
      
      // If it's a bookmark, also load the website favicon
      if (item.url) {
        const favicon = getBookmarkIconUrl(item.url);
        setFaviconUrl(favicon);
      }
    };
    
    loadIconData();
  }, [item.id, item.url]);

  useEffect(() => {
    if (position) {
      setItemPosition(position);
    }
  }, [position]);

  const getIconDisplay = () => {
    // If we have custom icon data (uploaded by user), show it
    if (customIconData) {
      return (
        <Box 
          component="img" 
          sx={{ 
            width: 32, 
            height: 32, 
            objectFit: 'contain'
          }} 
          src={customIconData} 
          alt={item.title} 
        />
      );
    }
    
    // If we have a predefined icon, show it
    if (customIcon && PREDEFINED_ICONS[customIcon]) {
      return PREDEFINED_ICONS[customIcon];
    }
    
    // For bookmarks, show website favicon
    if (!isFolder && faviconUrl) {
      return (
        <Box 
          component="img" 
          sx={{ 
            width: 32, 
            height: 32, 
            objectFit: 'contain'
          }} 
          src={faviconUrl} 
          alt={item.title} 
        />
      );
    }
    
    // Default icons
    return isFolder ? PREDEFINED_ICONS.folder : PREDEFINED_ICONS.default;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (isMultiSelectMode) {
      onToggleSelect(item);
    } else {
      onOpen(item);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, item);
  };

  return (
    <Paper
      ref={drag}
      elevation={2}
      sx={{
        width: 90,
        height: 90,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        cursor: isMultiSelectMode ? 'default' : 'pointer',
        opacity: isDragging ? 0.5 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: isMultiSelectMode ? 'none' : 'scale(1.05)',
          boxShadow: isMultiSelectMode ? 3 : 4
        },
        position: isDesktopView ? 'absolute' : 'relative',
        left: isDesktopView ? `${itemPosition.x}px` : 'auto',
        top: isDesktopView ? `${itemPosition.y}px` : 'auto',
        backgroundColor: isSelected 
          ? (darkMode ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)')
          : (isFolder 
            ? (darkMode ? '#333333' : '#f5f5f5') 
            : (darkMode ? '#2d2d2d' : '#fff')),
        border: isSelected ? `2px solid ${darkMode ? '#90caf9' : '#1976d2'}` : 'none',
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {isMultiSelectMode && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 4, 
            left: 4,
            zIndex: 2
          }}
        >
          <Checkbox
            size="small"
            checked={isSelected}
            onChange={() => onToggleSelect(item)}
            color="primary"
            icon={<UnselectedIcon fontSize="small" />}
            checkedIcon={<SelectedIcon fontSize="small" />}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      )}
      
      <Box sx={{ 
        fontSize: 36, 
        display: 'flex', 
        justifyContent: 'center', 
        mb: 1,
        height: 40
      }}>
        {getIconDisplay()}
      </Box>
      
      <Typography 
        variant="caption" 
        align="center" 
        noWrap 
        sx={{ 
          width: '100%',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit'
        }}
      >
        {item.title || (item.url ? new URL(item.url).hostname : 'Untitled')}
      </Typography>
    </Paper>
  );
};

export default BookmarkItem;