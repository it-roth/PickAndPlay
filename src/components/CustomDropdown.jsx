import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Dropdown as BSDropdown } from 'react-bootstrap';

// Custom Dropdown component that uses React Portal to prevent positioning issues
export const Dropdown = ({ children, ...props }) => {
  const [menuElement, setMenuElement] = useState(null);
  
  // Create a portal container for the dropdown menu
  useEffect(() => {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.zIndex = '1050';
    document.body.appendChild(element);
    setMenuElement(element);
    
    return () => {
      document.body.removeChild(element);
    };
  }, []);
  
  // Find the toggle and menu elements from the children
  const toggle = React.Children.toArray(children).find(
    child => child.type === BSDropdown.Toggle
  );
  
  const menu = React.Children.toArray(children).find(
    child => child.type === BSDropdown.Menu
  );
  
  // Render the dropdown with the toggle in the original location
  // and the menu in the portal container
  return (
    <BSDropdown {...props}>
      {toggle}
      {menuElement && menu && ReactDOM.createPortal(menu, menuElement)}
    </BSDropdown>
  );
};

// Re-export all other Dropdown subcomponents
Dropdown.Toggle = BSDropdown.Toggle;
Dropdown.Menu = BSDropdown.Menu;
Dropdown.Item = BSDropdown.Item;
Dropdown.Header = BSDropdown.Header;
Dropdown.Divider = BSDropdown.Divider;

export default Dropdown;