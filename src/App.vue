<template>
  <div class="flex h-full w-full bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="w-full md:w-1/3 h-full flex flex-col border-r border-slate-200">
      <header class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
        <h1 class="text-xl font-bold text-slate-700">Friday</h1>
        <div class="flex items-center space-x-4">
          <button @click="summarize" :disabled="agentStatus !== 'idle' || conversation.length <= 1" class="flex items-center space-x-2 text-sm bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-600 font-semibold py-1 px-3 rounded-full transition">
            <icon-sparkles class="text-amber-500" /><span>Summarize</span>
          </button>
          <button @click="toggleMute" class="p-2 rounded-full hover:bg-slate-200 transition" :title="isMuted ? 'Unmute' : 'Mute'">
            <icon-volume-x v-if="isMuted" class="text-slate-500" />
            <icon-volume-2 v-else class="text-slate-700" />
          </button>
        </div>
      </header>
      <div ref="chatLog" class="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div v-for="message in conversation" :key="message.id" :class="['flex mb-4', message.from === 'user' ? 'justify-end' : 'justify-start']" class="assistant-bubble">
          <div :class="['rounded-2xl p-3 max-w-sm', message.from === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800']">
             <div class="flex items-start space-x-2">
               <icon-user v-if="message.from === 'user'" class="mt-1 flex-shrink-0 text-white" />
               <icon-bot v-else class="mt-1 flex-shrink-0 text-slate-500" />
               <div class="w-full">
                 <div v-if="message.file" class="mb-2">
                   <img v-if="message.file.type.startsWith('image/')" :src="message.file.previewUrl" class="rounded-lg max-w-full h-auto" />
                   <audio v-if="message.file.type.startsWith('audio/')" :src="message.file.previewUrl" controls class="w-full"></audio>
                 </div>
                 <div :class="['text-sm', 'prose', 'max-w-none', message.from === 'user' ? 'prose-invert' : '']" v-html="renderMarkdown(message.text)"></div>
               </div>
                <button v-if="message.from === 'assistant'" @click="speakText(message.text)" class="ml-2 p-1 text-slate-400 hover:text-slate-600 transition flex-shrink-0">
                  <icon-volume-2 :size="16" />
                </button>
             </div>
          </div>
        </div>
        <div v-if="agentStatus !== 'idle'" class="flex justify-start mb-4"><div class="bg-slate-200 text-slate-800 rounded-2xl p-3 rounded-bl-none"><div class="flex items-center space-x-2"><icon-bot class="text-slate-500" /><p class="text-sm italic animate-pulse">{{ statusMessage }}</p></div></div></div>
        <div v-if="suggestedQuestions.length > 0 && agentStatus === 'idle'" class="flex flex-col items-start space-y-2 mt-4">
          <button v-for="q in suggestedQuestions" :key="q" @click="askSuggestion(q)" class="suggestion-chip bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full hover:bg-slate-200 transition">{{ q }}</button>
        </div>
      </div>
      <footer class="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <div v-if="activeFile" class="px-1 pb-2">
          <div class="flex items-center justify-between bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            <span class="truncate">Context: {{ activeFile.name }}</span>
            <button @click="clearFile" class="ml-2 p-1 rounded-full hover:bg-blue-200 flex-shrink-0" title="Clear file context">
              <icon-x :size="14" />
            </button>
          </div>
        </div>
        <div class="flex items-center bg-white rounded-full border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <input type="file" ref="fileInput" @change="onFileSelected" class="hidden" accept="image/*,audio/*">
          <button @click="triggerFileInput" class="p-3 text-slate-500 hover:text-blue-600 transition">
            <icon-paperclip />
          </button>
          <input type="text" v-model="userInput" @keyup.enter="submit" placeholder="Ask about the file or anything else..." class="w-full bg-transparent py-2 text-sm text-slate-700 outline-none" :disabled="agentStatus !== 'idle'">
          <button @click="toggleVoice" :class="['p-3 rounded-full m-1 transition', agentStatus === 'listening' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-slate-300']" :disabled="agentStatus === 'thinking'"><icon-mic /></button>
          <button @click="submit" class="p-3 bg-blue-500 text-white rounded-full m-1 hover:bg-blue-600 transition disabled:bg-slate-300" :disabled="agentStatus !== 'idle' || !userInput"><icon-send /></button>
        </div>
      </footer>
    </div>
    <!-- Display Panel -->
    <div class="hidden md:flex md:w-2/3 h-full flex-col">
       <header class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
        <h2 class="text-xl font-bold text-slate-700">{{ displayContent.title }}</h2>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2 text-sm text-slate-500">
            <icon-clock v-if="displayContent.type === 'reminders'"/><icon-brain-circuit v-else />
            <span>{{ displayContent.type === 'reminders' ? 'Reminders' : 'Markdown' }}</span>
          </div>
          <button @click="toggleDisplayMode" class="text-sm bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold py-1 px-3 rounded-full transition">
            {{ displayMode === 'rendered' ? 'View Raw' : 'View Rendered' }}
          </button>
        </div>
       </header>
      <div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div v-if="displayMode === 'rendered'" class="prose prose-slate max-w-none" v-html="renderMarkdown(displayContent.content)"></div>
        <pre v-else class="raw-markdown"><code>{{ displayContent.content }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useAgentStore } from './store/agent';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/plugins/autoloader/prism-autoloader';
Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';

const agentStore = useAgentStore();

const { 
  conversation,
  agentStatus, 
  displayContent, 
  suggestedQuestions, 
  displayMode,
  isMuted,
  activeFile
} = storeToRefs(agentStore);

const userInput = ref('');
const chatLog = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => agentStore.agentStatus = 'listening';
  recognition.onend = () => agentStore.agentStatus = 'idle';
  recognition.onerror = (event: any) => {
    agentStore.agentStatus = 'idle';
    console.error('Speech error', event.error);
    if (event.error === 'not-allowed') {
      agentStore.micPermission = 'denied';
      agentStore.addMessage('assistant', "Microphone access was denied. Please allow it in your browser's site settings.");
    } else {
      agentStore.addMessage('assistant', `An unexpected speech error occurred: ${event.error}`);
    }
  };
  recognition.onresult = (event: any) => {
    userInput.value = event.results[0][0].transcript;
    submit();
  };
}

const toggleVoice = async () => {
  agentStore.stopAudio();
  if (!recognition) {
    agentStore.addMessage('assistant', "Voice recognition not supported.");
    return;
  }
  if (agentStatus.value === 'listening') {
    recognition.stop();
    return;
  }
  if (navigator.permissions) {
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (permissionStatus.state === 'denied') {
      agentStore.addMessage('assistant', "Microphone access is blocked. Please enable it in your browser's site settings.");
      return;
    }
  }
  recognition.start();
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    agentStore.handleFileUpload(file, userInput.value);
    userInput.value = '';
    if(fileInput.value) fileInput.value.value = '';
  }
};

const submit = () => {
  if (!userInput.value.trim() || agentStatus.value !== 'idle') return;
  agentStore.handleUserInput(userInput.value);
  userInput.value = '';
};
const summarize = () => { agentStore.summarizeConversation(); };
const askSuggestion = (question: string) => { agentStore.handleUserInput(question); };
const renderMarkdown = (text: string) => marked.parse(text || '');
const statusMessage = computed(() => {
  const messages: { [key: string]: string } = {
    listening: 'Listening...',
    thinking: 'Thinking...'
  };
  return messages[agentStatus.value] || '';
});
const toggleDisplayMode = () => {
  agentStore.displayMode = agentStore.displayMode === 'rendered' ? 'raw' : 'rendered';
  nextTick(() => {
    Prism.highlightAll();
  });
};

const speakText = (text: string) => {
    agentStore.speak(text);
};

const toggleMute = () => {
    agentStore.toggleMute();
};

const clearFile = () => {
    agentStore.clearActiveFile();
};

const scrollToBottom = () => {
  nextTick(() => {
    chatLog.value?.scrollTo({ top: chatLog.value.scrollHeight, behavior: 'smooth' });
    Prism.highlightAll();
  });
};

watch(conversation, scrollToBottom, { deep: true });
onMounted(scrollToBottom);

</script>

<style>
/* Additional styles can go here if needed */
</style>
