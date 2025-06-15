import { defineStore } from 'pinia';

// This lets TypeScript know that the VITE_... variables will be available
// VITE handles this via import.meta.env, so we don't need to declare it here.

// Define interfaces for our data structures for better type safety
interface FileAttachment {
  name: string;
  type: string;
  previewUrl: string;
  base64: string;
}

interface Message {
  id: number;
  from: 'user' | 'assistant';
  text: string;
  file?: FileAttachment;
}

interface Thread {
  id: number;
  title: string;
  conversation: Message[];
  displayContent: DisplayContent;
  activeFile: FileAttachment | null;
}

interface Reminder {
  id: number;
  text: string;
  time: Date;
}

interface DisplayContent {
  title: string;
  content: string;
  type: 'markdown' | 'reminders';
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Define the Pinia store
export const useAgentStore = defineStore('agent', {
  state: () => ({
    threads: [
      {
        id: 1,
        title: "Welcome",
        conversation: [ 
          { id: 1, from: 'assistant', text: "Hello! My name is Friday. How can I assist you today?" },
          { id: 2, from: 'assistant', text: "You can use shortcuts like `/wp`, `/so`, `/arxiv`, `/mdn`, or `/web.dev` to search specific sites." }
        ],
        displayContent: { title: 'Welcome', content: 'Your requested information will appear here.', type: 'markdown' },
        activeFile: null
      }
    ] as Thread[],
    activeThreadId: 1 as number | null,
    agentStatus: 'idle' as 'idle' | 'thinking' | 'listening',
    reminders: [] as Reminder[],
    suggestedQuestions: [] as string[],
    micPermission: 'prompt' as 'prompt' | 'granted' | 'denied',
    displayMode: 'rendered' as 'rendered' | 'raw',
    isMuted: false,
    ttsSystemAnnounced: false,
    activeAudio: null as HTMLAudioElement | null
  }),
  
  getters: {
    activeThread(state): Thread | undefined {
      return state.threads.find(t => t.id === state.activeThreadId);
    }
  },

  actions: {
    addMessage(from: 'user' | 'assistant', text: string, file?: FileAttachment) {
      if (!this.activeThread) return;
      this.activeThread.conversation.push({ id: Date.now(), from, text, file });
      this.suggestedQuestions = [];
    },

    stopAudio() {
      if (this.activeAudio) {
        this.activeAudio.pause();
        this.activeAudio = null;
      }
      window.speechSynthesis.cancel();
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAudio();
        }
    },

    async speak(rawText: string) {
      if (this.isMuted || !rawText.trim()) return;

      const cleanText = rawText
        .replace(/```[\s\S]*?```/g, '(a code block)')
        .replace(/`[^`]*`/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
        .replace(/^[#\s*-\d\.]+/gm, '')
        .replace(/[\*_~]/g, '');
      
      if (!cleanText.trim()) return;

      this.stopAudio();
      
      const ttsApiKey = import.meta.env.VITE_GOOGLE_TTS_API_KEY;
      
      if (!ttsApiKey) {
        if (!this.ttsSystemAnnounced) {
          this.addMessage('assistant', "No Google TTS API key found. Using standard browser voice.");
          this.ttsSystemAnnounced = true;
        }
        this.speakWithBrowser(cleanText);
        return;
      }

      try {
        const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsApiKey}`;
        const payload = {
          input: { text: cleanText },
          voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
          audioConfig: { audioEncoding: 'MP3' },
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Google TTS request failed: ${errorBody.error.message}`);
        }
        
        const result = await response.json();
        if (result.audioContent && !this.isMuted) {
          if (!this.ttsSystemAnnounced) {
              this.addMessage('assistant', "Premium voice enabled.");
              this.ttsSystemAnnounced = true;
          }
          const audio = new Audio(`data:audio/mp3;base64,${result.audioContent}`);
          this.activeAudio = audio;
          this.activeAudio.play();
          this.activeAudio.onended = () => { this.activeAudio = null; };
          return;
        }
      } catch (error) {
        console.error("Google Text-to-Speech API failed, falling back to browser speech.", error);
        if (!this.ttsSystemAnnounced) {
            this.addMessage('assistant', "Premium voice API failed. Falling back to standard browser voice.");
            this.ttsSystemAnnounced = true;
        }
        this.speakWithBrowser(cleanText);
      }
    },

    speakWithBrowser(textToSpeak: string) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(utterance);
      }
    },
    
    startNewThread() {
      this.stopAudio();
      const newId = Date.now();
      this.threads.push({
        id: newId,
        title: "New Conversation",
        conversation: [
          { id: 1, from: 'assistant', text: "New thread started. How can I help?" }
        ],
        displayContent: { title: 'Welcome', content: 'Your requested information will appear here.', type: 'markdown' },
        activeFile: null
      });
      this.activeThreadId = newId;
    },

    loadThread(threadId: number) {
      this.activeThreadId = threadId;
      this.suggestedQuestions = [];
    },
    
    clearActiveFile() {
        if (!this.activeThread) return;
        this.activeThread.activeFile = null;
        this.addMessage('assistant', "File context has been cleared.");
    },

    async handleFileUpload(file: File, prompt: string) {
        if (!this.activeThread) return;
        this.agentStatus = 'thinking';
        const base64DataUrl = await fileToBase64(file);
        const base64Data = base64DataUrl.split(',')[1];
        const fileAttachment: FileAttachment = { name: file.name, type: file.type, previewUrl: base64DataUrl, base64: base64Data };
        this.activeThread.activeFile = fileAttachment;
        const messageText = prompt || `What should I know about this ${file.type.split('/')[0]}?`;
        this.addMessage('user', messageText, fileAttachment);
        this.callGeminiAPI(messageText, fileAttachment);
    },

    handleUserInput(userMessage: string) {
      if (!this.activeThread) return;
      this.addMessage('user', userMessage);
      this.stopAudio();
      
      const commands: { [key: string]: string } = {
        '/wp ': 'https://en.wikipedia.org/w/index.php?search=',
        '/so ': 'https://stackoverflow.com/search?q=',
        '/arxiv ': 'https://arxiv.org/search/?query=',
        '/mdn ': 'https://developer.mozilla.org/en-US/search?q=',
        '/web.dev ': 'https://web.dev/search?q='
      };

      for (const cmd in commands) {
        if (userMessage.toLowerCase().startsWith(cmd)) {
          const query = userMessage.substring(cmd.length).trim();
          const siteName = cmd.replace('/', '').trim();
          if (query) {
            const searchUrl = `${commands[cmd]}${encodeURIComponent(query)}`;
            this.agentStatus = 'thinking';
            const message = `Searching ${siteName} for "${query}"...`;
            this.addMessage('assistant', message);
            this.speak(message);
            window.open(searchUrl, '_blank');
            this.agentStatus = 'idle';
          } else {
            this.addMessage('assistant', `Please provide a search term after ${cmd}`);
          }
          return;
        }
      }

      this.agentStatus = 'thinking';
      if (userMessage.toLowerCase().startsWith('set a reminder')) {
        const reminderText = userMessage.substring('set a reminder to '.length);
        this.reminders.push({ id: Date.now(), text: reminderText, time: new Date() });
        const message = `Reminder set: "${reminderText}"`;
        this.addMessage('assistant', message);
        this.speak(message);
        const newContent = this.reminders.map(r => `- ${r.text}`).join('\n');
        this.activeThread.displayContent = { title: 'Active Reminders', content: newContent, type: 'reminders' };
        this.agentStatus = 'idle';
      } else if (userMessage.toLowerCase().trim() === 'what time is it?') {
        const time = new Date().toLocaleTimeString();
        const message = `The current time is ${time}.`;
        this.addMessage('assistant', message);
        this.speak(message);
        this.agentStatus = 'idle';
      } else {
        this.callGeminiAPI(userMessage, this.activeThread.activeFile);
      }
    },

    async callGeminiAPI(prompt: string, file: FileAttachment | null = null) {
      if (!this.activeThread) return;
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) { throw new Error("API Key is missing. Please ensure your `.env` file is in the project root and contains `VITE_GEMINI_API_KEY=...`. You may need to restart the Vite server."); }

        let model = 'gemini-1.5-flash-latest';
        const parts: any[] = [{ text: prompt }];

        if (file) {
          parts.push({
            inline_data: { mime_type: file.type, data: file.base64 }
          });
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts }] };
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        this.addMessage('assistant', textResponse);
        this.speak(textResponse);
        
        const promptHeading = `## ${prompt}`;
        if (this.activeThread.displayContent.title === 'Welcome' || !this.activeThread.displayContent.title.startsWith("Thread:")) {
          this.activeThread.displayContent = { title: `Thread: ${prompt}`, content: `${promptHeading}\n\n${textResponse}`, type: 'markdown' };
          this.activeThread.title = prompt.length > 25 ? prompt.substring(0, 22) + '...' : prompt;
        } else {
          this.activeThread.displayContent.content += `\n\n---\n\n${promptHeading}\n\n${textResponse}`;
        }
        this.suggestNextQuestions(textResponse);
      } catch (error) {
        console.error('Gemini API error:', error);
        this.addMessage('assistant', `Sorry, I encountered an error. ${(error as Error).message}`);
      } finally {
        this.agentStatus = 'idle';
      }
    },

    async summarizeConversation() {
      if (!this.activeThread || this.activeThread.conversation.length <= 1) return;
      this.agentStatus = 'thinking';
      const history = this.activeThread.conversation.map(m => `${m.from}: ${m.text}`).join('\n\n');
      const prompt = `Please provide a concise, bullet-point summary of the following conversation:\n\n---\n\n${history}`;
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key not found. Please check your `.env` file and restart the server.");
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API request failed`);
        const result = await response.json();
        const summary = result.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate a summary.";
        this.activeThread.displayContent = { title: 'Conversation Summary', content: summary, type: 'markdown' };
        this.speak("Here is a summary of our conversation.");
      } catch (error) {
        console.error("Summary error:", error);
        this.activeThread.displayContent = { title: 'Error', content: `Could not generate a summary. ${(error as Error).message}`, type: 'markdown' };
      } finally {
        this.agentStatus = 'idle';
      }
    },

    async suggestNextQuestions(lastResponse: string) {
      const prompt = `Based on the following text, suggest exactly three concise and relevant follow-up questions. Output them as a JavaScript array of strings, like this: ["Question 1?", "Question 2?", "Question 3?"]\n\nText: "${lastResponse}"`;
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) return;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API request failed`);
        const result = await response.json();
        const suggestionsText = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const jsonString = suggestionsText.match(/\[.*\]/s);
        this.suggestedQuestions = jsonString ? JSON.parse(jsonString[0]).slice(0, 3) : [];
      } catch (error) {
        console.error("Suggestion error:", error);
        this.suggestedQuestions = [];
      }
    }
  }
});
