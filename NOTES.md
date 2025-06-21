# Further Thoughts

## Local Storage to save conversation threads?

The current Friday implementation uses local storage to save conversation threads. This is a simple and effective way to persist data across sessions without requiring a backend server. However, it has limitations, such as:

- **Data Size Limitations**: Local storage has a size limit (typically around 5MB), which may not be sufficient for larger conversations or file uploads.
- **Data Security**: Data stored in local storage is accessible to any script running on the same domain, which may pose security risks if sensitive information is stored.
- **Data Loss**: If the user clears their browser cache or switches browsers, the data will be lost.
- **Cross-Device Syncing**: Local storage is not shared across devices, so users cannot access their conversation threads from different devices.
- **Backup and Restore**: There is no built-in mechanism for backing up or restoring data stored in local storage.

To address these limitations, consider the following alternatives:

- **IndexedDB**: A more powerful storage solution that allows for larger amounts of data to be stored and provides better querying capabilities. It can be used to store conversation threads and file uploads.
- **Server-Side Storage**: Implement a backend server to store conversation threads in a database. This would allow for larger data storage, better security, and cross-device syncing. It would also enable features like user authentication and data backup.
- **Cloud Storage**: Utilize cloud storage solutions (e.g., AWS S3, Google Cloud Storage) to store conversation threads and files. This would provide virtually unlimited storage, automatic backups, and easy access from any device.
- **Hybrid Approach**: Combine local storage with server-side or cloud storage to create a more robust solution. For example, you could use local storage for quick access to recent threads and sync them with a remote server for backup and cross-device access.

Another question to consider is the need to implement a mechanism to handle deletions both locally and on the server/cloud storage.

Would Firestore be a good choice for this?

## Do we need a third-party service to do speech recognition?

The Web Speech API provides a built-in speech recognition capability that works in modern browsers. However, if you require more advanced features or better accuracy, you might consider integrating a third-party service like Google's Speech-to-Text API, OpenAI's Whisper or [Deepgram](https://deepgram.com/). These services offer more robust speech recognition capabilities and can handle a wider range of accents and languages.

The downside is that these services require an API key and may incur costs based on usage beyond their free tier limits.

An ideal solution would be to use the Web Speech API for basic functionality and enable a third-party service as an option for users who need more advanced features or better accuracy via a toggle in a settings menu.

## ELectron, Tauri, or PWA?

If you want to create a desktop application, you have a few options:

- **Electron**: A popular framework for building cross-platform desktop applications using web technologies (HTML, CSS, JavaScript). It provides a lot of flexibility and has a large ecosystem of libraries and tools. However, it can result in larger application sizes and higher resource usage
- **Tauri**: A newer framework that allows you to build smaller, more efficient desktop applications using web technologies. It uses the system's webview instead of bundling a full browser engine like Electron, resulting in smaller application sizes and lower resource usage
  - Tauri also provides a Rust backend, which can be beneficial for performance and security.
- **Progressive Web App (PWA)**: A web application that can be installed on a user's device and provides a native app-like experience. PWAs can work offline, send push notifications, and access device features like camera and microphone
  - PWAs may not have the same level of access to system resources as Electron or Tauri applications when not running in a Chromium-based browser, but they can be a good choice for cross-platform compatibility and ease of deployment
