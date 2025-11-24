import { useEffect, useRef, useState } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
}

interface SwipeState {
  isSwiping: boolean;
  direction: "left" | "right" | null;
  progress: number;
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 50,
    maxVerticalDistance = 100,
  } = options;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    progress: 0,
  });

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return;

      touchCurrentX.current = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const diffX = touchCurrentX.current - touchStartX.current;
      const diffY = currentY - touchStartY.current;

      // Check if vertical movement is too much
      if (Math.abs(diffY) > maxVerticalDistance) return;

      // Calculate progress (0 to 1)
      const progress = Math.min(Math.abs(diffX) / minSwipeDistance, 1);

      // Only show swipe feedback if horizontal movement is significant
      if (Math.abs(diffX) > 10) {
        setSwipeState({
          isSwiping: true,
          direction: diffX > 0 ? "right" : "left",
          progress,
        });
      }
    };

    const handleTouchEnd = () => {
      const diffX = touchCurrentX.current - touchStartX.current;
      const diffY = Math.abs(
        (touchStartY.current || 0) - touchStartY.current
      );

      // Check if it's a valid horizontal swipe
      if (
        Math.abs(diffX) > minSwipeDistance &&
        diffY < maxVerticalDistance
      ) {
        if (diffX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (diffX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      // Reset state
      setSwipeState({
        isSwiping: false,
        direction: null,
        progress: 0,
      });
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchCurrentX.current = 0;
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance,
    maxVerticalDistance,
  ]);

  return swipeState;
}
