type FullState = string[][];

function solvedFull(): FullState {
  return [
    ['Y','Y','Y','Y','Y','Y','Y','Y','Y'], // U
    ['G','G','G','G','G','G','G','G','G'], // F
    ['R','R','R','R','R','R','R','R','R'], // R
    ['B','B','B','B','B','B','B','B','B'], // B
    ['O','O','O','O','O','O','O','O','O'], // L
    ['W','W','W','W','W','W','W','W','W'], // D
  ];
}

// face indices: U=0,F=1,R=2,B=3,L=4,D=5
// sticker index within face: reading order 0-8 (TL,TM,TR,ML,MM,MR,BL,BM,BR)

function rotateFaceCW(f: string[]): string[] {
  return [f[6],f[3],f[0], f[7],f[4],f[1], f[8],f[5],f[2]];
}

function rotateFaceCCW(f: string[]): string[] {
  return [f[2],f[5],f[8], f[1],f[4],f[7], f[0],f[3],f[6]];
}


function cycle4Stickers(
  fs: FullState,
  a: [number,number], b: [number,number], c: [number,number], d: [number,number]
): void {
  const tmp = fs[a[0]][a[1]];
  fs[a[0]][a[1]] = fs[d[0]][d[1]];
  fs[d[0]][d[1]] = fs[c[0]][c[1]];
  fs[c[0]][c[1]] = fs[b[0]][b[1]];
  fs[b[0]][b[1]] = tmp;
}

function cycle4Triple(
  fs: FullState,
  a: [[number,number],[number,number],[number,number]],
  b: [[number,number],[number,number],[number,number]],
  c: [[number,number],[number,number],[number,number]],
  d: [[number,number],[number,number],[number,number]],
): void {
  for (let i = 0; i < 3; i++) {
    cycle4Stickers(fs, a[i], b[i], c[i], d[i]);
  }
}

const U=0, F=1, R=2, B=3, L=4, D=5;

function applyFull(fs: FullState, move: string): void {
  switch (move) {
    case 'U': {
      fs[U] = rotateFaceCW(fs[U]);
      cycle4Triple(fs,
        [[F,0],[F,1],[F,2]],
        [[R,0],[R,1],[R,2]],
        [[B,0],[B,1],[B,2]],
        [[L,0],[L,1],[L,2]],
      );
      break;
    }
    case "U'": {
      fs[U] = rotateFaceCCW(fs[U]);
      cycle4Triple(fs,
        [[F,0],[F,1],[F,2]],
        [[L,0],[L,1],[L,2]],
        [[B,0],[B,1],[B,2]],
        [[R,0],[R,1],[R,2]],
      );
      break;
    }
    case 'U2': applyFull(fs,'U'); applyFull(fs,'U'); break;

    case 'D': {
      fs[D] = rotateFaceCW(fs[D]);
      cycle4Triple(fs,
        [[F,6],[F,7],[F,8]],
        [[L,6],[L,7],[L,8]],
        [[B,6],[B,7],[B,8]],
        [[R,6],[R,7],[R,8]],
      );
      break;
    }
    case "D'": {
      fs[D] = rotateFaceCCW(fs[D]);
      cycle4Triple(fs,
        [[F,6],[F,7],[F,8]],
        [[R,6],[R,7],[R,8]],
        [[B,6],[B,7],[B,8]],
        [[L,6],[L,7],[L,8]],
      );
      break;
    }
    case 'D2': applyFull(fs,'D'); applyFull(fs,'D'); break;

    case 'R': {
      fs[R] = rotateFaceCW(fs[R]);
      // U right col (2,5,8) -> B left col reversed (6,3,0) -> D right col (2,5,8) -> F right col (2,5,8)
      cycle4Triple(fs,
        [[U,2],[U,5],[U,8]],
        [[B,6],[B,3],[B,0]],
        [[D,2],[D,5],[D,8]],
        [[F,2],[F,5],[F,8]],
      );
      break;
    }
    case "R'": {
      fs[R] = rotateFaceCCW(fs[R]);
      cycle4Triple(fs,
        [[U,2],[U,5],[U,8]],
        [[F,2],[F,5],[F,8]],
        [[D,2],[D,5],[D,8]],
        [[B,6],[B,3],[B,0]],
      );
      break;
    }
    case 'R2': applyFull(fs,'R'); applyFull(fs,'R'); break;

    case 'L': {
      fs[L] = rotateFaceCW(fs[L]);
      // U left col (0,3,6) -> F left col (0,3,6) -> D left col (0,3,6) -> B right col reversed (8,5,2)
      cycle4Triple(fs,
        [[U,0],[U,3],[U,6]],
        [[F,0],[F,3],[F,6]],
        [[D,0],[D,3],[D,6]],
        [[B,8],[B,5],[B,2]],
      );
      break;
    }
    case "L'": {
      fs[L] = rotateFaceCCW(fs[L]);
      cycle4Triple(fs,
        [[U,0],[U,3],[U,6]],
        [[B,8],[B,5],[B,2]],
        [[D,0],[D,3],[D,6]],
        [[F,0],[F,3],[F,6]],
      );
      break;
    }
    case 'L2': applyFull(fs,'L'); applyFull(fs,'L'); break;

    case 'F': {
      fs[F] = rotateFaceCW(fs[F]);
      // U bottom row (6,7,8) -> R left col (0,3,6) -> D top row reversed (2,1,0) -> L right col reversed (8,5,2)
      cycle4Triple(fs,
        [[U,6],[U,7],[U,8]],
        [[R,0],[R,3],[R,6]],
        [[D,2],[D,1],[D,0]],
        [[L,8],[L,5],[L,2]],
      );
      break;
    }
    case "F'": {
      fs[F] = rotateFaceCCW(fs[F]);
      cycle4Triple(fs,
        [[U,6],[U,7],[U,8]],
        [[L,8],[L,5],[L,2]],
        [[D,2],[D,1],[D,0]],
        [[R,0],[R,3],[R,6]],
      );
      break;
    }
    case 'F2': applyFull(fs,'F'); applyFull(fs,'F'); break;

    case 'B': {
      fs[B] = rotateFaceCW(fs[B]);
      // U top row (0,1,2) -> L left col reversed (6,3,0) -> D bottom row reversed (8,7,6) -> R right col (2,5,8)
      cycle4Triple(fs,
        [[U,2],[U,1],[U,0]],
        [[R,2],[R,5],[R,8]],
        [[D,6],[D,7],[D,8]],
        [[L,6],[L,3],[L,0]],
      );
      break;
    }
    case "B'": {
      fs[B] = rotateFaceCCW(fs[B]);
      cycle4Triple(fs,
        [[U,2],[U,1],[U,0]],
        [[L,6],[L,3],[L,0]],
        [[D,6],[D,7],[D,8]],
        [[R,2],[R,5],[R,8]],
      );
      break;
    }
    case 'B2': applyFull(fs,'B'); applyFull(fs,'B'); break;

    case 'M': {
      // Middle slice same direction as L (between L and R)
      // U mid col (1,4,7) -> F mid col (1,4,7) -> D mid col (1,4,7) -> B mid col reversed (7,4,1)
      cycle4Triple(fs,
        [[U,1],[U,4],[U,7]],
        [[F,1],[F,4],[F,7]],
        [[D,1],[D,4],[D,7]],
        [[B,7],[B,4],[B,1]],
      );
      break;
    }
    case "M'": {
      cycle4Triple(fs,
        [[U,1],[U,4],[U,7]],
        [[B,7],[B,4],[B,1]],
        [[D,1],[D,4],[D,7]],
        [[F,1],[F,4],[F,7]],
      );
      break;
    }
    case 'M2': applyFull(fs,'M'); applyFull(fs,'M'); break;

    case 'S': {
      // Slice between F and B, same direction as F
      cycle4Triple(fs,
        [[U,3],[U,4],[U,5]],
        [[R,1],[R,4],[R,7]],
        [[D,5],[D,4],[D,3]],
        [[L,7],[L,4],[L,1]],
      );
      break;
    }
    case "S'": {
      cycle4Triple(fs,
        [[U,3],[U,4],[U,5]],
        [[L,7],[L,4],[L,1]],
        [[D,5],[D,4],[D,3]],
        [[R,1],[R,4],[R,7]],
      );
      break;
    }
    case 'S2': applyFull(fs,'S'); applyFull(fs,'S'); break;

    case 'E': {
      // Slice between U and D, same direction as D
      cycle4Triple(fs,
        [[F,3],[F,4],[F,5]],
        [[R,3],[R,4],[R,5]],
        [[B,3],[B,4],[B,5]],
        [[L,3],[L,4],[L,5]],
      );
      break;
    }
    case "E'": {
      cycle4Triple(fs,
        [[F,3],[F,4],[F,5]],
        [[L,3],[L,4],[L,5]],
        [[B,3],[B,4],[B,5]],
        [[R,3],[R,4],[R,5]],
      );
      break;
    }
    case 'E2': applyFull(fs,'E'); applyFull(fs,'E'); break;

    // Wide moves
    case 'r': applyFull(fs,'R'); applyFull(fs,"M'"); break;
    case "r'": applyFull(fs,"R'"); applyFull(fs,'M'); break;
    case 'r2': applyFull(fs,'r'); applyFull(fs,'r'); break;
    case 'l': applyFull(fs,'L'); applyFull(fs,'M'); break;
    case "l'": applyFull(fs,"L'"); applyFull(fs,"M'"); break;
    case 'l2': applyFull(fs,'l'); applyFull(fs,'l'); break;
    case 'u': applyFull(fs,'U'); applyFull(fs,"E'"); break;
    case "u'": applyFull(fs,"U'"); applyFull(fs,'E'); break;
    case 'u2': applyFull(fs,'u'); applyFull(fs,'u'); break;
    case 'd': applyFull(fs,'D'); applyFull(fs,'E'); break;
    case "d'": applyFull(fs,"D'"); applyFull(fs,"E'"); break;
    case 'd2': applyFull(fs,'d'); applyFull(fs,'d'); break;
    case 'f': applyFull(fs,'F'); applyFull(fs,'S'); break;
    case "f'": applyFull(fs,"F'"); applyFull(fs,"S'"); break;
    case 'f2': applyFull(fs,'f'); applyFull(fs,'f'); break;
    case 'b': applyFull(fs,'B'); applyFull(fs,"S'"); break;
    case "b'": applyFull(fs,"B'"); applyFull(fs,'S'); break;
    case 'b2': applyFull(fs,'b'); applyFull(fs,'b'); break;
    default: break;
  }
}

function parseMoves(algStr: string): string[] {
  const moves: string[] = [];
  const tokens = algStr.trim().split(/\s+/);
  for (const tok of tokens) {
    if (!tok) continue;
    moves.push(tok);
  }
  return moves;
}

export function computeLLState(algStr: string): string[] {
  const fs = solvedFull();
  const moves = parseMoves(algStr);
  for (const m of moves) {
    applyFull(fs, m);
  }
  // Extract LL stickers:
  // U face (0-8): fs[U][0..8]
  // F top row (9-11): fs[F][0], fs[F][1], fs[F][2]
  // R top row (12-14): fs[R][0], fs[R][1], fs[R][2]
  // B top row (15-17): fs[B][0], fs[B][1], fs[B][2]
  // L top row (18-20): fs[L][0], fs[L][1], fs[L][2]
  return [
    ...fs[U],
    fs[F][0], fs[F][1], fs[F][2],
    fs[R][0], fs[R][1], fs[R][2],
    fs[B][0], fs[B][1], fs[B][2],
    fs[L][0], fs[L][1], fs[L][2],
  ];
}
