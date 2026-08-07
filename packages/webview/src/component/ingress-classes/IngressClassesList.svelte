<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { icon } from '/@/component/icons/icon';
import type { IngressClassUI } from './IngressClassUI';
import { IngressClassHelper } from './ingress-class-helper';
import DefaultColumn from './columns/Default.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressClassHelper = dependencyAccessor.get<IngressClassHelper>(IngressClassHelper);

let statusColumn = new TableColumn<IngressClassUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<IngressClassUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let controllerColumn = new TableColumn<IngressClassUI, string>('Controller', {
  width: '2fr',
  renderMapping: (obj): string => obj.controller,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.controller.localeCompare(b.controller),
});

let isDefaultColumn = new TableColumn<IngressClassUI>('Default', {
  renderer: DefaultColumn,
  comparator: (a, b): number => a.isDefault.localeCompare(b.isDefault),
});

let ageColumn = new TableColumn<IngressClassUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, controllerColumn, isDefaultColumn, ageColumn];

const row = new TableRow<IngressClassUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'ingressclasses',
      transformer: ingressClassHelper.getIngressClassUI.bind(ingressClassHelper),
    },
  ]}
  singular="ingress class"
  plural="ingress classes"
  isNamespaced={false}
  icon={icon['IngressClass']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['IngressClass']} resources={['ingressclasses']} />
  {/snippet}
</KubernetesObjectsList>
