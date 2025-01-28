import { FC } from 'react';

interface LoadingSpinnerProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  color = 'white',
  size = 'md',
  className = '' 
}) => {
  const sizeMap = {
    sm: 20,
    md: 40,
    lg: 60
  } as const;
  
  const finalSize = typeof size === 'number' ? size : sizeMap[size];
  
  return (
    <div 
      className={`relative ${className}`.trim()}
      style={{ 
        height: `${finalSize}px`, 
        width: `${finalSize}px` 
      }}
    >
      <div 
        className="absolute inset-0 animate-circle-left"
        style={{
          border: `4px solid ${color}`,
        }}
      />
      <div 
        className="absolute inset-0 animate-circle-right"
        style={{
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
