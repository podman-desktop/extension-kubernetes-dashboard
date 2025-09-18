<script lang="ts">
import { Button, Tooltip } from '@podman-desktop/ui-svelte';

import MonacoEditor from './MonacoEditor.svelte';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '/@common/channels';

// Make sure that when using the MonacoEditor, the content is "stringified" before
// being passed into this component. ex. stringify(kubeDeploymentYAML)
// this is the 'initial' content.
interface Props {
  content?: string;
}
let { content = '' }: Props = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

let key = $state(0); // Initial key
let changesDetected = $state(false);
let inProgress = $state(false);
let originalContent = '';
let editorContent: string;

// Reactive statement to update originalContent only if it's blank and content is not
// as sometimes content is blank until it's "loaded". This does not work with onMount,
// so we use the reactive statement
$effect(() => {
  if (originalContent === '' && content !== '') {
    originalContent = content;
  }
});

// Handle the content change from the MonacoEditor / store it for us to use for applying to the cluster.
function handleContentChange(content: string): void {
  // If the content has changes (event.detail passed the content) vs the originalContent, then we have changes
  // and set changesDetected to true.
  changesDetected = content !== originalContent;
  editorContent = content;
}

/////////////
// Buttons //
/////////////

// Function that will update content with originalContent
// when 'revertChanges' button is pressed.
async function revertChanges(): Promise<void> {
  content = originalContent;
  changesDetected = false;
  key++; // Increment the key to force re-render
}

async function applyToCluster(): Promise<void> {
  try {
    inProgress = true;
    await contextsApi.applyResources(editorContent);

    // If the apply was successful, we update the originalContent to the new active content in the editor
    // and reset the changesDetected to false.
    originalContent = editorContent;
    changesDetected = false;
  } catch (error) {
    // TODO https://github.com/podman-desktop/extension-kubernetes-dashboard/issues/103
    console.error('error playing kube file', error);
  } finally {
    inProgress = false;
  }
}
</script>

<div
  class="flex flex-row-reverse p-6 bg-transparent fixed bottom-0 right-0 mb-0 pr-10 max-h-20 bg-opacity-90 z-50"
  role="group"
  aria-label="Edit Buttons">
  <Tooltip topLeft tip="Patch resource using Strategic Merge">
    <Button
      type="primary"
      aria-label="Patch resource"
      on:click={applyToCluster}
      disabled={!changesDetected}
      inProgress={inProgress}>Patch resource</Button>
  </Tooltip>
  <Tooltip topLeft tip="Revert the changes to the original content">
    <Button
      type="secondary"
      aria-label="Revert changes"
      class="mr-2 opacity-100"
      on:click={revertChanges}
      disabled={!changesDetected}>Revert changes</Button>
  </Tooltip>
</div>

<!-- We use key to force a re-render of the MonacoEditor component
    The reasoning is that MonacoEditor is complex and uses it's own rendering components
    and does not allow a way to reactively update the content externally. So we just re-render with the original content -->
{#key key}
  <MonacoEditor content={content} language="yaml" readOnly={false} onChange={handleContentChange} />
{/key}
