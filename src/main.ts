import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'
import App from './App.vue'

// Import all icon components
import IconUser from './components/IconUser.vue';
import IconBot from './components/IconBot.vue';
import IconMic from './components/IconMic.vue';
import IconSend from './components/IconSend.vue';
import IconBrainCircuit from './components/IconBrainCircuit.vue';
import IconClock from './components/IconClock.vue';
import IconSparkles from './components/IconSparkles.vue';
import IconVolume2 from './components/IconVolume2.vue';
import IconVolumeX from './components/IconVolumeX.vue';
import IconPaperclip from './components/IconPaperclip.vue';
import IconX from './components/IconX.vue';
import IconPlus from './components/IconPlus.vue';
import IconTrash from './components/IconTrash.vue';
import IconMenu from './components/IconMenu.vue';
import IconSearch from './components/IconSearch.vue';
import IconEdit from './components/IconEdit.vue';
import IconEditPencil from './components/IconEditPencil.vue';
import IconSettings from './components/IconSettings.vue';


const app = createApp(App);
const pinia = createPinia();

// --- LOCAL STORAGE PLUGIN FOR PINIA ---
// This plugin will automatically save the state of the agent store to local storage
// whenever a change is made. This is more robust than manual saving.
pinia.use(({ store }) => {
  store.$subscribe((_, state) => { // FIX: The 'mutation' parameter is unused, so we replace it with '_'
    // We only want to persist the 'threads' state.
    const dataToSave = {
        threads: state.threads
    };
    localStorage.setItem('friday-threads', JSON.stringify(dataToSave));
  });
});


app.use(pinia);

// Register icons globally
app.component('icon-user', IconUser);
app.component('icon-bot', IconBot);
app.component('icon-mic', IconMic);
app.component('icon-send', IconSend);
app.component('icon-brain-circuit', IconBrainCircuit);
app.component('icon-clock', IconClock);
app.component('icon-sparkles', IconSparkles);
app.component('icon-volume-2', IconVolume2);
app.component('icon-volume-x', IconVolumeX);
app.component('icon-paperclip', IconPaperclip);
app.component('icon-x', IconX);
app.component('icon-plus', IconPlus);
app.component('icon-trash', IconTrash);
app.component('icon-menu', IconMenu);
app.component('icon-search', IconSearch);
app.component('icon-edit', IconEdit);
app.component('icon-edit-pencil', IconEditPencil);
app.component('icon-settings', IconSettings);

app.mount('#app');
