/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;

/**
 * Agent Schema
 */
var AgentSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    // API Key
    // Historical portfolio compositions
    // Historical portfolio values
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    league: {
        type: Schema.ObjectId,
        ref: 'League'
    }
});

/**
 * Validations
 */
AgentSchema.path('name').validate(function(name) {
    return name.length;
}, 'Name cannot be blank');

/**
 * Statics
 */
AgentSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).populate('user', 'username').populate('name').exec(cb);
    }
};
