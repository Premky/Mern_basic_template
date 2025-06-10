import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Components/Auth/Login'
function App() {


  return (
    <>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </>
  )
}

export default App
