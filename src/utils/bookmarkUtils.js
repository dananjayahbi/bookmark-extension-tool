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