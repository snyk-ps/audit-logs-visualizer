import React from 'react';

/**
 * EntityDetails component displays the details of entities involved in an audit log:
 * - Group
 * - Organization
 * - Project (with optional linking to Snyk dashboard)
 * - User (with name and email when available)
 */
const EntityDetails = ({ 
  groupId,
  contentGroupId,
  orgId,
  projectId,
  userId,
  userInfo,
  projectUrl,
  getOrgInfo,
  getProjectUrl,
  getUserInfo
}) => {
  // Combine direct groupId with one that might be in content
  const displayGroupId = groupId || contentGroupId;
  
  return (
    <div className="flex flex-col space-y-3">
      {/* Group ID if available */}
      {displayGroupId && (
        <div>
          <span className="text-xs text-gray-500 mb-1">Group:</span>
          <span className="px-2 py-1 bg-pink-50 text-pink-700 rounded-md border border-pink-200 text-sm font-medium font-mono flex items-center mt-1">
            {displayGroupId}
          </span>
        </div>
      )}
      
      {/* Organization & Project Section */}
      <div className="flex flex-col space-y-2">
        {orgId && (
          <div>
            <span className="text-xs text-gray-500 mb-1">Organization:</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm font-medium font-mono flex items-center mt-1">
              {orgId}
            </span>
          </div>
        )}
        
        {/* Project with fixed alignment */}
        {projectId && (
          <div>
            <span className="text-xs text-gray-500 mb-1">Project:</span>
            {projectUrl ? (
              <a 
                href={projectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-2 py-1 bg-white text-blue-700 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium font-mono flex items-center mt-1 underline"
              >
                {projectId}
              </a>
            ) : (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-sm font-medium font-mono flex items-center mt-1">
                {projectId}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* User Section - Only show if userId exists */}
      {userId && (
        <div>
          <span className="text-xs text-gray-500 mb-1">User:</span>
          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200 text-sm font-medium font-mono flex items-center mt-1">
            {userId}
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
  );
};

export default EntityDetails; 