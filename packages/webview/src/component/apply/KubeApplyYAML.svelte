<script lang="ts">
import { faCircleCheck, faFolderOpen, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Button, Dropdown, ErrorMessage, FormPage, Input } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { getContext, onMount, type Snippet } from 'svelte';
import { router } from 'tinro';

import MonacoEditor from '/@/component/editor/MonacoEditor.svelte';
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
import SolidKubeIcon from './SolidKubeIcon.svelte';
import { Remote } from '/@/remote/remote';
import { States } from '/@/state/states';
import { API_CONTEXTS, API_SYSTEM } from '@kubernetes-dashboard/channels';

type UsersChoice = 'file' | 'custom';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string'
  ) {
    return (err as Record<string, unknown>).message as string;
  }
  return 'Unknown error';
}

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);
const systemApi = remote.getProxy(API_SYSTEM);

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const availableContexts = states.stateAvailableContextsInfoUI;

const contextNames = $derived(availableContexts.data?.contextNames ?? []);
let selectedContextName = $derived(currentContext.data?.contextName ?? '');

onMount(() => {
  const currentContextUnsubscriber = currentContext.subscribe();
  const availableContextsUnsubscriber = availableContexts.subscribe();
  return (): void => {
    currentContextUnsubscriber();
    availableContextsUnsubscriber();
  };
});

async function handleContextChange(value: unknown): Promise<void> {
  await contextsApi.setCurrentContext(String(value));
}

let runStarted = $state(false);
let runFinished = $state(false);
let runError = $state('');
let runWarning = $state('');
let kubernetesYamlFilePath = $state('');
let customYamlContent = $state('');
let userChoice: UsersChoice = $state('file');

let hasInvalidFields = $derived.by(() => {
  if (!selectedContextName) {
    return true;
  }
  switch (userChoice) {
    case 'file':
      return !kubernetesYamlFilePath;
    case 'custom':
      return customYamlContent.length === 0;
  }
});

let applyKubeResultRaw: string | undefined = $state(undefined);

async function browseFile(): Promise<void> {
  const result = await systemApi.openFileDialog({
    title: 'Select a .yaml file to apply',
    filters: [{ name: 'YAML files', extensions: ['yaml', 'yml'] }],
  });
  if (result?.length) {
    kubernetesYamlFilePath = result[0];
  }
}

function handleContentChange(content: string): void {
  customYamlContent = content;
}

async function kubeApply(): Promise<void> {
  runStarted = true;
  runFinished = false;
  runError = '';
  applyKubeResultRaw = '';
  runWarning = '';

  try {
    let content: string;
    if (userChoice === 'custom') {
      content = customYamlContent;
    } else {
      content = await systemApi.readTextFile(kubernetesYamlFilePath);
    }
    const objects = await contextsApi.createResources(content);
    if (objects.length === 0) {
      runWarning = 'No resource(s) were applied.';
    } else if (objects.length === 1) {
      applyKubeResultRaw = `Successfully applied 1 ${objects[0].kind ?? 'unknown resource'}.`;
    } else {
      const counts = objects.reduce(
        (acc, obj) => {
          acc[obj.kind ?? 'unknown'] = (acc[obj.kind ?? 'unknown'] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const resources = Object.entries(counts)
        .map(([kind, count]) => `${count} ${kind}`)
        .join(', ');
      applyKubeResultRaw = `Successfully applied ${objects.length} resources (${resources}).`;
    }
  } catch (error) {
    runError = 'Could not apply YAML: ' + extractErrorMessage(error);
  } finally {
    runStarted = false;
    runFinished = true;
  }
}

function toggle(choice: 'file' | 'custom'): void {
  userChoice = choice;

  if (choice === 'file') {
    customYamlContent = '';
  }
}

function goBack(): void {
  router.goto('/');
}
</script>

<FormPage title="Apply YAML" inProgress={runStarted && !runFinished} onclose={goBack}>
  {#snippet icon()}
    <KubeIcon size="30" solid />
  {/snippet}

  {#snippet content()}
    <div class="p-5 min-w-full h-full">
      <div class="bg-(--pd-content-card-bg) p-6 space-y-2 lg:p-8 rounded-lg">
        <div class="space-y-6">
          <label for="kubeContexts" class="block mb-2 text-base font-bold text-(--pd-content-card-header-text)"
            >Context</label>

          <div class="flex flex-col">
            <div
              class="border-2 rounded-md p-5 cursor-pointer bg-(--pd-content-card-inset-bg) border-(--pd-content-card-border)">
              <Dropdown
                id="kubeContexts"
                name="kubeContexts"
                value={selectedContextName}
                onChange={handleContextChange}
                options={contextNames.map(name => ({
                  label: name,
                  value: name,
                }))} />
            </div>
          </div>

          <label for="containerFilePath" class="block mb-2 text-base font-bold text-(--pd-content-card-header-text)"
            >YAML file</label>

          <div class="flex flex-col">
            {#snippet file()}
              <div class="flex flex-row grow space-x-1.5">
                <Input
                  name="containerFilePath"
                  id="containerFilePath"
                  readonly
                  required
                  bind:value={kubernetesYamlFilePath}
                  placeholder="Select a .yaml file to apply"
                  class="w-full p-2" />
                <Button aria-label="browse" icon={faFolderOpen} onclick={browseFile} disabled={runStarted} />
              </div>
            {/snippet}

            {#snippet custom()}
              <div
                class="pl-2"
                class:text-(--pd-content-card-text)={userChoice === 'custom'}
                class:text-(--pd-input-field-disabled-text)={userChoice !== 'custom'}>
                Create custom YAML from scratch
              </div>
            {/snippet}

            {#snippet optionSnippet(option: 'file' | 'custom', label: string, content: Snippet)}
              <button
                disabled={runStarted}
                class="border-2 rounded-md p-5 cursor-pointer bg-(--pd-content-card-inset-bg)"
                aria-label={label}
                aria-pressed={userChoice === option ? 'true' : 'false'}
                class:border-(--pd-content-card-border-selected)={userChoice === option}
                class:border-(--pd-content-card-border)={userChoice !== option}
                onclick={toggle.bind(undefined, option)}>
                <div class="flex flex-row align-middle items-center">
                  <div
                    class="text-2xl pr-2"
                    class:text-(--pd-content-card-border-selected)={userChoice === option}
                    class:text-(--pd-content-card-border)={userChoice !== option}>
                    <Icon icon={faCircleCheck} />
                  </div>
                  {@render content()}
                </div>
              </button>
            {/snippet}

            <!-- eslint-disable-next-line sonarjs/no-use-of-empty-return-value -->
            {@render optionSnippet('file', '.yaml file to apply', file)}
            <!-- eslint-disable-next-line sonarjs/no-use-of-empty-return-value -->
            {@render optionSnippet('custom', 'Custom yaml to apply', custom)}
          </div>

          {#if userChoice === 'custom'}
            <div class="space-y-3">
              <label for="custom-yaml-editor" class="block text-base font-bold text-(--pd-content-card-header-text)">
                Custom YAML Content
              </label>
              <div id="custom-yaml-editor" class="h-[400px] border">
                <MonacoEditor
                  content={customYamlContent}
                  readOnly={runStarted}
                  language="yaml"
                  onChange={handleContentChange} />
              </div>
            </div>
          {/if}

          {#if runStarted}
            <div class="text-(--pd-content-card-text) text-sm">
              Please don't leave the page while the YAML is being applied. This process may take a few minutes to
              complete...
            </div>
          {/if}

          {#if runWarning}
            <div class="text-(--pd-state-warning) p-1 flex flex-row items-center text-sm">
              <Icon icon={faTriangleExclamation} />
              <div role="alert" aria-label="Warning Message Content" class="ml-2">{runWarning}</div>
            </div>
          {/if}

          {#if runError}
            <ErrorMessage class="text-sm" error={runError} />
          {/if}

          {#if applyKubeResultRaw}
            <div class="text-(--pd-content-card-text) text-sm">{applyKubeResultRaw}</div>
          {/if}

          <div class="flex flex-row gap-4">
            <Button class="grow" onclick={goBack} type={!runFinished || runError ? 'secondary' : 'primary'}
              >{runFinished ? 'Done' : 'Cancel'}</Button>
            {#if !runFinished || runError}
              <Button
                type="primary"
                onclick={kubeApply}
                disabled={hasInvalidFields || runStarted}
                inProgress={runStarted}
                icon={SolidKubeIcon}
                class="grow">
                {userChoice === 'custom' ? 'Apply Custom YAML' : 'Apply'}
              </Button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/snippet}
</FormPage>
