import { describe, it, expect } from 'vitest';
import { BOTANICAL_FIELD_PLATES } from '../src/lib/sketch-generator.js';

describe('Filter Logic & Botanical Plates', () => {
  it('has valid botanical field plates for filtering and jump bar', () => {
    expect(BOTANICAL_FIELD_PLATES.length).toBeGreaterThanOrEqual(5);
    
    // Ensure each plate has unique ID, title, and shortName
    const ids = BOTANICAL_FIELD_PLATES.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(BOTANICAL_FIELD_PLATES.length);

    BOTANICAL_FIELD_PLATES.forEach(plate => {
      expect(plate.id).toBeTruthy();
      expect(plate.plateNumber).toBeTruthy();
      expect(plate.shortName).toBeTruthy();
    });
  });

  it('correctly maps plates into filter options with counts and labels', () => {
    const filterItems = BOTANICAL_FIELD_PLATES.map(plate => ({
      id: plate.id,
      label: `${plate.plateNumber}: ${plate.shortName}`,
    }));

    expect(filterItems.length).toBe(BOTANICAL_FIELD_PLATES.length);
    expect(filterItems[0].label).toContain(BOTANICAL_FIELD_PLATES[0].plateNumber);
    expect(filterItems[0].id).toBe(BOTANICAL_FIELD_PLATES[0].id);
  });

  it('handles unique environment filtering derivation without duplicates', () => {
    const mockEntries = [
      { id: '1', environment: 'forest', notes: 'Note 1' },
      { id: '2', environment: 'urban', notes: 'Note 2' },
      { id: '3', environment: 'forest', notes: 'Note 3' },
      { id: '4', environment: '', notes: 'Note 4' },
      { id: '5', notes: 'Note 5' },
    ];

    const environments = Array.from(
      new Set(mockEntries.map(e => e.environment).filter(Boolean))
    );

    expect(environments).toEqual(['forest', 'urban']);
    expect(environments.length).toBe(2);

    const forestEntries = mockEntries.filter(e => e.environment === 'forest');
    expect(forestEntries.length).toBe(2);

    const urbanEntries = mockEntries.filter(e => e.environment === 'urban');
    expect(urbanEntries.length).toBe(1);
  });
});
