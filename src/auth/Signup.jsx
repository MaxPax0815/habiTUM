import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignup } from './useSignup'

const Signup = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const { signup, error, isLoading } = useSignup()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const ok = await signup(email, password)
        if (ok) {
            setSuccess(true)
            setTimeout(() => navigate('/dashboard'), 1000)
        }
    }

    return (
        <form className="signup" onSubmit={handleSubmit}>
            <h3>Sign Up</h3>

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
    )
}

export default Signup