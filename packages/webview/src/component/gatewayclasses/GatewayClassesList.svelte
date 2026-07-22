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
import type { GatewayClassUI } from './GatewayClassUI';
import { GatewayClassHelper } from './gatewayclass-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const gatewayClassHelper = dependencyAccessor.get<GatewayClassHelper>(GatewayClassHelper);

let statusColumn = new TableColumn<GatewayClassUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<GatewayClassUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let controllerColumn = new TableColumn<GatewayClassUI, string>('Controller', {
  width: '2fr',
  renderMapping: (obj): string => obj.controller,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.controller.localeCompare(b.controller),
});

let ageColumn = new TableColumn<GatewayClassUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, controllerColumn, ageColumn];

const row = new TableRow<GatewayClassUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'gatewayclasses',
      transformer: gatewayClassHelper.getGatewayClassUI.bind(gatewayClassHelper),
    },
  ]}
  singular="gateway class"
  plural="gateway classes"
  isNamespaced={false}
  icon={icon['GatewayClass']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['GatewayClass']} resources={['gatewayclasses']} />
  {/snippet}
</KubernetesObjectsList>
