<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { directionsUrl } from '../composables/useMapLink';

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  name: { type: String, default: '' },
  height: { type: String, default: '180px' },
});

const router = useRouter();
const mapEl = ref(null);
let map = null;
let leafletLoaded = false;

async function loadLeaflet() {
  if (window.L) return window.L;
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  await new Promise((resolve) => {
    if (window.L) return resolve();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });
  return window.L;
}

async function initMap() {
  if (props.lat == null || props.lng == null) return;
  const L = await loadLeaflet();
  if (!mapEl.value) return;
  if (map) { map.remove(); map = null; }
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false }).setView([props.lat, props.lng], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  const icon = L.divIcon({
    className: '',
    html: `<div style="background:#FF6B5B;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.3);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-location-dot" style="color:white;font-size:11px"></i></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
  L.marker([props.lat, props.lng], { icon }).addTo(map);
  leafletLoaded = true;
}

onMounted(initMap);
watch(() => [props.lat, props.lng], initMap);
onBeforeUnmount(() => { if (map) { map.remove(); map = null; } });

function openFullMap() {
  const url = directionsUrl({ lat: props.lat, lng: props.lng, label: props.name });
  if (url) window.open(url, '_blank');
}
</script>

<template>
  <div class="relative rounded-2xl overflow-hidden shadow-soft cursor-pointer" :style="{ height }" @click="openFullMap">
    <div ref="mapEl" class="w-full h-full"></div>
    <div class="absolute inset-0 bg-transparent pointer-events-none"></div>
    <div class="absolute top-3 right-3 bg-white rounded-full px-3 py-1.5 shadow-soft text-xs font-bold flex items-center gap-1.5 pointer-events-none">
      <i class="fa-solid fa-diamond-turn-right text-teal-700"></i>
      <span>مسیریابی</span>
    </div>
  </div>
</template>
