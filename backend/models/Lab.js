const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        branch: { type: String, trim: true, default: 'General' },
        assignedLabIncharge: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        description: { type: String, trim: true, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Lab', labSchema);

