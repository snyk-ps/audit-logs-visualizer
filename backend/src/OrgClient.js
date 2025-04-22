const axios = require('axios');

class OrgClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.headers = {
            'Authorization': `token ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json'
        };
        // Initialize cache for org details
        this.orgCache = new Map();
        this.orgsData = null;
    }

    /**
     * Get all organizations
     * @returns {Promise<Object>} - Organizations data
     */
    async getOrgs() {
        // Return cached data if available
        if (this.orgsData) {
            console.log('Using cached orgs data');
            return this.orgsData;
        }
        
        try {
            const url = `${this.baseUrl}/rest/orgs?version=2024-10-15`;
            
            console.log('Fetching all organizations');
            
            const response = await axios.get(url, {
                headers: this.headers
            });
            
            const orgsData = response.data;
            
            // Cache the results
            this.orgsData = orgsData;
            
            // Also populate the org cache with id -> slug mapping
            if (orgsData.data && Array.isArray(orgsData.data)) {
                orgsData.data.forEach(org => {
                    this.orgCache.set(org.id, org);
                });
            }
            
            return orgsData;
        } catch (error) {
            console.error('Error fetching organizations:', error.message);
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

    /**
     * Get organization details by ID
     * @param {string} orgId - Organization ID
     * @returns {Promise<Object>} - Organization details
     */
    async getOrgDetails(orgId) {
        if (!orgId) {
            throw new Error('Organization ID is required');
        }

        // Check if we have cached results
        if (this.orgCache.has(orgId)) {
            console.log(`Using cached org details for ${orgId}`);
            return this.orgCache.get(orgId);
        }
        
        // If we don't have this specific org but have the full list, return not found
        if (this.orgsData) {
            return { 
                error: true, 
                message: `Organization ${orgId} not found`,
                status: 404
            };
        }
        
        // Otherwise fetch all orgs
        try {
            const orgsData = await this.getOrgs();
            
            if (orgsData.error) {
                return orgsData;
            }
            
            // Find the specific org
            const org = orgsData.data.find(o => o.id === orgId);
            
            if (!org) {
                return { 
                    error: true, 
                    message: `Organization ${orgId} not found`,
                    status: 404
                };
            }
            
            return org;
        } catch (error) {
            console.error(`Error fetching org details for ${orgId}:`, error.message);
            // Return a formatted error response
            return { 
                error: true, 
                message: error.message,
                status: error.response?.status || 500
            };
        }
    }
}

module.exports = { OrgClient }; 