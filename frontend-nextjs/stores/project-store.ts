import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Project, Room, Segment, Equipment, ComputationalProperties } from '@/types/air-duct-sizer'

interface ProjectState {
  // Current project data
  currentProject: Project | null
  
  // Project operations
  createProject: (projectData: Partial<Project>) => void
  updateProject: (updates: Partial<Project>) => void
  loadProject: (project: Project) => void
  clearProject: () => void
  
  // Room operations
  addRoom: (room: Omit<Room, 'room_id'>) => void
  updateRoom: (roomId: string, updates: Partial<Room>) => void
  deleteRoom: (roomId: string) => void
  getRoomById: (roomId: string) => Room | undefined
  
  // Segment operations
  addSegment: (segment: Omit<Segment, 'segment_id'>) => void
  updateSegment: (segmentId: string, updates: Partial<Segment>) => void
  deleteSegment: (segmentId: string) => void
  getSegmentById: (segmentId: string) => Segment | undefined
  
  // Equipment operations
  addEquipment: (equipment: Omit<Equipment, 'equipment_id'>) => void
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => void
  deleteEquipment: (equipmentId: string) => void
  getEquipmentById: (equipmentId: string) => Equipment | undefined
  
  // Computational properties
  updateComputationalProperties: (properties: Partial<ComputationalProperties>) => void

  // Plan actions
  setPlanPDF: (pdfData: string) => void
  setPlanScale: (scale: number) => void
  
  // Utility functions
  canAddRoom: () => boolean
  canAddSegment: () => boolean
  getRoomCount: () => number
  getSegmentCount: () => number
}

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const createDefaultProject = (): Project => ({
  project_name: 'New Project',
  project_location: '',
  codes: ['SMACNA'],
  rooms: [],
  segments: [],
  equipment: [],
  plan_pdf: undefined,
  plan_scale: 1,
  created_at: new Date().toISOString(),
  last_modified: new Date().toISOString(),
})

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        currentProject: null,

        createProject: (projectData) => {
          const newProject: Project = {
            ...createDefaultProject(),
            ...projectData,
            id: generateId('project'),
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
          }
          
          set({ currentProject: newProject }, false, 'createProject')
        },

        updateProject: (updates) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject: Project = {
            ...currentProject,
            ...updates,
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'updateProject')
        },

        loadProject: (project) => {
          set({ currentProject: project }, false, 'loadProject')
        },

        clearProject: () => {
          set({ currentProject: null }, false, 'clearProject')
        },

        addRoom: (roomData) => {
          const { currentProject } = get()
          if (!currentProject) return

          // Check tier limits (Free: 3 rooms max)
          if (!get().canAddRoom()) {
            console.warn('Room limit reached for current tier')
            return
          }

          const newRoom: Room = {
            ...roomData,
            room_id: generateId('room'),
          }

          const updatedProject: Project = {
            ...currentProject,
            rooms: [...currentProject.rooms, newRoom],
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'addRoom')
        },

        updateRoom: (roomId, updates) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject: Project = {
            ...currentProject,
            rooms: currentProject.rooms.map(room =>
              room.room_id === roomId ? { ...room, ...updates } : room
            ),
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'updateRoom')
        },

        deleteRoom: (roomId) => {
          const { currentProject } = get()
          if (!currentProject) return

          // Also remove segments connected to this room
          const updatedProject: Project = {
            ...currentProject,
            rooms: currentProject.rooms.filter(room => room.room_id !== roomId),
            segments: currentProject.segments.filter(segment => 
              !segment.connected_rooms?.includes(roomId)
            ),
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'deleteRoom')
        },

        getRoomById: (roomId) => {
          const { currentProject } = get()
          return currentProject?.rooms.find(room => room.room_id === roomId)
        },

        addSegment: (segmentData) => {
          const { currentProject } = get()
          if (!currentProject) return

          // Check tier limits (Free: 25 segments max)
          if (!get().canAddSegment()) {
            console.warn('Segment limit reached for current tier')
            return
          }

          const newSegment: Segment = {
            ...segmentData,
            segment_id: generateId('segment'),
            warnings: [],
          }

          const updatedProject: Project = {
            ...currentProject,
            segments: [...currentProject.segments, newSegment],
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'addSegment')
        },

        updateSegment: (segmentId, updates) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject: Project = {
            ...currentProject,
            segments: currentProject.segments.map(segment =>
              segment.segment_id === segmentId ? { ...segment, ...updates } : segment
            ),
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'updateSegment')
        },

        deleteSegment: (segmentId) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject: Project = {
            ...currentProject,
            segments: currentProject.segments.filter(segment => 
              segment.segment_id !== segmentId
            ),
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'deleteSegment')
        },

        getSegmentById: (segmentId) => {
          const { currentProject } = get()
          return currentProject?.segments.find(segment => segment.segment_id === segmentId)
        },

        addEquipment: (equipmentData) => {
          const { currentProject } = get()
          if (!currentProject) return

          const newEquipment: Equipment = {
            ...equipmentData,
            equipment_id: generateId('equipment'),
          }

          const updatedProject: Project = {
            ...currentProject,
            equipment: [...currentProject.equipment, newEquipment],
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'addEquipment')
        },

        updateEquipment: (equipmentId, updates) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject: Project = {
            ...currentProject,
            equipment: currentProject.equipment.map(equipment =>
              equipment.equipment_id === equipmentId ? { ...equipment, ...updates } : equipment
            ),
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'updateEquipment')
        },

        deleteEquipment: (equipmentId) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject: Project = {
            ...currentProject,
            equipment: currentProject.equipment.filter(equipment => 
              equipment.equipment_id !== equipmentId
            ),
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'deleteEquipment')
        },

        getEquipmentById: (equipmentId) => {
          const { currentProject } = get()
          return currentProject?.equipment.find(equipment => equipment.equipment_id === equipmentId)
        },

        updateComputationalProperties: (properties) => {
          const { currentProject } = get()
          if (!currentProject) return

          const currentProps = currentProject.computational_properties || {
            default_velocity: 1200,
            pressure_class: 'Medium',
            altitude: 0,
            r_value: 4.2,
            friction_rate: 0.08,
          }

          const updatedProject: Project = {
            ...currentProject,
            computational_properties: {
              ...currentProps,
              ...properties,
            },
            last_modified: new Date().toISOString(),
          }

          set({ currentProject: updatedProject }, false, 'updateComputationalProperties')
        },

        setPlanPDF: (pdfData) => {
          const { currentProject } = get()
          if (!currentProject) return
          const updated: Project = {
            ...currentProject,
            plan_pdf: pdfData,
            last_modified: new Date().toISOString(),
          }
          set({ currentProject: updated }, false, 'setPlanPDF')
        },

        setPlanScale: (scale) => {
          const { currentProject } = get()
          if (!currentProject) return
          const updated: Project = {
            ...currentProject,
            plan_scale: scale,
            last_modified: new Date().toISOString(),
          }
          set({ currentProject: updated }, false, 'setPlanScale')
        },

        canAddRoom: () => {
          const { currentProject } = get()
          if (!currentProject) return false
          
          // TODO: Check user tier from auth store
          // For now, assume Free tier with 3 room limit
          return currentProject.rooms.length < 3
        },

        canAddSegment: () => {
          const { currentProject } = get()
          if (!currentProject) return false
          
          // TODO: Check user tier from auth store
          // For now, assume Free tier with 25 segment limit
          return currentProject.segments.length < 25
        },

        getRoomCount: () => {
          const { currentProject } = get()
          return currentProject?.rooms.length || 0
        },

        getSegmentCount: () => {
          const { currentProject } = get()
          return currentProject?.segments.length || 0
        },
      }),
      {
        name: 'air-duct-sizer-project',
        partialize: (state) => ({ currentProject: state.currentProject }),
      }
    ),
    { name: 'ProjectStore' }
  )
)
