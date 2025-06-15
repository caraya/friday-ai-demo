# Friday Agent

This project is a personal assistant application modeled after Apple's Network Navigator, designed to help user manage tasks, access information, and interact with people and services.

<https://youtu.be/9bjve67p33E?si=T_6BEyhHnaJ0_GSV>

## The original prompt

Help me with implementing an agent modeled after the Knowledge Navigator outlined in <https://youtu.be/9bjve67p33E?si=T_6BEyhHnaJ0_GSV>

Use Gemini Pro and Gemma APIs to create a virtual assistant that can assist users with various tasks and information retrieval. The agent should be able to choose between on device and cloud processing based on the task requirements and available resources.

Also suggest the best language and framework for building this agent. Would Go be the best choice, or would Python or JavaScript be more suitable?

The agent should take written and spoke input, process it, and provide relevant information or perform tasks based on the input.

The agent should be able to:

1. Understand natural language input (both written and spoken).
2. Retrieve and synthesize information from various sources.
3. Be able to ask for login credentials when necessary to access certain services or data.
4. Handle multi-turn conversations to maintain context and continuity.
5. Write the output in a Markdown editor that can be used for documentation or note-taking. It should also support a rich text view for displaying information.
6. If showing code, use a code block with syntax highlighting for better readability.
7. Perform tasks such as setting reminders, searching the web, or managing schedules.
8. Search for and summarize relevant documents or articles.
9. Provide a user-friendly interface for interaction.
10. Learn from user interactions to improve its responses over time.
11. Ensure privacy and security of user data.

## Enhancements after the original prompt

* Switched to a Vite-based Vue project for the frontend
* Added capability to switch between rich text and markdown views
* Added Prism.js for syntax highlighting in code blocks
* Set up voice output using the Web Speech API
  * The user can mute the voice output
  * The user can choose what bubble to hear the voice output from
* Added shortcuts for searching MDN, Arxiv, and Web.dev
* Added Gemini's capability to summarize the conversation thread
* Added file upload (audio and images) for analysis, processing, and summarization
  * The file remains available in the conversation until you remove it
* Improved speech using Google's Wave-Net TTS API

Any further changes will be documented here and marked as complete in the TODOs section below once it's implemented.

## TODOs and Ideas

List of tasks and ideas for the project. They are not listed in any particular order, and some may be more important than others.

* [ ] Add save thread functionality
* [ ] Add a settings page to configure the agent's behavior and to store the user's API key and configure the agent's to take the user's API key from settings rather than `.env`
* [x] Allow for file uploads to the agent for analysis, processing and summarization
* [ ] Implement user authentication so this can be served publically while keeping user data private
* [ ] Add unit tests for all components
* [ ] Improve error handling in API calls
* [ ] Create documentation with examples
* [ ] Implement a dark mode theme
* [ ] Add logging
* [ ] Add Electron support for desktop app
* [ ] Figure out if it's possible to login to external sites like Quora or Reddit to retrieve information
* [ ] Research if it's possible to enhance the current shortcuts to select a link from the results
* [ ] Create a mobile-friendly version of the app
* [x] Explore if it's possible to integrate with Google's text to speech APIs to improve the voices used in the app
* [ ] Explore if it's possible to integrate with Google's speech to text APIs to improve speech recognition
* [x] Add additional shortcuts for Wikipedia and Stack Overflow
* [ ] Evaluate if it's possible to improve the summarization capabilities of the agent to something similar to NotebookML
* [x] Can we integrate other AI models for things like image recognition and text generation? (**Gemini handles this well**)
* [ ] Explore if the agent, as currently implemented, can learn from user interactions to improve its responses over time

## Further Thoughts

### Local Storage to save conversation threads?

## Do we need a third-party service to do speech recognition?

The Web Speech API provides a built-in speech recognition capability that works in modern browsers. However, if you require more advanced features or better accuracy, you might consider integrating a third-party service like Google's Speech-to-Text API, OpenAI's Whisper or [Deepgram](https://deepgram.com/). These services offer more robust speech recognition capabilities and can handle a wider range of accents and languages.

The downside is that these services require an API key and may incur costs based on usage beyond their free tier limits.

An ideal solution would be to use the Web Speech API for basic functionality and enable a third-party service as an option for users who need more advanced features or better accuracy via a toggle in a settings menu.
