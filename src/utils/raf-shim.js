const raf = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : (cb) => setTimeout(cb, 16);

export default raf;
