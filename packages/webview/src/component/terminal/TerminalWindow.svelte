<script lang="ts">
	import '@xterm/xterm/css/xterm.css';

	import { API_SYSTEM } from '@kubernetes-dashboard/channels';
	import { FitAddon } from '@xterm/addon-fit';
	import { Terminal } from '@xterm/xterm';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { Remote } from '/@/remote/remote';

	import { getTerminalTheme } from './terminal-theme';
	import TerminalSearchControls from './TerminalSearchControls.svelte';

	interface Props {
		terminal?: Terminal;
		convertEol?: boolean;
		disableStdIn?: boolean;
		screenReaderMode?: boolean;
		showCursor?: boolean;
		search?: boolean;
		class?: string;
	}

	let {
		terminal = $bindable(),
		convertEol,
		disableStdIn = true,
		screenReaderMode,
		showCursor = false,
		search = false,
		class: className,
	}: Props = $props();

	let logsXtermDiv: HTMLDivElement | undefined;
	let resizeHandler: () => void;
	let contextMenuHandler: (event: MouseEvent) => void;
	
	const remote = getContext<Remote>(Remote);
	const systemApi = remote.getProxy(API_SYSTEM);
	let platformName = $state<string>();

	function copySelectionToClipboard(): boolean {
		let copied = false;
		const selection = terminal?.getSelection();
		if (selection) {
			//We don't have permissions to the clipboard so instead we can use a text area with copy command to get around that
			const textarea = document.createElement('textarea');
			textarea.value = selection;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			try {
				document.execCommand('copy');
				copied = true;
			} catch (err) {
				console.error('Failed to copy:', err);
			}
			document.body.removeChild(textarea);
		}
		return copied;
	}

	async function refreshTerminal(): Promise<void> {
		// missing element, return
		if (!logsXtermDiv) {
			return;
		}
		// grab font size
		const fontSize = 10; // TODO: get from configuration
		const lineHeight = 1; // TODO: get from configuration

		terminal = new Terminal({
			fontSize,
			lineHeight,
			disableStdin: disableStdIn,
			theme: getTerminalTheme(),
			convertEol: convertEol,
			screenReaderMode: screenReaderMode,
			rightClickSelectsWord: true,
		});
		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);

		terminal.open(logsXtermDiv);
		if (!showCursor) {
			// disable cursor
			terminal.write('\x1b[?25l');
		}

		//copy behavior
		terminal.attachCustomKeyEventHandler((event: KeyboardEvent): boolean => {
			const isCopyShortcut = platformName === 'darwin' 
				? event.metaKey && event.key === 'c'
				: event.ctrlKey && event.key === 'c';
			
			if (isCopyShortcut) {
				const handled = copySelectionToClipboard();
				if (handled) {
					terminal?.clearSelection();
					event.preventDefault();
					return false;
				}
			}
			return true;
		});

		contextMenuHandler = (event: MouseEvent): boolean => {
			const handled = copySelectionToClipboard();
			if (handled) {
				terminal?.clearSelection();
				event.preventDefault();
				return false;
			}
			return true;
		};
		logsXtermDiv.addEventListener('contextmenu', contextMenuHandler);

		// call fit addon each time we resize the window
		resizeHandler = (): void => {
			fitAddon.fit();
		};
		window.addEventListener('resize', resizeHandler);

		fitAddon.fit();
	}

	onMount(async () => {
		platformName = await systemApi.getPlatformName();
		await refreshTerminal();
	});

	onDestroy(() => {
		window.removeEventListener('resize', resizeHandler);
		logsXtermDiv?.removeEventListener('contextmenu', contextMenuHandler);
		terminal?.dispose();
	});
</script>

{#if search && terminal}
	<TerminalSearchControls terminal={terminal} />
{/if}

<div
	class="{className} overflow-hidden p-[5px] pr-0 bg-[var(--pd-terminal-background)]" 
	role="term" 
	bind:this={logsXtermDiv}>
</div>
