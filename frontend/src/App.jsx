import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import Homepage from "./Homepage.jsx";
import Navbar from "./components/Navbar.jsx";
import Profile from "./Profile.jsx";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import './App.css'


function App() {
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<Homepage/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </Router>
      )
}

export default App;
