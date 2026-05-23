const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
    {
        leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
        lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
