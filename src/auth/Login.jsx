import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from './useLogin'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const { login, error, isLoading } = useLogin()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const ok = await login(email, password)
        if (ok) {
            setSuccess(true)
            setTimeout(() => navigate('/dashboard'), 1000)
        }
    }

    return (
        <form className="login" onSubmit={handleSubmit}>
            <h3>Log In</h3>

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

            <button disabled={isLoading}>Log In</button>
            {success && <div className="success">Login successful! Redirecting...</div>}
            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default Login

// Bot when we reload the page, the user is logged out. 
// We need to persist the user's login state across page reloads. 
// We can do this by storing the user's authentication token in localStorage and checking for it when the app loads. 
// If the token exists, we can set the user as logged in.