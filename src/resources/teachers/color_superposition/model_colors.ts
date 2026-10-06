/** Intensités linéaires normalisées, sans unité, entre 0 et 1. */
export type LightChannels = readonly [number, number, number];

export interface ColoredObject {
  readonly id: string;
  readonly name: string;
  readonly reflectance: LightChannels;
}

export const COLORED_OBJECTS: readonly ColoredObject[] = [
  { id: 'white', name: 'Blanc', reflectance: [1, 1, 1] },
  { id: 'red', name: 'Rouge', reflectance: [1, 0, 0] },
  { id: 'green', name: 'Vert', reflectance: [0, 1, 0] },
  { id: 'blue', name: 'Bleu', reflectance: [0, 0, 1] },
  { id: 'yellow', name: 'Jaune', reflectance: [1, 1, 0] },
  { id: 'cyan', name: 'Cyan', reflectance: [0, 1, 1] },
  { id: 'magenta', name: 'Magenta', reflectance: [1, 0, 1] },
];

function validateChannels(channels: LightChannels): void {
  if (channels.some((channel) => !Number.isFinite(channel) || channel < 0 || channel > 1)) {
    throw new RangeError('Les composantes RVB doivent être finies et comprises entre 0 et 1.');
  }
}

export function mixLights(lights: readonly LightChannels[]): LightChannels {
  lights.forEach(validateChannels);
  const sumChannel = (index: number) => Math.min(1, lights.reduce((sum, light) => sum + light[index], 0));
  return [sumChannel(0), sumChannel(1), sumChannel(2)];
}

export function diffuseLight(incident: LightChannels, reflectance: LightChannels): LightChannels {
  validateChannels(incident);
  validateChannels(reflectance);
  return [incident[0] * reflectance[0], incident[1] * reflectance[1], incident[2] * reflectance[2]];
}

export function absorbLight(incident: LightChannels, reflectance: LightChannels): LightChannels {
  const diffused = diffuseLight(incident, reflectance);
  return [incident[0] - diffused[0], incident[1] - diffused[1], incident[2] - diffused[2]];
}

/** Conversion d'intensités linéaires vers l'affichage sRGB ; aucun mélange en CSS. */
export function displayColor(channels: LightChannels): string {
  validateChannels(channels);
  const encoded = channels.map((channel) => {
    const value = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(value * 255);
  });
  return `rgb(${encoded.join(', ')})`;
}

export function describeColor(channels: LightChannels): string {
  validateChannels(channels);
  const mask = channels.reduce((bits, channel, index) => bits | (channel > 0 ? 1 << index : 0), 0);
  const names = ['Noir', 'Rouge', 'Vert', 'Jaune', 'Bleu', 'Magenta', 'Cyan', 'Blanc'];
  const nonzero = channels.filter((channel) => channel > 0);
  if (nonzero.length > 1 && Math.max(...nonzero) - Math.min(...nonzero) > 0.001) return 'Mélange RVB';
  return names[mask];
}
