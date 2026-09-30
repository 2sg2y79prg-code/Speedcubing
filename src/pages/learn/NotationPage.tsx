import { assetUrl } from '../../lib/algsets';

const MOVES: { move: string; img: string; text: string; section: string }[] = [
  { section: 'Face turns', move: "R, R'", img: 'move_R.png', text: "Right layer; front stickers go up. R': down." },
  { section: 'Face turns', move: "L, L'", img: 'move_L.png', text: 'Left layer; front stickers go down (opposite of R, judged from the left).' },
  { section: 'Face turns', move: "U, U'", img: 'move_U.png', text: "Top layer; front stickers go left. U': right." },
  { section: 'Face turns', move: "D, D'", img: 'move_D.png', text: 'Bottom layer; front stickers go right (opposite of U).' },
  { section: 'Face turns', move: "F, F'", img: 'move_F.png', text: 'Front layer like a clock hand; top stickers go right.' },
  { section: 'Face turns', move: "B, B'", img: 'move_B.png', text: 'Back layer; top stickers go left (looks counterclockwise from front).' },
  { section: 'Wide turns', move: "r, r'", img: 'move_r_w.png', text: 'Right two layers, same direction as R (also written Rw).' },
  { section: 'Wide turns', move: "l, l'", img: 'move_l_w.png', text: 'Left two layers, same as L.' },
  { section: 'Wide turns', move: "u, u'", img: 'move_u_w.png', text: 'Top two layers, same as U.' },
  { section: 'Wide turns', move: "d, d'", img: 'move_d_w.png', text: 'Bottom two layers, same as D.' },
  { section: 'Wide turns', move: "f, f'", img: 'move_f_w.png', text: 'Front two layers, same as F.' },
  { section: 'Slice turns', move: "M, M'", img: 'move_M.png', text: 'Middle slice between L and R, turns like L.' },
  { section: 'Slice turns', move: "E, E'", img: 'move_E.png', text: 'Middle slice between U and D, turns like D.' },
  { section: 'Slice turns', move: "S, S'", img: 'move_S.png', text: 'Middle slice between F and B, turns like F.' },
  { section: 'Cube rotations', move: "x, x'", img: 'move_x.png', text: 'Whole cube turns like R.' },
  { section: 'Cube rotations', move: "y, y'", img: 'move_y.png', text: 'Whole cube turns like U (after y, the old right face is now F).' },
  { section: 'Cube rotations', move: "z, z'", img: 'move_z.png', text: 'Whole cube turns like F.' },
];

const SECTIONS = ['Face turns', 'Wide turns', 'Slice turns', 'Cube rotations'];

export function NotationPage() {
  return (
    <>
      <div className="prose">
        <h1>Notation</h1>
        <p>
          A letter means: turn that face 90 degrees <b>clockwise</b>, as if looking straight at that face. An apostrophe (') reverses it.
          A 2 means a half turn (R2 = R twice; direction doesn't matter).
        </p>
        <p>
          Hold <b>white on the bottom</b> (D), <b>yellow on top</b> (U), <b>green facing you</b> (F). In the diagrams, colored stickers are
          the moving layer, gray stay put, and the arrow shows where front stickers travel. Parentheses in an algorithm are only grouping.
        </p>
      </div>
      <figure style={{ margin: '20px 0 0' }}>
        <img className="faces-img" src={assetUrl('assets/notation/faces.png')} alt="Face names: front view shows U, F, R; back view shows U, B, L; D is the bottom" />
        <figcaption className="small muted" style={{ marginTop: 6 }}>
          Front view: U, F, R. Back view: U, B, L. D is the bottom.
        </figcaption>
      </figure>
      <div className="callout small" style={{ marginTop: 20, maxWidth: 760 }}>
        <b>Tip:</b> if a move feels backwards, it's almost always L, D, B, M or E; picture looking straight at that face.
      </div>
      {SECTIONS.map((sec) => (
        <section key={sec}>
          <h2 className="section-title">{sec}</h2>
          <div className="notation-grid">
            {MOVES.filter((m) => m.section === sec).map((m) => (
              <div key={m.move} className="card move-card">
                <img src={assetUrl(`assets/notation/${m.img}`)} alt={`${m.move} diagram`} loading="lazy" />
                <div className="mv">{m.move}</div>
                <p className="small" style={{ color: '#3d3c38' }}>{m.text}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
