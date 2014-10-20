/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var escalationSchema = new Schema({
    name: String,
    description: String,
    public: Boolean,
    enterprise: {type: String, default: "ConversePoint"},
    steps: [
        {
            time: {type: Number, default: 300},
            targets: [
                {type: Schema.Types.ObjectId, ref: 'Person'}
            ],
            trigger: {type: String, default: "NO_READS"}
        }
    ],
    owner: [
        {type: Schema.Types.ObjectId, ref: 'Person'}
    ]
});

escalationSchema.pre('save', function (next) {

    this.lastModified = new Date();
    next();
});

var _Escalation = mongoose.model('Escalation', escalationSchema);

module.exports = {
    Escalation: _Escalation
};


