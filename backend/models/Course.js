const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true, trim: true },
        branch: { type: String, trim: true },
        year: { type: Number },
        lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
        semester: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
