const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const {check, validationResult} = require('express-validator');


//@route    GET api/profile/me
//@desc     Get current user profile
//@access   Private

router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id}).populate('user', ['name', 'avatar']);
        if(!profile){
            res.status(400).json({msg: 'There is no profile for this user'})
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

//@route    POST api/profile
//@desc     Create and update user profile
//@access   Private

router.post('/', [auth, [
            check('status', 'status is required').not().isEmpty(),
            check('skills', 'skills is requried').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
    }
);

module.exports = router;