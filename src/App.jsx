import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.min.css'
import Navbar from './assets/components/Navbar'
import Footer from './assets/components/Footer'
import RegisterPage from './assets/views/RegisterPage'
import LoginPage from './assets/views/LoginPage'
import NotFound from './assets/views/NotFound'
import ProfilePage from './assets/views/ProfilePage'
import ClientePage from './assets/views/ClientePage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

     <h1>TEST DE ACTUALIZACIÓN</h1>
  
      <Navbar />
      <Routes>
        <Route path='/' element={<ClientePage/>} />
        <Route path='/RegisterPage' element={<RegisterPage/>} />
        <Route path='/LoginPage' element={<LoginPage/>} />
        <Route path='/ProfilePage' element={<ProfilePage/>} />
        <Route path='*' element={<NotFound />} /> 
      </Routes>
      <Footer/>
    </>
  )
}

export default App
