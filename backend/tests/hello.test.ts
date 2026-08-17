import { describe, expect, test } from "vitest";

test('addition test', () => {
    expect(2+2).toBe(4);
});

test('this should be skipped', {skip: true}, () => {
    expect(null);
});