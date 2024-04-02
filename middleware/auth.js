const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    console.log(req.cookies);
    const { token } = req.cookies;
    if (!token) {
        return res.status(403).send('Please login first');
    }

    try {
        const decode = jwt.verify(token, 'sshh');
        console.log(decode);

     
        if (Date.now() >= decode.exp * 1000) {
            return res.status(401).send('Token has expired');
        }

        req.user = decode;
        return next();
    } catch (error) {
        console.log(error);
        return res.status(401).send('Invalid token');
    }
};

module.exports = auth;
