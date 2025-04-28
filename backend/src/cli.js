#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Validate date format
function isValidDateString(dateStr) {
  // Check format: YYYY-MM-DDTHH:MM:SSZ
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Parse command line arguments
function parseArguments() {
  return yargs(hideBin(process.argv))
    .option('api-key', {
      alias: 'k',
      type: 'string',
      description: 'Snyk API Key',
    })
    .option('org-id', {
      alias: 'o',
      type: 'string',
      description: 'Snyk Organization ID (required if group-id not provided)',
    })
    .option('group-id', {
      alias: 'g',
      type: 'string',
      description: 'Snyk Group ID (required if org-id not provided)',
    })
    .option('from-date', {
      alias: 'f',
      type: 'string',
      description: 'Start date for audit logs (format: YYYY-MM-DDTHH:MM:SSZ)',
    })
    .option('to-date', {
      alias: 't',
      type: 'string',
      description: 'End date for audit logs (format: YYYY-MM-DDTHH:MM:SSZ)',
    })
    .option('port', {
      alias: 'p', 
      type: 'number',
      default: 3001,
      description: 'Port to run the server on',
    })
    .help()
    .alias('help', 'h')
    .example('node src/cli.js --api-key=YOUR_KEY --group-id=YOUR_GROUP_ID --from-date=2023-01-01T00:00:00Z --to-date=2023-01-31T23:59:59Z')
    .argv;
}

// Process arguments and set up environment variables
function setupFromArguments() {
  const argv = parseArguments();
  
  // Set environment variables from command line arguments if provided
  if (argv['api-key']) {
    // Validate API key format (UUID format)
    const apiKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (apiKeyRegex.test(argv['api-key'])) {
      process.env.SNYK_API_KEY = argv['api-key'];
      console.log('API Key: Valid format ✅');
    } else {
      console.warn('Warning: API Key format is invalid. Should be a UUID.');
      process.env.SNYK_API_KEY = argv['api-key']; // Set anyway but warn the user
    }
  }
  
  if (argv['org-id']) {
    process.env.SNYK_ORG_ID = argv['org-id'];
    console.log(`Org ID: ${argv['org-id']} ✅`);
  }
  
  if (argv['group-id']) {
    process.env.SNYK_GROUP_ID = argv['group-id'];
    console.log(`Group ID: ${argv['group-id']} ✅`);
  }
  
  if (argv['from-date']) {
    if (isValidDateString(argv['from-date'])) {
      process.env.FROM_DATE = argv['from-date'];
      console.log(`From Date: ${argv['from-date']} ✅`);
    } else {
      console.error(`Error: Invalid from-date format: ${argv['from-date']}`);
      console.error('Expected format: YYYY-MM-DDTHH:MM:SSZ (e.g., 2023-01-01T00:00:00Z)');
    }
  }
  
  if (argv['to-date']) {
    if (isValidDateString(argv['to-date'])) {
      process.env.TO_DATE = argv['to-date'];
      console.log(`To Date: ${argv['to-date']} ✅`);
    } else {
      console.error(`Error: Invalid to-date format: ${argv['to-date']}`);
      console.error('Expected format: YYYY-MM-DDTHH:MM:SSZ (e.g., 2023-01-31T23:59:59Z)');
    }
  }
  
  return {
    port: argv.port,
    apiKey: argv['api-key'],
    orgId: argv['org-id'],
    groupId: argv['group-id'],
    fromDate: argv['from-date'],
    toDate: argv['to-date']
  };
}

module.exports = {
  setupFromArguments,
  isValidDateString
};

// If run directly (not imported)
if (require.main === module) {
  const argv = parseArguments();
  console.log('Parsed arguments:', argv);
} 