import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'
import { BrowserRouter } from 'react-router-dom'

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(container).toBeTruthy()
  })
})
