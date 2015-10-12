/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var EnterpriseSchema = new Schema({

    created: Date,
    modified: Date,
    apiKey: { type: String },
    name: {type: String},
    contact: {type: String}
});

EnterpriseSchema.pre('save', function (next) {
    if (!this.created){
        this.created = new Date();
    }
    this.modified = new Date();
    next();
});

EnterpriseSchema.set('toJSON',{
    transform: function(doc, ret, options){
        var retJson = {
            apiKey: ret.apiKey,
            name: ret.name,
            contact: ret.contact,
            id: ret._id
        };
        return retJson;
    }
});

var _Enterprise = mongoose.model('Enterprise', EnterpriseSchema);

module.exports = {
    Enterprise: _Enterprise
};


