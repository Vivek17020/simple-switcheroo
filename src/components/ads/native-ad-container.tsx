import { AdSlot } from './ad-slot';

interface NativeAdContainerProps {
  position: 'between-articles' | 'sidebar' | 'in-article';
  articleIndex?: number;
  className?: string;
}

export const NativeAdContainer = ({ 
  position, 
  articleIndex = 0,
  className 
}: NativeAdContainerProps) => {
  const getAdSlotId = () => `${position}-${articleIndex}`;

  const getAdFormat = () => {
    switch (position) {
      case 'sidebar':
        return 'rectangle';
      case 'in-article':
        return 'native';
      case 'between-articles':
        return 'native';
      default:
        return 'native';
    }
  };

  return (
    <div className={`native-ad-container my-6 ${className || ''}`}>
      <AdSlot
        id={getAdSlotId()}
        format={getAdFormat()}
        className={position === 'sidebar' ? 'sticky top-20' : ''}
        lazy={position !== 'sidebar'}
      />
    </div>
  );
};
