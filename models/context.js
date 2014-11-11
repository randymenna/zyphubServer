/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var conversation            = require('./conversation');

var Schema  = mongoose.Schema;

var contextSchema = new Schema({
    _id:            {type: Schema.Types.ObjectId},
    name:           String,
    label:          String,
    description:    String,
    avatar:         {type: String, default: "context.png"},
    type:           {type: String, default: "CONTEXT"},
    public:         {type: Boolean, default: false},
    meta:           [String],
    enterprise:     {type: String, default: "ConversePoint"},
    members:        [{type: Schema.Types.ObjectId, ref: 'Person'}],
    owner:          [{type: Schema.Types.ObjectId, ref: 'Person'}]
},
    {autoIndex: false});

var _Context = mongoose.model('Context', contextSchema);


module.exports =  {
    Context : _Context
};


contextSchema.pre("save", function(next) {
    var self = this;

    if ( this._id ) {
        _Context.findOne({id: this.id}, function (err, c) {
            if (err) {
                next(err);
            }
            else if (c) {
                if (c.owner != this.owner) {
                    next(new Error("Not Owner"));
                }
            }
        });
    }
    else {
        next();
    }
});