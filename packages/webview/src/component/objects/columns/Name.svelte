<script lang="ts">
import { Navigator } from '/@/navigator';
import { KubernetesObjectUIHelper } from '/@/component/objects/helper';

import type { ObjectProps } from './object-props';
import { getContext } from 'svelte';
import { Container } from 'inversify';

let { object }: ObjectProps = $props();

const bindingContainer = getContext<Container>(Container);
const navigator = bindingContainer.get<Navigator>(Navigator);
const objectHelper = bindingContainer.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

async function openDetails(): Promise<void> {
  if (objectHelper.isNamespaced(object)) {
    navigator.navigateTo({
      kind: object.kind,
      name: object.name,
      namespace: object.namespace,
    });
  } else {
    navigator.navigateTo({
      kind: object.kind,
      name: object.name,
    });
  }
}
</script>

<button class="hover:cursor-pointer flex flex-col max-w-full text-left" onclick={openDetails}>
  <div class="text-[var(--pd-table-body-text-highlight)] overflow-hidden text-ellipsis">
    {object.name}
  </div>
  {#if objectHelper.isNamespaced(object)}
    <div class="text-[var(--pd-table-body-text)] font-extra-light text-sm overflow-hidden text-ellipsis">
      {object.namespace}
    </div>
  {/if}
</button>
