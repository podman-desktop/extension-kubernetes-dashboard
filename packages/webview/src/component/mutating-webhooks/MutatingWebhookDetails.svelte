<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { MutatingWebhookHelper } from './mutating-webhook-helper';
import type { MutatingWebhookUI } from './MutatingWebhookUI';
import type { V1MutatingWebhookConfiguration } from '@kubernetes/client-node';
import MutatingWebhookDetailsSummary from './MutatingWebhookDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const mutatingWebhookHelper = dependencyAccessor.get<MutatingWebhookHelper>(MutatingWebhookHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1MutatingWebhookConfiguration}
  typedUI={{} as MutatingWebhookUI}
  kind="MutatingWebhookConfiguration"
  resourceName="mutatingwebhookconfigurations"
  listName="Mutating Webhook Configurations"
  name={name}
  transformer={mutatingWebhookHelper.getMutatingWebhookUI.bind(mutatingWebhookHelper)}
  SummaryComponent={MutatingWebhookDetailsSummary} />
