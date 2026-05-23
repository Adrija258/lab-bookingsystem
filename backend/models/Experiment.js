const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        requiredEquipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
        lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
        branch: { type: String, trim: true },
        year: { type: Number },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Experiment', experimentSchema);
