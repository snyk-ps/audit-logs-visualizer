import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook to manage filters for audit logs
 * This extracts the filtering logic from the AuditLogsVisualization component
 */
const useAuditLogFilters = (auditLogs) => {
  const [eventFilter, setEventFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    category: null,
    subcategory: null,
    action: null,
    subaction: null
  });
  const [showEventFilterDropdown, setShowEventFilterDropdown] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showOrgFilterDropdown, setShowOrgFilterDropdown] = useState(false);
  const [orgFilters, setOrgFilters] = useState({});
  const [showGroupFilterDropdown, setShowGroupFilterDropdown] = useState(false);
  const [groupFilters, setGroupFilters] = useState({});

  // Parse events into hierarchical structure
  const eventCategories = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return {};
    
    // Create a hierarchical structure: { category: { subcategory: { action: [subactions] } } }
    const categories = {};
    
    auditLogs.forEach(log => {
      if (!log.event) return;
      
      const parts = log.event.split('.');
      const category = parts[0] || 'unknown';
      const subcategory = parts.length > 1 ? parts[1] : 'other';
      
      // Handle actions and subactions differently
      let action = 'other';
      let subaction = 'other';
      
      if (parts.length > 2) {
        action = parts[2];
        if (parts.length > 3) {
          subaction = parts.slice(3).join('.');
        }
      }
      
      // Create category if it doesn't exist
      if (!categories[category]) {
        categories[category] = {};
      }
      
      // Create subcategory if it doesn't exist
      if (!categories[category][subcategory]) {
        categories[category][subcategory] = {};
      }
      
      // Create action if it doesn't exist
      if (!categories[category][subcategory][action]) {
        categories[category][subcategory][action] = new Set();
      }
      
      // Add subaction
      categories[category][subcategory][action].add(subaction);
    });
    
    return categories;
  }, [auditLogs]);

  // Initialize category filters when eventCategories changes
  useEffect(() => {
    if (Object.keys(eventCategories).length > 0 && Object.keys(categoryFilters).length === 0) {
      const initialFilters = {};
      const initialExpanded = {};
      
      // Initialize all categories, subcategories, actions, and subactions as checked
      Object.keys(eventCategories).forEach(category => {
        initialFilters[category] = true;
        initialExpanded[category] = true;
        
        Object.keys(eventCategories[category]).forEach(subcategory => {
          const subcategoryKey = `${category}.${subcategory}`;
          initialFilters[subcategoryKey] = true;
          
          Object.keys(eventCategories[category][subcategory]).forEach(action => {
            const actionKey = `${category}.${subcategory}.${action}`;
            initialFilters[actionKey] = true;
            
            eventCategories[category][subcategory][action].forEach(subaction => {
              const subactionKey = `${category}.${subcategory}.${action}.${subaction}`;
              initialFilters[subactionKey] = true;
            });
          });
        });
      });
      
      setCategoryFilters(initialFilters);
      setExpandedCategories(initialExpanded);
    }
  }, [eventCategories, categoryFilters]);

  // Create unique org list
  const uniqueOrgs = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];
    
    const orgsMap = new Map();
    
    auditLogs.forEach(log => {
      if (log.org_id) {
        if (!orgsMap.has(log.org_id)) {
          orgsMap.set(log.org_id, {
            id: log.org_id,
            name: log.org_id // This will be replaced with actual name when getOrgInfo is available
          });
        }
      }
    });
    
    return Array.from(orgsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [auditLogs]);

  // Create unique group list
  const uniqueGroups = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];
    
    const groupsMap = new Map();
    
    auditLogs.forEach(log => {
      // Check for group_id directly in the log
      if (log.group_id) {
        if (!groupsMap.has(log.group_id)) {
          groupsMap.set(log.group_id, {
            id: log.group_id,
            name: `Group ${log.group_id.substring(0, 8)}...`
          });
        }
      }
      
      // Also check for group_id in the log.content
      if (log.content && log.content.group_id) {
        if (!groupsMap.has(log.content.group_id)) {
          groupsMap.set(log.content.group_id, {
            id: log.content.group_id,
            name: `Group ${log.content.group_id.substring(0, 8)}...`
          });
        }
      }
    });
    
    return Array.from(groupsMap.values());
  }, [auditLogs]);

  // Update org names when getOrgInfo becomes available
  const updateOrgNames = (getOrgInfo) => {
    if (!getOrgInfo || uniqueOrgs.length === 0) return;
    
    const updatedOrgs = uniqueOrgs.map(org => ({
      ...org,
      name: getOrgInfo(org.id).name
    }));
    
    return updatedOrgs.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Handle category filter click
  const handleCategoryFilter = (category, subcategory = null, action = null, subaction = null) => {
    setActiveFilters(prev => {
      // If clicking on the same category, toggle it off
      if (prev.category === category && prev.subcategory === subcategory && 
          prev.action === action && prev.subaction === subaction) {
        return { category: null, subcategory: null, action: null, subaction: null };
      }
      
      return { category, subcategory, action, subaction };
    });
  };
  
  // Handle checkbox filter change
  const handleCheckboxChange = (key) => {
    setCategoryFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Toggle category expansion
  const toggleCategoryExpansion = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Select/Deselect all categories
  const selectAllCategories = (select) => {
    const newFilters = { ...categoryFilters };
    
    Object.keys(newFilters).forEach(key => {
      newFilters[key] = select;
    });
    
    setCategoryFilters(newFilters);
  };

  // Select or deselect all orgs
  const selectAllOrgs = (select) => {
    const newFilters = {};
    uniqueOrgs.forEach(org => {
      newFilters[org.id] = select;
    });
    setOrgFilters(newFilters);
  };

  // Handle org filter checkbox changes
  const handleOrgFilterChange = (orgId, checked) => {
    setOrgFilters(prev => ({
      ...prev,
      [orgId]: checked
    }));
  };

  // Select or deselect all groups
  const selectAllGroups = (select) => {
    const newFilters = {};
    uniqueGroups.forEach(group => {
      newFilters[group.id] = select;
    });
    setGroupFilters(newFilters);
  };

  // Handle group filter checkbox changes
  const handleGroupFilterChange = (groupId, checked) => {
    setGroupFilters(prev => ({
      ...prev,
      [groupId]: checked
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setEventFilter('');
    setActiveFilters({ category: null, subcategory: null, action: null, subaction: null });
    
    // Reset all category filters to checked
    const newCategoryFilters = {};
    Object.keys(eventCategories).forEach(category => {
      newCategoryFilters[category] = true;
      
      Object.keys(eventCategories[category]).forEach(subcategory => {
        const subcategoryKey = `${category}.${subcategory}`;
        newCategoryFilters[subcategoryKey] = true;
        
        Object.keys(eventCategories[category][subcategory]).forEach(action => {
          const actionKey = `${category}.${subcategory}.${action}`;
          newCategoryFilters[actionKey] = true;
          
          eventCategories[category][subcategory][action].forEach(subaction => {
            const subactionKey = `${category}.${subcategory}.${action}.${subaction}`;
            newCategoryFilters[subactionKey] = true;
          });
        });
      });
    });
    
    setCategoryFilters(newCategoryFilters);
    
    // Reset all org filters to checked
    const newOrgFilters = {};
    uniqueOrgs.forEach(org => {
      newOrgFilters[org.id] = true;
    });
    setOrgFilters(newOrgFilters);
    
    // Reset all group filters to checked
    const newGroupFilters = {};
    uniqueGroups.forEach(group => {
      newGroupFilters[group.id] = true;
    });
    setGroupFilters(newGroupFilters);
  };

  return {
    // State
    eventFilter,
    activeFilters,
    showEventFilterDropdown,
    categoryFilters,
    expandedCategories,
    showOrgFilterDropdown,
    orgFilters,
    showGroupFilterDropdown,
    groupFilters,
    
    // Derived data
    eventCategories,
    uniqueOrgs,
    uniqueGroups,
    
    // State updaters
    setEventFilter,
    setActiveFilters,
    setShowEventFilterDropdown,
    setCategoryFilters,
    setExpandedCategories,
    setShowOrgFilterDropdown,
    setOrgFilters,
    setShowGroupFilterDropdown,
    setGroupFilters,
    
    // Methods
    handleCategoryFilter,
    handleCheckboxChange,
    toggleCategoryExpansion,
    selectAllCategories,
    selectAllOrgs,
    handleOrgFilterChange,
    selectAllGroups,
    handleGroupFilterChange,
    clearFilters,
    updateOrgNames
  };
};

export default useAuditLogFilters; 