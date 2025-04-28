import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  darkMode,
  onDropInFolder,
  onReorderItems,
  iconSize = 'medium',
  // Organize mode props
  isOrganizeMode = false,
  onToggleOrganizeMode,
  onTempPositionChange,
  onSaveOrganizedItems
}) => {
  const [gridRef, setGridRef] = useState(null);
  const gridContainerRef = useRef(null);
  const [items, setItems] = useState([]);
  
  // Initialize items state with bookmark data and indices
  useEffect(() => {
    setItems(bookmarks);
  }, [bookmarks]);

  // Desktop area drop handler
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['BOOKMARK_ITEM', 'MULTI_BOOKMARK_ITEMS'],
    drop: (item, monitor) => {
      if (isDesktopView) {
        if (item.type === 'MULTI_BOOKMARK_ITEMS') {
          // Handle multiple items being dragged
          const dropOffset = monitor.getClientOffset();
          const initialOffset = monitor.getInitialClientOffset();
          const initialSourceOffset = monitor.getInitialSourceClientOffset();
          
          // Calculate the drop position for each item
          return {
            desktop: true,
            multiple: true,
            items: item.items,
            dropOffset,
            initialOffset,
            initialSourceOffset
          };
        } else {
          // Single item drag
          return {
            desktop: true,
            x: monitor.getClientOffset().x,
            y: monitor.getClientOffset().y,
            isOrganizeMode // Pass the organize mode flag
          };
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    })
  }), [isDesktopView, selectedItems, isOrganizeMode]);

  // Set ref for drop area
  const setRef = (ref) => {
    setGridRef(ref);
    drop(ref);
    gridContainerRef.current = ref;
  };

  // Handle double click on a bookmark
  const handleOpen = (item) => {
    // Don't open if in organize mode
    if (isOrganizeMode) {
      return;
    }
    
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

  // Get grid dimensions for calculations
  const getGridDimensions = () => {
    if (gridContainerRef.current) {
      const rect = gridContainerRef.current.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      };
    }
    return null;
  };

  // Handle reordering of items in grid view
  const moveItem = useCallback((dragIndex, hoverIndex, dragId, hoverId) => {
    if (dragIndex === hoverIndex) return;
    
    // Update local state to reflect the reorder immediately for smooth UI
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const temp = updatedItems[dragIndex];
      
      // Remove the item from its original position
      updatedItems.splice(dragIndex, 1);
      
      // Insert it at the new position
      updatedItems.splice(hoverIndex, 0, temp);
      
      return updatedItems;
    });
    
    // Update backend via parent component once drag is complete
    if (onReorderItems) {
      onReorderItems(dragId, hoverId, dragIndex, hoverIndex);
    }
  }, [onReorderItems]);

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
          : 'transparent',
        // Change cursor for organize mode
        cursor: isOrganizeMode ? 'move' : 'default',
        // Add a subtle indicator for organize mode
        border: isOrganizeMode ? '2px dashed #4caf50' : 'none'
      }}
    >
      {isDesktopView ? (
        // Desktop view (free position)
        items.map((item, index) => (
          <BookmarkItem
            key={item.id}
            item={item}
            index={index}
            onOpen={handleOpen}
            onContextMenu={onContextMenu}
            isDesktopView={true}
            position={itemPositions[item.id] || null}
            onPositionChange={isOrganizeMode ? onTempPositionChange : onItemPositionChange}
            isMultiSelectMode={isMultiSelectMode}
            isSelected={isItemSelected(item)}
            onToggleSelect={onToggleSelect}
            darkMode={darkMode}
            gridDimensions={getGridDimensions}
            onDropInFolder={onDropInFolder}
            moveItem={moveItem}
            iconSize={iconSize}
            isOrganizeMode={isOrganizeMode}
          />
        ))
      ) : (
        // Grid view
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {items.map((item, index) => (
            <Grid item key={item.id}>
              <BookmarkItem
                item={item}
                index={index}
                onOpen={handleOpen}
                onContextMenu={onContextMenu}
                isDesktopView={false}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={isItemSelected(item)}
                onToggleSelect={onToggleSelect}
                darkMode={darkMode}
                onDropInFolder={onDropInFolder}
                moveItem={moveItem}
                iconSize={iconSize}
                isOrganizeMode={isOrganizeMode}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BookmarkGrid;