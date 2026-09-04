<script lang="ts">
import type { KubernetesObject, V2HorizontalPodAutoscaler } from '@kubernetes/client-node';
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import { getContext } from 'svelte';

import { icon } from '/@/component/icons/icon';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import type { KubernetesObjectUI } from '/@/component/objects/KubernetesObjectUI';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

import ActionsColumn from './columns/Actions.svelte';
import { HpaHelper } from './hpa-helper';
import type { HpaUI } from './HpaUI';

function isV2HorizontalPodAutoscaler(o: KubernetesObject): o is V2HorizontalPodAutoscaler {
  return 'spec' in o && o.spec !== undefined;
}

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const hpaHelper = dependencyAccessor.get<HpaHelper>(HpaHelper);

let statusColumn = new TableColumn<HpaUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<HpaUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let metricsColumn = new TableColumn<HpaUI, string>('Metrics', {
  renderMapping: (obj): string => obj.metrics,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.metrics.localeCompare(b.metrics),
});

let minPodsColumn = new TableColumn<HpaUI, string>('Min Pods', {
  renderMapping: (obj): string => String(obj.minReplicas),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.minReplicas - b.minReplicas,
});

let maxPodsColumn = new TableColumn<HpaUI, string>('Max Pods', {
  renderMapping: (obj): string => String(obj.maxReplicas),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.maxReplicas - b.maxReplicas,
});

let replicasColumn = new TableColumn<HpaUI, string>('Replicas', {
  renderMapping: (obj): string => String(obj.currentReplicas),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.currentReplicas - b.currentReplicas,
});

let desiredReplicasColumn = new TableColumn<HpaUI, string>('Desired', {
  renderMapping: (obj): string => String(obj.desiredReplicas),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.desiredReplicas - b.desiredReplicas,
});

let ageColumn = new TableColumn<HpaUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  metricsColumn,
  minPodsColumn,
  maxPodsColumn,
  replicasColumn,
  desiredReplicasColumn,
  ageColumn,
  new TableColumn<HpaUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<HpaUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'horizontalpodautoscalers',
      transformer: (o: KubernetesObject): KubernetesObjectUI => {
        if (!isV2HorizontalPodAutoscaler(o)) {
          throw new Error(`HorizontalPodAutoscaler ${o.metadata?.name} is missing spec`);
        }
        return hpaHelper.getHpaUI.bind(hpaHelper)(o);
      },
    },
  ]}
  singular="horizontal pod autoscaler"
  plural="horizontal pod autoscalers"
  isNamespaced={true}
  icon={icon['HorizontalPodAutoscaler']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['HorizontalPodAutoscaler']} resources={['horizontalpodautoscalers']} />
  {/snippet}
</KubernetesObjectsList>
