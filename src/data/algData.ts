export type AlgSubset = 'OLL' | 'PLL' | 'F2L'

export interface AlgCase {
  id: string
  name: string
  subset: AlgSubset
  group: string
  alg: string
  altAlgs?: string[]
  probability?: string
}

// ─── OLL ──────────────────────────────────────────────────────────────────────
export const OLL: AlgCase[] = [
  // Dot
  { id: 'OLL-1',  name: 'OLL 1',  subset: 'OLL', group: 'Dot', alg: "R U2 R2 F R F' U2 R' F R F'" },
  { id: 'OLL-2',  name: 'OLL 2',  subset: 'OLL', group: 'Dot', alg: "F R U R' U' F' f R U R' U' f'" },
  { id: 'OLL-3',  name: 'OLL 3',  subset: 'OLL', group: 'Dot', alg: "f R U R' U' f' U' F R U R' U' F'" },
  { id: 'OLL-4',  name: 'OLL 4',  subset: 'OLL', group: 'Dot', alg: "f R U R' U' f' U F R U R' U' F'" },
  // Cross (edges only)
  { id: 'OLL-17', name: 'OLL 17', subset: 'OLL', group: 'Cross', alg: "F R' F' R2 r' U R U' R' U' M'" },
  { id: 'OLL-18', name: 'OLL 18', subset: 'OLL', group: 'Cross', alg: "r U R' U R U2 r2 U' R U' R' U2 r" },
  { id: 'OLL-19', name: 'OLL 19', subset: 'OLL', group: 'Cross', alg: "r' R U R U R' U' M' R' F R F'" },
  { id: 'OLL-20', name: 'OLL 20', subset: 'OLL', group: 'Cross', alg: "M U R U R' U' M2 U R U' r'" },
  // T
  { id: 'OLL-33', name: 'OLL 33', subset: 'OLL', group: 'T', alg: "R U R' U' R' F R F'" },
  { id: 'OLL-45', name: 'OLL 45', subset: 'OLL', group: 'T', alg: "F R U R' U' F'" },
  // Square
  { id: 'OLL-5',  name: 'OLL 5',  subset: 'OLL', group: 'Square', alg: "r' U2 R U R' U r" },
  { id: 'OLL-6',  name: 'OLL 6',  subset: 'OLL', group: 'Square', alg: "r U2 R' U' R U' r'" },
  // C
  { id: 'OLL-34', name: 'OLL 34', subset: 'OLL', group: 'C', alg: "R U R2 U' R' F R U R U' F'" },
  { id: 'OLL-46', name: 'OLL 46', subset: 'OLL', group: 'C', alg: "R' U' R' F R F' U R" },
  // W
  { id: 'OLL-36', name: 'OLL 36', subset: 'OLL', group: 'W', alg: "R' U' R U' R' U R U R B' R' B" },
  { id: 'OLL-38', name: 'OLL 38', subset: 'OLL', group: 'W', alg: "R U R' U R U' R' U' R' F R F'" },
  // Corners only
  { id: 'OLL-21', name: 'OLL 21', subset: 'OLL', group: 'Corners', alg: "R U2 R' U' R U R' U' R U' R'" },
  { id: 'OLL-22', name: 'OLL 22', subset: 'OLL', group: 'Corners', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'OLL-23', name: 'OLL 23', subset: 'OLL', group: 'Corners', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 'OLL-24', name: 'OLL 24', subset: 'OLL', group: 'Corners', alg: "r U R' U' r' F R F'" },
  { id: 'OLL-25', name: 'OLL 25', subset: 'OLL', group: 'Corners', alg: "F' r U R' U' r' F R" },
  { id: 'OLL-26', name: 'OLL 26 (Anti-Sune)', subset: 'OLL', group: 'Corners', alg: "R U2 R' U' R U' R'" },
  { id: 'OLL-27', name: 'OLL 27 (Sune)',      subset: 'OLL', group: 'Corners', alg: "R U R' U R U2 R'" },
  // P
  { id: 'OLL-31', name: 'OLL 31', subset: 'OLL', group: 'P', alg: "R' U' F U R U' R' F' R" },
  { id: 'OLL-32', name: 'OLL 32', subset: 'OLL', group: 'P', alg: "S R U R' U' R' F R f'" },
  { id: 'OLL-43', name: 'OLL 43', subset: 'OLL', group: 'P', alg: "R' U' F' U F R" },
  { id: 'OLL-44', name: 'OLL 44', subset: 'OLL', group: 'P', alg: "f R U R' U' f'" },
  // F (Fish)
  { id: 'OLL-9',  name: 'OLL 9',  subset: 'OLL', group: 'F', alg: "R U R' U' R' F R2 U R' U' F'" },
  { id: 'OLL-10', name: 'OLL 10', subset: 'OLL', group: 'F', alg: "R U R' U R' F R F' R U2 R'" },
  { id: 'OLL-35', name: 'OLL 35', subset: 'OLL', group: 'F', alg: "R U2 R2 F R F' R U2 R'" },
  { id: 'OLL-37', name: 'OLL 37', subset: 'OLL', group: 'F', alg: "F R' F' R U R U' R'" },
  // S (small lightning / S-shape)
  { id: 'OLL-7',  name: 'OLL 7',  subset: 'OLL', group: 'S', alg: "r U R' U R U2 r'" },
  { id: 'OLL-8',  name: 'OLL 8',  subset: 'OLL', group: 'S', alg: "r' U' R U' R' U2 r" },
  { id: 'OLL-11', name: 'OLL 11', subset: 'OLL', group: 'S', alg: "r' R2 U R' U R U2 R' U M'" },
  { id: 'OLL-12', name: 'OLL 12', subset: 'OLL', group: 'S', alg: "M' R' U' R U' R' U2 R U' M" },
  // L
  { id: 'OLL-13', name: 'OLL 13', subset: 'OLL', group: 'L', alg: "F U R U' R2 F' R U R U' R'" },
  { id: 'OLL-14', name: 'OLL 14', subset: 'OLL', group: 'L', alg: "R' F R U R' F' R F U' F'" },
  { id: 'OLL-15', name: 'OLL 15', subset: 'OLL', group: 'L', alg: "r' U' r R' U' R U r' U r" },
  { id: 'OLL-16', name: 'OLL 16', subset: 'OLL', group: 'L', alg: "r U r' R U R' U' r U' r'" },
  // I
  { id: 'OLL-51', name: 'OLL 51', subset: 'OLL', group: 'I', alg: "f R U R' U' R U R' U' f'" },
  { id: 'OLL-52', name: 'OLL 52', subset: 'OLL', group: 'I', alg: "R U R' U R U' B U' B' R'" },
  { id: 'OLL-55', name: 'OLL 55', subset: 'OLL', group: 'I', alg: "R' F R U R U' R2 F' R2 U' R' U R U R'" },
  { id: 'OLL-56', name: 'OLL 56', subset: 'OLL', group: 'I', alg: "r' U' r U' R' U R U' R' U R r' U r" },
  // Remaining numbered cases
  { id: 'OLL-28', name: 'OLL 28', subset: 'OLL', group: 'Corners', alg: "r U R' U' M U R U' R'" },
  { id: 'OLL-29', name: 'OLL 29', subset: 'OLL', group: 'P',  alg: "R U R' U' R U' R' F' U' F R U R'" },
  { id: 'OLL-30', name: 'OLL 30', subset: 'OLL', group: 'P',  alg: "F R' F R2 U' R' U' R U R' F2" },
  { id: 'OLL-39', name: 'OLL 39', subset: 'OLL', group: 'L',  alg: "R U R' F' U' F U R U2 R'" },
  { id: 'OLL-40', name: 'OLL 40', subset: 'OLL', group: 'L',  alg: "R' F R U R' U' F' U R" },
  { id: 'OLL-41', name: 'OLL 41', subset: 'OLL', group: 'Corners', alg: "R U R' U R U2 R' F R U R' U' F'" },
  { id: 'OLL-42', name: 'OLL 42', subset: 'OLL', group: 'Corners', alg: "R' U' R U' R' U2 R F R U R' U' F'" },
  { id: 'OLL-47', name: 'OLL 47', subset: 'OLL', group: 'I',  alg: "F' L' U' L U F" },
  { id: 'OLL-48', name: 'OLL 48', subset: 'OLL', group: 'I',  alg: "F R U R' U' F'" },
  { id: 'OLL-49', name: 'OLL 49', subset: 'OLL', group: 'I',  alg: "r U' r2 U r2 U r2 U' r" },
  { id: 'OLL-50', name: 'OLL 50', subset: 'OLL', group: 'I',  alg: "r' U r2 U' r2 U' r2 U r'" },
  { id: 'OLL-53', name: 'OLL 53', subset: 'OLL', group: 'W',  alg: "r' U' R U' R' U R U' R' U2 r" },
  { id: 'OLL-54', name: 'OLL 54', subset: 'OLL', group: 'W',  alg: "r U R' U R U' R' U R U2 r'" },
  { id: 'OLL-57', name: 'OLL 57', subset: 'OLL', group: 'Corners',  alg: "R U R' U' M' U R U' r'" },
]

// ─── PLL ──────────────────────────────────────────────────────────────────────
export const PLL: AlgCase[] = [
  // Corners only
  { id: 'PLL-Aa', name: 'Aa-perm', subset: 'PLL', group: 'Corners', probability: '1/18',
    alg: "x R' U R' D2 R U' R' D2 R2" },
  { id: 'PLL-Ab', name: 'Ab-perm', subset: 'PLL', group: 'Corners', probability: '1/18',
    alg: "x R2 D2 R U R' D2 R U' R" },
  { id: 'PLL-E',  name: 'E-perm',  subset: 'PLL', group: 'Corners', probability: '1/36',
    alg: "x' R U' R' D R U R' D' R U R' D R U' R' D'" },
  // Edges only
  { id: 'PLL-Ua', name: 'Ua-perm', subset: 'PLL', group: 'Edges', probability: '1/18',
    alg: "R U' R U R U R U' R' U' R2" },
  { id: 'PLL-Ub', name: 'Ub-perm', subset: 'PLL', group: 'Edges', probability: '1/18',
    alg: "R2 U R U R' U' R' U' R' U R'" },
  { id: 'PLL-H',  name: 'H-perm',  subset: 'PLL', group: 'Edges', probability: '1/72',
    alg: "M2 U M2 U2 M2 U M2" },
  { id: 'PLL-Z',  name: 'Z-perm',  subset: 'PLL', group: 'Edges', probability: '1/36',
    alg: "M' U M2 U M2 U M' U2 M2" },
  // Adjacent corner swap
  { id: 'PLL-Ja', name: 'Ja-perm', subset: 'PLL', group: 'Adjacent', probability: '1/18',
    alg: "x R2 F R F' R U2 r' U r U2" },
  { id: 'PLL-Jb', name: 'Jb-perm', subset: 'PLL', group: 'Adjacent', probability: '1/18',
    alg: "R U R' F' R U R' U' R' F R2 U' R'" },
  { id: 'PLL-T',  name: 'T-perm',  subset: 'PLL', group: 'Adjacent', probability: '1/18',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'PLL-F',  name: 'F-perm',  subset: 'PLL', group: 'Adjacent', probability: '1/18',
    alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: 'PLL-Ra', name: 'Ra-perm', subset: 'PLL', group: 'Adjacent', probability: '1/18',
    alg: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
  { id: 'PLL-Rb', name: 'Rb-perm', subset: 'PLL', group: 'Adjacent', probability: '1/18',
    alg: "R' U2 R U2 R' F R U R' U' R' F' R2" },
  // Diagonal corner swap
  { id: 'PLL-Y',  name: 'Y-perm',  subset: 'PLL', group: 'Diagonal', probability: '1/18',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'PLL-V',  name: 'V-perm',  subset: 'PLL', group: 'Diagonal', probability: '1/18',
    alg: "R' U R' d' R' F' R2 U' R' U R' F R F" },
  { id: 'PLL-Na', name: 'Na-perm', subset: 'PLL', group: 'Diagonal', probability: '1/72',
    alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: 'PLL-Nb', name: 'Nb-perm', subset: 'PLL', group: 'Diagonal', probability: '1/72',
    alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
  // G-perms
  { id: 'PLL-Ga', name: 'Ga-perm', subset: 'PLL', group: 'G-perms', probability: '1/18',
    alg: "R2 U R' U R' U' R U' R2 D U' R' U R D'" },
  { id: 'PLL-Gb', name: 'Gb-perm', subset: 'PLL', group: 'G-perms', probability: '1/18',
    alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { id: 'PLL-Gc', name: 'Gc-perm', subset: 'PLL', group: 'G-perms', probability: '1/18',
    alg: "R2 U' R U' R U R' U R2 D' U R U' R' D" },
  { id: 'PLL-Gd', name: 'Gd-perm', subset: 'PLL', group: 'G-perms', probability: '1/18',
    alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
]

// ─── F2L ──────────────────────────────────────────────────────────────────────
// Basic F2L cases — corner/edge oriented correctly or flipped
export const F2L: AlgCase[] = [
  { id: 'F2L-1',  name: 'F2L 1',  subset: 'F2L', group: 'Basic', alg: "U R U' R'" },
  { id: 'F2L-2',  name: 'F2L 2',  subset: 'F2L', group: 'Basic', alg: "U' F' U F" },
  { id: 'F2L-3',  name: 'F2L 3',  subset: 'F2L', group: 'Basic', alg: "U' R U R' U2 R U' R'" },
  // F2L 4: corner+edge already paired with white facing front — insert directly with R U R'
  { id: 'F2L-4',  name: 'F2L 4',  subset: 'F2L', group: 'Basic', alg: "R U R'" },
  { id: 'F2L-5',  name: 'F2L 5',  subset: 'F2L', group: 'Basic', alg: "R U' R' U R U' R'" },
  { id: 'F2L-6',  name: 'F2L 6',  subset: 'F2L', group: 'Basic', alg: "F' U F U' F' U F" },
  { id: 'F2L-7',  name: 'F2L 7',  subset: 'F2L', group: 'Basic', alg: "U' R U2 R' U2 R U' R'" },
  { id: 'F2L-8',  name: 'F2L 8',  subset: 'F2L', group: 'Basic', alg: "U F' U2 F U2 F' U F" },
  { id: 'F2L-9',  name: 'F2L 9',  subset: 'F2L', group: 'Pair split', alg: "R U R' U' R U R'" },
  { id: 'F2L-10', name: 'F2L 10', subset: 'F2L', group: 'Pair split', alg: "U R U' R' U' F' U F" },
  { id: 'F2L-11', name: 'F2L 11', subset: 'F2L', group: 'Pair split', alg: "R U' R' U F' U F" },
  { id: 'F2L-12', name: 'F2L 12', subset: 'F2L', group: 'Pair split', alg: "R U2 R' U' R U R'" },
  { id: 'F2L-13', name: 'F2L 13', subset: 'F2L', group: 'Pair split', alg: "F' U2 F U F' U' F" },
  { id: 'F2L-14', name: 'F2L 14', subset: 'F2L', group: 'Pair split', alg: "U R U2 R' U R U' R'" },
  { id: 'F2L-15', name: 'F2L 15', subset: 'F2L', group: 'Pair split', alg: "U' F' U2 F U' F' U F" },
  { id: 'F2L-16', name: 'F2L 16', subset: 'F2L', group: 'Pair split', alg: "R U R' U2 F' U' F" },
  { id: 'F2L-17', name: 'F2L 17', subset: 'F2L', group: 'Corner in slot', alg: "R U' R' d R' U2 R U2 R' U R" },
  { id: 'F2L-18', name: 'F2L 18', subset: 'F2L', group: 'Corner in slot', alg: "R U R' U' R U R' U' R U R'" },
  { id: 'F2L-19', name: 'F2L 19', subset: 'F2L', group: 'Corner in slot', alg: "R U' R' U R U2 R' U R U' R'" },
  { id: 'F2L-20', name: 'F2L 20', subset: 'F2L', group: 'Corner in slot', alg: "R U2 R' U R U' R'" },
  { id: 'F2L-21', name: 'F2L 21', subset: 'F2L', group: 'Edge in slot', alg: "R U' R' U' R U R' U' R U R'" },
  { id: 'F2L-22', name: 'F2L 22', subset: 'F2L', group: 'Edge in slot', alg: "U R U' R' U F' U' F" },
  { id: 'F2L-23', name: 'F2L 23', subset: 'F2L', group: 'Edge in slot', alg: "U2 R U R' U R U' R'" },
  { id: 'F2L-24', name: 'F2L 24', subset: 'F2L', group: 'Edge in slot', alg: "U2 F' U' F U' F' U F" },
  { id: 'F2L-25', name: 'F2L 25', subset: 'F2L', group: 'Both in slot', alg: "R U' R' U' R U' R' U R U' R'" },
  { id: 'F2L-26', name: 'F2L 26', subset: 'F2L', group: 'Both in slot', alg: "R U' R' U R U R'" },
  { id: 'F2L-27', name: 'F2L 27', subset: 'F2L', group: 'Both in slot', alg: "R U R' U' U' R U R' U' R U' R'" },
  { id: 'F2L-28', name: 'F2L 28', subset: 'F2L', group: 'Both in slot', alg: "R U' R' U R U R' U' R U' R'" },
  { id: 'F2L-29', name: 'F2L 29', subset: 'F2L', group: 'Both in slot', alg: "R' F R F' R U' R'" },
  { id: 'F2L-30', name: 'F2L 30', subset: 'F2L', group: 'Both in slot', alg: "R U' R' F R' F' R" },
  { id: 'F2L-31', name: 'F2L 31', subset: 'F2L', group: 'Both in slot', alg: "R' F' R U R U' R' F" },
  { id: 'F2L-32', name: 'F2L 32', subset: 'F2L', group: 'Both in slot', alg: "R U R' F' R U' R' F" },
  { id: 'F2L-33', name: 'F2L 33', subset: 'F2L', group: 'Both in slot', alg: "U' R U R' U R U R'" },
  { id: 'F2L-34', name: 'F2L 34', subset: 'F2L', group: 'Both in slot', alg: "U F' U' F U' F' U' F" },
  { id: 'F2L-35', name: 'F2L 35', subset: 'F2L', group: 'Both in slot', alg: "U' R U' R' U R U R'" },
  { id: 'F2L-36', name: 'F2L 36', subset: 'F2L', group: 'Both in slot', alg: "U F' U F U' F' U' F" },
  // TODO: F2L 37 previously had "R U2 R2 U' R2 U' R2 U2 R" which is the OLL-22 algorithm — clearly wrong.
  // F2L 37 (both pieces in slot, corner and edge both incorrectly placed/oriented):
  // standard alg per bestsiteever.net is "R U' R' U2 R U R' U' R U R'"
  { id: 'F2L-37', name: 'F2L 37', subset: 'F2L', group: 'Both in slot', alg: "R U' R' U2 R U R' U' R U R'" },
  { id: 'F2L-38', name: 'F2L 38', subset: 'F2L', group: 'Both in slot', alg: "R U R' U' U' R U' R' U' R U R'" },
  { id: 'F2L-39', name: 'F2L 39', subset: 'F2L', group: 'Both in slot', alg: "R U' R' U U R U R'" },
  { id: 'F2L-40', name: 'F2L 40', subset: 'F2L', group: 'Both in slot', alg: "R U' R' U R U' R' U R U' R'" },
  { id: 'F2L-41', name: 'F2L 41', subset: 'F2L', group: 'Both in slot', alg: "R U R' U' R U R' U' R U R'" },
]

export const ALL_CASES = [...OLL, ...PLL, ...F2L]

export function getGroup(subset: AlgSubset) {
  const src = subset === 'OLL' ? OLL : subset === 'PLL' ? PLL : F2L
  const groups = [...new Set(src.map((c) => c.group))]
  return groups
}
