export function validarAdministrador(form) {
  const errors = {}
  // La API rechaza caracteres de control en los campos.
  // eslint-disable-next-line no-control-regex
  const control = /[\u0000-\u001f\u007f]/u
  const nombre = form.nombre.trim()
  const correo = form.correo.trim().toLowerCase()
  if (!nombre) errors.nombre = 'Ingresa el nombre.'
  else if (nombre.length > 100 || control.test(nombre)) errors.nombre = 'Usa hasta 100 caracteres, sin caracteres de control.'
  if (!correo) errors.correo = 'Ingresa el correo electrónico.'
  else if (correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || control.test(correo)) errors.correo = 'Ingresa un correo válido de hasta 150 caracteres.'
  if (!form.contrasena.trim()) errors.contrasena = 'Ingresa la contraseña.'
  else if (form.contrasena.length < 15 || form.contrasena.length > 512 || control.test(form.contrasena)) {
    errors.contrasena = 'Usa entre 15 y 512 caracteres, sin caracteres de control.'
  }
  if (!form.confirmacion) errors.confirmacion = 'Confirma la contraseña.'
  else if (form.confirmacion !== form.contrasena) errors.confirmacion = 'Las contraseñas no coinciden.'
  return errors
}
