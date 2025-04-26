import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider, createTheme, CssBaseline, Box, useMediaQuery } from '@mui/material';
import BookmarkGrid from '../components/BookmarkGrid';
import NavigationBar from '../components/NavigationBar';
import SearchBar from '../components/SearchBar';
import ContextMenu from '../components/ContextMenu';
import Toolbar from '../components/Toolbar';
import CreateFolderDialog from '../components/CreateFolderDialog';
import RenameDialog from '../components/RenameDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import SelectIconDialog from '../components/SelectIconDialog';
import {
  getAllBookmarks,
  createFolder,
  updateBookmark,
  removeBookmark,
  removeFolder,
  searchBookmarks,
  setCustomIcon,
  calculateFolderDepth,
  flatten,
  getBookmarkIconUrl,
  getSavedViewPreference, 
  saveViewPreference,
  getSavedPositions,
  savePositions,
  uploadCustomIcon,
  getCustomIcon
} from '../utils/bookmarkUtils';

// Material UI icons for the context menu
import {
  Launch as OpenIcon,
  Edit as RenameIcon,
  Delete as DeleteIcon,
  Image as IconIcon,
  ContentCopy as CopyIcon,
  ContentCut as CutIcon,
  ContentPaste as PasteIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  SelectAll as SelectAllIcon
} from '@mui/icons-material';

// Create darkMode-aware theme
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#90caf9' : '#1976d2',
    },
    secondary: {
      main: mode === 'dark' ? '#f48fb1' : '#dc004e',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
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
  const [darkMode, setDarkMode] = useState(false);
  const theme = getTheme(darkMode ? 'dark' : 'light');
  
  // Selection state for multi-select operations
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Navigation history - store full bookmark objects
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Item positions for desktop view (stored in local storage)
  const [itemPositions, setItemPositions] = useState({});
  
  // Dialog states
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, items: [] });
  const [iconDialog, setIconDialog] = useState({ open: false, item: null });
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    menuItems: []
  });

  // Load initial bookmarks and preferences
  useEffect(() => {
    loadBookmarks();
    loadPreferences();
  }, []);

  // Load saved item positions and preferences from storage
  const loadPreferences = async () => {
    try {
      // Load desktop view preference
      const viewPreference = await getSavedViewPreference();
      setIsDesktopView(viewPreference);
      
      // Load saved positions
      const positions = await getSavedPositions();
      setItemPositions(positions || {});
      
      // Load dark mode preference 
      chrome.storage.local.get('darkMode', (result) => {
        setDarkMode(result.darkMode || false);
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Save dark mode preference
  const saveDarkModePreference = (isDarkMode) => {
    chrome.storage.local.set({ darkMode: isDarkMode });
  };

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    saveDarkModePreference(newMode);
  };

  // Toggle multi-select mode
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedItems([]);
  };

  // Toggle item selection
  const handleToggleSelect = (item) => {
    if (!isMultiSelectMode) return;
    
    setSelectedItems(prevSelected => {
      const isSelected = prevSelected.some(selected => selected.id === item.id);
      if (isSelected) {
        return prevSelected.filter(selected => selected.id !== item.id);
      } else {
        return [...prevSelected, item];
      }
    });
  };

  // Save view preference when it changes
  useEffect(() => {
    saveViewPreference(isDesktopView);
  }, [isDesktopView]);

  // Load bookmarks from Chrome API
  const loadBookmarks = async () => {
    try {
      const bookmarkTree = await getAllBookmarks();
      
      // Start at the Bookmarks Bar folder (usually id '1')
      const rootFolder = bookmarkTree[0].children[0];
      
      // Initialize with the root folder
      setCurrentFolder(rootFolder);
      setBookmarks(rootFolder.children || []);
      
      // Properly set up initial navigation state
      setNavigationHistory([rootFolder]);
      setHistoryIndex(0);
      
      // Calculate breadcrumbs for root folder (just itself)
      setBreadcrumbs([rootFolder]);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Navigate to a folder with proper history handling
  const navigateTo = (folder, resetHistory = false) => {
    if (!folder) return;
    
    setCurrentFolder(folder);
    setBookmarks(folder.children || []);
    
    // Get complete folder tree for accurate breadcrumbs
    getAllBookmarks().then(bookmarkTree => {
      const flatBookmarks = flatten(bookmarkTree);
      const fullFolder = findFullFolder(flatBookmarks, folder.id);
      
      if (fullFolder) {
        const crumbs = buildBreadcrumbs(flatBookmarks, fullFolder);
        setBreadcrumbs(crumbs);
        
        // Update navigation history
        if (resetHistory) {
          setNavigationHistory([fullFolder]);
          setHistoryIndex(0);
        } else {
          const newHistory = navigationHistory.slice(0, historyIndex + 1);
          newHistory.push(fullFolder);
          setNavigationHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      }
    });
    
    // Clear search when navigating
    setSearchQuery('');
    setIsSearchMode(false);
    
    // Exit multi-select mode when navigating
    setIsMultiSelectMode(false);
    setSelectedItems([]);
  };
  
  // Find the complete folder data by id
  const findFullFolder = (flatBookmarks, folderId) => {
    return flatBookmarks.find(bookmark => bookmark.id === folderId);
  };
  
  // Build the complete breadcrumb path
  const buildBreadcrumbs = (flatBookmarks, folder) => {
    const breadcrumbs = [];
    let current = folder;
    
    // Add the current folder
    breadcrumbs.unshift(current);
    
    // Build the path by traversing parents
    while (current && current.parentId && current.parentId !== '0') {
      const parent = flatBookmarks.find(b => b.id === current.parentId);
      if (parent) {
        breadcrumbs.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return breadcrumbs;
  };

  // Go back in history
  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const folder = navigationHistory[newIndex];
      
      setHistoryIndex(newIndex);
      setCurrentFolder(folder);
      setBookmarks(folder.children || []);
      
      // Calculate breadcrumbs for this folder
      getAllBookmarks().then(bookmarkTree => {
        const flatBookmarks = flatten(bookmarkTree);
        const crumbs = buildBreadcrumbs(flatBookmarks, folder);
        setBreadcrumbs(crumbs);
      });
      
      // Clear search and multi-select
      setSearchQuery('');
      setIsSearchMode(false);
      setIsMultiSelectMode(false);
      setSelectedItems([]);
    }
  };

  // Go forward in history
  const handleGoForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const folder = navigationHistory[newIndex];
      
      setHistoryIndex(newIndex);
      setCurrentFolder(folder);
      setBookmarks(folder.children || []);
      
      // Calculate breadcrumbs for this folder
      getAllBookmarks().then(bookmarkTree => {
        const flatBookmarks = flatten(bookmarkTree);
        const crumbs = buildBreadcrumbs(flatBookmarks, folder);
        setBreadcrumbs(crumbs);
      });
      
      // Clear search and multi-select
      setSearchQuery('');
      setIsSearchMode(false);
      setIsMultiSelectMode(false);
      setSelectedItems([]);
    }
  };

  // Go to root folder (home)
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
    savePositions(newPositions);
  };

  // Arrange items in a grid in desktop view
  const generateGridPositions = (items, containerWidth, containerHeight) => {
    const positions = {};
    const iconWidth = 100; // Width of icon with margins
    const iconHeight = 120; // Height of icon with margins
    const maxPerRow = Math.floor(containerWidth / iconWidth);
    const startX = 20; // Left margin
    const startY = 20; // Top margin
    
    items.forEach((item, index) => {
      const row = Math.floor(index / maxPerRow);
      const col = index % maxPerRow;
      
      positions[item.id] = {
        x: startX + (col * iconWidth),
        y: startY + (row * iconHeight)
      };
    });
    
    return positions;
  };

  // Initialize desktop view with grid layout
  const initializeDesktopLayout = () => {
    // Only initialize positions for items that don't already have positions
    const newPositions = { ...itemPositions };
    const width = window.innerWidth;
    const height = window.innerHeight - 200; // Adjust for header/toolbar height
    
    const defaultPositions = generateGridPositions(bookmarks, width, height);
    
    // Only set positions for items that don't already have one
    bookmarks.forEach(item => {
      if (!newPositions[item.id]) {
        newPositions[item.id] = defaultPositions[item.id];
      }
    });
    
    setItemPositions(newPositions);
    savePositions(newPositions);
  };

  // Initialize desktop layout when view changes or bookmarks change
  useEffect(() => {
    if (isDesktopView && bookmarks.length > 0) {
      initializeDesktopLayout();
    }
  }, [isDesktopView, bookmarks.length]);

  // Handle creating a new folder
  const handleCreateFolder = async (folderName) => {
    if (!folderName) return;

    try {
      // Check folder depth limit (max 5 levels)
      const depth = await calculateFolderDepth(currentFolder.id);
      if (depth >= 5) {
        alert('Maximum folder depth (5) reached. Cannot create more subfolders at this level.');
        return;
      }

      await createFolder(currentFolder.id, folderName);
      
      // Close the dialog and refresh the view
      setCreateFolderDialog(false);
      
      // Reload bookmarks and maintain the current folder
      getAllBookmarks().then(bookmarkTree => {
        const flatBookmarks = flatten(bookmarkTree);
        const updatedFolder = findFullFolder(flatBookmarks, currentFolder.id);
        if (updatedFolder) {
          setCurrentFolder(updatedFolder);
          setBookmarks(updatedFolder.children || []);
        }
      });
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  // Handle right-click on bookmark/folder
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    
    const isFolder = !item.url;
    
    let menuItems = [];
    
    if (isMultiSelectMode) {
      // In multi-select mode, show toggle selection option
      const isSelected = selectedItems.some(selected => selected.id === item.id);
      menuItems = [
        {
          label: isSelected ? 'Deselect' : 'Select',
          icon: <SelectAllIcon fontSize="small" />,
          onClick: () => handleToggleSelect(item)
        }
      ];
    } else {
      // Regular context menu options
      menuItems = [
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
          onClick: () => setRenameDialog({ open: true, item })
        },
        {
          label: 'Delete',
          icon: <DeleteIcon fontSize="small" />,
          onClick: () => setDeleteDialog({ open: true, items: [item] })
        },
        { divider: true },
        {
          label: 'Change Icon',
          icon: <IconIcon fontSize="small" />,
          onClick: () => setIconDialog({ open: true, item })
        }
      ];
    }

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item,
      menuItems
    });
  };

  // Handle renaming a bookmark or folder
  const handleRename = async (item, newName) => {
    if (!newName || newName === item.title) return;
    
    try {
      if (newName.length > 50) {
        alert('Name is too long. Maximum 50 characters allowed.');
        return;
      }
      
      await updateBookmark(item.id, { title: newName });
      
      // Close the dialog
      setRenameDialog({ open: false, item: null });
      
      // Reload the current folder to reflect changes
      getAllBookmarks().then(bookmarkTree => {
        const flatBookmarks = flatten(bookmarkTree);
        const updatedFolder = findFullFolder(flatBookmarks, currentFolder.id);
        if (updatedFolder) {
          setCurrentFolder(updatedFolder);
          setBookmarks(updatedFolder.children || []);
        }
      });
    } catch (error) {
      console.error('Error renaming item:', error);
    }
  };

  // Handle deleting bookmarks or folders
  const handleDelete = async (items) => {
    try {
      for (const item of items) {
        const isFolder = !item.url;
        if (isFolder) {
          await removeFolder(item.id);
        } else {
          await removeBookmark(item.id);
        }
      }
      
      // Close the dialog
      setDeleteDialog({ open: false, items: [] });
      
      // Clear selection
      setSelectedItems([]);
      
      // Reload the current folder to reflect changes
      getAllBookmarks().then(bookmarkTree => {
        const flatBookmarks = flatten(bookmarkTree);
        const updatedFolder = findFullFolder(flatBookmarks, currentFolder.id);
        if (updatedFolder) {
          setCurrentFolder(updatedFolder);
          setBookmarks(updatedFolder.children || []);
        }
      });
    } catch (error) {
      console.error('Error deleting items:', error);
    }
  };

  // Handle deleting selected items
  const handleDeleteSelected = () => {
    if (selectedItems.length > 0) {
      setDeleteDialog({ open: true, items: selectedItems });
    }
  };

  // Handle changing icon for a bookmark or folder
  const handleChangeIcon = async (item, iconSelection, customIconData) => {
    try {
      if (customIconData) {
        // Upload custom icon
        await uploadCustomIcon(item.id, customIconData);
      } else if (iconSelection) {
        // Set predefined icon
        await setCustomIcon(item.id, iconSelection);
      }
      
      // Close the dialog
      setIconDialog({ open: false, item: null });
      
      // Reload the current folder to reflect changes
      getAllBookmarks().then(bookmarkTree => {
        const flatBookmarks = flatten(bookmarkTree);
        const updatedFolder = findFullFolder(flatBookmarks, currentFolder.id);
        if (updatedFolder) {
          setCurrentFolder(updatedFolder);
          setBookmarks(updatedFolder.children || []);
        }
      });
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
            canGoForward={historyIndex < navigationHistory.length - 1}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onGoHome={handleGoHome}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
          
          <SearchBar 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
          />
          
          <Toolbar 
            onCreateFolder={() => setCreateFolderDialog(true)} 
            onRefresh={() => {
              // Reload the current folder
              getAllBookmarks().then(bookmarkTree => {
                const flatBookmarks = flatten(bookmarkTree);
                const updatedFolder = findFullFolder(flatBookmarks, currentFolder.id);
                if (updatedFolder) {
                  setCurrentFolder(updatedFolder);
                  setBookmarks(updatedFolder.children || []);
                }
              });
            }}
            isDesktopView={isDesktopView}
            onToggleView={handleToggleView}
            isMultiSelectMode={isMultiSelectMode}
            onToggleMultiSelect={handleToggleMultiSelect}
            selectedCount={selectedItems.length}
            onDeleteSelected={handleDeleteSelected}
          />
          
          <BookmarkGrid 
            bookmarks={isSearchMode ? searchResults : bookmarks}
            currentFolder={currentFolder}
            onNavigate={navigateTo}
            onContextMenu={handleContextMenu}
            onRefresh={() => {
              getAllBookmarks().then(bookmarkTree => {
                const flatBookmarks = flatten(bookmarkTree);
                const updatedFolder = findFullFolder(flatBookmarks, currentFolder.id);
                if (updatedFolder) {
                  setCurrentFolder(updatedFolder);
                  setBookmarks(updatedFolder.children || []);
                }
              });
            }}
            isDesktopView={isDesktopView}
            itemPositions={itemPositions}
            onItemPositionChange={handleItemPositionChange}
            isMultiSelectMode={isMultiSelectMode}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
            darkMode={darkMode}
          />
          
          <ContextMenu 
            anchorPosition={{ x: contextMenu.x, y: contextMenu.y }}
            isVisible={contextMenu.visible}
            menuItems={contextMenu.menuItems}
            onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
          />
          
          {/* Material UI Dialogs */}
          <CreateFolderDialog 
            open={createFolderDialog}
            onClose={() => setCreateFolderDialog(false)}
            onCreateFolder={handleCreateFolder}
          />
          
          <RenameDialog 
            open={renameDialog.open}
            item={renameDialog.item}
            onClose={() => setRenameDialog({ open: false, item: null })}
            onRename={handleRename}
          />
          
          <DeleteConfirmationDialog 
            open={deleteDialog.open}
            items={deleteDialog.items}
            onClose={() => setDeleteDialog({ open: false, items: [] })}
            onDelete={handleDelete}
          />
          
          <SelectIconDialog 
            open={iconDialog.open}
            item={iconDialog.item}
            onClose={() => setIconDialog({ open: false, item: null })}
            onSelectIcon={handleChangeIcon}
          />
        </Box>
      </DndProvider>
    </ThemeProvider>
  );
};

export default App;