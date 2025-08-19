<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import ActionsColumn from '/@/component/jobs/columns/Actions.svelte';
import JobIcon from '../icons/JobIcon.svelte';
import type { JobUI } from './JobUI';
import { JobHelper } from './job-helper';
import ConditionsColumn from './columns/Conditions.svelte';
import CompletionsColumn from './columns/Completions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const jobHelper = dependencyAccessor.get<JobHelper>(JobHelper);

let statusColumn = new TableColumn<JobUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<JobUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let ageColumn = new TableColumn<JobUI, Date | undefined>('Age', {
  renderMapping: (job): Date | undefined => job.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

let conditionColumn = new TableColumn<JobUI>('Conditions', {
  renderer: ConditionsColumn,
  comparator: (a, b): number => a.condition.localeCompare(b.condition),
});

let completionColumn = new TableColumn<JobUI>('Completions', {
  renderer: CompletionsColumn,
  comparator: (a, b): number => a.succeeded.toString().localeCompare(b.succeeded.toString()),
});

const columns = [
  statusColumn,
  nameColumn,
  conditionColumn,
  completionColumn,
  ageColumn,
  new TableColumn<JobUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<JobUI>({ selectable: (_job): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'jobs',
      transformer: jobHelper.getJobUI.bind(jobHelper),
    },
  ]}
  singular="Job"
  plural="Jobs"
  isNamespaced={true}
  icon={JobIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={JobIcon} resources={['jobs']} />
  {/snippet}
</KubernetesObjectsList>
