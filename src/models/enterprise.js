/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var EnterpriseSchema = new Schema({

    created: Date,
    modified: Date,
    apiKey: { type: String },
    details: {
        name: String,
        contact: String
    }
});

EnterpriseSchema.pre('save', function (next) {
    
    if (!this.created){
        this.created = new Date();
    }

    this.modified = new Date();
    next();
});

var _Enterprise = mongoose.model('Enterprise', EnterpriseSchema);

module.exports = {
    Enterprise: _Enterprise
};


