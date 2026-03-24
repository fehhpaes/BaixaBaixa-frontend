const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['live', 'posts'], default: 'live' },
    save_path: { type: String, default: 'downloads' },
    status: { type: String, enum: ['idle', 'monitoring', 'downloading', 'error'], default: 'idle' },
    auto_download: { type: Boolean, default: true },
    last_checked: { type: Date, default: Date.now },
}, { timestamps: true });

const Channel = mongoose.model('Channel', channelSchema);

module.exports = { Channel };
