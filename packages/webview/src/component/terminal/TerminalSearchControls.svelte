<script lang="ts">
import { faArrowDown, faArrowUp, faTimes } from '@fortawesome/free-solid-svg-icons';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';
import { Input } from '@podman-desktop/ui-svelte';
import { SearchAddon } from '@xterm/addon-search';
import type { Terminal } from '@xterm/xterm';
import { getContext, onDestroy, onMount, tick } from 'svelte';
import Fa from 'svelte-fa';
import { Remote } from '/@/remote/remote';

interface Props {
  terminal: Terminal;
}

let { terminal }: Props = $props();

let searchAddon: SearchAddon | undefined;
let searchTerm: string = $state('');
let showSearch: boolean = $state(false);
let hasMatches: boolean = $state(false);

let input: HTMLInputElement | undefined = $state();

let platformName = $state<string>();

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

function isFindShortcut(event: KeyboardEvent): boolean {
  const eventKey = event.key.toLowerCase();
  return platformName === 'darwin' ? event.metaKey && eventKey === 'f' : event.ctrlKey && eventKey === 'f';
}

onMount(async () => {
  searchAddon = new SearchAddon();
  searchAddon.activate(terminal);

  platformName = await systemApi.getPlatformName();

  // TODO onDidChangeResults doesn't seem to be working even if i add decorations...

  // Make sure the terminal doesn't intercept Cmd+F (Mac) or Ctrl+F (Windows/Linux)
  terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
    if (event.type === 'keydown' && isFindShortcut(event)) {
      event.preventDefault();
      showSearch = true;
      tick()
        .then(() => input?.focus())
        .catch(console.error);
      return false;
    } else if (event.type === 'keydown' && event.key === 'Escape' && showSearch) {
      event.preventDefault();
      closeSearch();
      return false;
    }
    return true;
  });
});

onDestroy(() => {
  searchAddon?.dispose();
});

function onKeyPressed(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    onSearchNext(true);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeSearch();
  }
}

function onSearchNext(incremental = false): void {
  if (searchTerm) {
    const found = searchAddon?.findNext(searchTerm, {
      incremental: incremental,
    });
    hasMatches = found ?? false;
  }
}

function onSearchPrevious(incremental = false): void {
  if (searchTerm) {
    const found = searchAddon?.findPrevious(searchTerm, {
      incremental: incremental,
    });
    hasMatches = found ?? false;
  }
}

function onSearch(event: Event): void {
  searchTerm = (event.target as HTMLInputElement).value;
  if (searchTerm) {
    onSearchNext(true);
  } else {
    hasMatches = false;
  }
}

function closeSearch(): void {
  showSearch = false;
  searchTerm = '';
}
</script>

{#if showSearch}
  <div
    class="flex flex-row py-2 h-[40px] items-center justify-end bg-(--pd-content-header-bg) border-b border-(--pd-content-divider)">
    {#if searchTerm && !hasMatches}
      <span class="text-sm text-(--pd-content-text) mr-2"> No results </span>
    {/if}
    <div class="w-200px mx-4">
      <Input
        bind:element={input}
        placeholder="Find"
        aria-label="Find"
        onkeypress={onKeyPressed}
        oninput={onSearch}
        value={searchTerm} />
    </div>
    <div class="space-x-1 mr-4">
      <button
        aria-label="Previous Match"
        class="p-2 rounded-sm hover:bg-(--pd-action-button-details-bg)"
        onclick={(): void => onSearchPrevious(true)}>
        <Fa icon={faArrowUp} />
      </button>
      <button
        aria-label="Next Match"
        class="p-2 rounded-sm hover:bg-(--pd-action-button-details-bg)"
        onclick={(): void => onSearchNext(true)}>
        <Fa icon={faArrowDown} />
      </button>
      <button
        aria-label="Close Search"
        class="p-2 rounded-sm hover:bg-(--pd-action-button-details-bg)"
        onclick={closeSearch}>
        <Fa icon={faTimes} />
      </button>
    </div>
  </div>
{/if}
