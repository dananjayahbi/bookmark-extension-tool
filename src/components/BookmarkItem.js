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
  CheckBoxOutlineBlank as UnselectedIcon,
  DragIndicator as DragIcon
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

// Size configurations
const SIZE_CONFIG = {
  small: {
    item: { width: 70, height: 70 },
    icon: { width: 24, height: 24 },
    fontSize: 'xx-small'
  },
  medium: {
    item: { width: 90, height: 90 },
    icon: { width: 32, height: 32 },
    fontSize: 'caption'
  },
  large: {
    item: { width: 120, height: 120 },
    icon: { width: 48, height: 48 },
    fontSize: 'body2'
  }
};

const BookmarkItem = ({ 
  item, 
  onOpen, 
  onContextMenu,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelect,
  darkMode = false,
  onDropInFolder,
  index,
  moveItem,
  iconSize = 'medium',
  isOrganizeMode = false
}) => {
  const [customIcon, setCustomIcon] = useState(null);
  const [customIconData, setCustomIconData] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const isFolder = !item.url;
  const itemRef = useRef(null);
  
  // Get the size configuration based on the iconSize prop
  const sizeConfig = SIZE_CONFIG[iconSize] || SIZE_CONFIG.medium;
  
  // For dragging individual items
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'BOOKMARK_ITEM',
    item: () => {
      if (isSelected && onDropInFolder && !isOrganizeMode) {
        // If this is part of a multi-selection, use special handler
        // Get all selected item IDs from the parent component
        return {
          type: 'MULTI_BOOKMARK_ITEMS',
          id: item.id, // Keep individual ID for compatibility
          isFolder,
          index
        };
      }
      return { 
        id: item.id, 
        isFolder,
        index
      };
    },
    canDrag: isOrganizeMode || !isMultiSelectMode || isSelected, // Allow dragging in organize mode or if selected in multi-select
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    end: (draggedItem, monitor) => {
      const dropResult = monitor.getDropResult();
      
      if (!dropResult) {
        return;
      }
      
      if (dropResult.folderId && onDropInFolder && !isOrganizeMode) {
        // Item was dropped into a folder (only if not in organize mode)
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
    }
  }), [item.id, isMultiSelectMode, isSelected, onDropInFolder, index, isOrganizeMode]);

  // For dropping items into folders
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['BOOKMARK_ITEM', 'MULTI_BOOKMARK_ITEMS'],
    canDrop: (droppedItem) => {
      // Only allow dropping into folders, not into items
      // And prevent dropping onto itself
      // Also disable dropping into folders in organize mode
      return isFolder && droppedItem.id !== item.id && !isOrganizeMode;
    },
    drop: (droppedItem) => {
      if (isFolder && !isOrganizeMode) {
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
  }), [isFolder, item.id, isOrganizeMode]);

  // For reordering in grid view
  const [, dropReorder] = useDrop(() => ({
    accept: 'BOOKMARK_ITEM',
    canDrop: (droppedItem) => {
      // Prevent dropping onto itself
      return droppedItem.id !== item.id;
    },
    hover: (droppedItem, monitor) => {
      if (!itemRef.current || droppedItem.id === item.id) {
        return;
      }
      
      const dragIndex = droppedItem.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Only perform the move when the mouse has crossed half of the item's height/width
      const hoverBoundingRect = itemRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Make it easier to reorder by reducing the threshold
      // for when items will switch positions
      const threshold = 0.15; // 15% of the way across

      // Dragging downwards/rightwards
      if (dragIndex < hoverIndex && 
          (hoverClientY < hoverMiddleY * (1 - threshold) || 
           hoverClientX < hoverMiddleX * (1 - threshold))) {
        return;
      }
      
      // Dragging upwards/leftwards
      if (dragIndex > hoverIndex && 
          (hoverClientY > hoverMiddleY * (1 + threshold) || 
           hoverClientX > hoverMiddleX * (1 + threshold))) {
        return;
      }
      
      // Time to actually perform the action
      if (moveItem) {
        moveItem(dragIndex, hoverIndex, droppedItem.id, item.id);
      }
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      droppedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isReorderOver: !!monitor.isOver(),
      canReorderDrop: !!monitor.canDrop()
    })
  }), [index, moveItem, item.id]);

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

  const getIconDisplay = () => {
    // If we have custom icon data (uploaded by user), show it
    if (customIconData) {
      return (
        <Box 
          component="img" 
          sx={{ 
            width: sizeConfig.icon.width, 
            height: sizeConfig.icon.height, 
            objectFit: 'contain'
          }} 
          src={customIconData} 
          alt={item.title} 
        />
      );
    }
    
    // If we have a predefined icon, show it
    if (customIcon && PREDEFINED_ICONS[customIcon]) {
      return React.cloneElement(PREDEFINED_ICONS[customIcon], { 
        sx: { 
          fontSize: sizeConfig.icon.width
        } 
      });
    }
    
    // For bookmarks, show website favicon
    if (!isFolder && faviconUrl) {
      return (
        <Box 
          component="img" 
          sx={{ 
            width: sizeConfig.icon.width, 
            height: sizeConfig.icon.height, 
            objectFit: 'contain'
          }} 
          src={faviconUrl} 
          alt={item.title} 
        />
      );
    }
    
    // Default icons
    const defaultIcon = isFolder ? PREDEFINED_ICONS.folder : PREDEFINED_ICONS.default;
    return React.cloneElement(defaultIcon, { 
      sx: { 
        fontSize: sizeConfig.icon.width
      } 
    });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (isMultiSelectMode) {
      onToggleSelect(item);
    } else if (!isOrganizeMode) {
      onOpen(item);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Disable context menu in organize mode
    if (!isOrganizeMode) {
      onContextMenu(e, item);
    }
  };

  // Combine all the drag and drop refs for folders and grid reordering
  const itemDragRef = (el) => {
    drag(el);
    itemRef.current = el;
    if (isFolder && !isOrganizeMode) { // Don't enable folder drop in organize mode
      drop(el);
    }
    dropReorder(el);
  };

  return (
    <Paper
      ref={itemDragRef}
      elevation={2}
      sx={{
        width: sizeConfig.item.width,
        height: sizeConfig.item.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        cursor: isOrganizeMode ? 'move' : isMultiSelectMode ? 'default' : 'pointer',
        opacity: isDragging ? 0.5 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: isMultiSelectMode ? 'none' : 'scale(1.05)',
          boxShadow: isMultiSelectMode ? 3 : 4
        },
        backgroundColor: isSelected 
          ? (darkMode ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)')
          : isFolder && isOver && canDrop 
            ? (darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.1)') // Highlight when can drop
            : (isFolder 
              ? (darkMode ? '#333333' : '#f5f5f5') 
              : (darkMode ? '#2d2d2d' : '#fff')),
        border: isOrganizeMode 
          ? `2px dashed ${darkMode ? '#4caf50' : '#2e7d32'}`
          : isSelected 
            ? `2px solid ${darkMode ? '#90caf9' : '#1976d2'}`
            : isFolder && isOver && canDrop
              ? `2px dashed ${darkMode ? '#4caf50' : '#2e7d32'}`
              : 'none',
        zIndex: isOver && canDrop ? 10 : isDragging ? 100 : isHovering ? 5 : 1
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Show drag handle indicator in organize mode */}
      {isOrganizeMode && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 4, 
            right: 4,
            zIndex: 2,
            color: darkMode ? '#90caf9' : '#1976d2'
          }}
        >
          <DragIcon fontSize="small" />
        </Box>
      )}
      
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
            size={iconSize === 'small' ? 'small' : 'medium'}
            checked={isSelected}
            onChange={() => onToggleSelect(item)}
            color="primary"
            icon={<UnselectedIcon fontSize={iconSize === 'small' ? 'small' : 'medium'} />}
            checkedIcon={<SelectedIcon fontSize={iconSize === 'small' ? 'small' : 'medium'} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mb: 1,
        height: sizeConfig.icon.height + 8,
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
        variant={sizeConfig.fontSize}
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