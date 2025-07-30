import { act } from '@testing-library/react'
import { useUIStore } from '../stores/ui-store'
import { useProjectStore } from '../stores/project-store'

describe('store actions', () => {
  it('updates plan scale in UI store', () => {
    act(() => {
      useUIStore.getState().setPlanScale(2)
    })
    expect(useUIStore.getState().planScale).toBe(2)
  })

  it('stores pdf and scale in project store', () => {
    act(() => {
      useProjectStore.getState().createProject({ project_name: 't', project_location: '' })
      useProjectStore.getState().setPlanPDF('data:application/pdf;base64,test')
      useProjectStore.getState().setPlanScale(0.5)
    })
    const proj = useProjectStore.getState().currentProject
    expect(proj?.plan_pdf).toBe('data:application/pdf;base64,test')
    expect(proj?.plan_scale).toBe(0.5)
  })
})
