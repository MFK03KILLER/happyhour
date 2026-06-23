<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  pins: { type: Array, default: () => [] },
  center: { type: Object, default: () => ({ lat: 37.7749, lng: -122.4194 }) },
  zoom: { type: Number, default: 14 },
  dark: { type: Boolean, default: false },
  userLocation: { type: Object, default: null },
  selectedId: { type: [String, null], default: null },
});
const emit = defineEmits(['pin-click', 'map-ready']);

const mapEl = ref(null);
let mapInstance = null;
let markerLayer = null;
let userMarker = null;

function pinIcon(p, selected) {
  const color = p.kind === 'surprise_bag' ? '#FF6B5B' : '#0E5C5C';
  const size = selected ? 48 : 38;
  const icon = p.icon || '📍';
  const html = `<div style="
    width:${size}px;height:${size}px;border-radius:9999px;
    background:${selected ? color : '#ffffff'};
    border:2.5px solid ${color};
    box-shadow:0 5px 16px rgba(0,0,0,.28);
    display:flex;align-items:center;justify-content:center;
    font-size:${selected ? 22 : 17}px;line-height:1;cursor:pointer;
  ">${icon}</div>`;
  return L.divIcon({ html, className: 'hh-pin', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function userIcon() {
  return L.divIcon({
    html: '<div class="hh-userdot"><span class="hh-userpulse"></span></div>',
    className: 'hh-user', iconSize: [22, 22], iconAnchor: [11, 11],
  });
}

function renderPins() {
  if (!mapInstance) return;
  if (markerLayer) markerLayer.clearLayers();
  markerLayer = L.layerGroup().addTo(mapInstance);
  props.pins.forEach((p) => {
    if (p.lat == null || p.lng == null) return;
    const selected = props.selectedId && p.id === props.selectedId;
    const marker = L.marker([p.lat, p.lng], { icon: pinIcon(p, selected), zIndexOffset: selected ? 1000 : 0 });
    marker.on('click', () => emit('pin-click', p));
    marker.addTo(markerLayer);
  });
}

function renderUser() {
  if (!mapInstance) return;
  if (userMarker) { mapInstance.removeLayer(userMarker); userMarker = null; }
  if (props.userLocation && props.userLocation.lat != null) {
    userMarker = L.marker([props.userLocation.lat, props.userLocation.lng],
      { icon: userIcon(), zIndexOffset: 2000, interactive: false }).addTo(mapInstance);
  }
}

// Exposed to the parent (recenter button / row taps)
function recenter(zoom) {
  const u = props.userLocation;
  if (mapInstance && u && u.lat != null) mapInstance.flyTo([u.lat, u.lng], zoom || 14, { duration: 0.6 });
}
function focus(lat, lng) {
  if (mapInstance && lat != null) mapInstance.flyTo([lat, lng], 16, { duration: 0.5 });
}
defineExpose({ recenter, focus });

onMounted(() => {
  const c = (props.userLocation && props.userLocation.lat != null) ? props.userLocation : props.center;
  mapInstance = L.map(mapEl.value, { zoomControl: false, attributionControl: true })
    .setView([c.lat, c.lng], props.zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
  const tileUrl = props.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  L.tileLayer(tileUrl, { maxZoom: 20, attribution: '© OpenStreetMap, © CARTO' }).addTo(mapInstance);
  renderPins();
  renderUser();
  emit('map-ready');
});

onBeforeUnmount(() => { if (mapInstance) mapInstance.remove(); });
watch(() => props.pins, renderPins, { deep: true });
watch(() => props.selectedId, renderPins);
watch(() => props.userLocation, renderUser, { deep: true });
</script>

<template>
  <div ref="mapEl" class="w-full h-full"></div>
</template>

<style>
.leaflet-container { background: #e8eaed; }
.leaflet-control-attribution { font-size: 9px !important; opacity: 0.55; }
.leaflet-control-zoom a { border-radius: 10px !important; }
.hh-userdot {
  width: 22px; height: 22px; border-radius: 9999px;
  background: #2563EB; border: 3px solid #fff; position: relative;
  box-shadow: 0 0 0 2px rgba(37,99,235,.35), 0 2px 8px rgba(0,0,0,.3);
}
.hh-userpulse {
  position: absolute; inset: -9px; border-radius: 9999px;
  background: rgba(37,99,235,.22); animation: hh-pulse 2s ease-out infinite;
}
@keyframes hh-pulse {
  0% { transform: scale(.55); opacity: .8; }
  100% { transform: scale(1.9); opacity: 0; }
}
</style>
