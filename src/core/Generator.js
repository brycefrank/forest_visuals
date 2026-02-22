/**
 * Shared procedural noise and math utilities for forestry assets.
 */
export default class Generator {
    /**
     * Simple seeded pseudo-random number generator.
     * @param {number} seed 
     */
    static random(seed = Math.random()) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Map a value from one range to another.
     */
    static map(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }

    /**
     * Return a random value between min and max.
     */
    static range(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Return a random integer value between min and max (inclusive).
     */
    static rangeInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Chance helper (e.g., 0.5 for 50% chance).
     */
    static chance(probability) {
        return Math.random() < probability;
    }
}
