<template>
  <div class="h-full w-full p-0 sm:p-4 bg-slate-100">
    <div class="flex h-full w-full max-w-screen-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <!-- Collapsible Thread Sidebar -->
      <div class="flex flex-shrink-0 bg-slate-100 border-r border-slate-200">
        <!-- Always-Visible Icon Bar -->
        <div :class="['flex flex-col items-center p-2 space-y-4 transition-colors duration-300', newThreadCue ? 'bg-blue-100' : '']">
          <button @click="toggleSidebar" class="p-2 hover:bg-slate-200 rounded-full text-slate-600">
            <icon-menu :size="20" />
          </button>
          <button v-if="!isSidebarOpen" @click="startNewThread" class="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 transition" title="New Chat">
            <icon-edit :size="20" />
          </button>
          <div class="flex-grow"></div> <!-- Spacer -->
          <button @click="handleSettingsClick" class="p-2 hover:bg-slate-200 rounded-full text-slate-600">
            <icon-settings :size="20" />
          </button>
        </div>

        <!-- Collapsible Panel Content -->
        <div v-if="isSidebarOpen" class="w-64 flex flex-col p-2 space-y-4 border-l border-slate-200">
          <div class="flex items-center justify-between flex-shrink-0 px-2">
            <h2 class="text-lg font-semibold text-slate-800">Threads</h2>
            <button class="p-2 hover:bg-slate-200 rounded-full text-slate-600">
               <icon-search :size="20" />
            </button>
          </div>
           <button @click="startNewThread" class="w-full text-sm font-semibold bg-slate-200 text-slate-700 rounded-md px-4 py-2 hover:bg-slate-300 transition">
              <span class="flex items-center justify-center"><icon-edit :size="16" class="mr-2"/>New chat</span>
            </button>
          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            <h3 class="px-4 text-sm font-semibold text-slate-500 mt-2">Recent</h3>
            <ul>
              <li v-for="thread in threads" :key="thread.id" class="group">
                <div :class="['w-full text-left pr-2 pl-4 py-2 text-sm flex items-center justify-between rounded-md', activeThreadId === thread.id ? 'bg-slate-200' : 'hover:bg-slate-200/70']">
                  <button @click="loadThread(thread.id)" :class="['flex-grow text-left truncate', activeThreadId === thread.id ? 'text-slate-800 font-semibold' : 'text-slate-600']">
                    <span v-if="editingThreadId !== thread.id" @dblclick="startEditingTitle(thread)" class="truncate">{{ thread.title }}</span>
                    <input v-else
                           :ref="el => { if (el) titleInputRefs[thread.id] = el as HTMLInputElement }"
                           type="text"
                           v-model="editingTitle"
                           @keyup.enter="saveTitle(thread.id)"
                           @blur="saveTitle(thread.id)"
                           class="bg-white w-full -m-1 p-1 rounded border border-blue-500 text-slate-800 font-semibold" />
                  </button>
                  <div class="flex items-center flex-shrink-0 ml-2">
                      <button @click.stop="startEditingTitle(thread)" class="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-300 text-slate-500 transition">
                        <icon-edit-pencil :size="14" />
                      </button>
                      <button @click.stop="deleteThread(thread.id)" class="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-200 text-red-500 transition">
                        <icon-trash :size="14" />
                      </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div class="p-2 border-t border-slate-200 space-y-2">
             <button @click="clearAllThreads" class="w-full flex items-center text-sm text-red-600 hover:bg-red-100 rounded-md p-2 transition disabled:opacity-50" :disabled="threads.length <= 1">
                <icon-trash :size="16" class="mr-2" />
                <span>Clear all threads</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex-1 flex flex-col" v-if="activeThread">
        <div class="w-full flex h-full">
          <div class="w-full lg:w-1/3 h-full flex flex-col border-r border-slate-200">
            <header class="p-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
              <h1 class="text-xl font-bold text-slate-700">Friday</h1>
              <div class="flex items-center space-x-4">
                <button @click="summarize" :disabled="agentStatus !== 'idle' || activeThread.conversation.length <= 1" class="flex items-center space-x-2 text-sm bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-600 font-semibold py-1 px-3 rounded-full transition">
                  <icon-sparkles class="text-amber-500" /><span>Summarize</span>
                </button>
                <button @click="toggleMute" class="p-2 rounded-full hover:bg-slate-200 transition" :title="isMuted ? 'Unmute' : 'Mute'">
                  <icon-volume-x v-if="isMuted" class="text-slate-500" />
                  <icon-volume-2 v-else class="text-slate-700" />
                </button>
              </div>
            </header>
            <div ref="chatLog" class="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white">
              <div v-for="message in activeThread.conversation" :key="message.id" :class="['flex mb-4', message.from === 'user' ? 'justify-end' : 'justify-start']" class="assistant-bubble">
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
                      <button v-if="message.from === 'assistant'" @click="agentStore.speak(message.text)" class="ml-2 p-1 text-slate-400 hover:text-slate-600 transition flex-shrink-0">
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
            <footer class="p-4 border-t border-slate-200 bg-white flex-shrink-0">
              <div v-if="activeThread.activeFile" class="px-1 pb-2">
                <div class="flex items-center justify-between bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                  <span class="truncate">Context: {{ activeThread.activeFile.name }}</span>
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
             <header class="p-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
              <h2 class="text-xl font-bold text-slate-700">{{ activeThread.displayContent.title }}</h2>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2 text-sm text-slate-500">
                  <icon-clock v-if="activeThread.displayContent.type === 'reminders'"/><icon-brain-circuit v-else />
                  <span>{{ activeThread.displayContent.type === 'reminders' ? 'Reminders' : 'Markdown' }}</span>
                </div>
                <button @click="toggleDisplayMode" class="text-sm bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold py-1 px-3 rounded-full transition">
                  {{ displayMode === 'rendered' ? 'View Raw' : 'View Rendered' }}
                </button>
              </div>
             </header>
            <div class="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
              <div v-if="displayMode === 'rendered'" class="prose prose-slate mx-auto" v-html="renderMarkdown(activeThread.displayContent.content)"></div>
              <pre v-else class="raw-markdown max-w-prose mx-auto w-full"><code>{{ activeThread.displayContent.content }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Settings Panel Overlay -->
    <SettingsPanel v-if="isSettingsOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useAgentStore } from './store/agent';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/plugins/autoloader/prism-autoloader';
import SettingsPanel from './components/SettingsPanel.vue';

Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';

const agentStore = useAgentStore();

const { 
  threads,
  activeThreadId,
  agentStatus, 
  suggestedQuestions, 
  displayMode,
  isMuted,
  isSettingsOpen
} = storeToRefs(agentStore);

const isSidebarOpen = ref(true);
const activeThread = computed(() => agentStore.activeThread);
const userInput = ref('');
const chatLog = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const editingThreadId = ref<number | null>(null);
const editingTitle = ref('');
const titleInputRefs = ref<Record<number, HTMLInputElement>>({});
const newThreadCue = ref(false);

const startEditingTitle = (thread: any) => {
  editingThreadId.value = thread.id;
  editingTitle.value = thread.title;
  nextTick(() => {
    titleInputRefs.value[thread.id]?.focus();
  });
};

const saveTitle = (threadId: number) => {
  if (editingThreadId.value === threadId) {
    agentStore.updateThreadTitle(threadId, editingTitle.value);
    editingThreadId.value = null;
  }
};

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

const toggleMute = () => {
    agentStore.toggleMute();
};

const clearFile = () => {
    if (agentStore.activeThread) {
      agentStore.activeThread.activeFile = null;
      agentStore.addMessage('assistant', "File context has been cleared.");
    }
};

const loadThread = (threadId: number) => {
  agentStore.loadThread(threadId);
};

const startNewThread = () => {
  const wasSidebarOpen = isSidebarOpen.value;
  agentStore.startNewThread();
  if (!wasSidebarOpen) {
    isSidebarOpen.value = true;
    newThreadCue.value = true;
    setTimeout(() => {
      isSidebarOpen.value = false;
      newThreadCue.value = false;
    }, 400); 
  }
};

const deleteThread = (threadId: number) => {
    if (confirm('Are you sure you want to delete this thread?')) {
        agentStore.deleteThread(threadId);
    }
};

const clearAllThreads = () => {
    if (confirm('Are you sure you want to delete ALL threads? This cannot be undone.')) {
        agentStore.clearAllThreads();
    }
};

const handleSettingsClick = () => {
    agentStore.toggleSettingsPanel();
};

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const scrollToBottom = () => {
  nextTick(() => {
    chatLog.value?.scrollTo({ top: chatLog.value.scrollHeight, behavior: 'smooth' });
    Prism.highlightAll();
  });
};

watch(
  () => activeThread.value?.conversation,
  (newConversation) => {
    if (newConversation) {
      scrollToBottom();
    }
  },
  { deep: true, immediate: true }
);

</script>

<style>
/* Additional styles can go here if needed */
</style>
