const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.render('index', {userType: req.user ? req.user.userType : null});
});

module.exports = router;