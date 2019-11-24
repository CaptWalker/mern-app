const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

//@route    GET api/auth
//@desc     Test route
//@access   Public 

router.get('/', auth, async (req, res) =>{

    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
} );

//@route    POST api/auth
//@desc     Authenticate User and get Token
//@access   Public 

router.post('/',[
    check('email', 'Email is invalid').isEmail(),
    check('password', 'password is required').exists()
], async (req, res) => {

    // Validating request
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    } 
    const {email, password} = req.body;
 
    try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).send({errors: [{msg: 'Invalid Credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if(!isMatch){
            return res.status(400).send({errors: [{msg: 'Invalid Credentials'}]});
        }

        const payload = {
            user:{
                id: user.id
            }
        }
 
        jwt.sign(
            payload,
            config.get('jwtSecret'),
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