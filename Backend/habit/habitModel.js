// =============================================================================
// MODELS/HABITMODEL.JS — Mongoose Schema for a Personal Habit (basic test version)
// =============================================================================
// This is a simplified single-model version for testing CRUD operations.
// What Mongoose does with this file:
//   1. You define a Schema (the blueprint / shape of the data)
//   2. mongoose.model() compiles it into a Model (the class you query with)
//   3. Mongoose stores documents in a collection called "habits" (auto-lowercased + pluralised)
// =============================================================================

const mongoose = require('mongoose')

// Allowed values for the category field — from the UML HabitCategory enumeration
const HABIT_CATEGORIES = ['Nutrition', 'Fitness', 'Learning', 'Wellness', 'Productivity', 'Other'] // for future use when we add the "category" field to the schema
const HABIT_FREQUENCY  = ['daily', 'weekly'] // for future use when we add the "frequency" field to the schema
const HABIT_TYPES = ['build', 'break'] // for future use when we add the "type" field to the schema
const HABIT_KINDS = ['personal', 'challenge']
// Allowed icon names — must match the frontend's HABIT_ICONS list
const HABIT_ICONS = ['nutrition', 'fitness', 'learning', 'wellness', 'productivity', 'other']


// Main habit schema — fields from the UML Habit base class + HabitPersonal
const habitSchema = new mongoose.Schema({

    // From UML Habit base: title, frequency, content, category
    title: {
        type: String,
        required: true,
        trim: true
    },
    // Progress period math switches on this: daily buckets by date, weekly by Monday week.
    frequency: {
        type: String,
        required: true,
        enum: HABIT_FREQUENCY
    },
    content: { //motivation or goal description — optional, so no "required" rule
        type: String,
        trim: true      // optional — e.g. "minutes", "km", "pages"
    },
    kpi: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,         // category is now mandatory — the user must pick one in the form
        enum: HABIT_CATEGORIES  // Mongoose rejects any value not in this list
    },
    // Progress uses build/break for wording and heatmap color, not for streak math.
    habitType: {
        type: String,
        required: true,
        enum: HABIT_TYPES   // 'build' = positive routine, 'break' = negative pattern
    },
    icon: { //category icon name from the frontend's HABIT_ICONS list (e.g. "nutrition", "fitness", etc.)
        type: String,
        default: undefined,   // optional — no default icon; user can pick one from the frontend's HABIT_ICONS list
        enum: HABIT_ICONS   // optional — no required
    },
    // Personal habits belong to users; challenge habits are shared and tracked per participant.
    kind: {
        type: String,
        required: true,
        enum: HABIT_KINDS,
        default: 'personal'
    },

    // Personal habits belong to a user; challenge habits belong to a challenge.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        required: function () {
            return this.kind === 'personal'
        }
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        default: null,
        required: function () {
            return this.kind === 'challenge'
        }
    }


}, { timestamps: true })
// timestamps: true auto-adds createdAt and updatedAt to every document

habitSchema.pre('validate', function () {
    if (this.kind === 'personal' && this.challenge) {
        throw new Error('Personal habits cannot reference a challenge.')
    }

    if (this.kind === 'challenge' && this.user) {
        throw new Error('Challenge habits cannot reference a user.')
    }
})

// mongoose.model('Habit', habitSchema)
//   'Habit' is the model name (used in controllers: Habit.find(), Habit.create(), etc.)
//   Mongoose maps this to a MongoDB collection called 'habits'
module.exports = mongoose.model('Habit', habitSchema)
