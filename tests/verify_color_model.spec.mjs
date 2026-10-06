import { expect, test } from '@playwright/test';
import { absorbLight, COLORED_OBJECTS, describeColor, diffuseLight, displayColor, mixLights } from '../src/resources/teachers/color_superposition/model_colors.ts';

test('adds primary lights to produce secondary colors and white', () => {
  expect(mixLights([[1, 0, 0], [0, 1, 0]])).toEqual([1, 1, 0]);
  expect(describeColor([1, 1, 0])).toBe('Jaune');
  expect(describeColor(mixLights([[0, 1, 0], [0, 0, 1]]))).toBe('Cyan');
  expect(describeColor(mixLights([[1, 0, 0], [0, 0, 1]]))).toBe('Magenta');
  expect(mixLights([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toEqual([1, 1, 1]);
  expect(mixLights([])).toEqual([0, 0, 0]);
  expect(mixLights([[0.8, 0, 0], [0.5, 0, 0]])).toEqual([1, 0, 0]);
});

test('a yellow object appears red in red light and black in blue light', () => {
  const yellow = COLORED_OBJECTS.find((object) => object.id === 'yellow');
  expect(diffuseLight([1, 0, 0], yellow.reflectance)).toEqual([1, 0, 0]);
  expect(diffuseLight([0, 0, 1], yellow.reflectance)).toEqual([0, 0, 0]);
});

test('accounts for every received component as either diffused or absorbed', () => {
  const incident = [0.2, 0.7, 0.9];
  for (const object of COLORED_OBJECTS) {
    const diffused = diffuseLight(incident, object.reflectance);
    const absorbed = absorbLight(incident, object.reflectance);
    incident.forEach((value, index) => expect(diffused[index] + absorbed[index]).toBeCloseTo(value));
    expect(diffuseLight([0, 0, 0], object.reflectance)).toEqual([0, 0, 0]);
    expect(diffuseLight([1, 1, 1], object.reflectance)).toEqual(object.reflectance);
  }
});

test('encodes linear intensities for sRGB without naming unequal mixtures white', () => {
  expect(displayColor([0, 0, 0])).toBe('rgb(0, 0, 0)');
  expect(displayColor([1, 1, 1])).toBe('rgb(255, 255, 255)');
  expect(displayColor([0.5, 0, 0])).toBe('rgb(188, 0, 0)');
  expect(describeColor([1, 0.5, 1])).toBe('Mélange RVB');
  expect(() => displayColor([NaN, 0, 0])).toThrow(RangeError);
  expect(() => diffuseLight([0, -1, 0], [1, 1, 1])).toThrow(RangeError);
});
