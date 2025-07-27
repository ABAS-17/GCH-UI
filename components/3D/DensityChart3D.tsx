// components/3D/DensityChart3D.tsx
'use client'

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DensityPoint {
  lat: number;
  lng: number;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DensityChart3DProps {
  incidents: Array<{
    location: { lat: number; lng: number };
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  visible?: boolean;
}

export default function DensityChart3D({ 
  incidents, 
  mapBounds, 
  visible = true 
}: DensityChart3DProps) {
  // Cluster incidents into density points
  const densityPoints = useMemo(() => {
    if (!incidents.length || !mapBounds) return [];

    // Simple clustering algorithm
    const clusters: DensityPoint[] = [];
    const CLUSTER_RADIUS = 0.01; // ~1km

    incidents.forEach(incident => {
      // Find existing cluster
      const existingCluster = clusters.find(cluster => {
        const distance = Math.sqrt(
          Math.pow(cluster.lat - incident.location.lat, 2) +
          Math.pow(cluster.lng - incident.location.lng, 2)
        );
        return distance < CLUSTER_RADIUS;
      });

      if (existingCluster) {
        existingCluster.count++;
        // Update severity to highest
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityLevels[incident.severity] > severityLevels[existingCluster.severity]) {
          existingCluster.severity = incident.severity;
        }
      } else {
        clusters.push({
          lat: incident.location.lat,
          lng: incident.location.lng,
          count: 1,
          severity: incident.severity
        });
      }
    });

    // Only show clusters with 2+ incidents
    return clusters.filter(cluster => cluster.count >= 2);
  }, [incidents, mapBounds]);

  if (!visible || !densityPoints.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {densityPoints.map((point, index) => (
        <DensityBar
          key={`density-${point.lat}-${point.lng}-${index}`}
          point={point}
          mapBounds={mapBounds!}
          index={index}
        />
      ))}
    </div>
  );
}

interface DensityBarProps {
  point: DensityPoint;
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  index: number;
}

function DensityBar({ point, mapBounds, index }: DensityBarProps) {
  // Convert lat/lng to screen position (simplified)
  const position = useMemo(() => {
    const latRange = mapBounds.north - mapBounds.south;
    const lngRange = mapBounds.east - mapBounds.west;
    
    const x = ((point.lng - mapBounds.west) / lngRange) * 100;
    const y = ((mapBounds.north - point.lat) / latRange) * 100;
    
    return { x: `${x}%`, y: `${y}%` };
  }, [point, mapBounds]);

  const height = Math.min(point.count * 15, 80); // Max 80px height
  
  const severityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
  };

  return (
    <motion.div
      initial={{ 
        scale: 0, 
        opacity: 0,
        rotateX: 90 
      }}
      animate={{ 
        scale: 1, 
        opacity: 0.8,
        rotateX: 0 
      }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 3D Bar */}
      <div
        className="relative"
        style={{
          width: '20px',
          height: `${height}px`,
          background: `linear-gradient(135deg, ${severityColors[point.severity]}, ${severityColors[point.severity]}aa)`,
          borderRadius: '2px 2px 0 0',
          boxShadow: `
            0 0 10px ${severityColors[point.severity]}40,
            inset 0 0 10px ${severityColors[point.severity]}20,
            0 4px 8px rgba(0,0,0,0.3)
          `,
          transform: 'rotateX(-15deg) rotateY(15deg)',
          transformOrigin: 'bottom center'
        }}
      >
        {/* Top glow */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: '4px',
            background: `linear-gradient(90deg, transparent, white, transparent)`,
            opacity: 0.6,
            borderRadius: '2px'
          }}
        />
        
        {/* Count label */}
        <div
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-black bg-opacity-60 px-1 rounded"
          style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          {point.count}
        </div>
      </div>

      {/* Base shadow */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{
          width: '24px',
          height: '4px',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3), transparent)',
          borderRadius: '50%'
        }}
      />
    </motion.div>
  );
}