import React from 'react';
import { useDrop } from 'react-dnd';
import { Box, Grid, Paper } from '@mui/material';
import BookmarkItem from './BookmarkItem';
import { moveBookmark } from '../utils/bookmarkUtils';

const BookmarkGrid = ({ 
  bookmarks, 
  currentFolder, 
  onNavigate, 
  onContextMenu, 
  onRefresh,
  isDesktopView,
  itemPositions,
  onItemPositionChange
}) => {
  // Set up drop target for drag and drop
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'BOOKMARK_ITEM',
    drop: (item, monitor) => {
      if (isDesktopView) {
        // In desktop view, return drop coordinates for absolute positioning
        const offset = monitor.getClientOffset();
        return { 
          desktop: true,
          x: offset.x,
          y: offset.y
        };
      } else {
        // In grid view, move item to current folder
        handleDrop(item);
        return { desktop: false };
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [currentFolder, isDesktopView]);

  // Handle dropping a bookmark onto the grid (moves to current folder)
  const handleDrop = async (droppedItem) => {
    try {
      // Only move if the target is different from source
      await moveBookmark(droppedItem.id, { parentId: currentFolder.id });
      onRefresh(); // Refresh bookmarks after successful move
    } catch (error) {
      console.error('Error moving bookmark:', error);
    }
  };

  // Handle clicking a bookmark/folder
  const handleOpen = (item) => {
    if (!item.url) {
      // It's a folder, navigate into it
      onNavigate(item);
    } else {
      // It's a bookmark, open the URL
      window.open(item.url, '_blank');
    }
  };

  // Get position for an item (used in desktop view)
  const getItemPosition = (id) => {
    return itemPositions[id] || generateRandomPosition();
  };

  // Generate a random position for new items on the desktop
  const generateRandomPosition = () => {
    // Generate a position within the visible area
    return {
      x: Math.floor(Math.random() * (window.innerWidth - 150)),
      y: Math.floor(Math.random() * (window.innerHeight - 250) + 150)
    };
  };

  return (
    <Box
      ref={drop}
      sx={{
        flexGrow: 1,
        height: '100%',
        position: 'relative',
        overflow: 'auto',
        p: 2,
        backgroundImage: isDesktopView ? 'linear-gradient(to bottom right, #e0f7fa, #bbdefb)' : 'none',
        backgroundColor: isDesktopView ? 'transparent' : '#fafafa',
        transition: 'background-color 0.3s ease',
        ...(isOver && {
          backgroundColor: isDesktopView ? 'rgba(33, 150, 243, 0.05)' : '#f0f8ff'
        })
      }}
    >
      {isDesktopView ? (
        // Desktop view - absolute positioning
        bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            item={bookmark}
            onOpen={handleOpen}
            onContextMenu={onContextMenu}
            isDesktopView={true}
            position={getItemPosition(bookmark.id)}
            onPositionChange={onItemPositionChange}
          />
        ))
      ) : (
        // Grid view - using Material UI Grid
        <Grid container spacing={2}>
          {bookmarks.map((bookmark) => (
            <Grid item key={bookmark.id}>
              <BookmarkItem
                item={bookmark}
                onOpen={handleOpen}
                onContextMenu={onContextMenu}
                isDesktopView={false}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BookmarkGrid;