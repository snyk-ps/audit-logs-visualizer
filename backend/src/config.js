const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../.env');

function loadConfig() {
  try {
    // Start with the environment variable values
    const config = {
      SNYK_API_KEY: process.env.SNYK_API_KEY || '',
      SNYK_ORG_ID: process.env.SNYK_ORG_ID || '',
      SNYK_GROUP_ID: process.env.SNYK_GROUP_ID || '',
      FROM_DATE: process.env.FROM_DATE || '',
      TO_DATE: process.env.TO_DATE || '',
      OUTPUT_FORMAT: process.env.OUTPUT_FORMAT || 'table'
    };

    // If no values exist in environment variables, try to load from file
    if (!config.SNYK_API_KEY && !config.SNYK_ORG_ID && !config.SNYK_GROUP_ID) {
      if (fs.existsSync(CONFIG_FILE)) {
        const envContent = fs.readFileSync(CONFIG_FILE, 'utf8');
        envContent.split('\n').forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value !== undefined) {
              // Only use the file value if no environment variable is set
              if (!process.env[key.trim()]) {
                config[key.trim()] = value.trim().replace(/["']/g, '');
              }
            }
          }
        });
      }
    }
    
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return {};
  }
}

function saveConfig(config) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Format the configuration
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value || ''}`)
      .join('\n');

    // Write the file
    fs.writeFileSync(CONFIG_FILE, envContent);
    console.log('Configuration saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

module.exports = {
  loadConfig,
  saveConfig
}; 