import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Box, Grid, Paper } from '@mui/material';
import BookmarkItem from './BookmarkItem';

const BookmarkGrid = ({ 
  bookmarks, 
  currentFolder, 
  onNavigate, 
  onContextMenu, 
  onRefresh,
  isDesktopView, 
  itemPositions, 
  onItemPositionChange,
  isMultiSelectMode,
  selectedItems,
  onToggleSelect,
  darkMode
}) => {
  const [gridRef, setGridRef] = useState(null);
  
  // Desktop area drop handler
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'BOOKMARK_ITEM',
    drop: (item, monitor) => {
      if (isDesktopView) {
        return {
          desktop: true,
          x: monitor.getClientOffset().x,
          y: monitor.getClientOffset().y
        };
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    })
  }), [isDesktopView]);

  // Set ref for drop area
  const setRef = (ref) => {
    setGridRef(ref);
    drop(ref);
  };

  // Handle double click on a bookmark
  const handleOpen = (item) => {
    if (item.url) {
      window.open(item.url, '_blank');
    } else {
      onNavigate(item);
    }
  };

  // Check if an item is selected
  const isItemSelected = (item) => {
    return selectedItems && selectedItems.some(selected => selected.id === item.id);
  };

  return (
    <Box
      ref={setRef}
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: 2,
        height: '100%',
        position: 'relative',
        background: isDesktopView 
          ? (darkMode 
              ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)' 
              : 'linear-gradient(45deg, #f5f5f5 0%, #e0e0e0 100%)'
            )
          : 'transparent'
      }}
    >
      {isDesktopView ? (
        // Desktop view (free position)
        bookmarks.map((item) => (
          <BookmarkItem
            key={item.id}
            item={item}
            onOpen={handleOpen}
            onContextMenu={onContextMenu}
            isDesktopView={true}
            position={itemPositions[item.id] || null}
            onPositionChange={onItemPositionChange}
            isMultiSelectMode={isMultiSelectMode}
            isSelected={isItemSelected(item)}
            onToggleSelect={onToggleSelect}
            darkMode={darkMode}
          />
        ))
      ) : (
        // Grid view
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {bookmarks.map((item) => (
            <Grid item key={item.id}>
              <BookmarkItem
                item={item}
                onOpen={handleOpen}
                onContextMenu={onContextMenu}
                isDesktopView={false}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={isItemSelected(item)}
                onToggleSelect={onToggleSelect}
                darkMode={darkMode}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BookmarkGrid;