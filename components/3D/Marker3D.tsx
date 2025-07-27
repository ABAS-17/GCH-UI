
// components/3D/Marker3D.tsx
'use client'

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Marker3DProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'traffic' | 'weather' | 'infrastructure' | 'events' | 'safety';
  isSelected?: boolean;
  isHovered?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const SEVERITY_HEIGHTS = {
  low: 20,
  medium: 30,
  high: 40,
  critical: 50
};

const TYPE_COLORS = {
  traffic: '#ea580c',
  weather: '#3b82f6', 
  infrastructure: '#dc2626',
  events: '#16a34a',
  safety: '#7c3aed'
};

const TYPE_ICONS = {
  traffic: '🚗',
  weather: '🌧️',
  infrastructure: '⚡',
  events: '🎉',
  safety: '🚨'
};

export default function Marker3D({ 
  severity, 
  type, 
  isSelected = false, 
  isHovered = false,
  size = 'medium' 
}: Marker3DProps) {
  const height = SEVERITY_HEIGHTS[severity];
  const color = TYPE_COLORS[type];
  const icon = TYPE_ICONS[type];
  
  const baseSize = size === 'small' ? 24 : size === 'large' ? 40 : 32;
  
  // Generate SVG for custom 3D marker
  const markerSVG = useMemo(() => {
    const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1;
    const shadowOpacity = isSelected ? 0.4 : isHovered ? 0.3 : 0.2;
    
    return `
      <svg width="${baseSize * scale}" height="${height * scale + 10}" viewBox="0 0 ${baseSize} ${height + 10}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="markerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${color};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:0.6" />
          </linearGradient>
          <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="${shadowOpacity}"/>
          </filter>
        </defs>
        
        <!-- Base shadow -->
        <ellipse cx="${baseSize/2}" cy="${height + 5}" rx="${baseSize/2 - 2}" ry="3" 
                 fill="black" opacity="0.2"/>
        
        <!-- 3D Cylinder Body -->
        <rect x="4" y="${height - height + 5}" width="${baseSize - 8}" height="${height - 5}" 
              fill="url(#markerGradient)" filter="url(#shadow)" rx="2"/>
        
        <!-- 3D Top -->
        <ellipse cx="${baseSize/2}" cy="5" rx="${baseSize/2 - 4}" ry="4" 
                 fill="url(#topGradient)"/>
        
        <!-- Icon -->
        <text x="${baseSize/2}" y="${height/2 + 3}" text-anchor="middle" 
              font-size="12" fill="white" font-weight="bold">${icon}</text>
        
        <!-- Severity indicator (top glow) -->
        <ellipse cx="${baseSize/2}" cy="5" rx="${baseSize/2 - 6}" ry="2" 
                 fill="${severity === 'critical' ? '#ff0000' : severity === 'high' ? '#ff8800' : 'white'}" 
                 opacity="0.6"/>
      </svg>
    `;
  }, [height, color, icon, baseSize, isSelected, isHovered, severity]);

  return (
    <motion.div
      initial={{ scale: 0, y: -20 }}
      animate={{ 
        scale: 1, 
        y: 0,
        rotateX: isHovered ? -5 : 0,
        rotateY: isSelected ? 10 : 0
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: Math.random() * 0.2 // Staggered animation
      }}
      whileHover={{ 
        scale: 1.1,
        transition: { duration: 0.2 }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: markerSVG }}
        style={{
          filter: isSelected ? 'brightness(1.2) saturate(1.3)' : undefined,
          transform: `translateZ(${isSelected ? '10px' : '0px'})`,
          transition: 'all 0.3s ease'
        }}
      />
    </motion.div>
  );
}