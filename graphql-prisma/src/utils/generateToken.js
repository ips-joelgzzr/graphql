import jwt from 'jsonwebtoken';

const generateToken = userId => {
    return jwt.sign({ userId }, 'supersecret', { expiresIn: '7 days' })
}

export default generateToken