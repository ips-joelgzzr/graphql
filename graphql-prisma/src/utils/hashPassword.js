import bcrypt from 'bcryptjs';

const hashPassword = password => {
    if(password < 8) {
        throw new Error('Password should be 8 characters or longer')
    }

    return bcrypt.hash(password, 10)
}

export default hashPassword