import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider, createTheme, CssBaseline, Box, Alert, Snackbar } from '@mui/material';
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
  getCustomIcon,
  moveBookmark,
  getClipboardData,
  saveToClipboard,
  clearClipboard,
  cloneBookmark,
  getIconSizePreference,
  saveIconSizePreference
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
  SelectAll as SelectAllIcon,
  DragIndicator as DragIcon,
  AddCircleOutline as NewFolderIcon
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

  // Organization mode for arranging items
  const [isOrganizeMode, setIsOrganizeMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [tempPositions, setTempPositions] = useState({});
  
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
  
  // Feedback notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    menuItems: []
  });

  // State to store the icon size preference
  const [iconSize, setIconSize] = useState('medium');

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

      // Load icon size preference
      const size = await getIconSizePreference();
      setIconSize(size);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Handle icon size change
  const handleIconSizeChange = (size) => {
    setIconSize(size);
    saveIconSizePreference(size);
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

  // Method to refresh the current folder view
  const refreshCurrentFolder = useCallback(async () => {
    if (!currentFolder) return;
    
    try {
      // Get fresh bookmark data
      const bookmarkTree = await getAllBookmarks();
      const flatBookmarks = flatten(bookmarkTree);
      const updatedFolder = flatBookmarks.find(b => b.id === currentFolder.id);
      
      if (updatedFolder) {
        setCurrentFolder(updatedFolder);
        setBookmarks(updatedFolder.children || []);
      }
    } catch (error) {
      console.error('Error refreshing folder:', error);
    }
  }, [currentFolder]);

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
  const handleGoBack = async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const folder = navigationHistory[newIndex];
      
      setHistoryIndex(newIndex);
      
      // Get fresh bookmark data instead of using cached data
      try {
        // Get fresh bookmark data
        const bookmarkTree = await getAllBookmarks();
        const flatBookmarks = flatten(bookmarkTree);
        const updatedFolder = flatBookmarks.find(b => b.id === folder.id);
        
        if (updatedFolder) {
          setCurrentFolder(updatedFolder);
          setBookmarks(updatedFolder.children || []);
          
          // Calculate breadcrumbs for this folder
          const crumbs = buildBreadcrumbs(flatBookmarks, updatedFolder);
          setBreadcrumbs(crumbs);
        } else {
          // Fallback if folder not found
          setCurrentFolder(folder);
          setBookmarks(folder.children || []);
          
          // Calculate breadcrumbs for this folder
          const crumbs = buildBreadcrumbs(flatBookmarks, folder);
          setBreadcrumbs(crumbs);
        }
      } catch (error) {
        console.error('Error refreshing folder:', error);
        // Fallback to cached data
        setCurrentFolder(folder);
        setBookmarks(folder.children || []);
        
        // Calculate breadcrumbs for this folder using cached data
        getAllBookmarks().then(bookmarkTree => {
          const flatBookmarks = flatten(bookmarkTree);
          const crumbs = buildBreadcrumbs(flatBookmarks, folder);
          setBreadcrumbs(crumbs);
        });
      }
      
      // Clear search and multi-select
      setSearchQuery('');
      setIsSearchMode(false);
      setIsMultiSelectMode(false);
      setSelectedItems([]);
    }
  };

  // Go forward in history
  const handleGoForward = async () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const folder = navigationHistory[newIndex];
      
      setHistoryIndex(newIndex);
      
      // Get fresh bookmark data instead of using cached data
      try {
        // Get fresh bookmark data
        const bookmarkTree = await getAllBookmarks();
        const flatBookmarks = flatten(bookmarkTree);
        const updatedFolder = flatBookmarks.find(b => b.id === folder.id);
        
        if (updatedFolder) {
          setCurrentFolder(updatedFolder);
          setBookmarks(updatedFolder.children || []);
          
          // Calculate breadcrumbs for this folder
          const crumbs = buildBreadcrumbs(flatBookmarks, updatedFolder);
          setBreadcrumbs(crumbs);
        } else {
          // Fallback if folder not found
          setCurrentFolder(folder);
          setBookmarks(folder.children || []);
          
          // Calculate breadcrumbs for this folder
          const crumbs = buildBreadcrumbs(flatBookmarks, folder);
          setBreadcrumbs(crumbs);
        }
      } catch (error) {
        console.error('Error refreshing folder:', error);
        // Fallback to cached data
        setCurrentFolder(folder);
        setBookmarks(folder.children || []);
        
        // Calculate breadcrumbs for this folder using cached data
        getAllBookmarks().then(bookmarkTree => {
          const flatBookmarks = flatten(bookmarkTree);
          const crumbs = buildBreadcrumbs(flatBookmarks, folder);
          setBreadcrumbs(crumbs);
        });
      }
      
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

  // Handle dropping items into folders
  const handleDropInFolder = async (itemIds, targetFolderId) => {
    if (!itemIds.length || !targetFolderId) return;
    
    try {
      for (const id of itemIds) {
        await moveBookmark(id, { parentId: targetFolderId });
      }
      
      showSnackbar('Items moved successfully', 'success');
      refreshCurrentFolder();
      
      // Exit multi-select mode after move operation
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error moving items to folder:', error);
      showSnackbar('Error moving items', 'error');
    }
  };

  // Handle multi-selection drag and drop
  const handleMultiSelectionDrop = (items, targetFolderId) => {
    if (!items.length || !targetFolderId) return;
    handleDropInFolder(items.map(item => item.id), targetFolderId);
  };

  // Arrange items in a grid in desktop view
  const generateGridPositions = (items, containerWidth, containerHeight) => {
    const positions = {};
    // Get dimensions based on selected icon size
    const sizeConfig = {
      small: { width: 80, height: 90 },
      medium: { width: 100, height: 120 },
      large: { width: 130, height: 150 }
    };
    
    const config = sizeConfig[iconSize] || sizeConfig.medium;
    const iconWidth = config.width;
    const iconHeight = config.height;
    
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

  // Show snackbar notification
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Handle creating a new folder
  const handleCreateFolder = async (folderName) => {
    if (!folderName) return;

    try {
      // Check folder depth limit (max 5 levels)
      const depth = await calculateFolderDepth(currentFolder.id);
      if (depth >= 5) {
        showSnackbar('Maximum folder depth (5) reached. Cannot create more subfolders at this level.', 'error');
        return;
      }

      await createFolder(currentFolder.id, folderName);
      showSnackbar(`Folder '${folderName}' created`, 'success');
      
      // Close the dialog and refresh the view
      setCreateFolderDialog(false);
      refreshCurrentFolder();
    } catch (error) {
      console.error('Error creating folder:', error);
      showSnackbar('Error creating folder', 'error');
    }
  };

  // Handle clipboard operations (cut/copy)
  const handleClipboardOperation = async (items, operation) => {
    if (!items.length) return;
    
    try {
      await saveToClipboard(
        items.map(item => item.id),
        operation
      );
      
      showSnackbar(
        `${items.length} item${items.length > 1 ? 's' : ''} ${operation === 'cut' ? 'cut' : 'copied'} to clipboard`,
        'info'
      );
      
      // If in multi-select mode, clear selection after operation
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error(`Error in ${operation} operation:`, error);
      showSnackbar(`Error ${operation === 'cut' ? 'cutting' : 'copying'} items`, 'error');
    }
  };

  // Handle paste operation
  const handlePaste = async () => {
    try {
      const clipboardData = await getClipboardData();
      
      if (!clipboardData || !clipboardData.items || !clipboardData.items.length) {
        showSnackbar('Nothing to paste', 'info');
        return;
      }
      
      const { items, operation } = clipboardData;
      
      if (operation === 'cut') {
        // Move items to current folder
        for (const id of items) {
          await moveBookmark(id, { parentId: currentFolder.id });
        }
        // Clear clipboard after cut operation is completed
        await clearClipboard();
        showSnackbar('Items moved here', 'success');
      } else if (operation === 'copy') {
        // Clone items to current folder
        for (const id of items) {
          await cloneBookmark(id, currentFolder.id);
        }
        showSnackbar('Items copied here', 'success');
      }
      
      // Refresh the current folder view
      refreshCurrentFolder();
    } catch (error) {
      console.error('Error pasting items:', error);
      showSnackbar('Error pasting items', 'error');
    }
  };

  // Generate context menu based on selection state
  const generateContextMenu = (item, isMultiSelectModeActive, selectedItemsArray) => {
    const isFolder = !item.url;
    const isSelected = selectedItemsArray.some(selected => selected.id === item.id);
    const hasSelection = selectedItemsArray.length > 0;
    
    // If in multi-select mode, show specific menu
    if (isMultiSelectModeActive) {
      return [
        {
          label: isSelected ? 'Deselect' : 'Select',
          icon: <SelectAllIcon fontSize="small" />,
          onClick: () => handleToggleSelect(item)
        },
        ...(hasSelection ? [
          { divider: true },
          {
            label: `Cut ${selectedItemsArray.length} item${selectedItemsArray.length > 1 ? 's' : ''}`,
            icon: <CutIcon fontSize="small" />,
            onClick: () => handleClipboardOperation(selectedItemsArray, 'cut')
          },
          {
            label: `Copy ${selectedItemsArray.length} item${selectedItemsArray.length > 1 ? 's' : ''}`,
            icon: <CopyIcon fontSize="small" />,
            onClick: () => handleClipboardOperation(selectedItemsArray, 'copy')
          },
          {
            label: `Delete ${selectedItemsArray.length} item${selectedItemsArray.length > 1 ? 's' : ''}`,
            icon: <DeleteIcon fontSize="small" />,
            onClick: () => setDeleteDialog({ open: true, items: selectedItemsArray })
          }
        ] : [])
      ];
    }
    
    // Regular context menu options
    return [
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
        label: 'Cut',
        icon: <CutIcon fontSize="small" />,
        onClick: () => handleClipboardOperation([item], 'cut')
      },
      {
        label: 'Copy',
        icon: <CopyIcon fontSize="small" />,
        onClick: () => handleClipboardOperation([item], 'copy')
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
  };

  // Handle right-click on bookmark/folder
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    
    const menuItems = generateContextMenu(item, isMultiSelectMode, selectedItems);
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item,
      menuItems
    });
  };

  // Handle right-click on empty space (background)
  const handleBackgroundContextMenu = (e) => {
    e.preventDefault();
    
    // Only show background context menu in the current folder view (not search)
    if (isSearchMode) return;
    
    const menuItems = [
      {
        label: 'Paste',
        icon: <PasteIcon fontSize="small" />,
        onClick: handlePaste
      },
      { divider: true },
      {
        label: 'New Folder',
        icon: <NewFolderIcon fontSize="small" />,
        onClick: () => setCreateFolderDialog(true)
      },
      {
        label: 'Select All',
        icon: <SelectAllIcon fontSize="small" />,
        onClick: () => {
          setIsMultiSelectMode(true);
          setSelectedItems(bookmarks);
        }
      },
      { divider: true },
      {
        label: darkMode ? 'Light Mode' : 'Dark Mode',
        icon: darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />,
        onClick: handleToggleDarkMode
      }
    ];
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: null,
      menuItems
    });
  };

  // Handle renaming a bookmark or folder
  const handleRename = async (item, newName) => {
    if (!newName || newName === item.title) return;
    
    try {
      if (newName.length > 50) {
        showSnackbar('Name is too long. Maximum 50 characters allowed.', 'error');
        return;
      }
      
      await updateBookmark(item.id, { title: newName });
      showSnackbar(`Renamed to '${newName}'`, 'success');
      
      // Close the dialog
      setRenameDialog({ open: false, item: null });
      refreshCurrentFolder();
    } catch (error) {
      console.error('Error renaming item:', error);
      showSnackbar('Error renaming item', 'error');
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
      
      showSnackbar(`${items.length} item${items.length > 1 ? 's' : ''} deleted`, 'success');
      
      // Close the dialog
      setDeleteDialog({ open: false, items: [] });
      
      // Clear selection
      setSelectedItems([]);
      setIsMultiSelectMode(false);
      
      // Refresh the current folder
      refreshCurrentFolder();
    } catch (error) {
      console.error('Error deleting items:', error);
      showSnackbar('Error deleting items', 'error');
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
      
      showSnackbar('Icon updated', 'success');
      
      // Close the dialog
      setIconDialog({ open: false, item: null });
      refreshCurrentFolder();
    } catch (error) {
      console.error('Error changing icon:', error);
      showSnackbar('Error updating icon', 'error');
    }
  };

  // Listen for multi-item drop messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MULTI_ITEM_DROP') {
        // Handle multi-item drop
        const targetFolderId = event.data.targetFolderId;
        if (selectedItems.length > 0 && targetFolderId) {
          const itemIds = selectedItems.map(item => item.id);
          handleDropInFolder(itemIds, targetFolderId);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [selectedItems]);

  // Handle reordering of bookmarks
  const handleReorderItems = async (dragId, hoverId, dragIndex, hoverIndex) => {
    try {
      // Get the items being reordered
      const draggedItem = bookmarks.find(item => item.id === dragId);
      const targetItem = bookmarks.find(item => item.id === hoverId);

      if (!draggedItem || !targetItem) return;

      // Calculate the index to insert the draggedItem at
      // If moving right, insert after the target; if moving left, insert before
      const insertIndex = dragIndex < hoverIndex ? 
        parseInt(targetItem.index) + 1 : // After target
        parseInt(targetItem.index);      // Before target

      // Move the bookmark using Chrome API
      await moveBookmark(draggedItem.id, { parentId: currentFolder.id, index: insertIndex });
      
      // Exit multi-select mode after reordering if active
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedItems([]);
      }
      
      // Refresh the current folder to reflect changes
      refreshCurrentFolder();
    } catch (error) {
      console.error('Error reordering bookmarks:', error);
      showSnackbar('Error reordering bookmarks', 'error');
    }
  };

  // Toggle organize mode
  const handleToggleOrganizeMode = () => {
    if (isOrganizeMode) {
      // Exiting organize mode without saving changes
      if (pendingChanges) {
        // Discard changes by reverting to saved positions
        showSnackbar('Changes discarded', 'info');
      }
      setIsOrganizeMode(false);
      setPendingChanges(false);
      setTempPositions({});
    } else {
      // Entering organize mode
      // Initialize temp positions with current positions
      setTempPositions({...itemPositions});
      setIsOrganizeMode(true);
      showSnackbar('Organize Mode: Rearrange items and click Save when done', 'info');
    }
  };

  // Save changes made in organize mode
  const handleSaveOrganizedItems = () => {
    if (!pendingChanges) {
      showSnackbar('No changes to save', 'info');
      return;
    }
    
    // Save the temporary positions to permanent storage
    setItemPositions(tempPositions);
    savePositions(tempPositions);
    
    // Exit organize mode
    setIsOrganizeMode(false);
    setPendingChanges(false);
    setTempPositions({});
    
    showSnackbar('Item positions saved successfully', 'success');
  };

  // Handle temporary position changes in organize mode
  const handleTempPositionChange = (id, position) => {
    setTempPositions(prev => {
      const newPositions = { ...prev, [id]: position };
      setPendingChanges(true);
      return newPositions;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DndProvider backend={HTML5Backend}>
        <Box 
          sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
          onContextMenu={handleBackgroundContextMenu}
        >
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
            onRefresh={refreshCurrentFolder}
            isDesktopView={isDesktopView}
            onToggleView={handleToggleView}
            isMultiSelectMode={isMultiSelectMode}
            onToggleMultiSelect={handleToggleMultiSelect}
            selectedCount={selectedItems.length}
            onDeleteSelected={() => {
              if (selectedItems.length > 0) {
                setDeleteDialog({ open: true, items: selectedItems });
              }
            }}
            onCutSelected={() => {
              if (selectedItems.length > 0) {
                handleClipboardOperation(selectedItems, 'cut');
              }
            }}
            onCopySelected={() => {
              if (selectedItems.length > 0) {
                handleClipboardOperation(selectedItems, 'copy');
              }
            }}
            onPaste={handlePaste}
            darkMode={darkMode}
            iconSize={iconSize}
            onIconSizeChange={handleIconSizeChange}
          />
          
          <BookmarkGrid 
            bookmarks={isSearchMode ? searchResults : bookmarks}
            currentFolder={currentFolder}
            onNavigate={navigateTo}
            onContextMenu={handleContextMenu}
            onRefresh={refreshCurrentFolder}
            isDesktopView={isDesktopView}
            itemPositions={itemPositions}
            onItemPositionChange={handleItemPositionChange}
            isMultiSelectMode={isMultiSelectMode}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
            darkMode={darkMode}
            onDropInFolder={handleDropInFolder}
            onReorderItems={handleReorderItems}
            iconSize={iconSize}
            // Pass organize mode props
            isOrganizeMode={isOrganizeMode}
            onToggleOrganizeMode={handleToggleOrganizeMode}
            onTempPositionChange={handleTempPositionChange}
            onSaveOrganizedItems={handleSaveOrganizedItems}
          />
          
          {/* Feedback notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert 
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
          
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