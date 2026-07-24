<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import ActionsColumn from './columns/Actions.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { icon } from '/@/component/icons/icon';
import type { ValidatingWebhookUI } from './ValidatingWebhookUI';
import { ValidatingWebhookHelper } from './validating-webhook-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const validatingWebhookHelper = dependencyAccessor.get<ValidatingWebhookHelper>(ValidatingWebhookHelper);

let statusColumn = new TableColumn<ValidatingWebhookUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ValidatingWebhookUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let webhooksColumn = new TableColumn<ValidatingWebhookUI, string>('Webhooks', {
  renderMapping: (obj): string => String(obj.webhooks),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.webhooks - b.webhooks,
});

let failurePolicyColumn = new TableColumn<ValidatingWebhookUI, string>('Failure Policy', {
  renderMapping: (obj): string => obj.failurePolicy,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.failurePolicy.localeCompare(b.failurePolicy),
});

let ageColumn = new TableColumn<ValidatingWebhookUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  webhooksColumn,
  failurePolicyColumn,
  ageColumn,
  new TableColumn<ValidatingWebhookUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<ValidatingWebhookUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'validatingwebhookconfigurations',
      transformer: validatingWebhookHelper.getValidatingWebhookUI.bind(validatingWebhookHelper),
    },
  ]}
  singular="validating webhook configuration"
  plural="validating webhook configurations"
  isNamespaced={false}
  icon={icon['ValidatingWebhookConfiguration']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen
      icon={icon['ValidatingWebhookConfiguration']}
      resources={['validatingwebhookconfigurations']} />
  {/snippet}
</KubernetesObjectsList>
