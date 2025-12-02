export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ShapeData {
  name: string;
  points: number[]; // Flat array [x,y,z, x,y,z...]
}

export type HandGestureState = {
  separation: number; // Distance between hands (0 to 1+)
  tension: number;    // Average "closed-ness" of hands (0 = open, 1 = fist)
  isPresent: boolean; // Are hands detected?
};

export enum PresetShape {
  Sphere = 'Sphere',
  Cube = 'Cube',
  Heart = 'Heart',
  Flower = 'Flower',
  Saturn = 'Saturn',
  Buddha = 'Buddha Statue',
  Firework = 'Firework Explosion',
  DNA = 'DNA Helix'
}
