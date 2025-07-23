import { render, waitFor } from '@testing-library/react'
import { PlanBackground } from '../components/canvas/PlanBackground'

jest.mock('pdfjs-dist/build/pdf', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      getPage: jest.fn().mockResolvedValue({
        getViewport: () => ({ width: 10, height: 10 }),
        render: jest.fn(() => ({ promise: Promise.resolve() }))
      })
    })
  })),
  GlobalWorkerOptions: {}
}), { virtual: true })
jest.mock('pdfjs-dist/build/pdf.worker.entry', () => ({}), { virtual: true })

describe('PlanBackground', () => {
  it('loads and renders pdf', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })) as any
    render(<PlanBackground pdfData="data:application/pdf;base64,JVBERi0xLjMKMSAwIG9iago8PD4+CmVuZG9iagp0cmFpbGVyCjw8Pj4KJSVFT0Y=" scale={1} offsetX={0} offsetY={0} />)
    await waitFor(() => expect(require('pdfjs-dist/build/pdf').getDocument).toHaveBeenCalled())
  })
})
