/**
 * Utility functions for Chrome bookmark operations
 */

// Get all bookmarks
export const getAllBookmarks = () => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(results);
      }
    });
  });
};

// Create a new bookmark
export const createBookmark = (parentId, title, url = '') => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create(
      {
        parentId,
        title,
        url
      },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// Create a new folder
export const createFolder = (parentId, title) => {
  return createBookmark(parentId, title);
};

// Update a bookmark or folder
export const updateBookmark = (id, changes) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.update(id, changes, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
};

// Remove a bookmark
export const removeBookmark = (id) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

// Remove a folder and all its contents
export const removeFolder = (id) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

// Move a bookmark or folder
export const moveBookmark = (id, destination) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(id, destination, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
};

// Search for bookmarks
export const searchBookmarks = (query) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search(query, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(results);
      }
    });
  });
};

// Get website favicon URL
export const getBookmarkIconUrl = (url) => {
  if (!url) return null;
  try {
    // Extract the domain from the URL
    const domain = new URL(url).hostname;
    // Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return null;
  }
};

// Upload and save a custom icon
export const uploadCustomIcon = (id, iconData) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [`customIcon_${id}`]: iconData,
      [`icon_${id}`]: 'custom' // Mark as using a custom icon
    }, () => {
      resolve();
    });
  });
};

// Get custom icon type (predefined icon name)
export const getCustomIcon = (id) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(`icon_${id}`, (result) => {
      const iconType = result[`icon_${id}`];
      resolve(iconType !== 'custom' ? iconType : null);
    });
  });
};

// Set custom icon (predefined icon name)
export const setCustomIcon = (id, iconName) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [`icon_${id}`]: iconName }, () => {
      resolve();
    });
  });
};

// Get custom icon or upload data
export const getCustomIconData = (id) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([`customIcon_${id}`, `icon_${id}`], (result) => {
      if (result[`icon_${id}`] === 'custom') {
        resolve(result[`customIcon_${id}`]);
      } else {
        resolve(null);
      }
    });
  });
};

// Copy custom icon data from one bookmark to another
export const copyCustomIconData = async (sourceId, targetId) => {
  const iconType = await getCustomIcon(sourceId);
  
  if (iconType === 'custom') {
    // Copy custom icon data
    const iconData = await getCustomIconData(sourceId);
    if (iconData) {
      await uploadCustomIcon(targetId, iconData);
    }
  } else if (iconType) {
    // Copy predefined icon type
    await setCustomIcon(targetId, iconType);
  }
};

// Save view preference (desktop or grid)
export const saveViewPreference = (isDesktopView) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ isDesktopView }, () => {
      resolve();
    });
  });
};

// Get view preference (desktop or grid)
export const getSavedViewPreference = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get('isDesktopView', (result) => {
      resolve(result.isDesktopView || false);
    });
  });
};

// Get saved positions for bookmark items in desktop view
export const getSavedPositions = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get('itemPositions', (result) => {
      resolve(result.itemPositions || {});
    });
  });
};

// Save positions for bookmark items in desktop view
export const savePositions = (positions) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ itemPositions: positions }, () => {
      resolve();
    });
  });
};

// Save clipboard data for cut/copy operations
export const saveToClipboard = (items, operation) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 
      bookmarkClipboard: {
        items,
        operation, // 'cut' or 'copy'
        timestamp: Date.now()
      }
    }, () => {
      resolve();
    });
  });
};

// Get clipboard data for paste operations
export const getClipboardData = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get('bookmarkClipboard', (result) => {
      resolve(result.bookmarkClipboard || null);
    });
  });
};

// Clear clipboard data (e.g., after cut operations are completed)
export const clearClipboard = () => {
  return new Promise((resolve) => {
    chrome.storage.local.remove('bookmarkClipboard', () => {
      resolve();
    });
  });
};

// Check if a bookmark name is a duplicate in the parent folder
export const isDuplicateName = async (parentId, name) => {
  const parent = await chrome.bookmarks.getSubTree(parentId);
  if (!parent[0] || !parent[0].children) return false;
  
  return parent[0].children.some(child => child.title === name);
};

// Generate a unique name to avoid duplicates
export const generateUniqueName = async (parentId, baseName) => {
  let name = baseName;
  let counter = 2;
  let isDuplicate = await isDuplicateName(parentId, name);
  
  while (isDuplicate) {
    name = `${baseName} (${counter})`;
    counter++;
    isDuplicate = await isDuplicateName(parentId, name);
  }
  
  return name;
};

// Helper function to flatten bookmark tree
export const flatten = (bookmarkTree) => {
  const result = [];
  
  const traverse = (nodes) => {
    if (!nodes) return;
    
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        traverse(node.children);
      }
    }
  };
  
  traverse(bookmarkTree);
  return result;
};

// Helper function to find a bookmark by ID
export const findBookmarkById = (flatBookmarks, id) => {
  return flatBookmarks.find(bookmark => bookmark.id === id);
};

// Helper function to calculate folder depth
export const calculateFolderDepth = async (folderId) => {
  const bookmarkTree = await getAllBookmarks();
  const flatBookmarks = flatten(bookmarkTree);
  
  let depth = 0;
  let currentId = folderId;
  
  while (currentId !== '0' && currentId !== '1') {
    const bookmark = findBookmarkById(flatBookmarks, currentId);
    if (!bookmark) break;
    
    depth++;
    currentId = bookmark.parentId;
  }
  
  return depth;
};

// Helper to get all data for an item by ID
export const getBookmarkData = async (id) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.get(id, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (results && results.length > 0) {
        resolve(results[0]);
      } else {
        reject(new Error('Bookmark not found'));
      }
    });
  });
};

// Deep clone a bookmark (including custom icons) into a target folder
export const cloneBookmark = async (sourceId, targetFolderId) => {
  try {
    // Get source bookmark data
    const source = await getBookmarkData(sourceId);
    const isFolder = !source.url;
    
    // For folders, recursively clone children
    if (isFolder) {
      // Create new folder in target location
      const uniqueName = await generateUniqueName(targetFolderId, source.title);
      const newFolder = await createFolder(targetFolderId, uniqueName);
      
      // Copy custom icon if any
      await copyCustomIconData(sourceId, newFolder.id);
      
      // Get children of source folder
      const children = await new Promise((resolve, reject) => {
        chrome.bookmarks.getChildren(sourceId, (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(results);
          }
        });
      });
      
      // Recursively clone each child into the new folder
      for (const child of children) {
        await cloneBookmark(child.id, newFolder.id);
      }
      
      return newFolder;
    } else {
      // For regular bookmarks, simply create new with same properties
      const uniqueName = await generateUniqueName(targetFolderId, source.title);
      const newBookmark = await createBookmark(
        targetFolderId,
        uniqueName,
        source.url
      );
      
      // Copy custom icon if any
      await copyCustomIconData(sourceId, newBookmark.id);
      
      return newBookmark;
    }
  } catch (error) {
    console.error('Error cloning bookmark:', error);
    throw error;
  }
};