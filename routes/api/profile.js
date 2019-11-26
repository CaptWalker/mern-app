const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const {check, validationResult} = require('express-validator');
const request = require('request');
const config = require('config');


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

        const {
            company,
            website,
            location, 
            bio, 
            status, 
            githubusername, 
            skills, 
            youtube, 
            facebook, 
            twitter, 
            instagram, 
            linkedin
        } = req.body;

        //build profile fields

        const profileFields = {};
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(bio) profileFields.bio = bio;
        if(status) profileFields.status = status;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills){
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }
        
        profileFields.social = {};
        if(twitter) profileFields.social.twitter = twitter;
        if(youtube) profileFields.social.youtube = youtube;
        if(facebook) profileFields.social.facebook = facebook;
        if(linkedin) profileFields.social.linkedin = linkedin;
        if(instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({user: req.user.id});

            if(profile){
                profile = await Profile.findOneAndUpdate({user: req.user.id}, 
                    {$set: profileFields}, 
                    {new : true});
                return res.json(profile);
            }

            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);

        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }

        res.send(profileFields);

    }
);

//@route    GET api/profile
//@desc     Get all profile
//@access   Public

router.get('/', async (req, res)=>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
});


//@route    GET api/profile/user/:user_id
//@desc     Get profile by user id
//@access   Public

router.get('/user/:user_id', async (req, res)=>{
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
        if(!profile) res.status(400).json({msg: 'Profile not found'});
        res.json(profile);

    } catch (error) {
        console.error(error.message);
        if(error.kind == 'ObjectId'){
            return res.status(400).json({msg:'Profile not found'});
        }else{
            return res.status(500).send('Server Error')
        }
        
    }
});

//@route    DELETE api/profile
//@desc     Delete profile, user adn posts
//@access   Public

router.delete('/', auth, async (req, res)=>{
    try {
        await Profile.findOneAndRemove({User: req.user.id});
        await User.findOneAndRemove({_id: req.user.id});
        res.json({msg:'User Deleted'});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
});

//@route    PUT api/profile/experience
//@desc     add experience to profile
//@access   Public

router.put('/experience', [auth,[
        check('title','title is required').not().isEmpty(),
        check('company','company is required').not().isEmpty(),
        check('from','From date is required').not().isEmpty()

    ]],async (req, res) =>{
        
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        const {
            title, 
            company, 
            location, 
            from, 
            to, 
            current, 
            description
        } = req.body;

        let newExp = {
            title, 
            company, 
            location, 
            from, 
            to, 
            current, 
            description
        };

        try {
            const profile = await Profile.findOne({user: req.user.id});
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);

        } catch (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }
});


//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete experience from profile based on id
//@access   private

router.delete('/experience/:exp_id', [auth,[
    check('exp_id', "experience is required").not().isEmpty()
]], async (req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    try {
        const profile = await Profile.findOne({user: req.user.id});

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        if(removeIndex == -1){
            return res.status(400).json({msg:"experience not found"});
        }
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error');
    }
});


//@route    PUT api/profile/education
//@desc     add education to profile
//@access   Public

router.put('/education', [auth,[
    check('school','school is required').not().isEmpty(),
    check('degree','degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()

]],async (req, res) =>{
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        school, 
        degree,
        fieldofstudy,
        from, 
        to, 
        current, 
        description
    } = req.body;

    let newEdu = {
        school, 
        degree,
        fieldofstudy, 
        from, 
        to, 
        current, 
        description
    };

    try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error');
    }
});


//@route    DELETE api/profile/education/:edu_id
//@desc     Delete education from profile based on id
//@access   private

router.delete('/education/:edu_id', [auth,[
check('edu_id', "education is required").not().isEmpty()
]], async (req, res)=>{
const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
}
try {
    const profile = await Profile.findOne({user: req.user.id});

    const removeIndex = profile.education.map(item => item._id).indexOf(req.params.edu_id);
    if(removeIndex == -1){
        return res.status(400).json({msg:"Education not found"});
    }
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);

} catch (error) {
    console.error(error.message);
    return res.status(500).send('Server Error');
}
});

//@route    GET api/profile/github/:username
//@desc     get user repo from gtihub
//@access   public

router.get('/github/:username', (req, res) =>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers:{'user-agent':'node.js'}

        };

        request(options, (error, response, body)=>{
            if(error) console.error(error.message);

            if(response.statusCode !== 200){
                return res.status(400).json({msg:'No github profile found'})
            }

            res.json(JSON.parse(body));
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error');
    }
})

module.exports = router;