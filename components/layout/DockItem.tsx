import { useState } from 'react';
import { Bell, Search, ChevronDown, Menu, Users, Settings } from 'lucide-react';

interface DockItemProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function DockItem({
  icon: Icon,
  label,
  href,
  isActive = false,
  onClick
}: DockItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    if (href) {
      // Handle navigation - in a real app, you'd use useRouter or next/link
      window.location.href = href;
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: 48,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        background: isActive
          ? 'rgba(0, 113, 227, 0.2)'
          : 'transparent',
        border: isActive
          ? '1px solid rgba(0, 113, 227, 0.3)'
          : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered
          ? 'scale(1.1)'
          : 'scale(1)',
        cursor: 'pointer',
        ...(isHovered && {
          // GSAP-like fish-eye effect with neighbors (simplified)
          // In a full implementation, this would be handled by GSAP context
          boxShadow: '0 4px 12px rgba(0, 113, 227, 0.15)'
        })
      }}
      title={label}
    >
      <Icon
        size={24}
        color={isActive ? '#0071e3' : 'var(--color-text-secondary)'}
        strokeWidth={1.5}
      />

      {/* Tooltip */}
      {!href && (
        <div style={{
          position: 'absolute',
          bottom: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 1000
        }}>
          {label}
        </div>
      )}
    </div>
  );
}