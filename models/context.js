/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');

var Schema  = mongoose.Schema;

var contextSchema = new Schema({

    label: { type: String, index: true, unique: true, required: true },

    owner: [{type: Schema.Types.ObjectId, ref: 'Profiles', index: true}],

    enterprise: {type: String, default: "ConversePoint"}

    });

var _Context = mongoose.model('Context', contextSchema);

module.exports =  {
    Context : _Context
};
