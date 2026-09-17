import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let server, ConsultaVideojuegos, ListaVideojuegos, RegistroVideojuego, EliminarVideojuego
before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: { port: 0 }, watch: null } })
  const consulta = await server.ssrLoadModule('/src/videojuegos/ConsultaVideojuegos.jsx')
  ConsultaVideojuegos = consulta.default
  ListaVideojuegos = consulta.ListaVideojuegos
  RegistroVideojuego = (await server.ssrLoadModule('/src/videojuegos/RegistroVideojuego.jsx')).default
  EliminarVideojuego = (await server.ssrLoadModule('/src/videojuegos/EliminarVideojuego.jsx')).default
})
after(async () => { await server?.close() })
const game = { ID: 8, nombre: 'Tekken 8', genero: 'Lucha' }

test('consulta y lista compartidas exponen controles solo a superadmin', () => {
  for (const user of [null, { role: 'Administrador' }, { role: 'Superadministrador' }]) {
    const manage = user?.role === 'Superadministrador'
    const html = renderToStaticMarkup(createElement(ConsultaVideojuegos, { user }))
    assert.match(html, /Buscar por nombre o género/)
    assert.equal(html.includes('+ Agregar videojuego'), manage)
    const list = renderToStaticMarkup(createElement(ListaVideojuegos, { games: [game], user }))
    assert.ok(list.includes('Tekken 8'))
    assert.ok(list.includes('Lucha'))
    assert.equal(list.includes('Editar'), manage)
    assert.equal(list.includes('Eliminar'), manage)
  }
})

test('registro y edicion comparten combobox; edicion carga nombre y genero actuales', () => {
  const create = renderToStaticMarkup(createElement(RegistroVideojuego))
  const edit = renderToStaticMarkup(createElement(RegistroVideojuego, { game, onCancel() {} }))
  assert.match(create, /Registrar videojuego/)
  for (const html of [create, edit]) {
    assert.match(html, /role="combobox"/)
    assert.match(html, /aria-autocomplete="list"/)
  }
  for (const value of ['Editar videojuego', 'Guardar cambios', 'Cancelar', 'value="Tekken 8"', 'value="Lucha"']) assert.ok(edit.includes(value))
})

test('eliminar requiere confirmar y muestra identidad sin solicitar la API al abrir', () => {
  const html = renderToStaticMarkup(createElement(EliminarVideojuego, { game, onCancel() {}, onSuccess() { assert.fail() } }))
  for (const value of ['¿Eliminar videojuego?', 'Tekken 8', 'Cancelar', 'Eliminar']) assert.ok(html.includes(value))
})
