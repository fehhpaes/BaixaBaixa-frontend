const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { Channel } = require('./models');
const monitor = require('./monitor');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/channels', async (req, res) => {
    const channels = await Channel.find({});
    res.json(channels);
});

app.post('/api/channels', async (req, res) => {
    const { name, url, type, save_path } = req.body;
    const channel = new Channel({ name, url, type, save_path });
    await channel.save();
    res.json(channel);
});

app.post('/api/channels/:id/toggle', async (req, res) => {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Canal não encontrado' });
    channel.auto_download = !channel.auto_download;
    await channel.save();
    
    if (channel.auto_download) {
        monitor.startMonitoring(channel._id, channel.url, channel.type, channel.save_path);
    } else {
        monitor.stopMonitoring(channel._id);
    }
    res.json(channel);
});

app.delete('/api/channels/:id', async (req, res) => {
    await Channel.findByIdAndDelete(req.params.id);
    monitor.stopMonitoring(req.params.id);
    res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
    res.json({ google: false, microsoft: false, isLocal: true });
});

const PORT = 3001;
app.listen(PORT, 'localhost', async () => {
    console.log("[BaixaBaixa] Local Backend Engine (MongoDB) running on port " + PORT);
    const activeChannels = await Channel.find({ auto_download: true });
    activeChannels.forEach(chan => {
        monitor.startMonitoring(chan._id, chan.url, chan.type, chan.save_path);
    });
});