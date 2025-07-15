import Dexie, { Table } from 'dexie'

export interface Project {
  id?: number
  name: string
  created: string
  modified: string
}

export interface Takeoff {
  id?: number
  projectId: number
  name: string
  created: string
  modified: string
}

export interface ExportRecord {
  id?: number
  projectId: number
  type: string
  created: string
}

class SizeWiseDB extends Dexie {
  projects!: Table<Project, number>
  takeoffs!: Table<Takeoff, number>
  exports!: Table<ExportRecord, number>

  constructor() {
    super('SizeWiseDB')
    this.version(1).stores({
      projects: '++id,name,created,modified',
      takeoffs: '++id,projectId,name,created,modified',
      exports: '++id,projectId,type,created'
    })
  }
}

const db = new SizeWiseDB()
export default db
