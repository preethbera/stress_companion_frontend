import { useState, useCallback, useEffect } from "react";

export function useMobileResizer(initialHeight = 45) {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);

  const startResizing = useCallback((e) => {
    // Prevent default to stop scrolling while dragging
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);

    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startHeight = height;
    const containerHeight = window.innerHeight;

    const handleMove = (moveEvent) => {
      const currentY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;
      const deltaY = currentY - startY;
      const deltaPercentage = (deltaY / containerHeight) * 100;

      // Limit resizing between 20% and 80%
      const newHeight = Math.min(
        80,
        Math.max(20, startHeight + deltaPercentage)
      );
      setHeight(newHeight);
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);
  }, [height]);

  return { height, isDragging, startResizing };
}