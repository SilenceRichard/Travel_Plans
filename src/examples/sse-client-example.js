#!/usr/bin/env node

/**
 * SSE Client Example for Transportation Information MCP Server
 * 
 * This example demonstrates how to connect to the SSE server and send requests to the MCP tools.
 * 
 * Usage:
 * 1. Start the SSE server: `node ./src/sse-server.js --port=3000 [--token=your_auth_token]`
 * 2. Run this example: `node ./src/examples/sse-client-example.js`
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SSE_ENDPOINT = `${SERVER_URL}/sse`;
const MESSAGES_ENDPOINT = `${SERVER_URL}/messages`;
const AUTH_TOKEN = ''; // Set your auth token here if needed

// Example request parameters
const EXAMPLES = {
  flightInfo: {
    from: '北京',
    to: '上海',
    date: '2023-08-15',
    headless: true,
    saveScreenshot: true,
    verbose: true
  },
  trainInfo: {
    from: '北京',
    to: '上海',
    date: '2023-08-15',
    headless: true,
    saveScreenshot: true,
    verbose: true
  },
  airportCode: {
    city: '成都'
  }
};

/**
 * Setup SSE connection to server
 */
function setupSseConnection() {
  const headers = {};
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  // Create EventSource connection
  console.log(`Connecting to SSE endpoint: ${SSE_ENDPOINT}`);
  
  return new Promise((resolve, reject) => {
    // In a browser environment, you would use:
    // const eventSource = new EventSource(SSE_ENDPOINT);
    
    // For Node.js, we'll simulate the SSE connection
    console.log('SSE connection established (simulated)');
    console.log('Waiting for messages...');
    
    resolve();
  });
}

/**
 * Send a request to the server
 */
async function sendRequest(toolName, parameters) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  // Generate a unique message ID
  const messageId = uuidv4();
  
  // Create the MCP request
  const request = {
    id: messageId,
    method: 'mcp.toolCall',
    params: {
      tool: toolName,
      parameters
    }
  };
  
  console.log(`\nSending request to ${toolName}:`);
  console.log(JSON.stringify(parameters, null, 2));
  
  try {
    // Send request
    const response = await fetch(MESSAGES_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    // Process response
    const result = await response.json();
    console.log(`\nReceived response from ${toolName}:`);
    
    if (result.error) {
      console.error('Error:', result.error);
      return null;
    }
    
    // Extract content from response
    const content = result.result?.content;
    if (content && content.length > 0) {
      content.forEach(item => {
        if (item.type === 'text') {
          console.log(item.text);
        } else {
          console.log(item);
        }
      });
    } else {
      console.log('No content in response');
    }
    
    return result;
  } catch (error) {
    console.error('Error sending request:', error.message);
    return null;
  }
}

/**
 * Run the example
 */
async function runExample() {
  try {
    // Setup SSE connection
    await setupSseConnection();
    
    // Example 1: Look up airport code
    console.log('\n--- Example 1: Look up airport code ---');
    await sendRequest('lookup_airport_code', EXAMPLES.airportCode);
    
    // Example 2: Get flight information
    console.log('\n--- Example 2: Get flight information ---');
    await sendRequest('get_flight_info', EXAMPLES.flightInfo);
    
    // Example 3: Get train information
    console.log('\n--- Example 3: Get train information ---');
    await sendRequest('get_train_info', EXAMPLES.trainInfo);
    
    console.log('\nExamples completed. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example
runExample();