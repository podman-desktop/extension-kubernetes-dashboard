<script lang="ts">
import { faArrowDown, faArrowUp, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@podman-desktop/ui-svelte';
import { SearchAddon } from '@xterm/addon-search';
import type { Terminal } from '@xterm/xterm';
import { onDestroy, onMount } from 'svelte';
import Fa from 'svelte-fa';

interface Props {
  terminal: Terminal;
}

let { terminal }: Props = $props();

let searchAddon: SearchAddon | undefined;
let searchTerm: string = $state('');
let showSearch: boolean = $state(false);
let hasMatches: boolean = $state(false);

let input: HTMLInputElement | undefined = $state();

onMount(() => {
  searchAddon = new SearchAddon();
  searchAddon.activate(terminal);

  // TODO onDidChangeResults doesn't seem to be working even if i add decorations...

  // Make sure the terminal doesn't intercept Ctrl+F
  terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'f' && event.type === 'keydown') {
      event.preventDefault();
      showSearch = true;
      setTimeout(() => input?.focus(), 0);
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
    onSearchNext(true);
  } else if (event.key === 'Escape') {
    showSearch = false;
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

function onKeyUp(e: KeyboardEvent): void {
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    showSearch = true;
    setTimeout(() => input?.focus(), 0);
  } else if (e.key === 'Escape' && showSearch) {
    e.preventDefault();
    closeSearch();
  }
}

function closeSearch(): void {
  showSearch = false;
  searchTerm = '';
}
</script>

<svelte:window on:keyup|preventDefault={onKeyUp} />

{#if showSearch}
  <div class="flex flex-row py-2 h-[40px] items-center justify-end bg-[var(--pd-content-header-bg)] border-b border-[var(--pd-content-divider)]">
    {#if searchTerm && !hasMatches}
      <span class="text-sm text-[var(--pd-content-text)] mr-2">
        No results
      </span>
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
        class="p-2 rounded-sm hover:bg-[var(--pd-action-button-details-bg)]"
        onclick={(): void => onSearchPrevious(true)}>
        <Fa icon={faArrowUp} />
      </button>
      <button
        aria-label="Next Match"
        class="p-2 rounded-sm hover:bg-[var(--pd-action-button-details-bg)]"
        onclick={(): void => onSearchNext(true)}>
        <Fa icon={faArrowDown} />
      </button>
      <button
        aria-label="Close Search"
        class="p-2 rounded-sm hover:bg-[var(--pd-action-button-details-bg)]"
        onclick={closeSearch}>
        <Fa icon={faTimes} />
      </button>
    </div>
  </div>
{/if}
