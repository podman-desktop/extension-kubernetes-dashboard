<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import type { HTMLAttributes } from 'svelte/elements';
import { MonacoManager } from './monaco';

interface Props extends HTMLAttributes<HTMLElement> {
  content: string;
  language?: string;
  readOnly?: boolean;
  noMinimap?: boolean;
  onChange?: (content: string) => void;
}

let {
  content = $bindable(),
  language = 'json',
  readOnly = true,
  onChange,
  noMinimap,
  class: className,
  ...restProps
}: Props = $props();

let editorInstance: Monaco.editor.IStandaloneCodeEditor;
let editorContainer: HTMLElement;

onMount(async () => {
  const monaco = await MonacoManager.getMonaco();

  editorInstance = monaco.editor.create(editorContainer, {
    value: content,
    language: language,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    readOnly: readOnly,
    fontSize: 10,
    theme: MonacoManager.getThemeName(),
    minimap: {
      enabled: !noMinimap,
    },
  });

  editorInstance.onDidChangeModelContent(() => {
    content = editorInstance.getValue();
    onChange?.(content);
  });
});

onDestroy(() => {
  editorInstance?.dispose();
});

$effect(() => {
  if (!readOnly) return;
  content;
  editorInstance?.getModel()?.setValue(content);
});
</script>

<div class="h-full {className}" {...restProps} bind:this={editorContainer}></div>
