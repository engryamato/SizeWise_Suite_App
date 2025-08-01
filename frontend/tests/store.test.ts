import { act } from '@testing-library/react'
import { useUIStore } from '../stores/ui-store'
import { useProjectStore } from '../stores/project-store'

describe('store actions', () => {
  it('updates plan scale in UI store', () => {
    act(() => {
      useUIStore.getState().setPlanScale({ pixelsPerMeter: 2 })
    })
    expect(useUIStore.getState().planScale.pixelsPerMeter).toBe(2)
  })

  it('stores pdf and scale in project store', () => {
    // Create a test project first
    const testProject = {
      id: 'test-1',
      project_name: 'Test Project',
      project_location: 'Test Location',
      rooms: [],
      segments: [],
      equipment: [],
      computational_properties: {
        altitude: 0,
        temperature: 70,
        humidity: 50,
        pressure: 14.7
      }
    }

    act(() => {
      useProjectStore.getState().addProject(testProject)
      useProjectStore.getState().setCurrentProject(testProject)
      useProjectStore.getState().setPlanPDF('data:application/pdf;base64,test')
      useProjectStore.getState().setPlanScale(0.5)
    })
    const proj = useProjectStore.getState().currentProject
    expect(proj?.plan_pdf).toBe('data:application/pdf;base64,test')
    expect(proj?.plan_scale).toBe(0.5)
  })
})
