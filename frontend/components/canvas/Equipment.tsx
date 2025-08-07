'use client'

import React, { useRef } from 'react'
import { Group, Rect, Circle, Text, Line } from 'react-konva'
import Konva from 'konva'
import { Vector3 } from 'three'
import { Equipment as EquipmentType } from '@/types/air-duct-sizer'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'

interface EquipmentProps {
  equipment: EquipmentType
  isSelected: boolean
  onSelect: () => void
}

export const Equipment: React.FC<EquipmentProps> = ({ equipment, isSelected, onSelect }) => {
  const groupRef = useRef<Konva.Group>(null)
  const { updateEquipment } = useProjectStore()
  const { grid } = useUIStore()
  
  const x = equipment.position?.x || 0
  const y = equipment.position?.y || 0
  
  // Handle dragging
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    let newX = node.x()
    let newY = node.y()
    
    // Snap to grid if enabled
    if (grid.snapEnabled) {
      newX = Math.round(newX / grid.size) * grid.size
      newY = Math.round(newY / grid.size) * grid.size
      node.position({ x: newX, y: newY })
    }
    
    updateEquipment(equipment.id, {
      position: new Vector3(newX, newY, equipment.position?.z || 0)
    })
  }
  
  // Get equipment dimensions and appearance based on type
  const getEquipmentConfig = () => {
    switch (equipment.type.toLowerCase()) {
      case 'ahu':
      case 'air handling unit':
        return {
          width: 80,
          height: 60,
          color: '#3b82f6',
          shape: 'rect',
          icon: 'AHU',
        }
      case 'vav':
      case 'variable air volume':
        return {
          width: 40,
          height: 30,
          color: '#059669',
          shape: 'rect',
          icon: 'VAV',
        }
      case 'fan':
        return {
          width: 50,
          height: 50,
          color: '#dc2626',
          shape: 'circle',
          icon: 'FAN',
        }
      case 'damper':
        return {
          width: 30,
          height: 20,
          color: '#7c3aed',
          shape: 'rect',
          icon: 'DMP',
        }
      case 'diffuser':
      case 'supply diffuser':
        return {
          width: 25,
          height: 25,
          color: '#0891b2',
          shape: 'circle',
          icon: 'SUP',
        }
      case 'return':
      case 'return grille':
        return {
          width: 25,
          height: 25,
          color: '#ea580c',
          shape: 'rect',
          icon: 'RET',
        }
      default:
        return {
          width: 40,
          height: 40,
          color: '#6b7280',
          shape: 'rect',
          icon: 'EQP',
        }
    }
  }
  
  const config = getEquipmentConfig()
  
  // Equipment colors based on selection
  const getFillColor = () => {
    if (isSelected) return config.color
    return `${config.color}80` // Add transparency when not selected
  }
  
  const getStrokeColor = () => {
    if (isSelected) return config.color
    return config.color
  }
  
  // Render equipment shape
  const renderEquipmentShape = () => {
    if (config.shape === 'circle') {
      return (
        <Circle
          radius={config.width / 2}
          fill={getFillColor()}
          stroke={getStrokeColor()}
          strokeWidth={isSelected ? 3 : 2}
        />
      )
    } else {
      return (
        <Rect
          width={config.width}
          height={config.height}
          offsetX={config.width / 2}
          offsetY={config.height / 2}
          fill={getFillColor()}
          stroke={getStrokeColor()}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={4}
        />
      )
    }
  }
  
  // Render equipment icon/text
  const renderEquipmentIcon = () => {
    const fontSize = Math.min(config.width / 4, 12)
    
    return (
      <Text
        text={config.icon}
        fontSize={fontSize}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        offsetX={config.icon.length * fontSize / 4}
        offsetY={fontSize / 2}
        listening={false}
      />
    )
  }
  
  // Render equipment label
  const renderEquipmentLabel = () => {
    const labelY = config.height / 2 + 15
    const fontSize = 10
    
    return (
      <Group>
        {/* Equipment type */}
        <Text
          y={labelY}
          text={equipment.type}
          fontSize={fontSize}
          fontFamily="Arial"
          fill="#374151"
          align="center"
          offsetX={equipment.type.length * fontSize / 4}
          listening={false}
        />
        
        {/* Airflow */}
        <Text
          y={labelY + fontSize + 2}
          text={`${equipment.flowProperties?.airflow || equipment.properties?.cfmCapacity || 0} CFM`}
          fontSize={fontSize * 0.9}
          fontFamily="Arial"
          fill="#059669"
          align="center"
          offsetX={`${equipment.flowProperties?.airflow || equipment.properties?.cfmCapacity || 0} CFM`.length * fontSize / 4.5}
          listening={false}
        />
        
        {/* Model (if specified) */}
        {equipment.properties?.model && (
          <Text
            y={labelY + fontSize * 2 + 4}
            text={equipment.properties.model}
            fontSize={fontSize * 0.8}
            fontFamily="Arial"
            fill="#6b7280"
            align="center"
            offsetX={equipment.properties.model.length * fontSize / 5}
            listening={false}
          />
        )}
      </Group>
    )
  }
  
  // Render connection points
  const renderConnectionPoints = () => {
    if (!isSelected) return null
    
    // Connection points based on equipment type
    const connectionPoints = []
    
    switch (equipment.type.toLowerCase()) {
      case 'ahu':
        // AHU typically has supply and return connections
        connectionPoints.push(
          { x: config.width / 2, y: 0, type: 'supply' },
          { x: -config.width / 2, y: 0, type: 'return' }
        )
        break
      case 'vav':
        // VAV has inlet and outlet
        connectionPoints.push(
          { x: 0, y: -config.height / 2, type: 'inlet' },
          { x: 0, y: config.height / 2, type: 'outlet' }
        )
        break
      case 'fan':
        // Fan has inlet and outlet
        connectionPoints.push(
          { x: -config.width / 2, y: 0, type: 'inlet' },
          { x: config.width / 2, y: 0, type: 'outlet' }
        )
        break
      default:
        // Generic equipment has one connection point
        connectionPoints.push({ x: 0, y: -config.height / 2, type: 'connection' })
        break
    }
    
    return connectionPoints.map((point, index) => (
      <Circle
        key={`connection-${index}`}
        x={point.x}
        y={point.y}
        radius={4}
        fill="#ffffff"
        stroke="#3b82f6"
        strokeWidth={2}
        listening={false}
      />
    ))
  }
  
  // Render airflow direction arrows (for fans and AHUs)
  const renderAirflowArrows = () => {
    if (!['ahu', 'fan', 'air handling unit'].includes(equipment.type.toLowerCase())) {
      return null
    }
    
    const arrowSize = 8
    const arrowOffset = config.width / 3
    
    return (
      <Group listening={false}>
        {/* Arrow pointing right (airflow direction) */}
        <Line
          points={[
            -arrowOffset, 0,
            arrowOffset, 0,
            arrowOffset - arrowSize, -arrowSize / 2,
            arrowOffset, 0,
            arrowOffset - arrowSize, arrowSize / 2
          ]}
          stroke="#ffffff"
          strokeWidth={2}
          lineCap="round"
          lineJoin="round"
        />
      </Group>
    )
  }
  
  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable={true}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Equipment shape */}
      {renderEquipmentShape()}
      
      {/* Equipment icon */}
      {renderEquipmentIcon()}
      
      {/* Airflow arrows */}
      {renderAirflowArrows()}
      
      {/* Connection points */}
      {renderConnectionPoints()}
      
      {/* Equipment label */}
      {renderEquipmentLabel()}
    </Group>
  )
}
