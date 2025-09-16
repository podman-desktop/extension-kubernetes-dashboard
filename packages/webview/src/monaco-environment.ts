import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_moduleId: unknown, languageId: string): Worker {
    if (languageId === 'json') {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};
