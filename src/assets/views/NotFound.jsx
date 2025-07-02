import React from 'react'
import errorImage from '../img/404Error.png'  // ajusta la ruta según la ubicación del archivo NotFound.jsx
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <main>
        <img src={errorImage} alt="Error 404" style={{ width: '450px', height: 'auto' }}  />
        <Link to="/">
            <button className="btn btn-outline-dark me-5 mb-3" type="button">
            Volver al Home <i class="fa-solid fa-house"></i>
            </button>
        </Link>
    </main>
  )
}

export default NotFound
