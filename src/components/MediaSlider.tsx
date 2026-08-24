import { useState } from 'react'
const focusByState: Record<string, string[]> = { Product: ['react', 'typescript'], Matchmaking: ['redis', 'express'], Video: ['livekit', 'webrtc', 'redis'], Infrastructure: ['docker', 'linux'], 'Data model': ['postgres'], System: ['node', 'typescript'] }
export default function MediaSlider({ states, onEmphasis }: { states: string[]; onEmphasis: (ids: string[]) => void }) {
  const [current, setCurrent] = useState(0)
  const choose = (index: number) => { setCurrent(index); onEmphasis(focusByState[states[index]] ?? []) }
  return <div className="media-slider" aria-label="Project system views"><div className={`media-panel state-${current % 4}`}><span className="media-coordinate">SYSTEM VIEW / {String(current + 1).padStart(2, '0')}</span><strong>{states[current]}</strong><i></i><b></b></div><div className="media-tabs" role="tablist">{states.map((state, index) => <button key={state} role="tab" aria-selected={index === current} onClick={() => choose(index)}>{state}</button>)}</div></div>
}
