import React, { useState } from 'react';

const LoginPage = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false);

    // Prevenimos el comportamiento por defecto
    const validarInput = (e) => {
        e.preventDefault()
    // Validación input
         if (!email.trim() || !password.trim()) {
        setError("Todos los campos son obligatorios")
        setSuccess(false)
        return
        }

        if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setSuccess(false);
        return;
        }

        // Todo está bien
        setError("");
        setSuccess(true);

        // Limpiar campos
        setEmail('')
        setPassword('')
    }

    return (
        <>
        <main>
        <form onSubmit={validarInput}>
            <h3>Login</h3>
            {error ? <p className='error'>{error}</p> : null}
            {success ? <p className='enviado'>Formulario enviado correctamente</p> : null}


            <div  className="form-group">
                <label>Email:
                    {error && !email.trim() ? <span className="text-danger"> *</span> : null}
                </label>
                <input className="form-control form-control-sm w-75 mx-auto" type="email" value={email} onChange={(e) =>
                    setEmail(e.target.value)} />
                <br />
                <label>Password:
                    {error && !email.trim() ? <span className="text-danger"> *</span> : null}
                </label>
                <input className="form-control form-control-sm w-75 mx-auto" type="password" value={password} onChange={(e) =>
                    setPassword(e.target.value)} />
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

export default LoginPage
