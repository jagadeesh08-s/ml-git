import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const trailPositionsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      positionRef.current = { x: e.clientX, y: e.clientY };

      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }

      // Update trail positions
      trailPositionsRef.current.unshift({ x: e.clientX, y: e.clientY });
      if (trailPositionsRef.current.length > 8) {
        trailPositionsRef.current.pop();
      }

      if (trailRef.current) {
        const trailElements = trailRef.current.children;
        trailPositionsRef.current.forEach((pos, index) => {
          if (trailElements[index] instanceof HTMLElement) {
            const element = trailElements[index] as HTMLElement;
            element.style.left = `${pos.x}px`;
            element.style.top = `${pos.y}px`;
            element.style.opacity = `${(8 - index) / 8}`;
            element.style.transform = `scale(${(8 - index) / 8})`;
          }
        });
      }
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
      if (trailRef.current) trailRef.current.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
      if (trailRef.current) trailRef.current.style.opacity = '0';
    };

    document.addEventListener('mousemove', updateCursor);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="cursor-core"
        style={{
          left: 0,
          top: 0,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Cursor trail */}
      <div
        ref={trailRef}
        style={{
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="cursor-trail"
            style={{
              left: 0,
              top: 0,
              opacity: 0,
              transition: 'all 0.1s ease'
            }}
          />
        ))}
      </div>
    </>
  );
};

export default CustomCursor;