<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import { getContext, onDestroy, onMount } from 'svelte';
import { Streams } from '/@/stream/streams';
import type { IDisposable } from 'monaco-editor';
import { Terminal } from '@xterm/xterm';
import { getTerminalTheme } from '../terminal/terminal-theme';
import { FitAddon } from '@xterm/addon-fit';
import { SerializeAddon } from '@xterm/addon-serialize';
import { Remote } from '/@/remote/remote';
import { API_POD_TERMINALS } from '/@common/channels';
import { Disposable } from '/@common/types/disposable';

interface Props {
  object: V1Pod;
  containerName: string;
}
let { object, containerName }: Props = $props();

const streams = getContext<Streams>(Streams);
const remote = getContext<Remote>(Remote);
const podTerminalsApi = remote.getProxy(API_POD_TERMINALS);

let disposables: IDisposable[] = [];

let terminalXtermDiv: HTMLElement = document.createElement('div');
let shellTerminal: Terminal;
let serializeAddon: SerializeAddon;
let fitAddon: FitAddon;

onMount(async () => {
  const podName = object.metadata?.name ?? '';
  const namespace = object.metadata?.namespace ?? '';
  const savedState = await podTerminalsApi.getState(podName, namespace, containerName);

  disposables.push(await initializeNewTerminal(terminalXtermDiv, podName, namespace, containerName));

  if (savedState) {
    shellTerminal.write(savedState);
    shellTerminal.focus();
  }
});

async function initializeNewTerminal(
  container: HTMLElement,
  podName: string,
  namespace: string,
  containerName: string,
): Promise<IDisposable> {
  if (!container) {
    return Disposable.create(() => {});
  }
  shellTerminal = new Terminal({
    fontSize: 10,
    lineHeight: 1,
    screenReaderMode: true,
    theme: getTerminalTheme(),
  });

  disposables.push(
    await streams.streamPodTerminals.subscribe(podName, namespace, containerName, chunk => {
      if (chunk.podName !== podName || chunk.namespace !== namespace || chunk.containerName !== containerName) {
        return;
      }
      shellTerminal.write(chunk.data);
      // save state to have an up to date backup of the terminal
      // in case the user leaves the webview of the extension
      podTerminalsApi.saveState(podName, namespace, containerName, serializeAddon.serialize()).catch(console.error);
    }),
  );

  fitAddon = new FitAddon();
  serializeAddon = new SerializeAddon();
  shellTerminal.loadAddon(fitAddon);
  shellTerminal.loadAddon(serializeAddon);
  shellTerminal.open(container);
  disposables.push(
    shellTerminal.onData(data => {
      podTerminalsApi.sendData(podName, namespace, containerName, data).catch(console.error);
    }),
  );

  const resize = async (): Promise<void> => {
    fitAddon.fit();
    await podTerminalsApi.resizeTerminal(podName, namespace, containerName, shellTerminal.cols, shellTerminal.rows);
  };
  const onResize = (): void => {
    resize().catch(console.error);
  };
  window.addEventListener('resize', onResize);
  await resize();

  return Disposable.create(() => {
    const terminalContent = serializeAddon.serialize();
    podTerminalsApi.saveState(podName, namespace, containerName, terminalContent).catch(console.error);
    window.removeEventListener('resize', onResize);
    shellTerminal.dispose();
    fitAddon.dispose();
    serializeAddon.dispose();
  });
}

onDestroy(() => {
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];
});
</script>

<div class="h-full w-full p-[5px] pr-0 bg-[var(--pd-terminal-background)]" bind:this={terminalXtermDiv}></div>
