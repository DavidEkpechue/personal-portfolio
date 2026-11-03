// A brass astrolabe behind the constellation: a graduated limb with an
// engraved inscription set on a circle (after React Bits CircularText) and a
// ring of twelve marks. Pure SVG; the limb turns slowly with a CSS transform.
const ticks = Array.from({ length: 72 }, (_, index) => index)
const sigils = Array.from({ length: 12 }, (_, index) => index)
const inscription = 'David Ekpechue ✦ Software engineer ✦ Ireland ✦ Systems, interfaces and the infrastructure beneath both ✦ '

function Sigil({ index }: { index: number }) {
  // Twelve small marks in three alternating shapes, drawn rather than typed.
  const shape = index % 3
  if (shape === 0) return <path d="M0 -5 4 0 0 5 -4 0Z" />
  if (shape === 1) return <><circle r="3.4" /><circle r="1" className="astrolabe-fill" /></>
  return <path d="M0 -4.5 4 3 -4 3Z" />
}

export default function Astrolabe() {
  return <div className="astrolabe" aria-hidden="true">
    <svg viewBox="-300 -300 600 600">
      <defs><path id="astrolabe-inscription" d="M0 -238 A238 238 0 1 1 -.01 -238" /></defs>
      <g className="astrolabe-limb">
        <circle r="262" />
        <circle r="222" />
        {ticks.map(index => <line key={index} y1={-262} y2={index % 6 === 0 ? -248 : -255} transform={`rotate(${index * 5})`} />)}
        <text textLength={1490} lengthAdjust="spacing"><textPath href="#astrolabe-inscription" startOffset="0" textLength={1490} lengthAdjust="spacing">{inscription}</textPath></text>
      </g>
      <g className="astrolabe-rete">
        {sigils.map(index => <g key={index} transform={`rotate(${index * 30}) translate(0 -194)`}><Sigil index={index} /></g>)}
      </g>
    </svg>
  </div>
}
