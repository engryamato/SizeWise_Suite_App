import React, { useEffect, useState } from 'react'
import db from '../../../core/storage/db'

export default function ProjectList({ onSelect }) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const load = async () => {
      const all = await db.projects.toArray()
      setProjects(all)
    }
    load()
  }, [])

  const addProject = async () => {
    const now = new Date().toISOString()
    const id = await db.projects.add({
      name: `Project ${projects.length + 1}`,
      created: now,
      modified: now
    })
    const updated = await db.projects.toArray()
    setProjects(updated)
    onSelect && onSelect(id)
  }

  return (
    <div>
      <button onClick={addProject}>Add Project</button>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <button onClick={() => onSelect && onSelect(p.id)}>{p.name}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
