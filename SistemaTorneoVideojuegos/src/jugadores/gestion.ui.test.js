import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let server, ConsultaJugadores, RegistroJugador, EliminarJugador
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null } })
  ConsultaJugadores = (await server.ssrLoadModule('/src/jugadores/ConsultaJugadores.jsx')).default
  RegistroJugador = (await server.ssrLoadModule('/src/jugadores/RegistroJugador.jsx')).default
  EliminarJugador = (await server.ssrLoadModule('/src/jugadores/EliminarJugador.jsx')).default
})
after(async () => { await server?.close() })

test('la misma consulta muestra Agregar solo al administrador y conserva la busqueda publica', () => {
  for (const user of [null, { role: 'Superadministrador' }, { role: 'Administrador' }]) {
    const html = renderToStaticMarkup(createElement(ConsultaJugadores, { user }))
    assert.match(html, /Buscar por nombre o gamertag/)
    assert.equal(html.includes('+ Agregar jugador'), user?.role === 'Administrador')
  }
})

test('el formulario existente sirve para registro independiente y para edicion precargada', () => {
  const initial = renderToStaticMarkup(createElement(RegistroJugador))
  assert.match(initial, /Registrar jugador/)
  assert.match(initial, /Guardar jugador/)
  const edit = renderToStaticMarkup(createElement(RegistroJugador, {
    player: { ID: 8, nombre: 'Ana', gamertag: 'Shadow', correo: 'ana@example.test' }, onCancel() {},
  }))
  for (const value of ['Editar jugador', 'Guardar cambios', 'Cancelar', 'value="Ana"', 'value="Shadow"', 'value="ana@example.test"']) {
    assert.ok(edit.includes(value), value)
  }
})

test('eliminar muestra identidad y confirmacion; renderizar no ejecuta ninguna solicitud', () => {
  const html = renderToStaticMarkup(createElement(EliminarJugador, {
    player: { ID: 8, nombre: 'Ana', gamertag: 'Shadow' },
    onSuccess() { assert.fail('No se debe eliminar al abrir el panel') }, onCancel() {},
  }))
  for (const text of ['¿Eliminar jugador?', 'Ana', 'Shadow', 'Cancelar', 'Eliminar']) assert.ok(html.includes(text))
})
