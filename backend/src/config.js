const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../.env');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const envContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = {};
      envContent.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value !== undefined) {
            config[key.trim()] = value.trim();
          }
        }
      });
      return config;
    }
    return {};
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