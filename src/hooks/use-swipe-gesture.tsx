import { useEffect, useRef, useState, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
  edgeOnly?: boolean; // Only trigger from screen edges
  edgeThreshold?: number; // Percentage of screen width for edge detection
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
    minSwipeDistance = 80,
    maxVerticalDistance = 50, // Reduced to prevent scroll interference
    edgeOnly = true, // Default to edge-only for better UX
    edgeThreshold = 15, // 15% from each edge
  } = options;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    progress: 0,
  });

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isValidSwipe = useRef<boolean>(false);
  const startedFromEdge = useRef<"left" | "right" | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchCurrentX.current = touch.clientX;
      touchCurrentY.current = touch.clientY;
      isValidSwipe.current = false;
      startedFromEdge.current = null;

      // Check if touch started from screen edge
      const screenWidth = window.innerWidth;
      const edgeWidth = screenWidth * (edgeThreshold / 100);
      
      if (touch.clientX < edgeWidth) {
        startedFromEdge.current = "left";
      } else if (touch.clientX > screenWidth - edgeWidth) {
        startedFromEdge.current = "right";
      }

      // If edgeOnly mode, only allow swipes from edges
      if (edgeOnly && !startedFromEdge.current) {
        return;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return;
      
      // If edgeOnly and didn't start from edge, ignore
      if (edgeOnly && !startedFromEdge.current) return;

      const touch = e.touches[0];
      touchCurrentX.current = touch.clientX;
      touchCurrentY.current = touch.clientY;

      const diffX = touchCurrentX.current - touchStartX.current;
      const diffY = touchCurrentY.current - touchStartY.current;

      // If vertical movement exceeds threshold, cancel swipe (allow normal scroll)
      if (Math.abs(diffY) > maxVerticalDistance) {
        if (swipeState.isSwiping) {
          setSwipeState({
            isSwiping: false,
            direction: null,
            progress: 0,
          });
        }
        isValidSwipe.current = false;
        return;
      }

      // Only consider horizontal swipes with minimal vertical movement
      if (Math.abs(diffX) > 20 && Math.abs(diffX) > Math.abs(diffY) * 2) {
        isValidSwipe.current = true;
        
        // Prevent vertical scrolling during horizontal swipe
        e.preventDefault();
        
        const progress = Math.min(Math.abs(diffX) / minSwipeDistance, 1);
        const direction = diffX > 0 ? "right" : "left";

        // Validate swipe direction matches edge
        // Left edge → swipe right (go to previous)
        // Right edge → swipe left (go to next)
        const isValidDirection = 
          (startedFromEdge.current === "left" && direction === "right") ||
          (startedFromEdge.current === "right" && direction === "left") ||
          !edgeOnly;

        if (isValidDirection) {
          setSwipeState({
            isSwiping: true,
            direction,
            progress,
          });
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isValidSwipe.current) {
        // Reset without triggering navigation
        setSwipeState({
          isSwiping: false,
          direction: null,
          progress: 0,
        });
        touchStartX.current = 0;
        touchStartY.current = 0;
        touchCurrentX.current = 0;
        touchCurrentY.current = 0;
        startedFromEdge.current = null;
        return;
      }

      const diffX = touchCurrentX.current - touchStartX.current;
      const diffY = Math.abs(touchCurrentY.current - touchStartY.current);

      // Check if it's a valid horizontal swipe
      if (
        Math.abs(diffX) > minSwipeDistance &&
        diffY < maxVerticalDistance &&
        isValidSwipe.current
      ) {
        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }

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
      touchCurrentY.current = 0;
      isValidSwipe.current = false;
      startedFromEdge.current = null;
    };

    const handleTouchCancel = () => {
      setSwipeState({
        isSwiping: false,
        direction: null,
        progress: 0,
      });
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchCurrentX.current = 0;
      touchCurrentY.current = 0;
      isValidSwipe.current = false;
      startedFromEdge.current = null;
    };

    // Use passive: false to allow preventDefault on touchmove
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance,
    maxVerticalDistance,
    edgeOnly,
    edgeThreshold,
    swipeState.isSwiping,
  ]);

  return swipeState;
}
