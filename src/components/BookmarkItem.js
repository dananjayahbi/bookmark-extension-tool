import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getCustomIcon } from '../utils/bookmarkUtils';
import { Paper, Typography, Box } from '@mui/material';
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
  School as EducationIcon
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
  onPositionChange
}) => {
  const [customIcon, setCustomIcon] = useState(null);
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
  }), [item.id, itemPosition, isDesktopView]);

  useEffect(() => {
    const loadCustomIcon = async () => {
      const icon = await getCustomIcon(item.id);
      setCustomIcon(icon);
    };
    
    loadCustomIcon();
  }, [item.id]);

  useEffect(() => {
    if (position) {
      setItemPosition(position);
    }
  }, [position]);

  const getIconDisplay = () => {
    if (customIcon && PREDEFINED_ICONS[customIcon]) {
      return PREDEFINED_ICONS[customIcon];
    }
    
    return isFolder ? PREDEFINED_ICONS.folder : PREDEFINED_ICONS.default;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onOpen(item);
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
        cursor: 'pointer',
        opacity: isDragging ? 0.5 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: 3
        },
        position: isDesktopView ? 'absolute' : 'relative',
        left: isDesktopView ? `${itemPosition.x}px` : 'auto',
        top: isDesktopView ? `${itemPosition.y}px` : 'auto',
        backgroundColor: isFolder ? '#f5f5f5' : '#fff'
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <Box sx={{ fontSize: 36, display: 'flex', justifyContent: 'center', mb: 1 }}>
        {getIconDisplay()}
      </Box>
      <Typography 
        variant="caption" 
        align="center" 
        noWrap 
        sx={{ 
          width: '100%',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}
      >
        {item.title || (item.url ? new URL(item.url).hostname : 'Untitled')}
      </Typography>
    </Paper>
  );
};

export default BookmarkItem;