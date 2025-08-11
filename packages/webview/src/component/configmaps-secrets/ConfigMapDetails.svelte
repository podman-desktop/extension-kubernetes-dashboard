<script lang="ts">
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ConfigMapSecretHelper } from '/@/component/configmaps-secrets/configmap-secret-helper';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import type { V1ConfigMap } from '@kubernetes/client-node';
import type { ConfigMapSecretUI } from '/@/component/configmaps-secrets/ConfigMapSecretUI';
import ConfigMapDetailsSummary from '/@/component/configmaps-secrets/ConfigMapDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const configMapSecretHelper = dependencyAccessor.get<ConfigMapSecretHelper>(ConfigMapSecretHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ConfigMap}
  typedUI={{} as ConfigMapSecretUI}
  kind="ConfigMap"
  resourceName="configmaps"
  SummaryComponent={ConfigMapDetailsSummary}
  name={name}
  namespace={namespace}
  transformer={configMapSecretHelper.getConfigMapSecretUI.bind(configMapSecretHelper)} />
