import { Box } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSignup } from '../../auth/useSignup'
import Header from '../../components/Header'

const Signup = () => {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const { signup, error, isLoading } = useSignup()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const ok = await signup(firstName, lastName, username, email, password)
        if (ok) {
            setSuccess(true)
            setTimeout(() => navigate('/today'), 1000)
        }
    }

    return (
        <Box>
            <Header />  
            <form className="signup" onSubmit={handleSubmit}>
                <h3>Sign Up</h3>

                <label>First Name:</label>
                <input
                    type="text"
                    onChange={(e) => setFirstName(e.target.value)}
                    value={firstName}
                />

                <label>Last Name:</label>
                <input
                    type="text"
                    onChange={(e) => setLastName(e.target.value)}
                    value={lastName}
                />

                <label>Username:</label>
                <input
                    type="text"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                />

                <label>Email:</label>
                <input
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                />

                <label>Password:</label>
                <input
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                />

                <button disabled={isLoading}>Sign Up</button>
                {success && <div className="success">Account created! Redirecting...</div>}
                {error && <div className="error">{error}</div>}
            </form>
        </Box>    
    )
}

export default Signup