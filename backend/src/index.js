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
        .option('--org-id <id>', 'Snyk Organization ID')
        .option('--group-id <id>', 'Snyk Group ID')
        .option('--from-date <date>', 'From date (YYYY-MM-DDTHH:MM:SSZ)')
        .option('--to-date <date>', 'To date (YYYY-MM-DDTHH:MM:SSZ)')
        .option('--page-size <number>', 'Page size', '100')
        .option('--page <number>', 'Page number', '1')
        .option('--max-pages <number>', 'Maximum number of pages', DEFAULT_MAX_PAGES.toString())
        .option('--debug', 'Enable debug logging')
        .option('--output-format <format>', 'Output format (table, json, csv, sqlite)', 'table')
        .option('--server', 'Start the server instead of running as CLI tool')
        .parse(process.argv);

    const options = program.opts();

    // If --server flag is present, run as server
    if (options.server) {
        startServer();
        return;
    }

    const apiKey = process.env.SNYK_API_KEY;
    if (!apiKey) {
        console.error('Missing required environment variable (SNYK_API_KEY).');
        process.exit(1);
    }

    const orgId = options.orgId || process.env.SNYK_ORG_ID;
    const groupId = options.groupId || process.env.SNYK_GROUP_ID;
    const fromDate = options.fromDate || process.env.FROM_DATE;
    const toDate = options.toDate || process.env.TO_DATE;
    const outputFormat = options.outputFormat || process.env.OUTPUT_FORMAT || 'table';

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
                await outputToJson(logs);
                break;
            case 'csv':
                await outputToCsv(logs);
                break;
            case 'sqlite':
                await outputToSqlite(logs);
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

// Check for server flag in raw args for direct execution 
// The start-servers.sh script expects to use our new yargs-based args
if (process.argv.includes('--server') || 
    process.argv.includes('--api-key') || 
    process.argv.includes('-k') ||
    process.argv.includes('--org-id') || 
    process.argv.includes('-o') ||
    process.argv.includes('--group-id') || 
    process.argv.includes('-g') ||
    process.argv.includes('--from-date') || 
    process.argv.includes('-f') ||
    process.argv.includes('--to-date') || 
    process.argv.includes('-t')) {
    // Start in server mode with yargs
    startServer();
} else {
    // Start in CLI mode with commander
    cliMain();
} 