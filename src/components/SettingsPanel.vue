<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" @click.self="closePanel">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
      <header class="p-4 border-b flex items-center justify-between">
        <h2 class="text-lg font-semibold">Settings</h2>
        <button @click="closePanel" class="p-2 hover:bg-slate-200 rounded-full">
          <icon-x :size="20"/>
        </button>
      </header>
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold">Use Premium Voice</h3>
            <p class="text-sm text-slate-500">Enable high-quality text-to-speech from Google Cloud.</p>
          </div>
          <button @click="toggleTTS"
                  :class="['w-14 h-8 flex items-center rounded-full p-1 transition-colors', useGoogleTTS ? 'bg-blue-500' : 'bg-slate-300']">
            <span :class="['w-6 h-6 bg-white rounded-full shadow-md transform transition-transform', useGoogleTTS ? 'translate-x-6' : '']"></span>
          </button>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold">Use Premium Speech Recognition</h3>
            <p class="text-sm text-slate-500">Enable high-accuracy speech-to-text from Google Cloud.</p>
          </div>
          <button @click="toggleSTT"
                  :class="['w-14 h-8 flex items-center rounded-full p-1 transition-colors', useGoogleSTT ? 'bg-blue-500' : 'bg-slate-300']">
            <span :class="['w-6 h-6 bg-white rounded-full shadow-md transform transition-transform', useGoogleSTT ? 'translate-x-6' : '']"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgentStore } from '../store/agent';
import { storeToRefs } from 'pinia';

const agentStore = useAgentStore();
const { useGoogleTTS, useGoogleSTT } = storeToRefs(agentStore);

const closePanel = () => {
  agentStore.toggleSettingsPanel();
};

const toggleTTS = () => {
  agentStore.toggleGoogleTTS();
};

const toggleSTT = () => {
    agentStore.toggleGoogleSTT();
};
</script>
