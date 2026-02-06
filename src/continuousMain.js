import './styles/global.css'
import ContinuousApp from './ContinuousApp.svelte'
import { mount } from 'svelte'

const app = mount(ContinuousApp, {
  target: document.getElementById('app'),
})

export default app
