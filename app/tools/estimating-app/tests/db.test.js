import db from '../../core/storage/db'

describe('Dexie offline storage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  test('saves and retrieves project', async () => {
    const id = await db.projects.add({
      name: 'Test',
      created: 'now',
      modified: 'now'
    })
    const project = await db.projects.get(id)
    expect(project?.name).toBe('Test')
  })

  test('stores takeoff linked to project', async () => {
    const projectId = await db.projects.add({ name: 'P', created: 'c', modified: 'm' })
    const takeoffId = await db.takeoffs.add({ projectId, name: 'T', created: 'c', modified: 'm' })
    const takeoff = await db.takeoffs.get(takeoffId)
    expect(takeoff?.projectId).toBe(projectId)
  })

  test('records exports', async () => {
    const projectId = await db.projects.add({ name: 'P', created: 'c', modified: 'm' })
    const exportId = await db.exports.add({ projectId, type: 'pdf', created: 'c' })
    const record = await db.exports.get(exportId)
    expect(record?.type).toBe('pdf')
  })
})
