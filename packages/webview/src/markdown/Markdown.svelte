<!-- The markdown rendered has it's own style that you'll have to customize / check against podman desktop
UI guidelines -->
<style lang="postcss">
.markdown > :global(p) {
  line-height: normal;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.markdown > :global(h1),
:global(h2),
:global(h3),
:global(h4),
:global(h5) {
  font-size: revert;
  line-height: normal;
  font-weight: revert;
  border-bottom: 1px solid #444;
  margin-bottom: 20px;
}

.markdown > :global(ul) {
  line-height: normal;
  list-style: revert;
  margin: revert;
  padding: revert;
}

.markdown > :global(b),
:global(strong) {
  font-weight: 600;
}
.markdown > :global(blockquote) {
  opacity: 0.8;
  line-height: normal;
}
.markdown :global(a) {
  color: var(--pd-link);
  text-decoration: none;
  border-radius: 4px;
}
.markdown :global(a):hover {
  background-color: var(--pd-link-hover-bg);
}
</style>

<script lang="ts">
import { micromark } from 'micromark';
import { onMount, type Snippet } from 'svelte';

let text = $state('');
let html = $state('');

// Optional attribute to specify the markdown to use
// the user can use: <Markdown>**bold</Markdown> or <Markdown markdown="**bold**" /> syntax
interface Props {
  markdown?: string;
  children?: Snippet;
}
let { markdown = '', children }: Props = $props();

// Render the markdown or the html+micromark markdown reactively
$effect(() => {
  markdown
    ? // eslint-disable-next-line sonarjs/no-nested-assignment
      (html = micromark(markdown))
    : undefined;
});

onMount(() => {
  if (markdown) {
    text = markdown;
  }
  html = micromark(text);
});
</script>

<!-- Placeholder to grab the content if people are using <Markdown>**bold</Markdown> -->
<span contenteditable="false" bind:textContent={text} class="hidden">
  {@render children?.()}
</span>

<section class="markdown" aria-label="markdown-content">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</section>
