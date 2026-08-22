export type AlgEvent = '222' | '333' | '444' | '555' | '666' | '777'
export type AlgSubset = 'OLL' | 'PLL' | 'F2L' | 'CLL' | 'OrtegaOLL' | 'OrtegaPLL' | 'COLL' | 'OLLParity' | 'PLLParity'

export interface AlgCase {
  id: string
  name: string
  subset: AlgSubset
  event: AlgEvent
  group: string
  alg: string
  altAlgs?: string[]
  probability?: string
}

// ─── 3x3 OLL — all 57 cases ───────────────────────────────────────────────────
export const OLL: AlgCase[] = [
  // Dot (4 cases)
  { id: 'OLL-1',  name: 'OLL 1',  subset: 'OLL', event: '333', group: 'Dot', alg: "R U2 R2 F R F' U2 R' F R F'" },
  { id: 'OLL-2',  name: 'OLL 2',  subset: 'OLL', event: '333', group: 'Dot', alg: "F R U R' U' F' f R U R' U' f'" },
  { id: 'OLL-3',  name: 'OLL 3',  subset: 'OLL', event: '333', group: 'Dot', alg: "f R U R' U' f' U' F R U R' U' F'" },
  { id: 'OLL-4',  name: 'OLL 4',  subset: 'OLL', event: '333', group: 'Dot', alg: "f R U R' U' f' U F R U R' U' F'" },

  // Square (2 cases)
  { id: 'OLL-5',  name: 'OLL 5',  subset: 'OLL', event: '333', group: 'Square', alg: "r' U2 R U R' U r" },
  { id: 'OLL-6',  name: 'OLL 6',  subset: 'OLL', event: '333', group: 'Square', alg: "r U2 R' U' R U' r'" },

  // S shape (4 cases)
  { id: 'OLL-7',  name: 'OLL 7',  subset: 'OLL', event: '333', group: 'S', alg: "r U R' U R U2 r'" },
  { id: 'OLL-8',  name: 'OLL 8',  subset: 'OLL', event: '333', group: 'S', alg: "r' U' R U' R' U2 r" },
  { id: 'OLL-11', name: 'OLL 11', subset: 'OLL', event: '333', group: 'S', alg: "r' R2 U R' U R U2 R' U M'" },
  { id: 'OLL-12', name: 'OLL 12', subset: 'OLL', event: '333', group: 'S', alg: "M' R' U' R U' R' U2 R U' M" },

  // F shape / Fish (4 cases)
  { id: 'OLL-9',  name: 'OLL 9',  subset: 'OLL', event: '333', group: 'F', alg: "R U R' U' R' F R2 U R' U' F'" },
  { id: 'OLL-10', name: 'OLL 10', subset: 'OLL', event: '333', group: 'F', alg: "R U R' U R' F R F' R U2 R'" },
  { id: 'OLL-35', name: 'OLL 35', subset: 'OLL', event: '333', group: 'F', alg: "R U2 R2 F R F' R U2 R'" },
  { id: 'OLL-37', name: 'OLL 37', subset: 'OLL', event: '333', group: 'F', alg: "F R' F' R U R U' R'" },

  // L shape (6 cases)
  { id: 'OLL-13', name: 'OLL 13', subset: 'OLL', event: '333', group: 'L', alg: "F U R U' R2 F' R U R U' R'" },
  { id: 'OLL-14', name: 'OLL 14', subset: 'OLL', event: '333', group: 'L', alg: "R' F R U R' F' R F U' F'" },
  { id: 'OLL-15', name: 'OLL 15', subset: 'OLL', event: '333', group: 'L', alg: "r' U' r R' U' R U r' U r" },
  { id: 'OLL-16', name: 'OLL 16', subset: 'OLL', event: '333', group: 'L', alg: "r U r' R U R' U' r U' r'" },
  { id: 'OLL-39', name: 'OLL 39', subset: 'OLL', event: '333', group: 'L', alg: "R U R' F' U' F U R U2 R'" },
  { id: 'OLL-40', name: 'OLL 40', subset: 'OLL', event: '333', group: 'L', alg: "R' F R U R' U' F' U R" },

  // Cross / edges only (4 cases)
  { id: 'OLL-17', name: 'OLL 17', subset: 'OLL', event: '333', group: 'Cross', alg: "F R' F' R2 r' U R U' R' U' M'" },
  { id: 'OLL-18', name: 'OLL 18', subset: 'OLL', event: '333', group: 'Cross', alg: "r U R' U R U2 r2 U' R U' R' U2 r" },
  { id: 'OLL-19', name: 'OLL 19', subset: 'OLL', event: '333', group: 'Cross', alg: "r' R U R U R' U' r R' F R F'" },
  { id: 'OLL-20', name: 'OLL 20', subset: 'OLL', event: '333', group: 'Cross', alg: "M U R U R' U' M2 U R U' r'" },

  // Corners only (8 cases)
  { id: 'OLL-21', name: 'OLL 21', subset: 'OLL', event: '333', group: 'Corners', alg: "R U2 R' U' R U R' U' R U' R'" },
  { id: 'OLL-22', name: 'OLL 22', subset: 'OLL', event: '333', group: 'Corners', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'OLL-23', name: 'OLL 23', subset: 'OLL', event: '333', group: 'Corners', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 'OLL-24', name: 'OLL 24', subset: 'OLL', event: '333', group: 'Corners', alg: "r U R' U' r' F R F'" },
  { id: 'OLL-25', name: 'OLL 25', subset: 'OLL', event: '333', group: 'Corners', alg: "F' r U R' U' r' F R" },
  { id: 'OLL-26', name: 'OLL 26 (Anti-Sune)', subset: 'OLL', event: '333', group: 'Corners', alg: "R U2 R' U' R U' R'" },
  { id: 'OLL-27', name: 'OLL 27 (Sune)',      subset: 'OLL', event: '333', group: 'Corners', alg: "R U R' U R U2 R'" },
  { id: 'OLL-28', name: 'OLL 28', subset: 'OLL', event: '333', group: 'Corners', alg: "r U R' U' M U R U' R'" },

  // P shape (6 cases)
  { id: 'OLL-29', name: 'OLL 29', subset: 'OLL', event: '333', group: 'P', alg: "R U R' U' R U' R' F' U' F R U R'" },
  { id: 'OLL-30', name: 'OLL 30', subset: 'OLL', event: '333', group: 'P', alg: "F R' F R2 U' R' U' R U R' F2" },
  { id: 'OLL-31', name: 'OLL 31', subset: 'OLL', event: '333', group: 'P', alg: "R' U' F U R U' R' F' R" },
  { id: 'OLL-32', name: 'OLL 32', subset: 'OLL', event: '333', group: 'P', alg: "S R U R' U' R' F R f'" },
  { id: 'OLL-43', name: 'OLL 43', subset: 'OLL', event: '333', group: 'P', alg: "R' U' F' U F R" },
  { id: 'OLL-44', name: 'OLL 44', subset: 'OLL', event: '333', group: 'P', alg: "f R U R' U' f'" },

  // T shape (2 cases)
  { id: 'OLL-33', name: 'OLL 33', subset: 'OLL', event: '333', group: 'T', alg: "R U R' U' R' F R F'" },
  { id: 'OLL-45', name: 'OLL 45', subset: 'OLL', event: '333', group: 'T', alg: "F R U R' U' F'" },

  // W shape (4 cases; OLL 36, 38, 53, 54 are all W-shape)
  { id: 'OLL-36', name: 'OLL 36', subset: 'OLL', event: '333', group: 'W', alg: "R' U' R U' R' U R U R B' R' B" },
  { id: 'OLL-38', name: 'OLL 38', subset: 'OLL', event: '333', group: 'W', alg: "R U R' U R U' R' U' R' F R F'" },
  { id: 'OLL-53', name: 'OLL 53', subset: 'OLL', event: '333', group: 'W', alg: "r' U' R U' R' U R U' R' U2 r" },
  { id: 'OLL-54', name: 'OLL 54', subset: 'OLL', event: '333', group: 'W', alg: "r U R' U R U' R' U R U2 r'" },

  // C shape (2 cases)
  { id: 'OLL-34', name: 'OLL 34', subset: 'OLL', event: '333', group: 'C', alg: "R U R2 U' R' F R U R U' F'" },
  { id: 'OLL-46', name: 'OLL 46', subset: 'OLL', event: '333', group: 'C', alg: "R' U' R' F R F' U R" },

  // I shape (8 cases)
  { id: 'OLL-47', name: 'OLL 47', subset: 'OLL', event: '333', group: 'I', alg: "R' U' R' F R F' R' F R F' U R" },
  { id: 'OLL-48', name: 'OLL 48', subset: 'OLL', event: '333', group: 'I', alg: "F R U R' U' R U R' U' F'" },
  { id: 'OLL-49', name: 'OLL 49', subset: 'OLL', event: '333', group: 'I', alg: "r U' r2 U r2 U r2 U' r" },
  { id: 'OLL-50', name: 'OLL 50', subset: 'OLL', event: '333', group: 'I', alg: "r' U r2 U' r2 U' r2 U r'" },
  { id: 'OLL-51', name: 'OLL 51', subset: 'OLL', event: '333', group: 'I', alg: "f R U R' U' R U R' U' f'" },
  { id: 'OLL-52', name: 'OLL 52', subset: 'OLL', event: '333', group: 'I', alg: "R U R' U R U' B U' B' R'" },
  { id: 'OLL-55', name: 'OLL 55', subset: 'OLL', event: '333', group: 'I', alg: "R' F R U R U' R2 F' R2 U' R' U R U R'" },
  { id: 'OLL-56', name: 'OLL 56', subset: 'OLL', event: '333', group: 'I', alg: "r' U' r U' R' U R U' R' U R r' U r" },

  // Knight move (2 cases)
  { id: 'OLL-41', name: 'OLL 41', subset: 'OLL', event: '333', group: 'Knight', alg: "R U R' U R U2 R' F R U R' U' F'" },
  { id: 'OLL-42', name: 'OLL 42', subset: 'OLL', event: '333', group: 'Knight', alg: "R' U' R U' R' U2 R F R U R' U' F'" },

  // Remaining — all 57 accounted for; OLL 57 is corners group
  { id: 'OLL-57', name: 'OLL 57', subset: 'OLL', event: '333', group: 'Corners', alg: "R U R' U' M' U R U' r'" },
]

// ─── 3x3 PLL — all 21 cases ───────────────────────────────────────────────────
export const PLL: AlgCase[] = [
  // Corners only
  { id: 'PLL-Aa', name: 'Aa-perm', subset: 'PLL', event: '333', group: 'Corners', probability: '1/18',
    alg: "x R' U R' D2 R U' R' D2 R2", altAlgs: ["l' U R' D2 R U' R' D2 R2"] },
  { id: 'PLL-Ab', name: 'Ab-perm', subset: 'PLL', event: '333', group: 'Corners', probability: '1/18',
    alg: "x R2 D2 R U R' D2 R U' R", altAlgs: ["l' U' L D2 L' U L D2 L2"] },
  { id: 'PLL-E',  name: 'E-perm',  subset: 'PLL', event: '333', group: 'Corners', probability: '1/36',
    alg: "x' R U' R' D R U R' D' R U R' D R U' R' D'" },

  // EPLL (edges only)
  { id: 'PLL-H',  name: 'H-perm',  subset: 'PLL', event: '333', group: 'EPLL', probability: '1/72',
    alg: "M2 U M2 U2 M2 U M2" },
  { id: 'PLL-Ua', name: 'Ua-perm', subset: 'PLL', event: '333', group: 'EPLL', probability: '1/18',
    alg: "R U' R U R U R U' R' U' R2", altAlgs: ["M2 U M U2 M' U M2"] },
  { id: 'PLL-Ub', name: 'Ub-perm', subset: 'PLL', event: '333', group: 'EPLL', probability: '1/18',
    alg: "R2 U R U R' U' R' U' R' U R'", altAlgs: ["M2 U' M U2 M' U' M2"] },
  { id: 'PLL-Z',  name: 'Z-perm',  subset: 'PLL', event: '333', group: 'EPLL', probability: '1/36',
    alg: "M' U M2 U M2 U M' U2 M2" },

  // Adjacent corner+edge swap
  { id: 'PLL-Ja', name: 'Ja-perm', subset: 'PLL', event: '333', group: 'Adjacent Swap', probability: '1/18',
    alg: "x R2 F R F' R U2 r' U r U2", altAlgs: ["R' U L' U2 R U' R' U2 R L"] },
  { id: 'PLL-Jb', name: 'Jb-perm', subset: 'PLL', event: '333', group: 'Adjacent Swap', probability: '1/18',
    alg: "R U R' F' R U R' U' R' F R2 U' R'" },
  { id: 'PLL-T',  name: 'T-perm',  subset: 'PLL', event: '333', group: 'Adjacent Swap', probability: '1/18',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'PLL-F',  name: 'F-perm',  subset: 'PLL', event: '333', group: 'Adjacent Swap', probability: '1/18',
    alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: 'PLL-Ra', name: 'Ra-perm', subset: 'PLL', event: '333', group: 'Adjacent Swap', probability: '1/18',
    alg: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
  { id: 'PLL-Rb', name: 'Rb-perm', subset: 'PLL', event: '333', group: 'Adjacent Swap', probability: '1/18',
    alg: "R' U2 R U2 R' F R U R' U' R' F' R2" },

  // Diagonal
  { id: 'PLL-Y',  name: 'Y-perm',  subset: 'PLL', event: '333', group: 'Diagonal', probability: '1/18',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'PLL-V',  name: 'V-perm',  subset: 'PLL', event: '333', group: 'Diagonal', probability: '1/18',
    alg: "R' U R' d' R' F' R2 U' R' U R' F R F" },
  { id: 'PLL-Na', name: 'Na-perm', subset: 'PLL', event: '333', group: 'Diagonal', probability: '1/72',
    alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: 'PLL-Nb', name: 'Nb-perm', subset: 'PLL', event: '333', group: 'Diagonal', probability: '1/72',
    alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },

  // G perms
  { id: 'PLL-Ga', name: 'Ga-perm', subset: 'PLL', event: '333', group: 'G perms', probability: '1/18',
    alg: "R2 U R' U R' U' R U' R2 D U' R' U R D'" },
  { id: 'PLL-Gb', name: 'Gb-perm', subset: 'PLL', event: '333', group: 'G perms', probability: '1/18',
    alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { id: 'PLL-Gc', name: 'Gc-perm', subset: 'PLL', event: '333', group: 'G perms', probability: '1/18',
    alg: "R2 U' R U' R U R' U R2 D' U R U' R' D" },
  { id: 'PLL-Gd', name: 'Gd-perm', subset: 'PLL', event: '333', group: 'G perms', probability: '1/18',
    alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
]

// ─── 3x3 F2L — 41 cases ───────────────────────────────────────────────────────
export const F2L: AlgCase[] = [
  // Basic pairs (corner and edge already together)
  { id: 'F2L-1',  name: 'F2L 1',  subset: 'F2L', event: '333', group: 'Basic', alg: "U R U' R'" },
  { id: 'F2L-2',  name: 'F2L 2',  subset: 'F2L', event: '333', group: 'Basic', alg: "U' F' U F" },
  { id: 'F2L-3',  name: 'F2L 3',  subset: 'F2L', event: '333', group: 'Basic', alg: "U' R U R' U2 R U' R'" },
  { id: 'F2L-4',  name: 'F2L 4',  subset: 'F2L', event: '333', group: 'Basic', alg: "R U R'" },
  { id: 'F2L-5',  name: 'F2L 5',  subset: 'F2L', event: '333', group: 'Basic', alg: "R U' R' U R U' R'" },
  { id: 'F2L-6',  name: 'F2L 6',  subset: 'F2L', event: '333', group: 'Basic', alg: "F' U F U' F' U F" },
  { id: 'F2L-7',  name: 'F2L 7',  subset: 'F2L', event: '333', group: 'Basic', alg: "U' R U2 R' U2 R U' R'" },
  { id: 'F2L-8',  name: 'F2L 8',  subset: 'F2L', event: '333', group: 'Basic', alg: "U F' U2 F U2 F' U F" },

  // Pair split — corner and edge separated
  { id: 'F2L-9',  name: 'F2L 9',  subset: 'F2L', event: '333', group: 'Pair split', alg: "R U R' U' R U R'" },
  { id: 'F2L-10', name: 'F2L 10', subset: 'F2L', event: '333', group: 'Pair split', alg: "U R U' R' U' F' U F" },
  { id: 'F2L-11', name: 'F2L 11', subset: 'F2L', event: '333', group: 'Pair split', alg: "R U' R' U F' U F" },
  { id: 'F2L-12', name: 'F2L 12', subset: 'F2L', event: '333', group: 'Pair split', alg: "R U2 R' U' R U R'" },
  { id: 'F2L-13', name: 'F2L 13', subset: 'F2L', event: '333', group: 'Pair split', alg: "F' U2 F U F' U' F" },
  { id: 'F2L-14', name: 'F2L 14', subset: 'F2L', event: '333', group: 'Pair split', alg: "U R U2 R' U R U' R'" },
  { id: 'F2L-15', name: 'F2L 15', subset: 'F2L', event: '333', group: 'Pair split', alg: "U' F' U2 F U' F' U F" },
  { id: 'F2L-16', name: 'F2L 16', subset: 'F2L', event: '333', group: 'Pair split', alg: "R U R' U2 F' U' F" },

  // Corner in slot
  { id: 'F2L-17', name: 'F2L 17', subset: 'F2L', event: '333', group: 'Corner in slot', alg: "R U' R' d R' U2 R U2 R' U R" },
  { id: 'F2L-18', name: 'F2L 18', subset: 'F2L', event: '333', group: 'Corner in slot', alg: "R U R' U' R U R' U' R U R'" },
  { id: 'F2L-19', name: 'F2L 19', subset: 'F2L', event: '333', group: 'Corner in slot', alg: "R U' R' U R U2 R' U R U' R'" },
  { id: 'F2L-20', name: 'F2L 20', subset: 'F2L', event: '333', group: 'Corner in slot', alg: "R U2 R' U R U' R'" },

  // Edge in slot
  { id: 'F2L-21', name: 'F2L 21', subset: 'F2L', event: '333', group: 'Edge in slot', alg: "R U' R' U' R U R' U' R U R'" },
  { id: 'F2L-22', name: 'F2L 22', subset: 'F2L', event: '333', group: 'Edge in slot', alg: "U R U' R' U F' U' F" },
  { id: 'F2L-23', name: 'F2L 23', subset: 'F2L', event: '333', group: 'Edge in slot', alg: "U2 R U R' U R U' R'" },
  { id: 'F2L-24', name: 'F2L 24', subset: 'F2L', event: '333', group: 'Edge in slot', alg: "U2 F' U' F U' F' U F" },

  // Both in slot
  { id: 'F2L-25', name: 'F2L 25', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' U' R U' R' U R U' R'" },
  { id: 'F2L-26', name: 'F2L 26', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' U R U R'" },
  { id: 'F2L-27', name: 'F2L 27', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U R' U2 R U' R' U R U R'" },
  { id: 'F2L-28', name: 'F2L 28', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' U R U R' U' R U' R'" },
  { id: 'F2L-29', name: 'F2L 29', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R' F R F' R U' R'" },
  { id: 'F2L-30', name: 'F2L 30', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' F R' F' R" },
  { id: 'F2L-31', name: 'F2L 31', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R' F' R U R U' R' F" },
  { id: 'F2L-32', name: 'F2L 32', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U R' F' R U' R' F" },
  { id: 'F2L-33', name: 'F2L 33', subset: 'F2L', event: '333', group: 'Both in slot', alg: "U' R U R' U R U R'" },
  { id: 'F2L-34', name: 'F2L 34', subset: 'F2L', event: '333', group: 'Both in slot', alg: "U F' U' F U' F' U' F" },
  { id: 'F2L-35', name: 'F2L 35', subset: 'F2L', event: '333', group: 'Both in slot', alg: "U' R U' R' U R U R'" },
  { id: 'F2L-36', name: 'F2L 36', subset: 'F2L', event: '333', group: 'Both in slot', alg: "U F' U F U' F' U' F" },
  { id: 'F2L-37', name: 'F2L 37', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' U2 R U R' U' R U R'" },
  { id: 'F2L-38', name: 'F2L 38', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U R' U2 R U' R' U' R U R'" },
  { id: 'F2L-39', name: 'F2L 39', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' U2 R U R'" },
  { id: 'F2L-40', name: 'F2L 40', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U' R' U R U' R' U R U' R'" },
  { id: 'F2L-41', name: 'F2L 41', subset: 'F2L', event: '333', group: 'Both in slot', alg: "R U R' U' R U R' U' R U R'" },
]

// ─── 3x3 COLL ─────────────────────────────────────────────────────────────────
export const COLL: AlgCase[] = [
  // H group
  { id: 'COLL-H-skip', name: 'H Skip', subset: 'COLL', event: '333', group: 'H', alg: "" },
  { id: 'COLL-H-1', name: 'COLL H1', subset: 'COLL', event: '333', group: 'H', alg: "R U2 R' U' R U2 L' U R' U' L" },
  { id: 'COLL-H-2', name: 'COLL H2', subset: 'COLL', event: '333', group: 'H', alg: "F R U R' U' F' U2 F R U R' U' F'" },
  { id: 'COLL-H-3', name: 'COLL H3', subset: 'COLL', event: '333', group: 'H', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'COLL-H-4', name: 'COLL H4', subset: 'COLL', event: '333', group: 'H', alg: "R' U2 R U R' U2 L U' R U L'" },

  // Pi group
  { id: 'COLL-Pi-1', name: 'COLL Pi1', subset: 'COLL', event: '333', group: 'Pi', alg: "F R U R' U' R U R' U' F'" },
  { id: 'COLL-Pi-2', name: 'COLL Pi2', subset: 'COLL', event: '333', group: 'Pi', alg: "R U2 R2 U' R U' R' U2 F R F'" },
  { id: 'COLL-Pi-3', name: 'COLL Pi3', subset: 'COLL', event: '333', group: 'Pi', alg: "F R' F' R U2 R U2 R'" },
  { id: 'COLL-Pi-4', name: 'COLL Pi4', subset: 'COLL', event: '333', group: 'Pi', alg: "R' U2 R U2 R' F R F'" },
  { id: 'COLL-Pi-5', name: 'COLL Pi5', subset: 'COLL', event: '333', group: 'Pi', alg: "R U R' U R U' R' U R U2 R'" },
  { id: 'COLL-Pi-6', name: 'COLL Pi6', subset: 'COLL', event: '333', group: 'Pi', alg: "R' U' R U' R' U R U' R' U2 R" },

  // U group (Sune / Anti-Sune family)
  { id: 'COLL-U-1', name: 'COLL U1 (Sune)', subset: 'COLL', event: '333', group: 'U', alg: "R U R' U R U2 R'" },
  { id: 'COLL-U-2', name: 'COLL U2 (Anti-Sune)', subset: 'COLL', event: '333', group: 'U', alg: "R U2 R' U' R U' R'" },
  { id: 'COLL-U-3', name: 'COLL U3', subset: 'COLL', event: '333', group: 'U', alg: "R2 D R' U2 R D' R' U2 R'" },
  { id: 'COLL-U-4', name: 'COLL U4', subset: 'COLL', event: '333', group: 'U', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 'COLL-U-5', name: 'COLL U5', subset: 'COLL', event: '333', group: 'U', alg: "r' U' r U' R' U R U' R' U R r' U r" },
  { id: 'COLL-U-6', name: 'COLL U6', subset: 'COLL', event: '333', group: 'U', alg: "r U r' U R U' R' U R U' R' r U' r'" },

  // T group
  { id: 'COLL-T-1', name: 'COLL T1', subset: 'COLL', event: '333', group: 'T', alg: "R U R' U' R' F R F'" },
  { id: 'COLL-T-2', name: 'COLL T2', subset: 'COLL', event: '333', group: 'T', alg: "L' U' L U L F' L' F" },
  { id: 'COLL-T-3', name: 'COLL T3', subset: 'COLL', event: '333', group: 'T', alg: "F R' F' R U2 R U' R' U R U2 R'" },
  { id: 'COLL-T-4', name: 'COLL T4', subset: 'COLL', event: '333', group: 'T', alg: "R' F R F' U2 R' U R U' R' U' R" },

  // S group
  { id: 'COLL-S-1', name: 'COLL S1', subset: 'COLL', event: '333', group: 'S', alg: "R U' L' U R' U' L" },
  { id: 'COLL-S-2', name: 'COLL S2', subset: 'COLL', event: '333', group: 'S', alg: "R' U L U' R U L'" },
  { id: 'COLL-S-3', name: 'COLL S3', subset: 'COLL', event: '333', group: 'S', alg: "R U2 R' U2 R' F R F'" },
  { id: 'COLL-S-4', name: 'COLL S4', subset: 'COLL', event: '333', group: 'S', alg: "R' F2 R U2 R U2 R' F2 R U2 R'" },

  // AS group
  { id: 'COLL-AS-1', name: 'COLL AS1', subset: 'COLL', event: '333', group: 'AS', alg: "L' U R U' L U R'" },
  { id: 'COLL-AS-2', name: 'COLL AS2', subset: 'COLL', event: '333', group: 'AS', alg: "R U' L' U R' U' L" },
  { id: 'COLL-AS-3', name: 'COLL AS3', subset: 'COLL', event: '333', group: 'AS', alg: "F R' F' R U2 R U2 R'" },
  { id: 'COLL-AS-4', name: 'COLL AS4', subset: 'COLL', event: '333', group: 'AS', alg: "R U2 R' U2 R' F R F'" },

  // L group
  { id: 'COLL-L-1', name: 'COLL L1', subset: 'COLL', event: '333', group: 'L', alg: "R U' R' U' R U R' U' R U R'" },
  { id: 'COLL-L-2', name: 'COLL L2', subset: 'COLL', event: '333', group: 'L', alg: "R' U R U R' U' R U R' U' R" },
  { id: 'COLL-L-3', name: 'COLL L3', subset: 'COLL', event: '333', group: 'L', alg: "R U R' F' R U2 R' U2 R' F R" },
  { id: 'COLL-L-4', name: 'COLL L4', subset: 'COLL', event: '333', group: 'L', alg: "R' U' R F R' U2 R U2 R F' R'" },
  { id: 'COLL-L-5', name: 'COLL L5', subset: 'COLL', event: '333', group: 'L', alg: "R' U R U' R' F' U' F R" },
  { id: 'COLL-L-6', name: 'COLL L6', subset: 'COLL', event: '333', group: 'L', alg: "R' F R F' R U R' U' R U' R'" },
  { id: 'COLL-L-7', name: 'COLL L7', subset: 'COLL', event: '333', group: 'L', alg: "r U' r2 D' r U r' D r2 U r'" },
  { id: 'COLL-L-8', name: 'COLL L8', subset: 'COLL', event: '333', group: 'L', alg: "r' U r2 D r' U' r D' r2 U' r" },
]

// ─── 2x2 CLL — 42 non-trivial cases ──────────────────────────────────────────
export const CLL: AlgCase[] = [
  // O group (all corners oriented — skip + 2 permutation cases)
  { id: 'CLL-O-skip', name: 'O Skip', subset: 'CLL', event: '222', group: 'O', alg: "" },
  { id: 'CLL-O-1',    name: 'O1', subset: 'CLL', event: '222', group: 'O', alg: "R U R' F' R U R' U' R' F R2 U' R'" },
  { id: 'CLL-O-2',    name: 'O2', subset: 'CLL', event: '222', group: 'O', alg: "F R2 U' R2 F' U2 F R2 U' R2 F'" },
  { id: 'CLL-O-3',    name: 'O3', subset: 'CLL', event: '222', group: 'O', alg: "R2 U' R2 U' R2 U R2 U R2 U R2" },

  // H group (bar on top — 2 headlights on opposite sides) — 4 cases
  { id: 'CLL-H-1', name: 'H1', subset: 'CLL', event: '222', group: 'H', alg: "R U2 R' U' R U2 L' U R' U' L" },
  { id: 'CLL-H-2', name: 'H2', subset: 'CLL', event: '222', group: 'H', alg: "F R U R' U' F' U2 F R U R' U' F'" },
  { id: 'CLL-H-3', name: 'H3', subset: 'CLL', event: '222', group: 'H', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'CLL-H-4', name: 'H4', subset: 'CLL', event: '222', group: 'H', alg: "R' U2 R U R' U2 L U' R U L'" },

  // Pi group — 6 cases
  { id: 'CLL-Pi-1', name: 'Pi1', subset: 'CLL', event: '222', group: 'Pi', alg: "F R U R' U' R U R' U' F'" },
  { id: 'CLL-Pi-2', name: 'Pi2', subset: 'CLL', event: '222', group: 'Pi', alg: "R U2 R2 U' R U' R' U2 F R F'" },
  { id: 'CLL-Pi-3', name: 'Pi3', subset: 'CLL', event: '222', group: 'Pi', alg: "F R' F' R U2 R U2 R'" },
  { id: 'CLL-Pi-4', name: 'Pi4', subset: 'CLL', event: '222', group: 'Pi', alg: "R' U2 R U2 R' F R F'" },
  { id: 'CLL-Pi-5', name: 'Pi5', subset: 'CLL', event: '222', group: 'Pi', alg: "R U R' U R U' R' U R U2 R'" },
  { id: 'CLL-Pi-6', name: 'Pi6', subset: 'CLL', event: '222', group: 'Pi', alg: "R' U' R U' R' U R U' R' U2 R" },

  // U group — 6 cases
  { id: 'CLL-U-1', name: 'U1 (Sune)',      subset: 'CLL', event: '222', group: 'U', alg: "R U R' U R U2 R'" },
  { id: 'CLL-U-2', name: 'U2 (Anti-Sune)', subset: 'CLL', event: '222', group: 'U', alg: "R U2 R' U' R U' R'" },
  { id: 'CLL-U-3', name: 'U3', subset: 'CLL', event: '222', group: 'U', alg: "R2 D R' U2 R D' R' U2 R'" },
  { id: 'CLL-U-4', name: 'U4', subset: 'CLL', event: '222', group: 'U', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 'CLL-U-5', name: 'U5', subset: 'CLL', event: '222', group: 'U', alg: "R' U' R U' R' U2 R U' R' U R U' R' U2 R" },
  { id: 'CLL-U-6', name: 'U6', subset: 'CLL', event: '222', group: 'U', alg: "R U R' U R U2 R' U R U' R' U R U2 R'" },

  // T group — 4 cases
  { id: 'CLL-T-1', name: 'T1', subset: 'CLL', event: '222', group: 'T', alg: "R U R' U' R' F R F'" },
  { id: 'CLL-T-2', name: 'T2', subset: 'CLL', event: '222', group: 'T', alg: "L' U' L U L F' L' F" },
  { id: 'CLL-T-3', name: 'T3', subset: 'CLL', event: '222', group: 'T', alg: "F R' F' R U2 R U' R' U R U2 R'" },
  { id: 'CLL-T-4', name: 'T4', subset: 'CLL', event: '222', group: 'T', alg: "R' F R F' U2 R' U R U' R' U' R" },

  // S group — 4 cases
  { id: 'CLL-S-1', name: 'S1', subset: 'CLL', event: '222', group: 'S', alg: "R U' L' U R' U' L" },
  { id: 'CLL-S-2', name: 'S2', subset: 'CLL', event: '222', group: 'S', alg: "R' U L U' R U L'" },
  { id: 'CLL-S-3', name: 'S3', subset: 'CLL', event: '222', group: 'S', alg: "R' F2 R U2 R U2 R' F2 R U2 R'" },
  { id: 'CLL-S-4', name: 'S4', subset: 'CLL', event: '222', group: 'S', alg: "R U2 R' U2 R' F R F'" },

  // AS group — 4 cases
  { id: 'CLL-AS-1', name: 'AS1', subset: 'CLL', event: '222', group: 'AS', alg: "L' U R U' L U R'" },
  { id: 'CLL-AS-2', name: 'AS2', subset: 'CLL', event: '222', group: 'AS', alg: "R U' L' U R' U' L" },
  { id: 'CLL-AS-3', name: 'AS3', subset: 'CLL', event: '222', group: 'AS', alg: "R U2 R' U2 R' F R F'" },
  { id: 'CLL-AS-4', name: 'AS4', subset: 'CLL', event: '222', group: 'AS', alg: "F R' F' R U2 R U2 R'" },

  // L group — 8 cases
  { id: 'CLL-L-1', name: 'L1', subset: 'CLL', event: '222', group: 'L', alg: "R U' R' U' R U R' U' R U R'" },
  { id: 'CLL-L-2', name: 'L2', subset: 'CLL', event: '222', group: 'L', alg: "R' U R U R' U' R U R' U' R" },
  { id: 'CLL-L-3', name: 'L3', subset: 'CLL', event: '222', group: 'L', alg: "R U R' F' R U2 R' U2 R' F R" },
  { id: 'CLL-L-4', name: 'L4', subset: 'CLL', event: '222', group: 'L', alg: "R' U' R F R' U2 R U2 R F' R'" },
  { id: 'CLL-L-5', name: 'L5', subset: 'CLL', event: '222', group: 'L', alg: "R' U R U' R' F' U' F R" },
  { id: 'CLL-L-6', name: 'L6', subset: 'CLL', event: '222', group: 'L', alg: "R' F R F' R U R' U' R U' R'" },
  { id: 'CLL-L-7', name: 'L7', subset: 'CLL', event: '222', group: 'L', alg: "F R U' R' U R U R' F'" },
  { id: 'CLL-L-8', name: 'L8', subset: 'CLL', event: '222', group: 'L', alg: "F' R' U R U' R' U' R F" },
]

// ─── 2x2 Ortega OLL — 7 cases (excluding skip) ──────────────────────────────
export const OrtegaOLL: AlgCase[] = [
  { id: 'OrtOLL-skip', name: 'OLL Skip', subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "" },
  { id: 'OrtOLL-1', name: 'OLL 1 (Dot)',        subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "R U2 R' U' R U' R'", altAlgs: ["F R U R' U' F'"] },
  { id: 'OrtOLL-2', name: 'OLL 2 (H)',           subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "F R U R' U' R U R' U' F'" },
  { id: 'OrtOLL-3', name: 'OLL 3 (Pi)',          subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "F R U R' U' F'" },
  { id: 'OrtOLL-4', name: 'OLL 4 (Sune)',        subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "R U R' U R U2 R'" },
  { id: 'OrtOLL-5', name: 'OLL 5 (Anti-Sune)',   subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "R U2 R' U' R U' R'" },
  { id: 'OrtOLL-6', name: 'OLL 6 (L)',           subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "r U R' U' r' F R F'" },
  { id: 'OrtOLL-7', name: 'OLL 7 (T)',           subset: 'OrtegaOLL', event: '222', group: 'OLL', alg: "R U R' U' R' F R F'" },
]

// ─── 2x2 Ortega PLL — 4 cases ─────────────────────────────────────────────────
export const OrtegaPLL: AlgCase[] = [
  { id: 'OrtPLL-skip', name: 'PLL Skip', subset: 'OrtegaPLL', event: '222', group: 'PLL', alg: "" },
  { id: 'OrtPLL-adj',  name: 'Adjacent Swap',  subset: 'OrtegaPLL', event: '222', group: 'PLL',
    alg: "R U' R F R2 U' R2 U R2 U F'" },
  { id: 'OrtPLL-diag', name: 'Diagonal Swap', subset: 'OrtegaPLL', event: '222', group: 'PLL',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'OrtPLL-H',    name: 'H-Perm (double adjacent)', subset: 'OrtegaPLL', event: '222', group: 'PLL',
    alg: "R2 U2 R2 U2 R2" },
]

// ─── 4x4 OLL Parity & PLL Parity ─────────────────────────────────────────────
export const OLLParity444: AlgCase[] = [
  { id: '444-OLLpar-1', name: 'OLL Parity', subset: 'OLLParity', event: '444', group: 'OLL Parity',
    alg: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
    altAlgs: ["r U2 x r U2 r U2 r' U2 l U2 r' U2 r U2 r' U2 r'"] },
]

export const PLLParity444: AlgCase[] = [
  { id: '444-PLLpar-1', name: 'PLL Parity (adj edge swap)', subset: 'PLLParity', event: '444', group: 'PLL Parity',
    alg: "2R2 U2 2R2 Uw2 2R2 Uw2",
    altAlgs: ["r2 U2 r2 u2 r2 u2"] },
  { id: '444-PLLpar-2', name: 'PLL Parity (opp edge swap)', subset: 'PLLParity', event: '444', group: 'PLL Parity',
    alg: "Uw2 2R2 U2 2R2 Uw2 2R2" },
]

// ─── 5x5 OLL/PLL Parity ───────────────────────────────────────────────────────
export const OLLParity555: AlgCase[] = [
  { id: '555-OLLpar-1', name: 'OLL Parity', subset: 'OLLParity', event: '555', group: 'OLL Parity',
    alg: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
    altAlgs: ["3Rw' U2 3Rw U2 Rw U2 Rw' U2 3Rw' U2 3Rw2 U2 3Rw' U2 3Rw' U2"] },
]

export const PLLParity555: AlgCase[] = [
  { id: '555-PLLpar-1', name: 'PLL Parity (single dedge)', subset: 'PLLParity', event: '555', group: 'PLL Parity',
    alg: "Dw' Rw F2 Rw' U2 Rw F2 Rw' Dw" },
  { id: '555-PLLpar-2', name: 'PLL Parity (double dedge)', subset: 'PLLParity', event: '555', group: 'PLL Parity',
    alg: "Rw2 U2 Rw2 Uw2 Rw2 Uw2" },
]

// ─── 6x6 OLL/PLL Parity ───────────────────────────────────────────────────────
export const OLLParity666: AlgCase[] = [
  { id: '666-OLLpar-1', name: 'OLL Parity (outer)', subset: 'OLLParity', event: '666', group: 'OLL Parity',
    alg: "3Rw U2 x 3Rw U2 3Rw U2 3Rw' U2 3Lw U2 3Rw' U2 3Rw U2 3Rw' U2 3Rw'" },
  { id: '666-OLLpar-2', name: 'OLL Parity (inner)', subset: 'OLLParity', event: '666', group: 'OLL Parity',
    alg: "2Rw U2 x 2Rw U2 2Rw U2 2Rw' U2 2Lw U2 2Rw' U2 2Rw U2 2Rw' U2 2Rw'" },
]

export const PLLParity666: AlgCase[] = [
  { id: '666-PLLpar-1', name: 'PLL Parity (outer edges)', subset: 'PLLParity', event: '666', group: 'PLL Parity',
    alg: "3Rw2 U2 3Rw2 3Uw2 3Rw2 3Uw2" },
  { id: '666-PLLpar-2', name: 'PLL Parity (inner edges)', subset: 'PLLParity', event: '666', group: 'PLL Parity',
    alg: "2Rw2 U2 2Rw2 2Uw2 2Rw2 2Uw2" },
]

// ─── 7x7 OLL/PLL Parity ───────────────────────────────────────────────────────
export const OLLParity777: AlgCase[] = [
  { id: '777-OLLpar-1', name: 'OLL Parity (outermost)', subset: 'OLLParity', event: '777', group: 'OLL Parity',
    alg: "4Rw U2 x 4Rw U2 4Rw U2 4Rw' U2 4Lw U2 4Rw' U2 4Rw U2 4Rw' U2 4Rw'" },
  { id: '777-OLLpar-2', name: 'OLL Parity (middle)', subset: 'OLLParity', event: '777', group: 'OLL Parity',
    alg: "3Rw U2 x 3Rw U2 3Rw U2 3Rw' U2 3Lw U2 3Rw' U2 3Rw U2 3Rw' U2 3Rw'" },
  { id: '777-OLLpar-3', name: 'OLL Parity (inner)', subset: 'OLLParity', event: '777', group: 'OLL Parity',
    alg: "2Rw U2 x 2Rw U2 2Rw U2 2Rw' U2 2Lw U2 2Rw' U2 2Rw U2 2Rw' U2 2Rw'" },
]

export const PLLParity777: AlgCase[] = [
  { id: '777-PLLpar-1', name: 'PLL Parity (outer)', subset: 'PLLParity', event: '777', group: 'PLL Parity',
    alg: "4Rw2 U2 4Rw2 4Uw2 4Rw2 4Uw2" },
  { id: '777-PLLpar-2', name: 'PLL Parity (middle)', subset: 'PLLParity', event: '777', group: 'PLL Parity',
    alg: "3Rw2 U2 3Rw2 3Uw2 3Rw2 3Uw2" },
  { id: '777-PLLpar-3', name: 'PLL Parity (inner)', subset: 'PLLParity', event: '777', group: 'PLL Parity',
    alg: "2Rw2 U2 2Rw2 2Uw2 2Rw2 2Uw2" },
]

// ─── Combined OLL/PLL parity by event ────────────────────────────────────────
export const OLLParity: AlgCase[] = [
  ...OLLParity444,
  ...OLLParity555,
  ...OLLParity666,
  ...OLLParity777,
]

export const PLLParity: AlgCase[] = [
  ...PLLParity444,
  ...PLLParity555,
  ...PLLParity666,
  ...PLLParity777,
]

// ─── Exports ──────────────────────────────────────────────────────────────────
export const ALL_CASES: AlgCase[] = [
  ...OLL,
  ...PLL,
  ...F2L,
  ...COLL,
  ...CLL,
  ...OrtegaOLL,
  ...OrtegaPLL,
  ...OLLParity,
  ...PLLParity,
]

export function getGroup(subset: AlgSubset): string[] {
  const src = ALL_CASES.filter((c) => c.subset === subset)
  return [...new Set(src.map((c) => c.group))]
}

export function getCasesForSubset(subset: AlgSubset): AlgCase[] {
  return ALL_CASES.filter((c) => c.subset === subset)
}

export const SOURCES: Record<AlgSubset, AlgCase[]> = {
  OLL,
  PLL,
  F2L,
  COLL,
  CLL,
  OrtegaOLL,
  OrtegaPLL,
  OLLParity,
  PLLParity,
}
