import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';

import { Box, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton, TextField, Button } from '@mui/material';
// import Visibility from '@mui/icons-material/Visibility';
// import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useBaseURL } from '../../Context/BaseURLProvider'; // Import the custom hook for base URL


const Login = () => {
    // const BASE_URL = import.meta.env.VITE_API_BASE_URL
    // const BASE_URL = useApiBaseUrl();
    const BASE_URL = useBaseURL();
    const navigate = useNavigate();
    const { dispatch, fetchSession } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [values, setValues] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleClickShowPassword = () => setShowPassword((prev) => !prev);

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, values, { withCredentials: true });

            Swal.fire({
                title: "Logging in...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            if (response.data.loginStatus) {
                await fetchSession();
                dispatch({ type: "LOGIN", payload: response.data });
                Swal.fire({ title: "Login Success", text: "Redirecting to Home", icon: "success", timer: 1000, showConfirmButton: false });
                navigate('/');
            } else {
                Swal.fire({ title: "Login Failed", text: response.data.error, icon: "error" });
            }
        } catch (error) {
            setError(error.response?.data?.Error || 'Unexpected error occurred');
            Swal.fire({ title: "Login Error", text: error.message, icon: "error" });
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '5%' }}>
                कारागार व्यवस्थापन विभाग
                {/* <img src='/np_police_logo.png' alt='Nepal Police Logo' height='150px' /> */}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="loginPage">

                <div className='p-3 rounded w-40 border loginForm'>
                    <form onSubmit={handleLogin} >
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                            <TextField id="username" label="Username" onChange={(e) => setValues({ ...values, username: e.target.value })} fullWidth />
                        </FormControl>
                        <br />
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                        <InputLabel htmlFor="password">Password</InputLabel>
                        <OutlinedInput
                            id="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            onChange={(e) => setValues({ ...values, password: e.target.value })}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton onClick={handleClickShowPassword} edge="end">
                                        {/* {showPassword ? <VisibilityOff /> : <Visibility />} */}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                    <Button variant="contained" type="submit" fullWidth>Login</Button>
                    {/* <Toaster /> */}
                    </form>
                </div>
            </Box>
        </>
    )
}

export default Login
