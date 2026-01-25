/**
 * Tutorial Lottie Animation Data
 * Custom animations for each tutorial step in peach/cream theme
 * Using inline JSON data to avoid external file dependencies
 */

import { TutorialStep } from "./InteractiveTutorial";

// Rocket Launch Animation (Welcome)
const rocketAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "Rocket",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Rocket",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: -45 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 0], e: [40, 40, 0], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 60, s: [40, 40, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100], e: [100, 100, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [30, 40] },
              p: { a: 0, k: [0, 0] },
              nm: "Body"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.6, 0.4, 1] }, // Coral color
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Body Group"
        },
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [12, 12] },
              p: { a: 0, k: [0, -8] },
              nm: "Window"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.96, 0.93, 1] }, // Cream color
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Window Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Flame",
      sr: 1,
      ks: {
        o: { a: 1, k: [
          { t: 0, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: 15, s: [100] }
        ]},
        r: { a: 0, k: -45 },
        p: { a: 0, k: [95, 95, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [60, 60, 100], e: [100, 120, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [100, 120, 100], e: [80, 100, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 45, s: [80, 100, 100], e: [100, 120, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 60, s: [100, 120, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [20, 30] },
              p: { a: 0, k: [0, 0] },
              nm: "Flame"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.8, 0.4, 1] }, // Orange/yellow
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Flame Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

// Plus/Add Animation (Add Subject)
const addAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 45,
  w: 120,
  h: 120,
  nm: "Add",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Plus",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [90], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 30, s: [90] }
          ]
        },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [110, 110, 100], i: { x: 0.2, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 20, s: [110, 110, 100], e: [100, 100, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [8, 40] },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 4 },
              nm: "Vertical"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.6, 0.4, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Vertical Group"
        },
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [40, 8] },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 4 },
              nm: "Horizontal"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.6, 0.4, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Horizontal Group"
        }
      ],
      ip: 0,
      op: 45,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Circle BG",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [100, 100, 100], i: { x: 0.2, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 25, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [60, 60] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.96, 0.93, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Circle Group"
        }
      ],
      ip: 0,
      op: 45,
      st: 0
    }
  ]
};

// Lab/Sparkle Animation (Explore Lab)
const labAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "Lab",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Sparkle1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 15, s: [100], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 45, s: [100], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [0] }
          ]
        },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [180], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [180] }
          ]
        },
        p: { a: 0, k: [60, 45, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [100, 100, 100], i: { x: 0.2, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 20, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 5 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 15 },
              os: { a: 0, k: 0 },
              nm: "Star"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.6, 0.4, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Sparkle Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Sparkle2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 10, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 25, s: [100], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 50, s: [100], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [0] }
          ]
        },
        r: {
          a: 1,
          k: [
            { t: 10, s: [0], e: [180], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [180] }
          ]
        },
        p: { a: 0, k: [85, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 10, s: [0, 0, 100], e: [80, 80, 100], i: { x: 0.2, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [80, 80, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 4 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 12 },
              os: { a: 0, k: 0 },
              nm: "Star"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.8, 0.6, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Sparkle Group 2"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Sparkle3",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 5, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 20, s: [100], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 48, s: [100], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [0] }
          ]
        },
        r: {
          a: 1,
          k: [
            { t: 5, s: [0], e: [180], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [180] }
          ]
        },
        p: { a: 0, k: [35, 75, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 5, s: [0, 0, 100], e: [70, 70, 100], i: { x: 0.2, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 25, s: [70, 70, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 3 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 10 },
              os: { a: 0, k: 0 },
              nm: "Star"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.7, 0.5, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Sparkle Group 3"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

// Pulse/Heart Animation (Check Pulse)
const pulseAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 45,
  w: 120,
  h: 120,
  nm: "Pulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Heart",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100], e: [115, 115, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 15, s: [115, 115, 100], e: [100, 100, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [100, 100, 100], e: [110, 110, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 45, s: [110, 110, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [45, 45] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.6, 0.4, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Circle Group"
        }
      ],
      ip: 0,
      op: 45,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Ring",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [80], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 30, s: [0], e: [80], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 45, s: [80] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100], e: [150, 150, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [150, 150, 100], e: [100, 100, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 45, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [55, 55] },
              p: { a: 0, k: [0, 0] },
              nm: "Ring"
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 0.6, 0.4, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Ring Group"
        }
      ],
      ip: 0,
      op: 45,
      st: 0
    }
  ]
};

// Trophy/Complete Animation
const completeAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "Complete",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 55, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [120, 120, 100], i: { x: 0.2, y: 1.5 }, o: { x: 0.6, y: 0 } },
            { t: 20, s: [120, 120, 100], e: [100, 100, 100], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 30, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  c: false,
                  v: [[-12, 0], [-4, 8], [12, -8]],
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]]
                }
              },
              nm: "Checkmark"
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 5 },
              lc: 2,
              lj: 2
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Check Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Circle BG",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 55, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [100, 100, 100], i: { x: 0.2, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 25, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [50, 50] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.4, 0.8, 0.4, 1] }, // Green success color
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Circle Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Confetti1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 25, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 35, s: [100], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [0] }
          ]
        },
        r: {
          a: 1,
          k: [
            { t: 25, s: [0], e: [360], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [360] }
          ]
        },
        p: {
          a: 1,
          k: [
            { t: 25, s: [60, 55, 0], e: [30, 20, 0], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 60, s: [30, 20, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [6, 6] },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 1 },
              nm: "Square"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.6, 0.4, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Confetti Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "Confetti2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 28, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 38, s: [100], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [0] }
          ]
        },
        r: {
          a: 1,
          k: [
            { t: 28, s: [0], e: [-360], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [-360] }
          ]
        },
        p: {
          a: 1,
          k: [
            { t: 28, s: [60, 55, 0], e: [95, 25, 0], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 60, s: [95, 25, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [5, 5] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.8, 0.4, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Confetti Group 2"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

// Map tutorial steps to animations
export const tutorialAnimations: Record<TutorialStep, object> = {
  welcome: rocketAnimation,
  "add-subject": addAnimation,
  "explore-lab": labAnimation,
  "check-pulse": pulseAnimation,
  complete: completeAnimation,
};

export type { TutorialStep };
