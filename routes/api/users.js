const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//@route    POST api/users
//@desc     Register User
//@access   Public 

router.post('/',[
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is invalid').isEmail(),
    check('password', 'please enter a valid Password is not valid').isLength({min:6})
], async (req, res) => {

    // Validating request
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    } 
    const {name, email, password} = req.body;
 
    try {
        let user = await User.findOne({email});
        if(user){
            return res.status(400).send({errors: [{msg: 'User Already Exists'}]});
        }
        const avatar = gravatar.url(email, {
            s:'200',
            r:'pg',
            d:'mm'
        });
        user = new User({
            name,
            email,
            avatar,
            password
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = {
            user:{
                id: user.id,
                name: user.name,
                email: user.email
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),
            {
                expiresIn:36000
            },
            (err, token) => {
                if(err) throw err;
                res.json({token})
            }
        );

    } catch (error) {
        console.log(error.message);
        res.status(500).send('server Error');
    }

});

module.exports = router;