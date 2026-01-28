// src/constants/spriteAssets.js

export const PART_ASSETS = {
  // Face (FRONT) assets - Resize to 8x8 for Steve-like look
  faceFront: {
    normal: {
      w: 8,
      h: 8,
      px: [
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
      ],
    },
    round: {
      w: 8,
      h: 8,
      px: [
        ".FFFFFF.",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        ".FFFFFF.",
      ],
    },
    square: {
      w: 8,
      h: 8,
      px: [
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
      ],
    },
    long: {
      w: 8,
      h: 9, // Slightly longer
      px: [
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        ".FFFFFF.",
      ],
    },
  },

  // Face (SIDE) assets - Resize to 8x8
  faceSide: {
    normal: {
      w: 8,
      h: 8,
      px: [
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
      ],
    },
    round: {
      w: 8,
      h: 8,
      px: [
        ".FFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        ".FFFFFFF",
      ],
    },
    square: {
      w: 8,
      h: 8,
      px: [
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
      ],
    },
    long: {
      w: 8,
      h: 9,
      px: [
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        "FFFFFFFF",
        ".FFFFFF.",
      ],
    },
  },

  // Eyes - Keep relatively simple
  eye: {
    normal: {
      w: 2,
      h: 2,
      px: [
        "SS",
        "SI",
      ],
    },
    big: {
      w: 2,
      h: 3,
      px: [
        "SS",
        "SI",
        "SI",
      ],
    },
    small: {
      w: 2,
      h: 1,
      px: [
        "SI",
      ],
    },
    narrow: {
      w: 2,
      h: 1,
      px: [
        "II",
      ],
    },
    cat: {
      w: 2,
      h: 2,
      px: [
        "SI",
        "SP",
      ],
    },
  },
  
};