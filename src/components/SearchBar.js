import React from 'react';
import { TextField, InputAdornment, Paper } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchBar = ({ searchQuery, onSearchChange }) => {
  return (
    <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search bookmarks..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Paper>
  );
};

export default SearchBar;