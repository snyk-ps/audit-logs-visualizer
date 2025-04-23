const axios = require('axios');
const { format, subDays } = require('date-fns');

class AuditLogClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.apiKey = apiKey;
        this.headers = {
            'Authorization': `token ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    _getDates(fromDate, toDate) {
        if (fromDate && toDate) {
            if (!this._isValidDate(fromDate) || !this._isValidDate(toDate)) {
                throw new Error('Invalid date format. Use YYYY-MM-DDTHH:MM:SSZ');
            }
            return [fromDate, toDate];
        }

        const now = new Date();
        const toDateStr = format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        const fromDateStr = format(subDays(now, 7), "yyyy-MM-dd'T'HH:mm:ss'Z'");
        return [fromDateStr, toDateStr];
    }

    _isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        return regex.test(dateString);
    }

    async queryAuditLogs({
        queryType,
        queryId,
        event,
        userId,
        pageSize = 100,
        page = 1,
        fromDate,
        toDate,
        debug = false
    }) {
        console.log(`Query type: ${queryType}, Query ID: ${queryId}`);
        
        // Check if we have a valid query ID
        if (!queryId) {
            console.error('No query ID provided');
            throw new Error('No query ID provided');
        }
        
        // Get the correct type based on the passed queryType parameter
        let url;
        if (queryType === 'org') {
            url = `${this.baseUrl}/rest/orgs/${queryId}/audit_logs/search?version=2024-10-15`;
            console.log('Using organization endpoint');
        } else if (queryType === 'group') {
            url = `${this.baseUrl}/rest/groups/${queryId}/audit_logs/search?version=2024-10-15`;
            console.log('Using group endpoint');
        } else {
            throw new Error(`Invalid query type: ${queryType}. Must be 'org' or 'group'.`);
        }
        
        console.log('Making request to:', url);
        
        const [from, to] = this._getDates(fromDate, toDate);
        const params = {
            'from': from,
            'to': to,
            'page[size]': pageSize,
            'page[number]': page
        };

        if (event) params['filter[event]'] = event;
        if (userId) params['filter[userId]'] = userId;

        console.log('With headers:', JSON.stringify({
            Authorization: 'token ***API_KEY_REDACTED***',
            'Content-Type': this.headers['Content-Type']
        }));
        console.log('With params:', params);

        try {
            const response = await axios.get(url, {
                headers: this.headers,
                params
            });

            console.log('Response status:', response.status);
            
            const { data } = response;
            if (data.data && data.data.items) {
                return {
                    logs: data.data.items,
                    hasMore: data.links?.next != null,
                    total: data.data.meta?.total || 0
                };
            } else if (data.logs) {
                // Handle alternative response format
                return {
                    logs: data.logs,
                    hasMore: data.hasMore || false,
                    total: data.total || data.logs.length
                };
            }
            throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
        } catch (error) {
            console.error('Error querying audit logs:');
            console.error(`- Message: ${error.message}`);
            
            if (error.response) {
                console.error(`- Status: ${error.response.status}`);
                console.error(`- Status text: ${error.response.statusText}`);
                console.error(`- URL: ${url}`);
                console.error(`- Data: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            throw error;
        }
    }

    async getAllAuditLogs({
        queryType,
        queryId,
        event,
        userId,
        pageSize = 100,
        fromDate,
        toDate,
        maxPages = 100,
        debug = false
    }) {
        const allLogs = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= maxPages) {
            console.log(`Retrieving page ${page} of audit logs`);
            const result = await this.queryAuditLogs({
                queryType,
                queryId,
                event,
                userId,
                pageSize,
                page,
                fromDate,
                toDate,
                debug
            });

            if (result.logs.length > 0) {
                allLogs.push(...result.logs);
            }
            hasMore = result.hasMore;
            page++;
        }

        if (page > maxPages) {
            console.warn(`Reached maximum number of pages (${maxPages}). Stopping.`);
        }

        return allLogs;
    }
}

module.exports = { AuditLogClient }; 