# Audit Logs Event Visualizer

A React-based visualization tool for audit logs data. This application provides interactive charts and tables to analyze event data from audit logs.

## Features

- Upload and parse CSV, TXT, or LOG files containing audit event data
- View interactive visualizations:
  - Action Types Distribution (Pie Chart)
  - Time of Day Distribution (Bar Chart)
  - Daily Activity Breakdown (Stacked Bar Chart)
  - Recent Events Timeline (Table)
- Support for multiple data formats:
  - Standard audit_logs.csv format with columns: Count, Group ID, Org ID, Project ID, User ID, Event, Time
  - Custom format with columns for user ID, session ID, resource ID, status, action type, timestamp
  - Space-delimited text files with similar column structure

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/luciano-mori/audit-logs-v2.git
   cd audit-logs-v2/event-visualizer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Tailwind CSS Setup:
   
   This project uses Tailwind CSS v3 for styling. Follow these specific steps if you're setting up the project from scratch or encountering styling issues:

   **Step 1:** Install specific Tailwind CSS dependencies with exact versions:
   ```bash
   npm install -D tailwindcss@3.3.3 postcss@8.4.27 autoprefixer@10.4.14
   ```

   **Step 2:** Generate the Tailwind and PostCSS configuration files:
   ```bash
   npx tailwindcss init -p
   ```

   **Step 3:** Replace the content of `postcss.config.js` with:
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

   **Step 4:** Replace the content of `tailwind.config.js` with:
   ```javascript
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
     ],
     theme: {
       extend: {
         colors: {
           // Custom color palette used in the project
           'blue-500': '#3b82f6',
           'blue-50': '#eff6ff',
           'red-500': '#ef4444',
           'red-50': '#fef2f2',
           'gray-50': '#f9fafb',
           'gray-100': '#f3f4f6',
           'gray-200': '#e5e7eb',
           'gray-300': '#d1d5db',
           'gray-500': '#6b7280',
           'gray-600': '#4b5563',
         },
       },
     },
     plugins: [],
   }
   ```

   **Step 5:** Ensure your `src/index.css` includes these exact Tailwind directives at the top:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* Your custom CSS can go below this line */
   body {
     margin: 0;
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
       'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
       sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }
   ```

   **Step 6:** Restart your development server completely:
   ```bash
   npm run build
   npm start
   ```

   **Common Tailwind Issues & Solutions:**

   - **Classes not applying**: Make sure the path in `content` array includes all your component files
   - **JIT mode problems**: Clear your browser cache and node_modules/.cache folder
   - **PostCSS errors**: Ensure you have the compatible versions of all packages
   - **Custom colors not working**: Verify your tailwind.config.js has the correct theme extensions

## Running the Application

1. Start the development server:
   ```
   npm start
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Use the file upload button to select and upload your audit log file

### Troubleshooting

- **Port conflicts**: If port 3000 is already in use, you'll be prompted to use another port. Type 'Y' to accept.

- **Dependencies issues**: If you encounter any dependency-related errors during startup:
  ```
  npm clean-cache --force
  rm -rf node_modules
  npm install
  ```

- **Recharts rendering issues**: If charts don't render properly, ensure you're using a compatible version:
  ```
  npm install recharts@2.1.9
  ```

## Supported File Formats

The visualizer supports several types of input files:

### CSV Format (audit_logs.csv)
```
Count,Group ID,Org ID,Project ID,User ID,Event,Time
1,0fe5f483-330b-4dc7-8770-a48422312f75,7568202e-ab7e-4a3e-8ca0-493b39157336,2af1da8b-8154-4c7e-880b-98fa0276d861,N/A,org.project.files.access,2025-03-15T03:03:59.000Z
```

### Standard Format (CSV or text)
```
user_id,session_id,resource_id,status,action_type,timestamp
```

## Building for Production

Build the application for production deployment:
```
npm run build
```

This creates an optimized production build in the `build` folder.

## Technology Stack

- React 18
- Recharts for data visualization
- Papa Parse for CSV parsing
- Tailwind CSS for styling

## System Requirements

- Node.js 14.0.0 or later
- npm 6.14.0 or later
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Browser Support

The application has been tested and verified on:
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Development

If you want to contribute to this project:

1. Fork the repository
2. Create a feature branch:
   ```
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests:
   ```
   npm test
   ```
5. Submit a pull request

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
