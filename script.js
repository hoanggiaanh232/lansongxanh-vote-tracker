/**
 * Vote Tracking System - Main JavaScript Module
 * Handles API integration, real-time updates, data processing, and UI rendering
 * Created: 2025-12-26 14:52:16 UTC
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  POLL_INTERVAL: 5000, // 5 seconds for real-time updates
  WEBSOCKET_URL: process.env.WS_URL || 'ws://localhost:3000/ws',
  CACHE_DURATION: 60000, // 1 minute
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  votes: [],
  candidates: [],
  totalVotes: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  wsConnected: false,
  pollingActive: false,
  cache: {
    votes: null,
    timestamp: null,
  },
};

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * Generic API request handler with retry logic and error handling
 */
async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    retries = CONFIG.MAX_RETRIES,
  } = options;

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(
        `API request failed, retrying... (${CONFIG.MAX_RETRIES - retries + 1}/${CONFIG.MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return apiRequest(endpoint, { ...options, retries: retries - 1 });
    }

    updateError(`Failed to fetch from ${endpoint}: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch all votes from API
 */
async function fetchVotes() {
  try {
    setState({ isLoading: true });
    const data = await apiRequest('/votes');
    return data.votes || [];
  } catch (error) {
    console.error('Error fetching votes:', error);
    return [];
  } finally {
    setState({ isLoading: false });
  }
}

/**
 * Fetch candidates from API
 */
async function fetchCandidates() {
  try {
    const data = await apiRequest('/candidates');
    return data.candidates || [];
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
}

/**
 * Submit a new vote
 */
async function submitVote(candidateId) {
  try {
    const data = await apiRequest('/votes', {
      method: 'POST',
      body: {
        candidateId,
        timestamp: new Date().toISOString(),
      },
    });
    return data;
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
}

/**
 * Fetch vote statistics
 */
async function fetchVoteStats() {
  try {
    const data = await apiRequest('/stats');
    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// ============================================================================
// REAL-TIME UPDATES WITH WEBSOCKET
// ============================================================================

let wsConnection = null;

/**
 * Initialize WebSocket connection for real-time updates
 */
function initWebSocket() {
  return new Promise((resolve, reject) => {
    try {
      wsConnection = new WebSocket(CONFIG.WEBSOCKET_URL);

      wsConnection.onopen = () => {
        console.log('WebSocket connected');
        setState({ wsConnected: true });
        resolve();
      };

      wsConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateError('Real-time connection error');
        reject(error);
      };

      wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        setState({ wsConnected: false });
        // Attempt to reconnect after delay
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          initWebSocket().catch(console.error);
        }, CONFIG.RETRY_DELAY);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'new_vote':
      handleNewVote(message.data);
      break;
    case 'stats_update':
      handleStatsUpdate(message.data);
      break;
    case 'error':
      updateError(message.data.message);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}

/**
 * Handle new vote event
 */
function handleNewVote(voteData) {
  state.votes.push(voteData);
  state.totalVotes = state.votes.length;
  invalidateCache();
  renderVoteResults();
  renderStats();
}

/**
 * Handle stats update event
 */
function handleStatsUpdate(stats) {
  state.totalVotes = stats.totalVotes;
  invalidateCache();
  renderStats();
}

/**
 * Send message through WebSocket
 */
function sendWebSocketMessage(type, data) {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(
      JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// ============================================================================
// POLLING FOR REAL-TIME UPDATES (Fallback)
// ============================================================================

let pollingInterval = null;

/**
 * Start polling for vote updates
 */
function startPolling() {
  if (state.pollingActive) return;

  state.pollingActive = true;
  console.log('Starting vote polling...');

  pollingInterval = setInterval(async () => {
    try {
      const votes = await fetchVotes();
      
      // Check if there are new votes
      if (votes.length > state.votes.length) {
        state.votes = votes;
        state.totalVotes = votes.length;
        invalidateCache();
        renderVoteResults();
        renderStats();
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, CONFIG.POLL_INTERVAL);
}

/**
 * Stop polling for updates
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    state.pollingActive = false;
    console.log('Polling stopped');
  }
}

// ============================================================================
// DATA PROCESSING & ANALYTICS
// ============================================================================

/**
 * Process votes and calculate statistics
 */
function processVoteData(votes) {
  const stats = {
    totalVotes: votes.length,
    votesByCandidate: {},
    percentages: {},
    lastUpdated: new Date(),
  };

  // Group votes by candidate
  votes.forEach((vote) => {
    const candidateId = vote.candidateId;
    stats.votesByCandidate[candidateId] =
      (stats.votesByCandidate[candidateId] || 0) + 1;
  });

  // Calculate percentages
  state.candidates.forEach((candidate) => {
    const candidateId = candidate.id;
    const voteCount = stats.votesByCandidate[candidateId] || 0;
    stats.percentages[candidateId] =
      stats.totalVotes > 0 ? (voteCount / stats.totalVotes) * 100 : 0;
  });

  return stats;
}

/**
 * Get votes for a specific candidate
 */
function getVotesForCandidate(candidateId) {
  return state.votes.filter((vote) => vote.candidateId === candidateId);
}

/**
 * Get candidate by ID
 */
function getCandidateById(candidateId) {
  return state.candidates.find((c) => c.id === candidateId);
}

/**
 * Get top candidates by vote count
 */
function getTopCandidates(limit = 5) {
  const stats = processVoteData(state.votes);
  return state.candidates
    .map((candidate) => ({
      ...candidate,
      votes: stats.votesByCandidate[candidate.id] || 0,
      percentage: stats.percentages[candidate.id] || 0,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, limit);
}

/**
 * Calculate voting trends (votes per time interval)
 */
function calculateVotingTrends(intervalMinutes = 5) {
  const trends = {};
  const now = new Date();

  state.votes.forEach((vote) => {
    const voteTime = new Date(vote.timestamp);
    const timeDiff = Math.floor((now - voteTime) / (1000 * 60 * intervalMinutes));
    const timeKey = `${intervalMinutes * timeDiff} mins ago`;

    trends[timeKey] = (trends[timeKey] || 0) + 1;
  });

  return trends;
}

// ============================================================================
// CACHING MECHANISM
// ============================================================================

/**
 * Get cached votes if valid
 */
function getCachedVotes() {
  const now = Date.now();
  if (
    state.cache.votes &&
    state.cache.timestamp &&
    now - state.cache.timestamp < CONFIG.CACHE_DURATION
  ) {
    console.log('Using cached votes');
    return state.cache.votes;
  }
  return null;
}

/**
 * Set votes cache
 */
function setCachedVotes(votes) {
  state.cache.votes = votes;
  state.cache.timestamp = Date.now();
}

/**
 * Invalidate cache
 */
function invalidateCache() {
  state.cache.votes = null;
  state.cache.timestamp = null;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Update state
 */
function setState(updates) {
  Object.assign(state, updates);
  console.log('State updated:', state);
}

/**
 * Update error state
 */
function updateError(errorMessage) {
  setState({ error: errorMessage });
  renderError();
}

/**
 * Clear error
 */
function clearError() {
  setState({ error: null });
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = '';
  }
}

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Render vote results with bar charts
 */
function renderVoteResults() {
  const resultsContainer = document.getElementById('vote-results');
  if (!resultsContainer) return;

  const stats = processVoteData(state.votes);
  const topCandidates = getTopCandidates();

  let html = '<div class="vote-results">';
  html += '<h2>Vote Results</h2>';

  if (topCandidates.length === 0) {
    html += '<p class="no-data">No votes yet</p>';
  } else {
    html += '<div class="results-list">';
    topCandidates.forEach((candidate) => {
      const barWidth = candidate.percentage;
      const barColor = getBarColor(candidate.percentage);

      html += `
        <div class="result-item">
          <div class="candidate-info">
            <span class="candidate-name">${escapeHtml(candidate.name)}</span>
            <span class="vote-count">${candidate.votes} votes (${candidate.percentage.toFixed(1)}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${barWidth}%; background-color: ${barColor};">
              <span class="percentage-label">${candidate.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  resultsContainer.innerHTML = html;
}

/**
 * Render voting statistics
 */
function renderStats() {
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;

  const stats = processVoteData(state.votes);

  let html = '<div class="stats">';
  html += '<h3>Statistics</h3>';
  html += `<div class="stat-item"><strong>Total Votes:</strong> ${stats.totalVotes}</div>`;
  html += `<div class="stat-item"><strong>Last Updated:</strong> ${new Date().toLocaleTimeString()}</div>`;
  html += `<div class="stat-item"><strong>Connection Status:</strong> <span class="status ${state.wsConnected ? 'connected' : 'disconnected'}">${state.wsConnected ? 'Connected' : 'Polling Mode'}</span></div>`;
  html += '</div>';

  statsContainer.innerHTML = html;
}

/**
 * Render error message
 */
function renderError() {
  const errorContainer = document.getElementById('error-container');
  if (!errorContainer) return;

  if (state.error) {
    errorContainer.innerHTML = `
      <div class="error-message">
        <strong>Error:</strong> ${escapeHtml(state.error)}
        <button onclick="clearError()" class="close-btn">×</button>
      </div>
    `;
  } else {
    errorContainer.innerHTML = '';
  }
}

/**
 * Render candidate voting form
 */
function renderVotingForm() {
  const formContainer = document.getElementById('voting-form');
  if (!formContainer) return;

  let html = '<div class="voting-form">';
  html += '<h2>Cast Your Vote</h2>';

  if (state.candidates.length === 0) {
    html += '<p class="no-data">No candidates available</p>';
  } else {
    html += '<div class="candidates-grid">';
    state.candidates.forEach((candidate) => {
      html += `
        <div class="candidate-card">
          <h3>${escapeHtml(candidate.name)}</h3>
          <p class="candidate-description">${escapeHtml(candidate.description || '')}</p>
          <button 
            class="vote-btn" 
            onclick="handleVoteClick('${candidate.id}')"
            ${state.isLoading ? 'disabled' : ''}
          >
            Vote
          </button>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  formContainer.innerHTML = html;
}

/**
 * Render trends chart
 */
function renderTrends() {
  const trendsContainer = document.getElementById('trends-container');
  if (!trendsContainer) return;

  const trends = calculateVotingTrends(5);
  const sortedTrends = Object.entries(trends)
    .sort((a, b) => {
      const aMinutes = parseInt(a[0]);
      const bMinutes = parseInt(b[0]);
      return aMinutes - bMinutes;
    })
    .slice(-10); // Last 10 intervals

  let html = '<div class="trends">';
  html += '<h3>Voting Trends (Last 50 Minutes)</h3>';

  if (sortedTrends.length === 0) {
    html += '<p class="no-data">No trend data</p>';
  } else {
    html += '<div class="trends-chart">';
    const maxVotes = Math.max(...sortedTrends.map((t) => t[1]));

    sortedTrends.forEach(([timeLabel, voteCount]) => {
      const barHeight = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
      html += `
        <div class="trend-item">
          <div class="trend-bar" style="height: ${barHeight}%; background-color: #3498db;">
            <span class="trend-value">${voteCount}</span>
          </div>
          <span class="trend-label">${timeLabel}</span>
        </div>
      `;
    });

    html += '</div>';
  }

  html += '</div>';
  trendsContainer.innerHTML = html;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle vote button click
 */
async function handleVoteClick(candidateId) {
  try {
    setState({ isLoading: true });
    clearError();

    await submitVote(candidateId);

    const candidate = getCandidateById(candidateId);
    showSuccessMessage(
      `Vote cast for ${candidate?.name || 'candidate'} successfully!`
    );

    // Refresh data
    await loadInitialData();
  } catch (error) {
    updateError(`Failed to submit vote: ${error.message}`);
  } finally {
    setState({ isLoading: false });
  }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  const successContainer = document.getElementById('success-container');
  if (!successContainer) return;

  successContainer.innerHTML = `
    <div class="success-message">
      ${escapeHtml(message)}
      <button onclick="this.parentElement.remove()" class="close-btn">×</button>
    </div>
  `;

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    successContainer.innerHTML = '';
  }, 3000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Load initial data
 */
async function loadInitialData() {
  try {
    const [votes, candidates] = await Promise.all([
      fetchVotes(),
      fetchCandidates(),
    ]);

    setState({
      votes,
      candidates,
      totalVotes: votes.length,
      lastUpdated: new Date(),
    });

    setCachedVotes(votes);
    renderVotingForm();
    renderVoteResults();
    renderStats();
    renderTrends();
  } catch (error) {
    console.error('Error loading initial data:', error);
    updateError('Failed to load voting data');
  }
}

/**
 * Initialize real-time updates
 */
async function initializeRealTimeUpdates() {
  try {
    // Try WebSocket first
    await initWebSocket();
    console.log('Real-time updates via WebSocket enabled');
  } catch (error) {
    console.warn('WebSocket connection failed, falling back to polling:', error);
    startPolling();
  }
}

/**
 * Initialize the application
 */
async function initialize() {
  console.log('Initializing Vote Tracker...');

  try {
    await loadInitialData();
    await initializeRealTimeUpdates();

    console.log('Vote Tracker initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    updateError('Failed to initialize application');
  }
}

/**
 * Cleanup and teardown
 */
function cleanup() {
  stopPolling();
  if (wsConnection) {
    wsConnection.close();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get color based on percentage
 */
function getBarColor(percentage) {
  if (percentage >= 40) return '#27ae60'; // Green
  if (percentage >= 20) return '#f39c12'; // Orange
  return '#e74c3c'; // Red
}

/**
 * Format date to readable string
 */
function formatDate(date) {
  return new Date(date).toLocaleString();
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// EXPORT FOR MODULE USAGE
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initialize,
    cleanup,
    state,
    // API functions
    fetchVotes,
    fetchCandidates,
    submitVote,
    fetchVoteStats,
    // WebSocket functions
    initWebSocket,
    sendWebSocketMessage,
    // Polling functions
    startPolling,
    stopPolling,
    // Data processing
    processVoteData,
    getVotesForCandidate,
    getCandidateById,
    getTopCandidates,
    calculateVotingTrends,
    // Rendering functions
    renderVoteResults,
    renderStats,
    renderVotingForm,
    renderTrends,
    renderError,
    // Utilities
    escapeHtml,
    getBarColor,
    formatDate,
    debounce,
    throttle,
  };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
