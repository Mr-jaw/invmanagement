// Utility functions for managing dropdown menus

export const setupDropdownClickOutside = () => {
  // Close all dropdowns when clicking outside
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Get all dropdown elements
    const dropdowns = document.querySelectorAll('[id$="-dropdown"]');
    
    dropdowns.forEach((dropdown) => {
      const button = dropdown.previousElementSibling;
      
      // If click is not on the button or inside the dropdown, close it
      if (button && !button.contains(target) && !dropdown.contains(target)) {
        dropdown.classList.add('hidden');
      }
    });
  });
};

export const toggleDropdown = (dropdownId: string) => {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    // Close all other dropdowns first
    const allDropdowns = document.querySelectorAll('[id$="-dropdown"]');
    allDropdowns.forEach((d) => {
      if (d.id !== dropdownId) {
        d.classList.add('hidden');
      }
    });
    
    // Toggle the target dropdown
    dropdown.classList.toggle('hidden');
  }
};

// Initialize dropdown functionality
export const initializeDropdowns = () => {
  setupDropdownClickOutside();
};