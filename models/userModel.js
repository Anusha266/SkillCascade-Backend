const mongoose=require('mongoose');

const validator=require('validator');

const bcrypt=require('bcryptjs');




const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Please enter your email."],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email."]
    },
    photo: {
        type: String
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minlength: 5,
        select: false // Hides password when querying users
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    spoken_languages: {
        type: [String], // Array of strings (e.g., ["English", "Hindi"])
        default: []
    },
    college: {
        type: String
    },
    skills: {
        type: [String], // Array of skills (e.g., ["JavaScript", "React", "Node.js"])
        default: []
    },
    projects: [
        {
            name: { type: String },
            description: { type: String },
            github: { type: String }, // GitHub link (optional)
            livelink: { type: String } // Live project URL (optional)
        }
    ]
});



userSchema.pre(/^find/, function(next) {
        this.find({ active: { $ne: false } });
        next();
    });


userSchema.methods.comparePassword=async function(pwd,dbpwd){
        return await bcrypt.compare(pwd,dbpwd);
}


const User=mongoose.model('User',userSchema);

module.exports=User;