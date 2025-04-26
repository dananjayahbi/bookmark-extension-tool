import React from 'react';
import { 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider 
} from '@mui/material';

const ContextMenu = ({ anchorPosition, isVisible, menuItems, onClose }) => {
  return (
    <Menu
      open={isVisible}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        isVisible
          ? { top: anchorPosition.y, left: anchorPosition.x }
          : undefined
      }
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          <MenuItem
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
          {index < menuItems.length - 1 && item.divider && <Divider />}
        </React.Fragment>
      ))}
    </Menu>
  );
};

export default ContextMenu;