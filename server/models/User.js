const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    githubId: {type: String, required: true, unique: true},
    githubUsername: String,
    email: String,
    avatar: String,
    accessToken: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);