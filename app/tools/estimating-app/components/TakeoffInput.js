import React, { useState } from 'react'
import db from '../../../core/storage/db'

export default function TakeoffInput({ projectId, onSaved }) {
  const [name, setName] = useState('')

  const saveTakeoff = async () => {
    const now = new Date().toISOString()
    const id = await db.takeoffs.add({
      projectId,
      name,
      created: now,
      modified: now
    })
    onSaved && onSaved(id)
    setName('')
  }

  return (
    <div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Takeoff Name"
      />
      <button onClick={saveTakeoff}>Save Takeoff</button>
    </div>
  )
}
