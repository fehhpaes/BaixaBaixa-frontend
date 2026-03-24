const { spawn, exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const storage = require('./storage.cjs');

const CLOUD_API = 'https://baixabaixa.onrender.com/api';
const API_KEY = 'baixabaixa-secret-2026';

const api = axios.create({
    baseURL: CLOUD_API,
    headers: { 'x-api-key': API_KEY }
});

class MonitorManager {
    constructor() {
        this.processes = new Map();
        this.pollers = new Map();
    }

    async updateStatus(id, status) {
        try {
            await api.post(`/agent/${id}/status`, { status });
        } catch (err) {
            console.error(`[Monitor] Failed to update cloud status for ${id}:`, err.message);
        }
    }

    startMonitoring(channelId, url, type = 'live', savePath = null) {
        if (type === 'live') {
            this.startLiveMonitoring(channelId, url, savePath);
        } else {
            this.startPostMonitoring(channelId, url, savePath);
        }
    }

    async startLiveMonitoring(channelId, url, savePath = null) {
        if (this.processes.has(channelId.toString())) return;

        console.log(`[Live Monitor] Starting for ${url}`);
        const ytDlpPath = path.resolve(__dirname, '../yt-dlp.exe');
        const downloadDir = savePath ? savePath : 'downloads';
        const filename = `%(uploader)s/%(title)s [%(upload_date)s] [%(id)s].mp4`;
        const outputTemplate = path.join(path.resolve(__dirname, '..', downloadDir), filename);

        const args = [
            url,
            '--format', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
            '--merge-output-format', 'mp4',
            '--wait-for-video', '60',
            '--live-from-start',
            '--output', outputTemplate,
            '--newline',
            '--progress'
        ];
        
        const proc = spawn(ytDlpPath, args);
        this.processes.set(channelId.toString(), proc);
        this.updateStatus(channelId, 'monitoring');

        proc.on('close', (code) => {
            this.processes.delete(channelId.toString());
            this.updateStatus(channelId, code === 0 ? 'completed' : 'error');
        });
    }

    startPostMonitoring(channelId, url, savePath = null) {
        if (this.pollers.has(channelId.toString())) return;
        this.runGalleryDl(channelId, url, savePath);
        const interval = setInterval(() => this.runGalleryDl(channelId, url, savePath), 30 * 60 * 1000);
        this.pollers.set(channelId.toString(), interval);
    }

    async runGalleryDl(channelId, url, savePath = null) {
        const galleryPath = path.resolve(__dirname, '../gallery-dl.exe');
        const downloadDir = savePath ? path.resolve(__dirname, '..', savePath) : path.resolve(__dirname, '..', 'downloads');

        this.updateStatus(channelId, 'downloading');
        const cmd = `"${galleryPath}" --directory "${downloadDir}" "${url}"`;
        exec(cmd, (error) => {
            this.updateStatus(channelId, error ? 'error' : 'completed');
        });
    }

    stopMonitoring(channelId) {
        const idStr = channelId.toString();
        if (this.processes.has(idStr)) {
            this.processes.get(idStr).kill();
            this.processes.delete(idStr);
        }
        if (this.pollers.has(idStr)) {
            clearInterval(this.pollers.get(idStr));
            this.pollers.delete(idStr);
        }
    }
}

module.exports = new MonitorManager();
