export function seededShuffle<T>(array: T[], seed: number): T[] {
    // If seed is 0, return original order
    if (seed === 0) return [...array];

    // Map each element to an object with a random sort key derived from the seed and its original index/content
    // However, simple Math.random() with a seed isn't built-in to JS.
    // We can use a simple pseudo-random number generator (PRNG) for stability.

    const mulberry32 = (a: number) => {
        return () => {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }

    const rng = mulberry32(seed);

    // We want to shuffle the array. A standard Fisher-Yates with a seeded RNG is best.
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}
