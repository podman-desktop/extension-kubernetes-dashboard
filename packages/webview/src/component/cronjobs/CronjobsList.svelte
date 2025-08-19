<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import ActionsColumn from '/@/component/cronjobs/columns/Actions.svelte';
import { CronJobHelper } from './cronjob-helper';
import type { CronJobUI } from './CronJobUI';
import CronJobIcon from '../icons/CronJobIcon.svelte';
import { KubernetesObjectUIHelper } from '../objects/kubernetes-object-ui-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const cronjobHelper = dependencyAccessor.get<CronJobHelper>(CronJobHelper);
const kubernetesObjectUIHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

let statusColumn = new TableColumn<CronJobUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<CronJobUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let ageColumn = new TableColumn<CronJobUI, Date | undefined>('Age', {
  renderMapping: (cronjob): Date | undefined => cronjob.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

let scheduleColumn = new TableColumn<CronJobUI, string>('Schedule', {
  renderMapping: (cronjob): string => cronjob.schedule,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.schedule.localeCompare(b.schedule),
});

let suspendColumn = new TableColumn<CronJobUI, string>('Suspended', {
  renderMapping: (cronjob): string => kubernetesObjectUIHelper.capitalize(cronjob.suspended.toString()),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.suspended.toString().localeCompare(b.suspended.toString()),
});

// This column just lists the number of active jobs at the moment, we do not link to the pods, etc (yet).. maybe in the future
let activeColumn = new TableColumn<CronJobUI, string>('Active', {
  renderMapping: (cronjob): string => cronjob.active?.toString() ?? '',
  renderer: TableSimpleColumn,
  comparator: (a, b): number => (a.active?.toString() ?? '').localeCompare(b.active?.toString() ?? ''),
});

let lastScheduleColumn = new TableColumn<CronJobUI, Date | undefined>('Last scheduled', {
  renderMapping: (cronjob): Date | undefined => cronjob.lastScheduleTime,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.lastScheduleTime).diff(moment(a.lastScheduleTime)),
});

const columns = [
  statusColumn,
  nameColumn,
  scheduleColumn,
  lastScheduleColumn,
  suspendColumn,
  activeColumn,
  ageColumn,
  new TableColumn<CronJobUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<CronJobUI>({ selectable: (_cronjob): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'cronjobs',
      transformer: cronjobHelper.getCronJobUI.bind(cronjobHelper),
    },
  ]}
  singular="CronJob"
  plural="CronJobs"
  isNamespaced={true}
  icon={CronJobIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={CronJobIcon} resources={['cronjobs']} />
  {/snippet}
</KubernetesObjectsList>
