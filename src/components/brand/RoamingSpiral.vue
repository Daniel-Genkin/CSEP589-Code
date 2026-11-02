<script setup>
// The hero spiral bounces around the top of the page like the DVD logo, and stops at
// the floor element (the ticker tape). Every wall hit shifts its colours one square along.
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { prefersReducedMotion } from '@/composables/useReceiptFx'

const props = defineProps({
  floor: { type: Function, required: true }, // returns the element it stops at
})

const SIZE = 632 // wrapper box
const RADIUS = 235 // visible half-extent of the spiral, for edge hits
const SPEED = 170 // px/second
const ANGLE = (40 * Math.PI) / 180

const squares = [
  { d: 'M5.31964 5.31966H374.92V374.92H5.31964V5.31966Z', t: '36s', dir: 'normal' },
  { d: 'M80.354 0L380.239 80.354L299.885 380.239L7.55569e-06 299.885L80.354 0Z', t: '26s', dir: 'reverse' },
  { d: 'M142.771 13.4106L366.829 142.771L237.469 366.829L13.4106 237.469L142.771 13.4106Z', t: '18s', dir: 'normal' },
  { d: 'M190.12 38.5386L341.701 190.12L190.12 341.701L38.5386 190.12L190.12 38.5386Z', t: '13s', dir: 'reverse' },
  { d: 'M221.911 71.4722L308.767 221.911L158.328 308.767L71.4721 158.328L221.911 71.4722Z', t: '9s', dir: 'normal' },
  { d: 'M238.469 106.376L273.863 238.469L141.77 273.863L106.376 141.77L238.469 106.376Z', t: '6.5s', dir: 'reverse' },
  { d: 'M227.08 153.16V227.08H153.16V153.16H227.08Z', t: '5s', dir: 'normal' },
]
const palette = ref(['#F7C54E', '#E85A2A', '#D6472B', '#F07AB6', '#8A6CF2', '#3A2A9E', '#FFF4D6'])

const root = useTemplateRef('root')
let raf

onMounted(() => {
  const parent = root.value.offsetParent
  const scaleFor = () => (window.innerWidth <= 900 ? 0.6 : 1)
  const place = (cx, cy, scale) => {
    const half = (SIZE / 2) * scale
    root.value.style.transform = `translate3d(${cx - half}px, ${cy - half}px, 0) scale(${scale})`
  }

  let cx = parent.clientWidth * 0.7
  let cy = 330
  if (prefersReducedMotion()) {
    place(cx, cy, scaleFor())
    return
  }

  let vx = Math.cos(ANGLE) * SPEED
  let vy = Math.sin(ANGLE) * SPEED
  let last = performance.now()

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now

    const scale = scaleFor()
    const r = RADIUS * scale
    const maxX = parent.clientWidth - r
    const floorEl = props.floor()
    const maxY = (floorEl ? floorEl.offsetTop : parent.clientHeight) - r

    cx += vx * dt
    cy += vy * dt
    let hit = false
    if (cx < r) {
      cx = r
      vx = Math.abs(vx)
      hit = true
    }
    if (cx > maxX) {
      cx = maxX
      vx = -Math.abs(vx)
      hit = true
    }
    if (cy < r) {
      cy = r
      vy = Math.abs(vy)
      hit = true
    }
    if (cy > maxY) {
      cy = Math.max(r, maxY)
      vy = -Math.abs(vy)
      hit = true
    }
    if (hit) palette.value = [...palette.value.slice(1), palette.value[0]]

    place(cx, cy, scale)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div ref="root" class="roamer" aria-hidden="true">
    <div class="roamer__box">
      <svg class="roamer__art" viewBox="0 0 380.239 380.239" width="380" height="380" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          v-for="(sq, i) in squares"
          :key="i"
          class="roamer__sq"
          :d="sq.d"
          :fill="palette[i]"
          :style="{ animationDuration: sq.t, animationDirection: sq.dir }"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.roamer {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  display: grid;
  place-items: center;
  width: 632px;
  height: 632px;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none;
}
.roamer__box {
  display: grid;
  place-items: center;
  width: 560px;
  height: 560px;
  animation: roamer-spin 40s linear infinite;
}
@keyframes roamer-spin {
  from {
    transform: rotate(-8deg);
  }
  to {
    transform: rotate(352deg);
  }
}
.roamer__art {
  overflow: visible;
  animation: roamer-float 6s ease-in-out infinite alternate;
}
@keyframes roamer-float {
  from {
    transform: translate(-14px, 10px) scale(0.95);
  }
  to {
    transform: translate(14px, -10px) scale(1.07);
  }
}
.roamer__sq {
  transform-box: fill-box;
  transform-origin: center;
  transition: fill 0.15s linear;
  animation: roamer-sq 20s linear infinite;
}
@keyframes roamer-sq {
  to {
    transform: rotate(360deg);
  }
}
</style>
