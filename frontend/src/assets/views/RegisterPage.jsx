import React, { useState } from 'react';

const RegisterPage = () => {
    const [nombre, setNombre] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false);
    const API = import.meta.env.VITE_API_URL;

    // Prevenimos el comportamiento por defecto
    const validarInput = (e) => {
        e.preventDefault()
    // Validación input
         if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setError("Todos los campos son obligatorios")
        setSuccess(false)
        return
        }

        if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setSuccess(false);
        return;
        }

        if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setSuccess(false);
        return;
        }

        // Todo está bien
        setError("");
        setSuccess(true);

        // Limpiar campos
        setNombre('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
    }

    return (
        <>
        <main>
        <form onSubmit={validarInput}>
            <h3>Formulario de Registro</h3>
            {error ? <p className='error'>{error}</p> : null}
            {success ? <p className='enviado'>Formulario enviado correctamente</p> : null}


            <div  className="form-group">
                <label>Nombre:
                    {error && !nombre.trim() ? <span className="text-danger"> *</span> : null}
                </label>
                <input className="form-control form-control-sm w-75 mx-auto" type="text" value={nombre} onChange={(e) =>
                    setNombre(e.target.value)} />
                <br />
                <label>Email:
                    {error && !email.trim() ? <span className="text-danger"> *</span> : null}
                </label>
                <input className="form-control form-control-sm w-75 mx-auto" type="email" value={email} onChange={(e) =>
                    setEmail(e.target.value)} />
                <br />
                <label>Password:
                    {error && !password.trim() ? <span className="text-danger"> *</span> : null}
                </label>
                <input className="form-control form-control-sm w-75 mx-auto" type="password" value={password} onChange={(e) =>
                    setPassword(e.target.value)} />
                <br />
                <label>Confirmar Contraseña:
                    {error && !confirmPassword.trim() ? <span className="text-danger"> *</span> : null}
                </label>
                <input className="form-control form-control-sm w-75 mx-auto" type="password" value={confirmPassword} onChange={(e) =>
                    setConfirmPassword(e.target.value)} />
                <br />
                <button className="btn btn-dark mt-3" type="submit">Enviar</button>
            </div>
         </form>
         </main>
         
        {/* Solo para corroborar que los datos son ingresados
            <hr />
            <h1>Datos ingresados</h1>
            {nombre}-{email}-{password}-{confirmPassword} 
        */}

         </>
  )
}

export default RegisterPage
