const axios = require('axios');
const { format, subDays } = require('date-fns');

class AuditLogClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
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
        const url = queryType === 'org' 
            ? `${this.baseUrl}/rest/orgs/${queryId}/audit_logs/search?version=2024-10-15`
            : `${this.baseUrl}/rest/groups/${queryId}/audit_logs/search?version=2024-10-15`;
        
        const [from, to] = this._getDates(fromDate, toDate);
        const params = {
            'from': from,
            'to': to,
            'page[size]': pageSize,
            'page[number]': page
        };

        if (event) params['filter[event]'] = event;
        if (userId) params['filter[userId]'] = userId;

        console.log('Making request to:', url);
        console.log('With headers:', this.headers);
        console.log('With params:', params);

        try {
            const response = await axios.get(url, {
                headers: this.headers,
                params
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Response data:', JSON.stringify(response.data, null, 2));

            const { data } = response;
            if (data.data && data.data.items) {
                return {
                    logs: data.data.items,
                    hasMore: data.links?.next != null,
                    total: data.data.meta?.total || 0
                };
            }
            throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
        } catch (error) {
            console.error('Error querying audit logs:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
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