# Lansongxanh Vote Tracker

A comprehensive voting tracking and management system designed to monitor, analyze, and report voting activities and results in real-time.

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Installation Instructions](#installation-instructions)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Deployment Instructions](#deployment-instructions)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project Description

Lansongxanh Vote Tracker is a modern, web-based application that provides real-time voting tracking and analytics. Whether you're organizing a contest, election, survey, or any polling event, this tool offers a user-friendly interface to monitor vote counts, view detailed statistics, and generate comprehensive reports.

### Purpose

The application was built to simplify the process of:
- Managing multiple voting events
- Tracking votes in real-time
- Analyzing voting patterns and trends
- Generating reports and insights
- Ensuring transparent and accurate vote counting

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js / Express.js (optional)
- **Database**: LocalStorage / Cloud-based solutions
- **Hosting**: GitHub Pages
- **Version Control**: Git

## Features

### Core Features

✅ **Real-Time Vote Tracking**
- Live vote count updates
- Instant statistics refresh
- Multiple voting event support

✅ **Comprehensive Analytics**
- Vote distribution charts
- Percentage breakdowns
- Historical data tracking
- Trend analysis

✅ **User-Friendly Interface**
- Responsive design for all devices
- Intuitive navigation
- Clean and modern UI
- Accessibility features

✅ **Vote Management**
- Create and manage voting events
- Add/remove voting options
- Set voting timeframes
- Reset vote counts

✅ **Reporting & Export**
- Generate detailed reports
- Export data as CSV/JSON
- Share results
- Print-friendly format

✅ **Security Features**
- Input validation
- XSS protection
- CSRF tokens
- Secure data storage

## Installation Instructions

### Prerequisites

Before you begin, ensure you have the following installed:
- Git
- Node.js (v14.0.0 or higher) - optional, for local development server
- A modern web browser (Chrome, Firefox, Safari, Edge)
- GitHub account

### Step 1: Clone the Repository

```bash
git clone https://github.com/hoanggiaanh232/lansongxanh-vote-tracker.git
cd lansongxanh-vote-tracker
```

### Step 2: Install Dependencies

If you plan to run a local development server:

```bash
npm install
```

### Step 3: Project Structure Setup

Ensure your project directory structure looks like this:

```
lansongxanh-vote-tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── images/
│   └── icons/
├── README.md
└── docs/
    └── API.md
```

### Step 4: Configure (Optional)

For local development with a server:

```bash
npm start
# Server will run on http://localhost:3000
```

For GitHub Pages, no additional configuration is needed.

### Step 5: Verification

Open your browser and navigate to:
- **Local**: `http://localhost:3000` (if running development server)
- **GitHub Pages**: `https://hoanggiaanh232.github.io/lansongxanh-vote-tracker`

## Usage Guide

### Getting Started

1. **Access the Application**
   - Visit the GitHub Pages URL or open `index.html` locally

2. **Create a New Voting Event**
   - Click on "New Event" button
   - Enter event name and description
   - Add voting options
   - Set event parameters (start/end time, private/public)

3. **Add Voting Options**
   - Click "Add Option" button
   - Enter option name and description
   - Optionally upload images for visual voting

4. **Cast Votes**
   - Select a voting option
   - Confirm your selection
   - Vote count updates in real-time

### Viewing Results

**Dashboard View**
- Overview of all active voting events
- Current vote counts
- Live statistics

**Detailed Results**
- Click on any event to view detailed results
- See vote distribution charts
- Access full analytics

**Export Results**
- Click "Export" button
- Choose format (CSV, JSON, PDF)
- Download report

### Managing Events

**Edit Event**
- Click on event settings icon
- Modify event details
- Add/remove voting options

**Delete Event**
- Access event menu
- Click "Delete Event"
- Confirm deletion

**Archive Event**
- Archive old voting events
- Keep records for history
- Restore archived events if needed

## API Documentation

### Overview

The Vote Tracker system provides REST API endpoints for integration with external applications.

### Base URL

```
https://api.lansongxanh-vote-tracker.com/v1
```

Or for local development:

```
http://localhost:3000/api/v1
```

### Authentication

Include your API key in request headers:

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Endpoints

#### 1. Get All Events

**Request**
```http
GET /events
Authorization: Bearer YOUR_API_KEY
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_001",
      "name": "Best Product Vote",
      "description": "Vote for your favorite product",
      "status": "active",
      "createdAt": "2025-12-26T10:00:00Z",
      "options": [
        { "id": "opt_1", "name": "Product A", "votes": 150 },
        { "id": "opt_2", "name": "Product B", "votes": 125 }
      ]
    }
  ]
}
```

#### 2. Create New Event

**Request**
```http
POST /events
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "New Voting Event",
  "description": "Description of the event",
  "options": [
    { "name": "Option 1" },
    { "name": "Option 2" }
  ],
  "startTime": "2025-12-26T12:00:00Z",
  "endTime": "2025-12-27T12:00:00Z"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "event_new",
    "name": "New Voting Event",
    "status": "created"
  }
}
```

#### 3. Cast a Vote

**Request**
```http
POST /events/{eventId}/vote
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "optionId": "opt_1",
  "voterId": "voter_id_optional"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "eventId": "event_001",
    "optionId": "opt_1",
    "newVoteCount": 151
  }
}
```

#### 4. Get Event Details

**Request**
```http
GET /events/{eventId}
Authorization: Bearer YOUR_API_KEY
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "event_001",
    "name": "Best Product Vote",
    "totalVotes": 275,
    "options": [
      { "id": "opt_1", "name": "Product A", "votes": 150, "percentage": 54.5 },
      { "id": "opt_2", "name": "Product B", "votes": 125, "percentage": 45.5 }
    ]
  }
}
```

#### 5. Update Event

**Request**
```http
PUT /events/{eventId}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Updated Event Name",
  "description": "Updated description"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "event_001",
    "message": "Event updated successfully"
  }
}
```

#### 6. Delete Event

**Request**
```http
DELETE /events/{eventId}
Authorization: Bearer YOUR_API_KEY
```

**Response**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "code": "BAD_REQUEST"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid or missing API key",
  "code": "UNAUTHORIZED"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Event not found",
  "code": "NOT_FOUND"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

## Deployment Instructions

### Option 1: GitHub Pages (Recommended for Static Sites)

GitHub Pages is the simplest way to deploy the application with no additional cost.

#### Steps:

1. **Enable GitHub Pages**
   - Go to repository settings
   - Navigate to "Pages" section
   - Select "Deploy from a branch"
   - Choose branch: `main` (or your default branch)
   - Select folder: `/ (root)` or `/docs` if applicable
   - Click "Save"

2. **Wait for Deployment**
   - GitHub will automatically build and deploy
   - Check the "Deployments" section for status
   - Your site will be available at: `https://hoanggiaanh232.github.io/lansongxanh-vote-tracker`

3. **Verify Deployment**
   - Visit the GitHub Pages URL
   - Test all functionality
   - Check console for any errors

#### Troubleshooting GitHub Pages

- **Site not updating**: Clear browser cache and wait a few minutes
- **404 errors**: Verify file paths are correct (case-sensitive on Linux)
- **CSS/JS not loading**: Check file paths in HTML are relative paths
- **Custom domain**: Add CNAME file to repository root if using custom domain

### Option 2: Manual Deployment to Web Server

For deploying to your own server:

#### Steps:

1. **Prepare Files**
   ```bash
   # Ensure all files are ready
   ls -la
   ```

2. **Connect to Server**
   ```bash
   # Using SFTP or FTP
   sftp user@your-server.com
   cd public_html
   put -r ./*
   ```

3. **Or using SSH**
   ```bash
   ssh user@your-server.com
   cd public_html
   git clone https://github.com/hoanggiaanh232/lansongxanh-vote-tracker.git
   ```

4. **Configure Web Server**
   - Ensure `.htaccess` for Apache or nginx configuration
   - Set proper file permissions: `chmod 755 -R .`
   - Enable HTTPS if required

### Option 3: Docker Deployment

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Deploy using:
```bash
docker build -t lansongxanh-vote-tracker .
docker run -p 3000:3000 lansongxanh-vote-tracker
```

### Option 4: Vercel or Netlify

For seamless deployment with auto-updates:

**Vercel:**
1. Go to vercel.com and sign in with GitHub
2. Select "Import Project"
3. Choose your repository
4. Configure settings (usually auto-detected)
5. Click "Deploy"

**Netlify:**
1. Go to netlify.com and sign in with GitHub
2. Click "New site from Git"
3. Select your repository
4. Configure build settings if needed
5. Deploy

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Votes Not Updating in Real-Time

**Symptoms**: Vote counts don't update without manual refresh

**Solutions**:
- Check browser console for JavaScript errors (F12 → Console)
- Verify WebSocket connection is enabled (if using real-time features)
- Clear browser cache: Ctrl+Shift+Delete
- Try different browser
- Disable browser extensions that might block updates

#### Issue 2: GitHub Pages Site Not Loading

**Symptoms**: 404 error or blank page

**Solutions**:
- Verify repository is public
- Check GitHub Pages is enabled in settings
- Ensure `index.html` exists in the correct branch
- Check file paths are relative, not absolute
- Wait 5-10 minutes after enabling Pages
- Try incognito/private browsing mode

#### Issue 3: CSS/JavaScript Files Not Loading

**Symptoms**: Unstyled page or functionality doesn't work

**Solutions**:
```html
<!-- Correct relative paths for GitHub Pages -->
<link rel="stylesheet" href="css/style.css">
<script src="js/script.js"></script>

<!-- Not: /css/style.css or absolute paths -->
```

- Check file names are case-sensitive
- Verify files exist in repository
- Check file paths in HTML match actual structure
- Look for mixed content warnings (HTTPS/HTTP)

#### Issue 4: Data Not Persisting

**Symptoms**: Votes are lost after page refresh

**Solutions**:
- Check LocalStorage is enabled in browser
- Verify no privacy mode is enabled
- Check browser storage quota isn't exceeded
- Clear browser data selectively (keep site data)
- Implement backend database if needed

#### Issue 5: CORS Errors When Using API

**Symptoms**: Cross-Origin Request Blocked error in console

**Solutions**:
```javascript
// Ensure API calls include proper headers
fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify(data)
});
```

- Add CORS headers to backend
- Use proxy service if calling external API
- Check API key is valid and not expired

#### Issue 6: Performance Issues

**Symptoms**: Slow page load or sluggish interface

**Solutions**:
- Minimize and compress CSS/JavaScript files
- Optimize images (use WebP format)
- Implement lazy loading
- Use browser caching headers
- Monitor network requests (DevTools → Network)
- Reduce DOM elements and animations

#### Issue 7: Mobile Responsiveness Issues

**Symptoms**: Layout breaks on mobile devices

**Solutions**:
```html
<!-- Ensure viewport meta tag is present -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- Use CSS media queries
- Test on various devices/sizes
- Use responsive framework (Bootstrap, Tailwind)
- Ensure touch-friendly button sizes (min 44×44px)

### Getting Help

1. **Check Existing Issues**: Search GitHub Issues for similar problems
2. **Read Error Messages**: Console errors provide valuable information
3. **Search Online**: Stack Overflow, GitHub Discussions
4. **Create GitHub Issue**: Include:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/error messages
5. **Contact Support**: Open an issue with detailed information

### Debug Mode

Enable debug mode for development:

```javascript
// In your JavaScript console
localStorage.setItem('DEBUG_MODE', 'true');
location.reload();
```

This will:
- Log detailed information to console
- Show performance metrics
- Display API request/response details
- Reveal data structure information

## Contributing

Contributions are welcome! Here's how to contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please ensure:
- Code follows project style guidelines
- Tests pass (if applicable)
- Documentation is updated
- Commits have clear messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Contact

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: hoanggiaanh232@example.com
- **Website**: https://hoanggiaanh232.github.io/lansongxanh-vote-tracker

---

**Last Updated**: December 26, 2025

Made with ❤️ by [hoanggiaanh232](https://github.com/hoanggiaanh232)
