<script lang="ts">
import Fa from 'svelte-fa';
import { isFontAwesomeIcon } from '@podman-desktop/ui-svelte';
import { onMount } from 'svelte';
import type { IconDefinition } from '@fortawesome/free-regular-svg-icons';

interface Props {
  title: string;
  icon: IconDefinition | string;
  fontAwesomeIcon?: IconDefinition;
  hidden?: boolean;
  enabled?: boolean;
  onClick?: () => void;
  detailed?: boolean;
  inProgress?: boolean;
  iconOffset?: string;
}

let {
  title,
  icon,
  fontAwesomeIcon,
  hidden = false,
  enabled = true,
  onClick = (): void => {},
  detailed = false,
  inProgress = false,
  iconOffset = '',
}: Props = $props();

const buttonDetailedClass =
  'text-(--pd-action-button-details-text) bg-(--pd-action-button-details-bg) hover:text-(--pd-action-button-details-hover-text) font-medium rounded-lg text-sm items-center px-3 py-2 text-center';
const buttonDetailedDisabledClass =
  'text-(--pd-action-button-details-disabled-text) bg-(--pd-action-button-details-disabled-bg) font-medium rounded-lg text-sm  items-center px-3 py-2 text-center';
const buttonClass =
  'text-(--pd-action-button-text) hover:bg-(--pd-action-button-hover-bg) hover:text-(--pd-action-button-hover-text) font-medium rounded-full items-center px-2 py-2 text-center';
const buttonDisabledClass =
  'text-(--pd-action-button-disabled-text) font-medium rounded-full items-center px-2 py-2 text-center';

const styleClass = $derived(
  detailed
    ? enabled && !inProgress
      ? buttonDetailedClass
      : buttonDetailedDisabledClass
    : enabled && !inProgress
      ? buttonClass
      : buttonDisabledClass,
);

let positionLeftClass = $state('left-1');
if (detailed) positionLeftClass = 'left-2';

let positionTopClass = $state('top-1');
if (detailed) positionTopClass = '[0.2rem]';

onMount(() => {
  if (isFontAwesomeIcon(icon)) {
    fontAwesomeIcon = icon;
  }
});

function handleClick(): void {
  if (enabled && !inProgress) {
    onClick();
  }
}
</script>

<button
  title={title}
  aria-label={title}
  onclick={handleClick}
  class="{styleClass} relative"
  class:disabled={inProgress}
  class:hidden={hidden}
  class:inline-flex={!hidden}
  disabled={!enabled}>
  {#if fontAwesomeIcon}
    <Fa class="h-4 w-4 {iconOffset}" icon={fontAwesomeIcon} />
  {/if}

  <div
    aria-label="spinner"
    class="w-6 h-6 rounded-full animate-spin border border-solid border-(--pd-action-button-spinner) border-t-transparent absolute {positionTopClass} {positionLeftClass}"
    class:hidden={!inProgress}>
  </div>
</button>
