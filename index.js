// Satellite Glitch Spotter Tool Entry Point
// This file is used by the NexusHub to launch the tool

const path = require('path');

module.exports = {
    name: 'Satellite Glitch Spotter',
    description: 'Advanced anomaly detection system for satellite imagery analysis',
    version: '1.0.0',
    author: 'Cursor AI',
    category: 'Analysis',
    icon: '🛰️',
    htmlFile: path.join(__dirname, 'tool.html'),
    features: [
        'Image upload and analysis',
        'Edge detection algorithms',
        'Color deviation mapping',
        'Pattern recognition',
        'Compression artifact detection',
        'Contour mapping',
        'Suspicion Scale™ scoring',
        'Export capabilities'
    ],
    requirements: {
        node: '>=14.0.0',
        browser: 'Modern browser with Canvas API support'
    }
}; 