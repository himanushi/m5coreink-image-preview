import { render } from 'preact'
import { App } from './app.tsx'
import './pico.min.css'

const appElement = document.getElementById('app')
if (appElement) {
  render(<App />, appElement)
}
