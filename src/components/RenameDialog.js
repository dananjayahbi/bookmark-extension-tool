import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button 
} from '@mui/material';

const RenameDialog = ({ open, item, onClose, onRename }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setNewName(item.title || '');
    }
  }, [item]);

  const handleSubmit = () => {
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    if (newName.length > 50) {
      setError('Name cannot exceed 50 characters');
      return;
    }
    
    if (item) {
      onRename(item, newName);
    }
    setError('');
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Rename {item && !item.url ? 'Folder' : 'Bookmark'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="New Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (e.target.value.trim()) setError('');
          }}
          error={!!error}
          helperText={error}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;