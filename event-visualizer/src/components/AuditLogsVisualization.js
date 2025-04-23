import React, { useState, useEffect, useMemo, useRef } from 'react';
import EnhancedVisualizations from './EnhancedVisualizations';

function AuditLogsVisualization({ config }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [orgDetails, setOrgDetails] = useState({});
  const [loadingOrgs, setLoadingOrgs] = useState(false);
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
  const dropdownRef = useRef(null);
  const orgFilterRef = useRef(null);
  const eventFilterRef = useRef(null);
  const eventFilterDropdownRef = useRef(null);
  const orgFilterDropdownRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [isHovering, setIsHovering] = useState(null);
  const [search, setSearch] = useState('');
  const [showOrgFilterDropdown, setShowOrgFilterDropdown] = useState(false);
  const [orgFilters, setOrgFilters] = useState({});
  const [showGroupFilterDropdown, setShowGroupFilterDropdown] = useState(false);
  const [groupFilters, setGroupFilters] = useState({});
  const groupFilterRef = useRef(null);
  const groupFilterDropdownRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Toggle event filter dropdown
  const toggleEventFilterDropdown = () => {
    // When opening the dropdown, expand all categories by default
    if (!showEventFilterDropdown) {
      const expandAll = {};
      Object.keys(eventCategories).forEach(category => {
        expandAll[category] = true;
      });
      setExpandedCategories(expandAll);
    }
    setShowEventFilterDropdown(!showEventFilterDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEventFilterDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(''); // Clear any previous errors
    try {
      let url = 'http://localhost:3001/api/audit-logs';
      
      // Choose endpoint based on the available config
      if (config) {
        if (config.SNYK_GROUP_ID) {
          url = `http://localhost:3001/api/audit-logs/group/${config.SNYK_GROUP_ID}`;
          console.log(`Fetching audit logs for group ID: ${config.SNYK_GROUP_ID}`);
        } else if (config.SNYK_ORG_ID) {
          url = `http://localhost:3001/api/audit-logs/org/${config.SNYK_ORG_ID}`;
          console.log(`Fetching audit logs for org ID: ${config.SNYK_ORG_ID}`);
        }
      }
      
      console.log(`Fetching logs from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        // Parse the response to get detailed error info
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.message}: ${errorData.details}` 
          : errorData.message || `Failed to fetch audit logs: ${response.status} ${response.statusText}`;
          
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setAuditLogs(data);
      
      // After setting audit logs, fetch user details and org details
      fetchUserDetails(data);
      fetchOrgDetails(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (logs) => {
    if (!logs || !logs.length) return;
    
    setLoadingUsers(true);
    
    // Get unique user IDs to avoid duplicate requests
    const uniqueUserIds = [...new Set(logs.map(log => log.user_id).filter(id => id))];

    // Find all unique organization IDs in the logs
    const logsOrgIds = [...new Set(logs.map(log => log.org_id).filter(id => id))];
    
    // We need org IDs from the logs to fetch user details
    if (logsOrgIds.length === 0) {
      console.warn('No organization IDs found in logs');
      setLoadingUsers(false);
      return;
    }
    
    const userDetailsMap = { ...userDetails };
    
    try {
      // Process each organization found in the logs
      for (const orgId of logsOrgIds) {
        // Find all user IDs that appear with this org ID in the logs
        const orgUserIds = uniqueUserIds.filter(userId => 
          logs.some(log => log.org_id === orgId && log.user_id === userId)
        );

        console.log(`Fetching ${orgUserIds.length} user details for org ${orgId}`);
        
        // Fetch user details for each unique user ID in this organization
        const promises = orgUserIds.map(async (userId) => {
          try {
            const response = await fetch(`http://localhost:3001/api/user/${orgId}/${userId}`);
            if (!response.ok) {
              console.warn(`Failed to fetch details for user ${userId} in org ${orgId}`);
              return null;
            }
            const userData = await response.json();
            return { userId, userData };
          } catch (err) {
            console.error(`Error fetching user ${userId} in org ${orgId}:`, err);
            return null;
          }
        });
        
        // Wait for all promises to resolve
        const results = await Promise.all(promises);
        
        // Update the user details map
        results.forEach(result => {
          if (result) {
            userDetailsMap[result.userId] = result.userData;
          }
        });
      }
      
      setUserDetails(userDetailsMap);
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchOrgDetails = async (logs) => {
    if (!logs || !logs.length) return;
    
    setLoadingOrgs(true);
    
    // Get unique org IDs to avoid duplicate requests
    const uniqueOrgIds = [...new Set(logs.map(log => log.org_id).filter(id => id))];
    
    if (uniqueOrgIds.length === 0) {
      console.error('No organization IDs found in logs');
      setLoadingOrgs(false);
      return;
    }
    
    const orgDetailsMap = { ...orgDetails };
    
    try {
      // Fetch details for each unique org ID
      const promises = uniqueOrgIds.map(async (orgId) => {
        try {
          const response = await fetch(`http://localhost:3001/api/org/${orgId}`);
          if (!response.ok) {
            console.warn(`Failed to fetch details for org ${orgId}`);
            return null;
          }
          const orgData = await response.json();
          return { orgId, orgData };
        } catch (err) {
          console.error(`Error fetching org ${orgId}:`, err);
          return null;
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Update the org details map
      results.forEach(result => {
        if (result) {
          orgDetailsMap[result.orgId] = result.orgData;
        }
      });
      
      setOrgDetails(orgDetailsMap);
    } catch (err) {
      console.error('Error fetching org details:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    if (config) {
      fetchAuditLogs();
    }
  }, [config]);

  // Function to extract user name and email from user details
  const getUserInfo = (userId) => {
    if (!userId) return { name: 'N/A', email: 'N/A' };
    
    const user = userDetails[userId];
    if (!user || !user.data || !user.data.attributes) {
      return { name: 'N/A', email: 'N/A' };
    }
    
    return {
      name: user.data.attributes.name || 'N/A',
      email: user.data.attributes.email || 'N/A'
    };
  };

  // Function to get organization slug and construct project URL
  const getProjectUrl = (orgId, projectId) => {
    if (!orgId || !projectId) return null;
    
    const org = orgDetails[orgId];
    if (!org || !org.attributes || !org.attributes.slug) {
      return null;
    }
    
    const slug = org.attributes.slug;
    return `https://app.snyk.io/org/${slug}/project/${projectId}/`;
  };

  // Function to extract org name from org details
  const getOrgInfo = (orgId) => {
    if (!orgId) return { name: 'N/A', slug: 'N/A' };
    
    const org = orgDetails[orgId];
    if (!org || !org.attributes) {
      return { name: orgId, slug: 'N/A' };
    }
    
    return {
      name: org.attributes.name || org.attributes.slug || orgId,
      slug: org.attributes.slug || 'N/A'
    };
  };

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
        initialExpanded[category] = true; // Set all categories to be expanded by default
        
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
  
  // Filter logs based on selected categories and checkbox filters
  const filteredLogs = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];
    
    // If no filters and no search, return all logs
    if (!activeFilters.category && !eventFilter && 
        (!categoryFilters || Object.keys(categoryFilters).length === 0 || 
         Object.values(categoryFilters).every(value => value === true)) &&
        (!orgFilters || Object.keys(orgFilters).length === 0 ||
         Object.values(orgFilters).every(value => value === true)) &&
        (!groupFilters || Object.keys(groupFilters).length === 0 ||
         Object.values(groupFilters).every(value => value === true))) {
      return auditLogs;
    }
    
    return auditLogs.filter(log => {
      // Text-based filtering - search in event name, user name, or user email
      if (eventFilter) {
        const searchTerm = eventFilter.toLowerCase();
        
        // Check event name
        const eventMatch = log.event && log.event.toLowerCase().includes(searchTerm);
        
        // Check user details (name and email)
        let userMatch = false;
        if (log.user_id) {
          const userInfo = getUserInfo(log.user_id);
          userMatch = 
            (userInfo.name && userInfo.name.toLowerCase().includes(searchTerm)) || 
            (userInfo.email && userInfo.email.toLowerCase().includes(searchTerm)) ||
            (log.user_id.toLowerCase().includes(searchTerm));
        }
        
        // Check group ID
        let groupMatch = false;
        if (log.group_id) {
          groupMatch = log.group_id.toLowerCase().includes(searchTerm);
        } else if (log.content && log.content.group_id) {
          groupMatch = log.content.group_id.toLowerCase().includes(searchTerm);
        }
        
        // If none of them match, filter out this log
        if (!eventMatch && !userMatch && !groupMatch) {
          return false;
        }
      }
      
      // Excel-like hierarchical filtering
      if (Object.keys(categoryFilters).length > 0) {
        if (!log.event) return false;
        
        const parts = log.event.split('.');
        const category = parts[0] || 'unknown';
        const subcategory = parts.length > 1 ? parts[1] : 'other';
        
        let action = 'other';
        let subaction = 'other';
        
        if (parts.length > 2) {
          action = parts[2];
          if (parts.length > 3) {
            subaction = parts.slice(3).join('.');
          }
        }
        
        // Check if category is unchecked
        if (categoryFilters[category] === false) {
          return false;
        }
        
        // Check if subcategory is unchecked
        const subcategoryKey = `${category}.${subcategory}`;
        if (categoryFilters[subcategoryKey] === false) {
          return false;
        }
        
        // Check if action is unchecked
        const actionKey = `${category}.${subcategory}.${action}`;
        if (categoryFilters[actionKey] === false) {
          return false;
        }
        
        // Check if subaction is unchecked
        const subactionKey = `${category}.${subcategory}.${action}.${subaction}`;
        if (categoryFilters[subactionKey] === false) {
          return false;
        }
      }
      
      // Dot notation category-based filtering (from clicking parts)
      if (activeFilters.category) {
        const parts = log.event ? log.event.split('.') : [];
        const category = parts[0] || 'unknown';
        
        if (category !== activeFilters.category) {
          return false;
        }
        
        if (activeFilters.subcategory) {
          const subcategory = parts.length > 1 ? parts[1] : 'other';
          if (subcategory !== activeFilters.subcategory) {
            return false;
          }
          
          if (activeFilters.action && activeFilters.action !== 'other') {
            const action = parts.length > 2 ? parts[2] : 'other';
            if (action !== activeFilters.action) {
              return false;
            }
            
            if (activeFilters.subaction && activeFilters.subaction !== 'other') {
              const subaction = parts.length > 3 ? parts.slice(3).join('.') : 'other';
              if (subaction !== activeFilters.subaction) {
                return false;
              }
            }
          }
        }
      }
      
      // Organization filtering
      if (log.org_id && orgFilters[log.org_id] === false) {
        return false;
      }
      
      // Group filtering
      if ((log.group_id && groupFilters[log.group_id] === false) || 
          (log.content && log.content.group_id && groupFilters[log.content.group_id] === false)) {
        return false;
      }
      
      return true;
    });
  }, [auditLogs, activeFilters, eventFilter, categoryFilters, orgFilters, groupFilters, getUserInfo]);
  
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
  
  // Handle filter input change
  const handleFilterChange = (e) => {
    setEventFilter(e.target.value);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setEventFilter('');
    setActiveFilters({ category: null, subcategory: null, action: null, subaction: null });
    
    // Reset all category filters to checked
    const newFilters = {};
    
    Object.keys(eventCategories).forEach(category => {
      newFilters[category] = true;
      
      Object.keys(eventCategories[category]).forEach(subcategory => {
        const subcategoryKey = `${category}.${subcategory}`;
        newFilters[subcategoryKey] = true;
        
        Object.keys(eventCategories[category][subcategory]).forEach(action => {
          const actionKey = `${category}.${subcategory}.${action}`;
          newFilters[actionKey] = true;
          
          eventCategories[category][subcategory][action].forEach(subaction => {
            const subactionKey = `${category}.${subcategory}.${action}.${subaction}`;
            newFilters[subactionKey] = true;
          });
        });
      });
    });
    
    setCategoryFilters(newFilters);
    
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
  
  // Function to render event with highlighted parts based on its structure
  const renderEventWithStructure = (eventString) => {
    if (!eventString) return <span className="text-gray-400">N/A</span>;
    
    const parts = eventString.split('.');
    
    if (parts.length === 1) {
      return (
        <span className={activeFilters.category === parts[0] ? "font-bold text-blue-600" : ""}>
          {parts[0]}
        </span>
      );
    }
    
    return (
      <span>
        <span 
          className={`${activeFilters.category === parts[0] ? "font-bold text-blue-600" : "text-blue-600"} cursor-pointer hover:underline`}
          onClick={() => handleCategoryFilter(parts[0])}
          title={`Filter by ${parts[0]}`}
        >
          {parts[0]}
        </span>
        <span className="text-gray-500">.</span>
        {parts.length > 1 && (
          <>
            <span 
              className={`${activeFilters.subcategory === parts[1] ? "font-bold text-purple-600" : "text-purple-600"} cursor-pointer hover:underline`}
              onClick={() => handleCategoryFilter(parts[0], parts[1])}
              title={`Filter by ${parts[0]}.${parts[1]}`}
            >
              {parts[1]}
            </span>
            {parts.length > 2 && (
              <>
                <span className="text-gray-500">.</span>
                <span 
                  className={`${activeFilters.action === parts[2] ? "font-bold text-green-600" : "text-green-600"} cursor-pointer hover:underline`}
                  onClick={() => handleCategoryFilter(parts[0], parts[1], parts[2])}
                  title={`Filter by ${parts[0]}.${parts[1]}.${parts[2]}`}
                >
                  {parts[2]}
                </span>
                {parts.length > 3 && (
                  <>
                    <span className="text-gray-500">.</span>
                    <span 
                      className={`${activeFilters.subaction === parts.slice(3).join('.') ? "font-bold text-orange-600" : "text-orange-600"} cursor-pointer hover:underline`}
                      onClick={() => handleCategoryFilter(parts[0], parts[1], parts[2], parts.slice(3).join('.'))}
                      title={`Filter by complete action`}
                    >
                      {parts.slice(3).join('.')}
                    </span>
                  </>
                )}
              </>
            )}
          </>
        )}
      </span>
    );
  };

  // Toggle org filter dropdown
  const toggleOrgFilterDropdown = () => {
    setShowOrgFilterDropdown(prev => !prev);
    // Close other dropdown if open
    if (!showOrgFilterDropdown && showEventFilterDropdown) {
      setShowEventFilterDropdown(false);
    }
  };

  // Create unique org list
  const uniqueOrgs = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];
    
    const orgsMap = new Map();
    
    auditLogs.forEach(log => {
      if (log.org_id) {
        // Use Map to ensure uniqueness
        if (!orgsMap.has(log.org_id)) {
          orgsMap.set(log.org_id, {
            id: log.org_id,
            name: getOrgInfo(log.org_id).name
          });
        }
      }
    });
    
    // Convert Map to array and sort alphabetically by name
    return Array.from(orgsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [auditLogs, getOrgInfo]);

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

  // Toggle group filter dropdown
  const toggleGroupFilterDropdown = () => {
    setShowGroupFilterDropdown(prev => !prev);
    // Close other dropdowns if open
    if (!showGroupFilterDropdown && (showEventFilterDropdown || showOrgFilterDropdown)) {
      setShowEventFilterDropdown(false);
      setShowOrgFilterDropdown(false);
    }
  };

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
        // Use Map to ensure uniqueness
        if (!groupsMap.has(log.content.group_id)) {
          groupsMap.set(log.content.group_id, {
            id: log.content.group_id,
            name: `Group ${log.content.group_id.substring(0, 8)}...`
          });
        }
      }
    });
    
    // Convert Map to array
    return Array.from(groupsMap.values());
  }, [auditLogs]);

  // Initialize group filters
  useEffect(() => {
    if (uniqueGroups.length > 0 && Object.keys(groupFilters).length === 0) {
      // Default all groups to visible (not filtered out)
      const initialGroupFilters = {};
      uniqueGroups.forEach(group => {
        initialGroupFilters[group.id] = true;
      });
      setGroupFilters(initialGroupFilters);
    }
  }, [uniqueGroups, groupFilters]);

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

  // Function to generate and download HTML report
  const generateHtmlReport = async () => {
    try {
      setIsExporting(true);
      
      // Determine the correct API endpoint based on the configuration
      let url = 'http://localhost:3001/api/audit-logs/events';
      
      if (config) {
        if (config.SNYK_GROUP_ID) {
          url = `http://localhost:3001/api/audit-logs/events/group/${config.SNYK_GROUP_ID}`;
        } else if (config.SNYK_ORG_ID) {
          url = `http://localhost:3001/api/audit-logs/events/org/${config.SNYK_ORG_ID}`;
        }
      }
      
      // Fetch the events data from the API
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to generate HTML report: ${response.status} ${response.statusText}`);
      }
      
      // Generate HTML content directly in the browser
      const eventsData = await response.json();
      
      // Create a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `audit_logs_report_${timestamp}.html`;
      
      // Create a styled HTML document
      const html = generateHtmlContent(auditLogs, filteredLogs);
      
      // Create a download link and trigger the download
      const blob = new Blob([html], { type: 'text/html' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    } catch (error) {
      console.error('Error generating HTML report:', error);
      setError(`Failed to generate HTML report: ${error.message}`);
      setIsExporting(false);
    }
  };
  
  // Generate the HTML content for the report
  const generateHtmlContent = (allLogs, filteredLogs) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Snyk Audit Logs Report | ${new Date().toISOString().slice(0, 10)}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            h1 {
                color: #4b45a1;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            .info-box {
                background-color: #f8f9fa;
                border-left: 4px solid #4b45a1;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 14px;
            }
            th {
                background-color: #4b45a1;
                color: white;
                text-align: left;
                padding: 12px;
                position: sticky;
                top: 0;
            }
            td {
                padding: 10px 12px;
                border-bottom: 1px solid #ddd;
                max-width: 250px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            tr:hover {
                background-color: #f1f1f1;
            }
            .event-category {
                color: #205493; /* Blue for category */
            }
            .event-subcategory {
                color: #6f42c1; /* Purple for subcategory */
            }
            .event-action {
                color: #28a745; /* Green for action */
            }
            .event-subaction {
                color: #fd7e14; /* Orange for subaction */
            }
            .badge {
                display: inline-block;
                padding: 3px 7px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                margin-right: 5px;
            }
            .badge-green {
                background-color: #e7f7e9;
                color: #28a745;
                border: 1px solid #bce7c8;
            }
            .badge-blue {
                background-color: #e6f1ff;
                color: #0366d6;
                border: 1px solid #c8e1ff;
            }
            .badge-purple {
                background-color: #f5f0ff;
                color: #6f42c1;
                border: 1px solid #e2ceff;
            }
            .badge-pink {
                background-color: #ffeef8;
                color: #d73a49;
                border: 1px solid #f9c9df;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <h1>Snyk Audit Logs Report</h1>
        <div class="info-box">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total logs:</strong> ${filteredLogs.length} (filtered from ${allLogs.length} total)</p>
            <p><strong>Date range:</strong> ${filteredLogs[0]?.created || 'N/A'} to ${filteredLogs[filteredLogs.length-1]?.created || 'N/A'}</p>
            ${Object.keys(activeFilters).some(key => activeFilters[key]) ? 
              `<p><strong>Active category filter:</strong> ${activeFilters.category || ''}${activeFilters.subcategory ? '.' + activeFilters.subcategory : ''}${activeFilters.action ? '.' + activeFilters.action : ''}${activeFilters.subaction ? '.' + activeFilters.subaction : ''}</p>` : ''}
            ${eventFilter ? `<p><strong>Search filter:</strong> "${eventFilter}"</p>` : ''}
        </div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Event</th>
                    <th>User</th>
                    <th>Group</th>
                    <th>Organization</th>
                    <th>Project</th>
                </tr>
            </thead>
            <tbody>
    ${filteredLogs.map((log, index) => {
      // Format the event name with color coding by parts
      let formattedEvent = '';
      if (log.event) {
        const parts = log.event.split('.');
        if (parts.length > 0) formattedEvent += `<span class="event-category">${parts[0]}</span>`;
        if (parts.length > 1) formattedEvent += `.<span class="event-subcategory">${parts[1]}</span>`;
        if (parts.length > 2) formattedEvent += `.<span class="event-action">${parts[2]}</span>`;
        if (parts.length > 3) formattedEvent += `.<span class="event-subaction">${parts.slice(3).join('.')}</span>`;
      } else {
        formattedEvent = 'N/A';
      }

      // Format the date for better readability
      const date = log.created ? new Date(log.created).toLocaleString() : 'N/A';

      // Get user details
      const userInfo = getUserInfo(log.user_id);
      const userId = log.user_id ? 
        `<span class="badge badge-blue">${log.user_id}</span><br>${userInfo.name}<br>${userInfo.email}` : 'N/A';

      // Get group, org and project IDs
      const groupId = (log.group_id || (log.content && log.content.group_id)) ? 
        `<span class="badge badge-pink">${log.group_id || log.content.group_id}</span>` : 'N/A';

      const orgInfo = getOrgInfo(log.org_id);
      const orgId = log.org_id ? 
        `<span class="badge badge-green">${log.org_id}</span><br>${orgInfo.name}` : 'N/A';

      const projectId = log.project_id ? 
        `<span class="badge badge-purple">${log.project_id}</span>` : 'N/A';

      return `
        <tr>
            <td>${index + 1}</td>
            <td>${date}</td>
            <td>${formattedEvent}</td>
            <td>${userId}</td>
            <td>${groupId}</td>
            <td>${orgId}</td>
            <td>${projectId}</td>
        </tr>
      `;
    }).join('')}
            </tbody>
        </table>
        <div class="footer">
            <p>Generated by Snyk Audit Logs Visualizer | ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="text-gray-500 mt-4">Loading audit logs...</div>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return <div className="text-gray-500">No audit logs available</div>;
  }

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Enhanced Visualizations */}
      <EnhancedVisualizations data={auditLogs} />

      {/* Table Section */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Logs Details</h3>
        
        {/* Filter and Export Section */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by event name, user, or group ID"
              value={eventFilter}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full"
            />
          </div>
          
          <button 
            onClick={generateHtmlReport}
            disabled={isExporting || filteredLogs.length === 0}
            className={`px-3 py-2 rounded-md transition-colors ${isExporting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isExporting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" fillRule="evenodd"></path>
                </svg>
                Export as HTML
              </span>
            )}
          </button>
          
          {(Object.keys(activeFilters).some(key => activeFilters[key]) || 
            (Object.keys(categoryFilters).length > 0 && Object.values(categoryFilters).some(v => v === false))) && (
            <button 
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
            >
              Clear Filters
            </button>
          )}
          
          <div className="w-full mt-2">
            <div className="text-xs text-gray-500 mb-1">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {activeFilters.category}
                  {activeFilters.subcategory && (
                    <span>
                      .{activeFilters.subcategory}
                      {activeFilters.action && activeFilters.action !== 'other' && (
                        <span>
                          .{activeFilters.action}
                          {activeFilters.subaction && activeFilters.subaction !== 'other' && (
                            <span>.{activeFilters.subaction}</span>
                          )}
                        </span>
                      )}
                    </span>
                  )}
                  <button 
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={clearFilters}
                  >
                    ×
                  </button>
                </span>
              )}
              {eventFilter && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  Search: "{eventFilter}"
                  <button 
                    className="ml-1 text-gray-600 hover:text-gray-800"
                    onClick={() => setEventFilter('')}
                  >
                    ×
                  </button>
                </span>
              )}
              {Object.entries(categoryFilters)
                .filter(([_, isChecked]) => isChecked === false)
                .map(([key]) => (
                  <span key={key} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    Exclude: {key}
                    <button 
                      className="ml-1 text-yellow-600 hover:text-yellow-800"
                      onClick={() => handleCheckboxChange(key)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              {Object.entries(orgFilters)
                .filter(([_, isChecked]) => isChecked === false)
                .map(([orgId]) => {
                  const org = uniqueOrgs.find(o => o.id === orgId);
                  return (
                    <span key={orgId} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Exclude Org: {org ? org.name : orgId} 
                      <span className="text-xs font-mono bg-green-50 px-1 ml-1 rounded">
                        {orgId}
                      </span>
                      <button 
                        className="ml-1 text-green-600 hover:text-green-800"
                        onClick={(e) => { e.stopPropagation(); handleOrgFilterChange(orgId, true); }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              {Object.entries(groupFilters)
                .filter(([_, isChecked]) => isChecked === false)
                .map(([groupId]) => {
                  const group = uniqueGroups.find(g => g.id === groupId);
                  return (
                    <span key={groupId} className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                      Exclude Group: 
                      <span className="text-xs font-mono bg-pink-50 px-1 ml-1 rounded">
                        {groupId}
                      </span>
                      <button 
                        className="ml-1 text-pink-600 hover:text-pink-800"
                        onClick={(e) => { e.stopPropagation(); handleGroupFilterChange(groupId, true); }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
            </div>
          </div>
        </div>
        
        {(loadingUsers || loadingOrgs) && (
          <div className="flex items-center space-x-4 mb-3 text-sm text-blue-500">
            <div className="flex items-center">
              {loadingUsers && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <span>Loading user details...</span>
                </>
              )}
            </div>
            <div className="flex items-center">
              {loadingOrgs && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <span>Loading organization details...</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-2">
          Showing {filteredLogs.length} of {auditLogs.length} logs
        </div>
        
        <div className="overflow-x-auto w-full" style={{ maxWidth: '100vw' }}>
          <table className="w-full divide-y divide-gray-200 table-fixed" style={{ width: '100%', minWidth: '1200px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '18%' }}>
                  <div className="flex items-center relative" ref={dropdownRef}>
                    <span>Event</span>
                    <button 
                      className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={toggleEventFilterDropdown}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                    
                    {/* Excel-like dropdown menu */}
                    {showEventFilterDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-72 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <div className="p-3 border-b border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Filter by event hierarchy</div>
                          <div className="flex gap-2 mb-2">
                            <button 
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => selectAllCategories(true)}
                            >
                              Select All
                            </button>
                            <button 
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              onClick={() => selectAllCategories(false)}
                            >
                              Deselect All
                            </button>
                          </div>
                          
                          <div className="max-h-72 overflow-y-auto">
                            {Object.keys(eventCategories).map(category => (
                              <div key={category} className="mb-2">
                                <div className="flex items-center gap-2 py-1">
                                  <input
                                    type="checkbox"
                                    id={`category-${category}`}
                                    checked={categoryFilters[category] !== false}
                                    onChange={() => handleCheckboxChange(category)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`category-${category}`} className="text-sm font-medium text-gray-700 flex-1">
                                    {category} <span className="text-xs text-gray-500">
                                      ({auditLogs.filter(log => log.event && log.event.split('.')[0] === category).length})
                                    </span>
                                  </label>
                                  <button 
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => toggleCategoryExpansion(category)}
                                  >
                                    {expandedCategories[category] ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                
                                {expandedCategories[category] && (
                                  <div className="ml-6 border-l border-gray-200 pl-2">
                                    {Object.keys(eventCategories[category]).map(subcategory => {
                                      const subcategoryKey = `${category}.${subcategory}`;
                                      const subcategoryCount = auditLogs.filter(log => 
                                        log.event && 
                                        log.event.split('.')[0] === category && 
                                        (log.event.split('.')[1] || 'other') === subcategory
                                      ).length;
                                      
                                      return (
                                        <div key={subcategoryKey} className="my-1">
                                          <div className="flex items-center gap-2 py-1">
                                            <input
                                              type="checkbox"
                                              id={`subcat-${subcategoryKey}`}
                                              checked={categoryFilters[subcategoryKey] !== false}
                                              onChange={() => handleCheckboxChange(subcategoryKey)}
                                              className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`subcat-${subcategoryKey}`} className="text-sm text-purple-600">
                                              {subcategory} <span className="text-xs text-gray-500">({subcategoryCount})</span>
                                            </label>
                                          </div>
                                          
                                          <div className="ml-4 border-l border-gray-100 pl-2">
                                            {Object.keys(eventCategories[category][subcategory]).map(action => {
                                              const actionKey = `${category}.${subcategory}.${action}`;
                                              const actionCount = auditLogs.filter(log => 
                                                log.event && 
                                                log.event.split('.')[0] === category && 
                                                (log.event.split('.')[1] || 'other') === subcategory &&
                                                (log.event.split('.')[2] || 'other') === action
                                              ).length;
                                              
                                              return (
                                                <div key={actionKey} className="my-1">
                                                  <div className="flex items-center gap-2 py-1">
                                                    <input
                                                      type="checkbox"
                                                      id={`action-${actionKey}`}
                                                      checked={categoryFilters[actionKey] !== false}
                                                      onChange={() => handleCheckboxChange(actionKey)}
                                                      className="h-2 w-2 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`action-${actionKey}`} className="text-xs text-green-600">
                                                      {action} <span className="text-xs text-gray-500">({actionCount})</span>
                                                    </label>
                                                  </div>
                                                  
                                                  <div className="ml-3 border-l border-gray-100 pl-2">
                                                    {Array.from(eventCategories[category][subcategory][action]).map(subaction => {
                                                      const subactionKey = `${category}.${subcategory}.${action}.${subaction}`;
                                                      const subactionCount = auditLogs.filter(log => 
                                                        log.event && 
                                                        log.event.split('.')[0] === category && 
                                                        (log.event.split('.')[1] || 'other') === subcategory &&
                                                        (log.event.split('.')[2] || 'other') === action &&
                                                        (log.event.split('.').slice(3).join('.') || 'other') === subaction
                                                      ).length;
                                                      
                                                      return (
                                                        <div key={subactionKey} className="flex items-center gap-2 py-0.5">
                                                          <input
                                                            type="checkbox"
                                                            id={`subaction-${subactionKey}`}
                                                            checked={categoryFilters[subactionKey] !== false}
                                                            onChange={() => handleCheckboxChange(subactionKey)}
                                                            className="h-2 w-2 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                          />
                                                          <label htmlFor={`subaction-${subactionKey}`} className="text-xs text-orange-600">
                                                            {subaction} <span className="text-xs text-gray-500">({subactionCount})</span>
                                                          </label>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="p-2 border-t border-gray-200 flex justify-end gap-2">
                          <button 
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                            onClick={() => setShowEventFilterDropdown(false)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                            onClick={() => setShowEventFilterDropdown(false)}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="ml-1 group">
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1 hidden group-hover:block z-10">
                          <div className="text-xs text-gray-700 p-2">
                            <p className="mb-1">About entity IDs:</p>
                            <ul className="list-disc ml-4 mb-1">
                              <li>Organization IDs (green) can be filtered using the organization filter icon</li>
                              <li>Project IDs (blue) may link to the Snyk dashboard</li>
                              <li>User IDs (purple) may show "N/A" for system events</li>
                              <li>Group IDs (pink) can be filtered using the group filter icon</li>
                            </ul>
                            <p className="mt-2 mb-1">Filtering tips:</p>
                            <ul className="list-disc ml-4 mb-1">
                              <li>Use the search box to filter by any ID, including group ID</li>
                              <li>Click the organization/group icon to filter by specific IDs</li>
                              <li>Click "Clear Filters" to reset all active filters</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100 font-bold" style={{ width: '30%' }}>
                  <div className="flex items-center relative">
                    <span>Entity IDs</span>
                    <button 
                      className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={toggleOrgFilterDropdown}
                      ref={orgFilterRef}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                    
                    {/* Organization filter dropdown */}
                    {showOrgFilterDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-72 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-md z-50"
                        ref={orgFilterDropdownRef}
                      >
                        <div className="p-3 border-b border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Filter by organization</div>
                          <div className="flex gap-2 mb-2">
                            <button 
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => selectAllOrgs(true)}
                            >
                              Select All
                            </button>
                            <button 
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              onClick={() => selectAllOrgs(false)}
                            >
                              Deselect All
                            </button>
                          </div>
                          
                          <div className="max-h-72 overflow-y-auto">
                            {uniqueOrgs.map(org => {
                              const orgCount = auditLogs.filter(log => (log.org_id) === org.id).length;
                              
                              return (
                                <div key={org.id} className="my-1">
                                  <div className="flex items-center gap-2 py-1">
                                    <input
                                      type="checkbox"
                                      id={`org-${org.id}`}
                                      checked={orgFilters[org.id] !== false}
                                      onChange={(e) => handleOrgFilterChange(org.id, e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`org-${org.id}`} className="text-sm font-medium text-gray-700 flex-1">
                                      <div className="flex flex-col">
                                        <div className="flex items-center">
                                          <span>{org.name}</span>
                                          <span className="text-xs text-gray-500 ml-1">({orgCount})</span>
                                        </div>
                                        <span className="text-xs text-blue-600 font-mono bg-blue-50 px-1 rounded mt-1">
                                          {org.id}
                                        </span>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="p-2 border-t border-gray-200 flex justify-end gap-2">
                          <button 
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                            onClick={() => setShowOrgFilterDropdown(false)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                            onClick={() => setShowOrgFilterDropdown(false)}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Group Filter Button */}
                    <button 
                      className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={toggleGroupFilterDropdown}
                      ref={groupFilterRef}
                      title="Filter by group ID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                    
                    {/* Group filter dropdown */}
                    {showGroupFilterDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-72 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-md z-50"
                        ref={groupFilterDropdownRef}
                      >
                        <div className="p-3 border-b border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Filter by group</div>
                          <div className="flex gap-2 mb-2">
                            <button 
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => selectAllGroups(true)}
                            >
                              Select All
                            </button>
                            <button 
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              onClick={() => selectAllGroups(false)}
                            >
                              Deselect All
                            </button>
                          </div>
                          
                          {uniqueGroups.length > 0 ? (
                            <div className="max-h-72 overflow-y-auto">
                              {uniqueGroups.map(group => {
                                const groupCount = auditLogs.filter(log => 
                                  log.content && log.content.group_id === group.id
                                ).length;
                                
                                return (
                                  <div key={group.id} className="my-1">
                                    <div className="flex items-center gap-2 py-1">
                                      <input
                                        type="checkbox"
                                        id={`group-${group.id}`}
                                        checked={groupFilters[group.id] !== false}
                                        onChange={(e) => handleGroupFilterChange(group.id, e.target.checked)}
                                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                      />
                                      <label htmlFor={`group-${group.id}`} className="text-sm font-medium text-gray-700 flex-1">
                                        <div className="flex flex-col">
                                          <div className="flex items-center">
                                            <span>{group.name}</span>
                                            <span className="text-xs text-gray-500 ml-1">({groupCount})</span>
                                          </div>
                                          <span className="text-xs text-pink-600 font-mono bg-pink-50 px-1 rounded mt-1">
                                            {group.id}
                                          </span>
                                        </div>
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 text-sm text-gray-500">
                              No group IDs found in the current logs
                            </div>
                          )}
                        </div>
                        
                        <div className="p-2 border-t border-gray-200 flex justify-end gap-2">
                          <button 
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                            onClick={() => setShowGroupFilterDropdown(false)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="px-3 py-1 text-xs bg-pink-600 hover:bg-pink-700 text-white rounded"
                            onClick={() => setShowGroupFilterDropdown(false)}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="ml-1 group">
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1 hidden group-hover:block z-10">
                          <div className="text-xs text-gray-700 p-2">
                            <p className="mb-1">About entity IDs:</p>
                            <ul className="list-disc ml-4 mb-1">
                              <li>Organization IDs (green) can be filtered using the organization filter icon</li>
                              <li>Project IDs (blue) may link to the Snyk dashboard</li>
                              <li>User IDs (purple) may show "N/A" for system events</li>
                              <li>Group IDs (pink) can be filtered using the group filter icon</li>
                            </ul>
                            <p className="mt-2 mb-1">Filtering tips:</p>
                            <ul className="list-disc ml-4 mb-1">
                              <li>Use the search box to filter by any ID, including group ID</li>
                              <li>Click the organization/group icon to filter by specific IDs</li>
                              <li>Click "Clear Filters" to reset all active filters</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '30%' }}>Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log, index) => {
                const userInfo = getUserInfo(log.user_id);
                const projectUrl = getProjectUrl(log.org_id, log.project_id);
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.created ? (
                        <div>
                          <div>{log.created.split('T')[0]}</div>
                          <div className="text-xs text-gray-400">T{log.created.split('T')[1]}</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-normal">
                      {renderEventWithStructure(log.event)}
                    </td>
                    <td className="px-6 py-4 text-sm break-all">
                      <div className="flex flex-col space-y-3">
                        {/* Group ID if available */}
                        {(log.group_id || (log.content && log.content.group_id)) && (
                          <div>
                            <span className="text-xs text-gray-500 mb-1">Group:</span>
                            <span className="px-2 py-1 bg-pink-50 text-pink-700 rounded-md border border-pink-200 text-sm font-medium font-mono flex items-center mt-1">
                              {log.group_id || log.content.group_id}
                            </span>
                          </div>
                        )}
                        
                        {/* Organization & Project Section */}
                        <div className="flex flex-col space-y-2">
                          {log.org_id && (
                            <div>
                              <span className="text-xs text-gray-500 mb-1">Organization:</span>
                              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm font-medium font-mono flex items-center mt-1">
                                {log.org_id}
                              </span>
                            </div>
                          )}
                          
                          {/* Project with fixed alignment */}
                          {log.project_id && (
                            <div>
                              <span className="text-xs text-gray-500 mb-1">Project:</span>
                              {projectUrl ? (
                                <a 
                                  href={projectUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-white text-blue-700 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium font-mono flex items-center mt-1 underline"
                                >
                                  {log.project_id}
                                </a>
                              ) : (
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-sm font-medium font-mono flex items-center mt-1">
                                  {log.project_id}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* User Section - Only show if log.user_id exists */}
                        {log.user_id && (
                          <div>
                            <span className="text-xs text-gray-500 mb-1">User:</span>
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200 text-sm font-medium font-mono flex items-center mt-1">
                              {log.user_id}
                            </span>
                            <div className="mt-1 ml-1">
                              <div className="text-sm font-normal">
                                <span className="text-gray-700">{userInfo.name}</span>
                                <span className="text-gray-400 mx-2">•</span>
                                <span className="text-gray-500">{userInfo.email}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto text-xs">{JSON.stringify(log.content, null, 2)}</pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsVisualization; 