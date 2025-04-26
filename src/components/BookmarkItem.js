import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getCustomIcon, getBookmarkIconUrl, getCustomIconData } from '../utils/bookmarkUtils';
import { Paper, Typography, Box, Checkbox, Badge } from '@mui/material';
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
  darkMode = false,
  gridDimensions,
  onDropInFolder
}) => {
  const [customIcon, setCustomIcon] = useState(null);
  const [customIconData, setCustomIconData] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [itemPosition, setItemPosition] = useState(position || { x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const isFolder = !item.url;
  const itemRef = useRef(null);
  
  // For dragging individual items
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'BOOKMARK_ITEM',
    item: () => {
      if (isSelected && onDropInFolder) {
        // If this is part of a multi-selection, use special handler
        // Get all selected item IDs from the parent component
        return {
          type: 'MULTI_BOOKMARK_ITEMS',
          id: item.id, // Keep individual ID for compatibility
          isFolder,
          position: itemPosition,
          originalPosition: itemPosition
        };
      }
      return { 
        id: item.id, 
        isFolder, 
        position: itemPosition,
        originalPosition: itemPosition
      };
    },
    canDrag: !isMultiSelectMode || isSelected, // Can drag in multi-select mode only if selected
    end: (draggedItem, monitor) => {
      const dropResult = monitor.getDropResult();
      
      if (dropResult) {
        if (dropResult.folderId && onDropInFolder) {
          // Item was dropped into a folder
          if (isSelected && isMultiSelectMode) {
            // This is a multi-selection drop, let the parent component handle it
            window.postMessage({
              type: 'MULTI_ITEM_DROP',
              targetFolderId: dropResult.folderId
            }, '*');
          } else {
            // Single item drop
            onDropInFolder([draggedItem.id], dropResult.folderId);
          }
        }
        else if (dropResult.desktop && isDesktopView) {
          // Calculate new position for desktop view
          if (dropResult.multiple) {
            // Part of multi-drop (handled by parent component)
            return;
          }
          
          // Individual item position update
          const deltaX = dropResult.x - monitor.getInitialClientOffset().x;
          const deltaY = dropResult.y - monitor.getInitialClientOffset().y;
          
          const newPosition = { 
            x: Math.max(0, itemPosition.x + deltaX),
            y: Math.max(0, itemPosition.y + deltaY)
          };
          
          // Make sure item doesn't go out of bounds
          const dimensions = gridDimensions?.();
          if (dimensions) {
            if (newPosition.x > dimensions.width - 100) {
              newPosition.x = dimensions.width - 100;
            }
            if (newPosition.y > dimensions.height - 100) {
              newPosition.y = dimensions.height - 100;
            }
          }
          
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
  }), [item.id, itemPosition, isDesktopView, isMultiSelectMode, isSelected, onDropInFolder]);

  // For dropping items into folders
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['BOOKMARK_ITEM', 'MULTI_BOOKMARK_ITEMS'],
    canDrop: (droppedItem) => {
      // Only allow dropping into folders, not into items
      return isFolder && droppedItem.id !== item.id;
    },
    drop: (droppedItem) => {
      if (isFolder) {
        if (droppedItem.type === 'MULTI_BOOKMARK_ITEMS') {
          // Multiple items being dropped into this folder
          return { 
            folderId: item.id,
            multiple: true
          };
        } else {
          // Single item dropped into this folder
          return { folderId: item.id };
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  }), [isFolder, item.id]);

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

  // Combine the drag and drop refs for folder items
  const itemDragRef = (el) => {
    drag(el);
    itemRef.current = el;
    if (isFolder) {
      drop(el);
    }
  };

  return (
    <Paper
      ref={itemDragRef}
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
          : isFolder && isOver && canDrop 
            ? (darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.1)') // Highlight when can drop
            : (isFolder 
              ? (darkMode ? '#333333' : '#f5f5f5') 
              : (darkMode ? '#2d2d2d' : '#fff')),
        border: isSelected 
          ? `2px solid ${darkMode ? '#90caf9' : '#1976d2'}`
          : isFolder && isOver && canDrop
            ? `2px dashed ${darkMode ? '#4caf50' : '#2e7d32'}`
            : 'none',
        zIndex: isOver && canDrop ? 10 : isHovering ? 5 : 1
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
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
        height: 40,
        position: 'relative'
      }}>
        {isFolder && isOver && canDrop ? (
          <Badge
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: darkMode ? '#4caf50' : '#2e7d32',
                color: 'white'
              }
            }}
            badgeContent="+"
            color="primary"
          >
            {getIconDisplay()}
          </Badge>
        ) : (
          getIconDisplay()
        )}
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