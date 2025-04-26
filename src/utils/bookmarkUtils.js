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

// Get custom icon for a bookmark or folder
export const getCustomIcon = (id) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([`icon_${id}`], (result) => {
      resolve(result[`icon_${id}`] || null);
    });
  });
};

// Set custom icon for a bookmark or folder
export const setCustomIcon = (id, iconName) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [`icon_${id}`]: iconName }, () => {
      resolve();
    });
  });
};

// Calculate folder depth (to enforce max depth of 5)
export const calculateFolderDepth = async (folderId) => {
  let depth = 0;
  let currentId = folderId;
  
  while (currentId !== '0' && currentId !== '1') {
    const bookmarks = await getAllBookmarks();
    const folder = findBookmarkById(flatten(bookmarks), currentId);
    
    if (!folder || !folder.parentId) break;
    
    currentId = folder.parentId;
    depth++;
  }
  
  return depth;
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

// Save view preference (desktop or grid)
export const saveViewPreference = (isDesktopView) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ isDesktopView }, () => {
      resolve();
    });
  });
};

// Get view preference (desktop or grid)
export const getViewPreference = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get('isDesktopView', (result) => {
      resolve(result.isDesktopView || false);
    });
  });
};

// Get navigation history
export const getSavedNavigationHistory = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['history', 'historyIndex'], (result) => {
      resolve({
        history: result.history || [],
        historyIndex: result.historyIndex || -1
      });
    });
  });
};

// Save navigation history
export const saveNavigationHistory = (history, historyIndex) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ history, historyIndex }, () => {
      resolve();
    });
  });
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