import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import * as runner from './utils/executeRequest'

describe('API Collection Runner', () => {
  it('shows empty collections state initially', () => {
    render(<App />)
    expect(screen.getByText(/Create a collection/i)).toBeInTheDocument()
  })

  it('validates missing URL', async () => {
    render(<App />)
    const urlInput = screen.getByLabelText('URL')
    fireEvent.change(urlInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))
    expect(await screen.findByText(/URL is required/i)).toBeInTheDocument()
  })

  it('saves a request into a collection', async () => {
    vi.spyOn(runner, 'executeRequest').mockResolvedValue({
      kind: 'success',
      status: 200,
      statusText: 'OK',
      timeMs: 1,
      headers: { 'content-type': 'application/json' },
      data: { ok: true },
    })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    const name = await screen.findByPlaceholderText(/Get Users/i)
    fireEvent.change(name, { target: { value: 'Get Users' } })
    fireEvent.click(screen.getAllByRole('button', { name: /^Save$/i })[1])
    expect(await screen.findByText('Saved request.')).toBeInTheDocument()
    expect(screen.getByText('Get Users')).toBeInTheDocument()
  })
})

