import { useMemo, useState } from 'react';

export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export interface VizSettings {
  invertX: boolean;
  invertY: boolean;
  invertZ: boolean;
  flipYSign: boolean;
}

export const useVizSettings = () => {
  const [invertX, setInvertX] = useState(false);
  const [invertY, setInvertY] = useState(false);
  const [invertZ, setInvertZ] = useState(false);
  const [flipYSign, setFlipYSign] = useState(false);

  const settings: VizSettings = { invertX, invertY, invertZ, flipYSign };

  const mapVector = useMemo(
    () => (v: BlochVector): BlochVector => ({
      x: invertX ? -v.x : v.x,
      y: (invertY ? -1 : 1) * (flipYSign ? -1 : 1) * v.y,
      z: invertZ ? -v.z : v.z,
    }),
    [invertX, invertY, invertZ, flipYSign]
  );

  return {
    settings,
    mapVector,
    invertX,
    invertY,
    invertZ,
    flipYSign,
    setInvertX,
    setInvertY,
    setInvertZ,
    setFlipYSign,
  } as const;
};


