const axios = require('axios');
const monitor = require('./monitor.cjs');
const path = require('path');

const CLOUD_API = 'https://baixabaixa.onrender.com/api';
const API_KEY = 'baixabaixa-secret-2026';

const api = axios.create({
    baseURL: CLOUD_API,
    headers: { 'x-api-key': API_KEY }
});

async function pollForWork() {
    try {
        console.log('[Agent] Polling for work...');
        const res = await api.get('/agent/work');
        
        if (res.data && res.data._id) {
            const work = res.data;
            console.log(`[Agent] New work found: ${work.url}`);
            
            // Perform download
            try {
                // We use our existing monitor logic but we need to notify the cloud when done
                await monitor.startMonitoring(work._id, work.url, work.type, work.save_path);
                
                // Since startMonitoring is async/spawn, we need a way to know when it finishes
                // For now, let's just mark it as "completed" after a while or hook into monitor events
                // In a real scenario, monitor.js should emit events.
            } catch (err) {
                await api.post(`/agent/${work._id}/status`, { status: 'error' });
            }
        }
    } catch (err) {
        console.error('[Agent] Polling failed:', err.message);
    }
}

// Start polling loop
setInterval(pollForWork, 30000); // 30 seconds
pollForWork();

console.log('[Agent] Local Worker Started.');
