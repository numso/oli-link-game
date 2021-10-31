import { Howl, Howler } from 'howler'
import React from 'react'
import styled, { css, keyframes } from 'styled-components'

const SPEED = 10

const PLAYER_HEIGHT = 150
const PLAYER_WIDTH = (PLAYER_HEIGHT * 556) / 981

const SCORPION_HEIGHT = 100
const SCORPION_WIDTH = (SCORPION_HEIGHT * 823) / 707

const ROCKET_HEIGHT = 200
const ROCKET_WIDTH = (ROCKET_HEIGHT * 410) / 913
const ROCKET_X = window.innerWidth - ROCKET_WIDTH - 30
const ROCKET_Y = (window.innerHeight - ROCKET_HEIGHT) / 2
const ROCKET = { x: ROCKET_X, y: ROCKET_Y, w: ROCKET_WIDTH, h: ROCKET_HEIGHT }

const sounds = {
  ouch: new Howl({ src: ['/ouch.mp3'] }),
  blastoff: new Howl({ src: ['/blastoff.mp3'] }),
  launch: new Howl({ src: ['/launch.mp3'] }),
  walk: new Howl({ src: ['/walk.mp3'] })
}
sounds.walk.loop(true)

function useEnemyPosition (x, y) {
  const [position, setPosition] = React.useState({ x, y })
  const [direction, setDirection] = React.useState(1)

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (position.y > window.innerHeight - SCORPION_HEIGHT) {
        setDirection(-1)
      } else if (position.y < 0) {
        setDirection(1)
      }
      setPosition(prev => ({
        x: prev.x,
        y: prev.y + (direction * SPEED) / 3
      }))
    }, 1000 / 60)
    return () => clearInterval(interval)
  }, [position, direction])
  return [position, direction]
}

function useEnemyPositionH (x, y) {
  const [position, setPosition] = React.useState({ x, y })
  const [direction, setDirection] = React.useState(1)

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (position.x > window.innerWidth - SCORPION_WIDTH) {
        setDirection(-1)
      } else if (position.x < 0) {
        setDirection(1)
      }
      setPosition(prev => ({
        x: prev.x + (direction * SPEED) / 3,
        y: prev.y
      }))
    }, 1000 / 60)
    return () => clearInterval(interval)
  }, [position, direction])
  return [position, direction]
}

function useKeys () {
  const keys = React.useRef({})
  React.useEffect(() => {
    const handleKeyDown = e => (keys.current[e.key] = true)
    const handleKeyUp = e => (keys.current[e.key] = false)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  return keys
}

function usePlayerPosition (keys, health) {
  const [position, setPosition] = React.useState({
    x: 30,
    y: (window.innerHeight - PLAYER_HEIGHT) / 2
  })
  React.useEffect(() => {
    if (health <= 0) return
    const interval = setInterval(() => {
      let moving = false
      if (keys.current.ArrowUp) {
        moving = true
        setPosition(prev => ({
          x: prev.x,
          y: Math.max(0, prev.y - SPEED)
        }))
      }
      if (keys.current.ArrowDown) {
        moving = true
        setPosition(prev => ({
          x: prev.x,
          y: Math.min(window.innerHeight - PLAYER_HEIGHT, prev.y + SPEED)
        }))
      }
      if (keys.current.ArrowLeft) {
        moving = true
        setPosition(prev => ({
          x: Math.max(0, prev.x - SPEED),
          y: prev.y
        }))
      }
      if (keys.current.ArrowRight) {
        moving = true
        setPosition(prev => ({
          x: Math.min(window.innerWidth - PLAYER_WIDTH, prev.x + SPEED),
          y: prev.y
        }))
      }
      if (moving && !sounds.walk.playing()) sounds.walk.play()
      if (!moving && sounds.walk.playing()) sounds.walk.stop()
    }, 1000 / 60)
    return () => clearInterval(interval)
  }, [health])
  return position
}

function useEnterRocket (keys, { x, y }) {
  const [enterRocket, setEnterRocket] = React.useState(false)
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (
        !enterRocket &&
        keys.current[' '] &&
        collides(ROCKET, { x, y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT })
      ) {
        setEnterRocket(true)
        sounds.blastoff.play()
        setTimeout(() => {
          sounds.launch.play()
          setTimeout(() => window.location.reload(), 3000)
        }, 3000)
      }
    }, 1000 / 60)
    return () => clearInterval(interval)
  }, [x, y, enterRocket])
  return enterRocket
}

function collides (a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  )
}

export default () => {
  const keys = useKeys()
  const [health, setHealth] = React.useState(3)
  const [invulnerable, setInvulnerable] = React.useState(false)
  const position = usePlayerPosition(keys, health)
  const inRocket = useEnterRocket(keys, position)
  const [enemyPosition, enemyDirection] = useEnemyPosition(
    window.innerWidth / 3,
    200
  )
  const [enemyPosition2, enemyDirection2] = useEnemyPosition(
    (window.innerWidth / 3) * 2,
    window.innerHeight - SCORPION_HEIGHT
  )
  const [enemyPosition3, enemyDirection3] = useEnemyPositionH(
    (window.innerWidth - SCORPION_WIDTH) / 2,
    window.innerHeight - SCORPION_HEIGHT - 100
  )

  React.useEffect(() => {
    if (
      !inRocket &&
      !invulnerable &&
      health > 0 &&
      (collides(
        { ...position, w: PLAYER_WIDTH, h: PLAYER_HEIGHT },
        { ...enemyPosition, w: SCORPION_WIDTH, h: SCORPION_HEIGHT }
      ) ||
        collides(
          { ...position, w: PLAYER_WIDTH, h: PLAYER_HEIGHT },
          { ...enemyPosition2, w: SCORPION_WIDTH, h: SCORPION_HEIGHT }
        ) ||
        collides(
          { ...position, w: PLAYER_WIDTH, h: PLAYER_HEIGHT },
          { ...enemyPosition3, w: SCORPION_WIDTH, h: SCORPION_HEIGHT }
        ))
    ) {
      setHealth(prev => Math.max(0, prev - 1))
      setInvulnerable(true)
      sounds.ouch.play()
      setTimeout(() => setInvulnerable(false), 2000)
    }
  }, [inRocket, invulnerable, position, enemyPosition, health])

  React.useEffect(() => {
    if (health <= 0) {
      sounds.walk.stop()
      setTimeout(() => window.location.reload(), 3000)
    }
  }, [health])

  return (
    <div>
      <Instructions>
        <p>Use the arrow keys to move the player</p>
        <p>Press the spacebar to enter the rocketship</p>
        <p>Avoid the enemy</p>
      </Instructions>
      {!inRocket && (
        <Player
          position={position}
          invulnerable={invulnerable}
          dead={health === 0}
        />
      )}
      <ScorpionV position={enemyPosition} direction={enemyDirection} />
      <ScorpionV position={enemyPosition2} direction={enemyDirection2} />
      <ScorpionH position={enemyPosition3} direction={enemyDirection3} />
      <Rocket launching={inRocket} position={{ x: ROCKET_X, y: ROCKET_Y }} />
      <HealthBar>
        <Health filled={health >= 1} />
        <Health filled={health >= 2} />
        <Health filled={health >= 3} />
      </HealthBar>
    </div>
  )
}

const flash = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`

const Player = styled.img.attrs({ src: '/knight.png' })`
  position: absolute;
  top: ${props => props.position.y}px;
  left: ${props => props.position.x}px;
  height: ${PLAYER_HEIGHT}px;
  transform: ${props => (props.dead ? 'rotate(-90deg)' : 'none')};
  transition: transform 0.5s;
  ${props =>
    props.invulnerable &&
    css`
      animation: 500ms ${flash} infinite alternate;
    `}
`

const Scorpion = styled.img.attrs({ src: '/scorpion.png' })`
  position: absolute;
  top: ${props => props.position.y}px;
  left: ${props => props.position.x}px;
  height: ${SCORPION_HEIGHT}px;
`

const ScorpionV = styled(Scorpion)`
  transform: scaleY(${props => -props.direction}) rotate(90deg);
`

const ScorpionH = styled(Scorpion)`
  transform: scaleX(${props => -props.direction});
`

const Rocket = styled.img.attrs({ src: '/rocket.png' })`
  position: absolute;
  top: ${props => props.position.y}px;
  left: ${props => props.position.x}px;
  height: ${ROCKET_HEIGHT}px;
  transition: all 2.5s ease-in-out;
  transition-delay: 3s;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55);
  top: ${props =>
    props.launching ? -(ROCKET_HEIGHT * 3) : props.position.y}px;
`

const Instructions = styled.div`
  color: rgba(0, 0, 0, 0.5);
`

const HealthBar = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
`

const Health = styled.img.attrs(props => ({
  src: props.filled ? '/health-full.png' : '/health-empty.png'
}))`
  height: 60px;
  padding: 0 5px;
`
