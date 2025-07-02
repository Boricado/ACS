import React from 'react'
import profilePics from '../img/Profile.jpg' 
import { Link } from 'react-router-dom'


const ProfilePage = () => {
return (
<div className="container mt-5 d-flex justify-content-center">
    <div className="card p-3">
        <div className="d-flex align-items-center">
            <div className="image">
            <img src={profilePics} className="rounded" width="155" alt="Profile" />
            </div>
            
            <div className="ml-3 w-100 ms-3">
                <h4 className="mb-0 mt-0">Pedro Pascal</h4>
                <span>Mejor cliente</span>
                <hr />
                <h6>hola_Pedro@pizzas.cl</h6>
                <hr />
                <div className="d-flex justify-content-center m-3">
                    <Link to="/Cart">
                        <button className="btn btn-outline-dark me-5 mb-3" type="button">
                        Mi carrito <i className="fa-solid fa-cart-shopping"></i>
                        </button>
                    </Link>
                    <button className="btn btn-dark mb-3" type="button">Cerrar sesión  <i class="fa-solid fa-right-from-bracket"></i></button>
                </div>
            </div>    
        </div>
    </div>
</div>
)
}

export default ProfilePage
