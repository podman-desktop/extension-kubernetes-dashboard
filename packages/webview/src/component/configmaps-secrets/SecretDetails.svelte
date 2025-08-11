<script lang="ts">
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ConfigMapSecretHelper } from '/@/component/configmaps-secrets/configmap-secret-helper';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import type { V1Secret } from '@kubernetes/client-node';
import type { ConfigMapSecretUI } from '/@/component/configmaps-secrets/ConfigMapSecretUI';
import SecretDetailsSummary from '/@/component/configmaps-secrets/SecretDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const configMapSecretHelper = dependencyAccessor.get<ConfigMapSecretHelper>(ConfigMapSecretHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Secret}
  typedUI={{} as ConfigMapSecretUI}
  kind="Secret"
  resourceName="secrets"
  SummaryComponent={SecretDetailsSummary}
  name={name}
  namespace={namespace}
  transformer={configMapSecretHelper.getConfigMapSecretUI.bind(configMapSecretHelper)} />
