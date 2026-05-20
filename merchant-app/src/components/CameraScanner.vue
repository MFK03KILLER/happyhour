<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { BrowserMultiFormatReader } from '@zxing/browser';

const emit = defineEmits(['detected', 'error']);
const videoEl = ref(null);
let reader = null;
let controls = null;

onMounted(async () => {
  try {
    reader = new BrowserMultiFormatReader();
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    const back = devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[0];
    controls = await reader.decodeFromVideoDevice(back?.deviceId, videoEl.value, (result) => {
      if (result) emit('detected', result.getText());
    });
  } catch (err) {
    emit('error', err.message || 'Cannot access camera');
  }
});

onBeforeUnmount(() => {
  if (controls && controls.stop) controls.stop();
});
</script>

<template>
  <div class="relative w-full h-full bg-black overflow-hidden">
    <video ref="videoEl" class="absolute inset-0 w-full h-full object-cover" playsinline muted></video>
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="relative w-72 h-72">
          <div class="absolute inset-0 rounded-3xl border-2 border-white/0">
            <div class="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
            <div class="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
            <div class="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
            <div class="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-3xl"></div>
            <div class="absolute inset-x-4 top-1/2 h-px bg-coral-500 shadow-[0_0_18px_2px_rgba(255,107,91,.8)] animate-laser"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
