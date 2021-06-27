const mongoose = require('mongoose');

const serverScheme = new mongoose.Schema({
    serverID: { type: String, required: true, unique: true },
    movies: [{
        movieTitle: { type: String, required: true },
        movieID: { type: String, required: true },
        addedBy: { type: String, required: true },
        dateAdded: { type: Date }
    }],
    watchList: [{
        movieTitle: { type: String, required: true },
        movieID: { type: String, required: true },
        addedBy: { type: String, required: true },
        dateAdded: { type: Date }
    }],
});

const model = mongoose.model('ServerModels', serverScheme);

module.exports = model;