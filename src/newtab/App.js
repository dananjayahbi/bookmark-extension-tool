import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import BookmarkGrid from '../components/BookmarkGrid';
import NavigationBar from '../components/NavigationBar';
import SearchBar from '../components/SearchBar';
import ContextMenu from '../components/ContextMenu';
import Toolbar from '../components/Toolbar';
import {
  getAllBookmarks,
  createFolder,
  updateBookmark,
  removeBookmark,
  removeFolder,
  searchBookmarks,
  setCustomIcon,
  calculateFolderDepth,
  flatten
} from '../utils/bookmarkUtils';

// Material UI icons for the context menu
import {
  Launch as OpenIcon,
  Edit as RenameIcon,
  Delete as DeleteIcon,
  Image as IconIcon,
  ContentCopy as CopyIcon,
  ContentCut as CutIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';

// Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const App = () => {
  // State management
  const [bookmarks, setBookmarks] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isDesktopView, setIsDesktopView] = useState(false);
  
  // Navigation history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Item positions for desktop view (stored in local storage)
  const [itemPositions, setItemPositions] = useState({});
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    menuItems: []
  });

  // Load initial bookmarks
  useEffect(() => {
    loadBookmarks();
    loadSavedItemPositions();
  }, []);

  // Load saved item positions from storage
  const loadSavedItemPositions = async () => {
    try {
      chrome.storage.local.get('itemPositions', (result) => {
        if (result.itemPositions) {
          setItemPositions(result.itemPositions);
        }
      });
    } catch (error) {
      console.error('Error loading saved item positions:', error);
    }
  };

  // Save item positions to storage
  const saveItemPositions = async (positions) => {
    try {
      chrome.storage.local.set({ itemPositions: positions });
    } catch (error) {
      console.error('Error saving item positions:', error);
    }
  };

  // Load bookmarks from Chrome API
  const loadBookmarks = async () => {
    try {
      const bookmarkTree = await getAllBookmarks();
      
      // Start at the Bookmarks Bar folder (usually id '1')
      const rootFolder = bookmarkTree[0].children[0];
      navigateTo(rootFolder, true);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Navigate to a folder and optionally add to history
  const navigateTo = (folder, isReset = false) => {
    setCurrentFolder(folder);
    setBookmarks(folder.children || []);
    setBreadcrumbs(calculateBreadcrumbs(folder));

    // Add to history if not from history navigation
    if (!isReset) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(folder);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    // Clear search when navigating
    setSearchQuery('');
    setIsSearchMode(false);
  };

  // Calculate breadcrumbs for a folder
  const calculateBreadcrumbs = (folder) => {
    if (folder.id === '0' || folder.id === '1') {
      return [folder];
    }

    // Reconstruct path
    const path = [];
    let current = folder;
    
    while (current) {
      path.unshift(current);
      
      // Root has been reached
      if (current.id === '0' || current.id === '1' || !current.parentId) {
        break;
      }
      
      // Prepare for next iteration - this is simplified and would need a proper lookup
      current = { id: current.parentId, title: '...' };
    }
    
    return path;
  };

  // Go back in history
  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const folder = history[newIndex];
      setCurrentFolder(folder);
      setBookmarks(folder.children || []);
      setBreadcrumbs(calculateBreadcrumbs(folder));
      setSearchQuery('');
      setIsSearchMode(false);
    }
  };

  // Go forward in history
  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const folder = history[newIndex];
      setCurrentFolder(folder);
      setBookmarks(folder.children || []);
      setBreadcrumbs(calculateBreadcrumbs(folder));
      setSearchQuery('');
      setIsSearchMode(false);
    }
  };

  // Go to root folder
  const handleGoHome = () => {
    loadBookmarks();
  };

  // Handle search query changes
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim() === '') {
        setIsSearchMode(false);
        return;
      }

      try {
        setIsSearchMode(true);
        const results = await searchBookmarks(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching bookmarks:', error);
      }
    };

    handleSearch();
  }, [searchQuery]);

  // Toggle between desktop and grid view
  const handleToggleView = () => {
    setIsDesktopView(!isDesktopView);
  };

  // Handle item position changes in desktop view
  const handleItemPositionChange = (id, position) => {
    const newPositions = { ...itemPositions, [id]: position };
    setItemPositions(newPositions);
    saveItemPositions(newPositions);
  };

  // Create a new folder
  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      // Check folder depth limit (max 5 levels)
      const depth = await calculateFolderDepth(currentFolder.id);
      if (depth >= 5) {
        alert('Maximum folder depth (5) reached. Cannot create more subfolders at this level.');
        return;
      }

      await createFolder(currentFolder.id, folderName);
      loadBookmarks(); // Refresh the view
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  // Handle right-click on bookmark/folder
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    
    const isFolder = !item.url;
    
    const menuItems = [
      {
        label: isFolder ? 'Open Folder' : 'Open Bookmark',
        icon: <OpenIcon fontSize="small" />,
        onClick: () => {
          if (item.url) {
            window.open(item.url, '_blank');
          } else {
            navigateTo(item);
          }
        }
      },
      { divider: true },
      {
        label: 'Rename',
        icon: <RenameIcon fontSize="small" />,
        onClick: () => handleRename(item)
      },
      {
        label: 'Delete',
        icon: <DeleteIcon fontSize="small" />,
        onClick: () => handleDelete(item)
      },
      { divider: true },
      {
        label: 'Change Icon',
        icon: <IconIcon fontSize="small" />,
        onClick: () => handleChangeIcon(item)
      }
    ];

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item,
      menuItems
    });
  };

  // Rename a bookmark or folder
  const handleRename = async (item) => {
    const newName = prompt('Enter new name:', item.title);
    if (!newName || newName === item.title) return;
    
    try {
      if (newName.length > 50) {
        alert('Name is too long. Maximum 50 characters allowed.');
        return;
      }
      
      await updateBookmark(item.id, { title: newName });
      loadBookmarks(); // Refresh the view
    } catch (error) {
      console.error('Error renaming item:', error);
    }
  };

  // Delete a bookmark or folder
  const handleDelete = async (item) => {
    const isFolder = !item.url;
    let confirmDelete = true;
    
    if (isFolder && item.children && item.children.length > 0) {
      confirmDelete = window.confirm(
        `Are you sure you want to delete the folder "${item.title}" and all its contents?`
      );
    }
    
    if (!confirmDelete) return;
    
    try {
      if (isFolder) {
        await removeFolder(item.id);
      } else {
        await removeBookmark(item.id);
      }
      loadBookmarks(); // Refresh the view
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Change icon for a bookmark or folder
  const handleChangeIcon = async (item) => {
    const iconOptions = [
      'default', 'folder', 'star', 'heart', 'work', 
      'home', 'important', 'music', 'shopping', 'travel', 'education'
    ];
    
    const iconSelection = prompt(
      `Choose an icon (${iconOptions.join(', ')}):`,
      'default'
    );
    
    if (!iconSelection || !iconOptions.includes(iconSelection)) {
      alert('Invalid icon selection');
      return;
    }
    
    try {
      await setCustomIcon(item.id, iconSelection);
      loadBookmarks(); // Refresh the view
    } catch (error) {
      console.error('Error changing icon:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DndProvider backend={HTML5Backend}>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <NavigationBar 
            breadcrumbs={breadcrumbs} 
            onNavigate={navigateTo}
            canGoBack={historyIndex > 0}
            canGoForward={historyIndex < history.length - 1}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onGoHome={handleGoHome}
          />
          
          <SearchBar 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
          />
          
          <Toolbar 
            onCreateFolder={handleCreateFolder} 
            onRefresh={loadBookmarks}
            isDesktopView={isDesktopView}
            onToggleView={handleToggleView}
          />
          
          <BookmarkGrid 
            bookmarks={isSearchMode ? searchResults : bookmarks}
            currentFolder={currentFolder}
            onNavigate={navigateTo}
            onContextMenu={handleContextMenu}
            onRefresh={loadBookmarks}
            isDesktopView={isDesktopView}
            itemPositions={itemPositions}
            onItemPositionChange={handleItemPositionChange}
          />
          
          <ContextMenu 
            anchorPosition={{ x: contextMenu.x, y: contextMenu.y }}
            isVisible={contextMenu.visible}
            menuItems={contextMenu.menuItems}
            onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
          />
        </Box>
      </DndProvider>
    </ThemeProvider>
  );
};

export default App;