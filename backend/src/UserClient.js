const axios = require('axios');

class UserClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.headers = {
            'Authorization': `token ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json'
        };
        // Initialize cache for user details
        this.userCache = new Map();
    }

    /**
     * Get user details by user ID
     * @param {string} orgId - Organization ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User details
     */
    async getUserDetails(orgId, userId) {
        if (!orgId || !userId) {
            throw new Error('Organization ID and User ID are required');
        }

        // Generate cache key
        const cacheKey = `${orgId}:${userId}`;
        
        // Check if we have cached results
        if (this.userCache.has(cacheKey)) {
            console.log(`Using cached user details for ${userId}`);
            return this.userCache.get(cacheKey);
        }
        
        try {
            const url = `${this.baseUrl}/rest/orgs/${orgId}/users/${userId}?version=2024-10-15`;
            
            console.log(`Fetching user details for user ID ${userId} in org ${orgId}`);
            
            const response = await axios.get(url, {
                headers: this.headers
            });
            
            const userData = response.data;
            
            // Cache the results
            this.userCache.set(cacheKey, userData);
            
            return userData;
        } catch (error) {
            console.error(`Error fetching user details for ${userId}:`, error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            // Return a formatted error response
            return { 
                error: true, 
                message: error.message,
                status: error.response?.status || 500
            };
        }
    }
}

module.exports = { UserClient }; 