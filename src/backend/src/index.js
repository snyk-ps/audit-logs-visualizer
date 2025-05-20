#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();
const app = require('./server');
const { setupFromArguments } = require('./cli');

// Fix the AuditLogClient import
// const AuditLogClient = require('./AuditLogClient');
const { AuditLogClient } = require('./AuditLogClient');

const DEFAULT_MAX_PAGES = 100;
const DEFAULT_DAYS = 7;

// Add debug logging
console.log('Starting backend server with environment variables:');
console.log('API Key:', process.env.SNYK_API_KEY ? '✅ Set' : '❌ Not set');
console.log('Org ID:', process.env.SNYK_ORG_ID || 'Not set');
console.log('Group ID:', process.env.SNYK_GROUP_ID || 'Not set');
console.log('From Date:', process.env.FROM_DATE || 'Not set');
console.log('To Date:', process.env.TO_DATE || 'Not set');

// Validate dates if provided
if (process.env.FROM_DATE) {
  const fromDate = new Date(process.env.FROM_DATE);
  if (isNaN(fromDate.getTime())) {
    console.error('Invalid FROM_DATE format:', process.env.FROM_DATE);
    console.error('Setting FROM_DATE to null');
    process.env.FROM_DATE = null;
  } else {
    console.log('FROM_DATE validated successfully:', fromDate.toISOString());
  }
}

if (process.env.TO_DATE) {
  const toDate = new Date(process.env.TO_DATE);
  if (isNaN(toDate.getTime())) {
    console.error('Invalid TO_DATE format:', process.env.TO_DATE);
    console.error('Setting TO_DATE to null');
    process.env.TO_DATE = null;
  } else {
    console.log('TO_DATE validated successfully:', toDate.toISOString());
  }
}

async function outputToJson(logs, outputFilename = 'audit_logs.json') {
    await fs.promises.writeFile(outputFilename, JSON.stringify(logs, null, 2));
    console.log(`Audit logs saved to ${outputFilename}`);
}

async function outputToCsv(logs, outputFilename = 'audit_logs.csv') {
    const headers = ['#', 'Group ID', 'Org ID', 'Project ID', 'User ID', 'Event', 'Time'];
    const rows = logs.map((log, index) => [
        index + 1,
        log.group_id || 'N/A',
        log.org_id || 'N/A',
        log.project_id || 'N/A',
        log.user_id || 'N/A',
        log.event || 'N/A',
        log.created || 'N/A'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    await fs.promises.writeFile(outputFilename, csvContent);
    console.log(`Audit logs saved to ${outputFilename}`);
}

async function outputToSqlite(logs, dbFilename = 'audit_logs.db') {
    const db = new sqlite3.Database(dbFilename);

    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT,
                org_id TEXT,
                project_id TEXT,
                user_id TEXT,
                event TEXT,
                created TEXT
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    for (const log of logs) {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO audit_logs (group_id, org_id, project_id, user_id, event, created)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                log.group_id || 'N/A',
                log.org_id || 'N/A',
                log.project_id || 'N/A',
                log.user_id || 'N/A',
                log.event || 'N/A',
                log.created || 'N/A'
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    db.close();
    console.log(`Audit logs saved to ${dbFilename}`);
}

async function outputToHtml(logs, outputFilename = 'audit_logs_report.html') {
    // Get current date for report timestamp
    const reportDate = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = outputFilename.replace('.html', '') + `_${reportDate}.html`;
    
    // Build the HTML content
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Snyk Audit Logs Report | ${reportDate}</title>
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
            <p><strong>Total logs:</strong> ${logs.length}</p>
            <p><strong>Date range:</strong> ${logs[0]?.created || 'N/A'} to ${logs[logs.length-1]?.created || 'N/A'}</p>
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
    `;

    // Add table rows for each log
    logs.forEach((log, index) => {
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

        // Get user, group, org and project IDs with badge styling
        const userId = log.user_id ? 
            `<span class="badge badge-blue">${log.user_id}</span>` : 'N/A';
            
        const groupId = (log.group_id || (log.content && log.content.group_id)) ? 
            `<span class="badge badge-pink">${log.group_id || log.content.group_id}</span>` : 'N/A';
            
        const orgId = log.org_id ? 
            `<span class="badge badge-green">${log.org_id}</span>` : 'N/A';
            
        const projectId = log.project_id ? 
            `<span class="badge badge-purple">${log.project_id}</span>` : 'N/A';

        html += `
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
    });

    // Close the HTML structure
    html += `
            </tbody>
        </table>
        <div class="footer">
            <p>Generated by Snyk Audit Logs CLI Tool</p>
        </div>
    </body>
    </html>
    `;

    await fs.promises.writeFile(filename, html);
    console.log(`HTML report saved to ${filename}`);
}

function outputToTable(logs) {
    const tableData = logs.map((log, index) => [
        index + 1,
        log.group_id || 'N/A',
        log.org_id || 'N/A',
        log.project_id || 'N/A',
        log.user_id || 'N/A',
        log.event || 'N/A',
        log.created || 'N/A'
    ]);

    const headers = ['#', 'Group ID', 'Org ID', 'Project ID', 'User ID', 'Event', 'Time'];
    console.table(tableData, headers);
}

// Main CLI function to export data to various formats
async function cliMain() {
    program
        .option('--api-key <key>', 'Snyk API Key')
        .option('--org-id <id>', 'Snyk Organization ID')
        .option('--group-id <id>', 'Snyk Group ID')
        .option('--from-date <date>', 'From date (YYYY-MM-DDTHH:MM:SSZ)')
        .option('--to-date <date>', 'To date (YYYY-MM-DDTHH:MM:SSZ)')
        .option('--page-size <number>', 'Page size', '100')
        .option('--page <number>', 'Page number', '1')
        .option('--max-pages <number>', 'Maximum number of pages', DEFAULT_MAX_PAGES.toString())
        .option('--debug', 'Enable debug logging')
        .option('--output-format <format>', 'Output format (table, json, csv, sqlite, html)', 'html')
        .option('--output-file <filename>', 'Output filename (for json, csv, sqlite, html formats)', '')
        .option('--server', 'Start the server instead of running as CLI tool')
        .parse(process.argv);

    const options = program.opts();

    // If --server flag is present, run as server
    if (options.server) {
        startServer();
        return;
    }

    // Otherwise, run as CLI tool
    const apiKey = options.apiKey || process.env.SNYK_API_KEY;
    if (!apiKey) {
        console.error('Missing required environment variable (SNYK_API_KEY).');
        process.exit(1);
    }

    const orgId = options.orgId || process.env.SNYK_ORG_ID;
    const groupId = options.groupId || process.env.SNYK_GROUP_ID;
    const fromDate = options.fromDate || process.env.FROM_DATE;
    const toDate = options.toDate || process.env.TO_DATE;
    const outputFormat = options.outputFormat || process.env.OUTPUT_FORMAT || 'html';

    // Ignore the output file name from parameters and stick to the default name
    const outputFile = 'audit_logs_report.html'; // Default output file name

    let queryType, queryId;
    if (orgId && groupId) {
        console.warn(`Both org_id and group_id provided. Using org_id ${orgId} and ignoring group_id.`);
        queryType = 'org';
        queryId = orgId;
    } else if (orgId) {
        queryType = 'org';
        queryId = orgId;
        console.log(`Using org_id ${orgId}`);
    } else if (groupId) {
        queryType = 'group';
        queryId = groupId;
        console.log(`Using group_id ${groupId}`);
    } else {
        console.error('Neither org_id nor group_id provided. At least one is required.');
        process.exit(1);
    }

    const client = new AuditLogClient('https://api.snyk.io', apiKey);

    try {
        const logs = await client.getAllAuditLogs({
            queryType,
            queryId,
            fromDate,
            toDate,
            pageSize: parseInt(options.pageSize),
            maxPages: parseInt(options.maxPages),
            debug: options.debug
        });

        switch (outputFormat) {
            case 'json':
                await outputToJson(logs, options.outputFile || 'audit_logs.json');
                break;
            case 'csv':
                await outputToCsv(logs, options.outputFile || 'audit_logs.csv');
                break;
            case 'sqlite':
                await outputToSqlite(logs, options.outputFile || 'audit_logs.db');
                break;
            case 'html':
                await outputToHtml(logs, options.outputFile || 'audit_logs_report.html');
                break;
            case 'table':
                outputToTable(logs);
                break;
            default:
                console.error(`Invalid output format: ${outputFormat}`);
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Start the server with yargs command line arguments
function startServer() {
    // Process command line arguments using yargs
    const argv = setupFromArguments();

    const port = argv.port || process.env.PORT || 3001;

    // Remove the app.listen from server.js to avoid double binding
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log('Configuration:');
        console.log(`API Key: ${process.env.SNYK_API_KEY ? '✅ Set' : '❌ Not set'}`);
        console.log(`Org ID: ${process.env.SNYK_ORG_ID || 'Not set'}`);
        console.log(`Group ID: ${process.env.SNYK_GROUP_ID || 'Not set'}`);
        console.log(`From Date: ${process.env.FROM_DATE || 'Not set'}`);
        console.log(`To Date: ${process.env.TO_DATE || 'Not set'}`);
        
        if (!process.env.SNYK_API_KEY) {
            console.error('Warning: API Key is not set. Requests will fail without an API Key.');
        }
        
        if (!process.env.SNYK_ORG_ID && !process.env.SNYK_GROUP_ID) {
            console.warn('Warning: Neither Org ID nor Group ID is set. You must specify one in the request or configuration.');
        }
    });
}

// Check if this script is being run directly or via requiring
if (require.main === module) {
    // This is the entry point of the application
    // We want to run in CLI mode by default
    cliMain().catch(error => {
        console.error('Error running audit logs CLI:', error);
        process.exit(1);
    });
} 