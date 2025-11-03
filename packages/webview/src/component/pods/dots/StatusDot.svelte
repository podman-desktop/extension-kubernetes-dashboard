<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';

import { getStatusColor } from './Dots';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

interface Props {
  status: string;
  name?: string;
  tooltip?: string;
  number?: number;
}
let { status, name = '', tooltip = '', number = 0 }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const kubernetesObjectUIHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

// If the tooltip is blank, use the container name and status
// as the tooltip / title
if (tooltip === '' && name !== '' && status !== '') {
  tooltip = `${name}: ${kubernetesObjectUIHelper.capitalize(status)}`;
}

// Get the color class for the status
// that could be either an outline or a fill
let dotClass = getStatusColor(status);

// If dotClass contains "outline", then we will use 'outline-1 outline-offset-[-2px]
</script>

<Tooltip top tip={tooltip}>
  <div
    class="w-2 h-2 mr-0.5 rounded-full text-center {dotClass.includes('outline')
      ? 'outline-2 outline-offset-[-2px] outline'
      : ''} {getStatusColor(status)} {number ? 'mt-3' : ''}"
    data-testid="status-dot"
    title={tooltip}>
  </div>
  <!-- If text -->
  {#if number}
    <div class="text-sm text-bold text-(--pd-content-text) mr-0.5">{number}</div>
  {/if}
</Tooltip>
