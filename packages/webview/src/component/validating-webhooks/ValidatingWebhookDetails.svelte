<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ValidatingWebhookHelper } from './validating-webhook-helper';
import type { ValidatingWebhookUI } from './ValidatingWebhookUI';
import type { V1ValidatingWebhookConfiguration } from '@kubernetes/client-node';
import ValidatingWebhookDetailsSummary from './ValidatingWebhookDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const validatingWebhookHelper = dependencyAccessor.get<ValidatingWebhookHelper>(ValidatingWebhookHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ValidatingWebhookConfiguration}
  typedUI={{} as ValidatingWebhookUI}
  kind="ValidatingWebhookConfiguration"
  resourceName="validatingwebhookconfigurations"
  listName="Validating Webhook Configurations"
  name={name}
  transformer={validatingWebhookHelper.getValidatingWebhookUI.bind(validatingWebhookHelper)}
  SummaryComponent={ValidatingWebhookDetailsSummary} />
