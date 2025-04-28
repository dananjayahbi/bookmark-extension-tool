import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText,
  DialogActions, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { 
  Folder as FolderIcon,
  Description as BookmarkIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const DeleteConfirmationDialog = ({ open, items, onClose, onDelete }) => {
  if (!items || items.length === 0) return null;
  
  const containsFolders = items.some(item => !item.url);
  const containsBookmarks = items.some(item => item.url);
  
  // Check if any folders have children
  const hasFolderChildren = items.some(item => !item.url && item.children && item.children.length > 0);
  
  const getItemIcon = (item) => {
    return item.url ? <BookmarkIcon color="primary" /> : <FolderIcon color="primary" />;
  };
  
  const getTitle = () => {
    if (items.length === 1) {
      return `Delete ${items[0].url ? 'Bookmark' : 'Folder'}`;
    } else {
      let title = 'Delete Items';
      if (containsFolders && !containsBookmarks) {
        title = 'Delete Folders';
      } else if (containsBookmarks && !containsFolders) {
        title = 'Delete Bookmarks';
      }
      return title;
    }
  };
  
  const getMessage = () => {
    if (items.length === 1) {
      const item = items[0];
      if (item.url) {
        return `Are you sure you want to delete the bookmark "${item.title}"?`;
      } else {
        if (item.children && item.children.length > 0) {
          return `Are you sure you want to delete the folder "${item.title}" and all its contents? This action cannot be undone.`;
        } else {
          return `Are you sure you want to delete the empty folder "${item.title}"?`;
        }
      }
    } else {
      let message = `Are you sure you want to delete these ${items.length} items?`;
      
      const folderCount = items.filter(item => !item.url).length;
      const bookmarkCount = items.filter(item => item.url).length;
      
      if (folderCount && bookmarkCount) {
        message = `Are you sure you want to delete ${folderCount} folder${folderCount > 1 ? 's' : ''} and ${bookmarkCount} bookmark${bookmarkCount > 1 ? 's' : ''}?`;
      } else if (folderCount) {
        message = `Are you sure you want to delete ${folderCount} folder${folderCount > 1 ? 's' : ''}?`;
      } else if (bookmarkCount) {
        message = `Are you sure you want to delete ${bookmarkCount} bookmark${bookmarkCount > 1 ? 's' : ''}?`;
      }
      
      if (hasFolderChildren) {
        message += ' Some folders contain items which will also be deleted. This action cannot be undone.';
      }
      
      return message;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {getTitle()}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {getMessage()}
        </DialogContentText>
        
        {items.length > 1 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Items to delete:
            </Typography>
            <List dense>
              {items.map((item) => (
                <ListItem key={item.id}>
                  <ListItemIcon>
                    {getItemIcon(item)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    secondary={item.url ? new URL(item.url).hostname : (
                      item.children && item.children.length > 0 ? 
                      `Contains ${item.children.length} item${item.children.length > 1 ? 's' : ''}` : 
                      'Empty folder'
                    )}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        
        {hasFolderChildren && (
          <Typography 
            color="error" 
            variant="body2" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 2 
            }}
          >
            <WarningIcon fontSize="small" sx={{ mr: 1 }} />
            Warning: Deleting folders will permanently delete all contents
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => onDelete(items)} 
          color="error" 
          variant="contained" 
          autoFocus
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;