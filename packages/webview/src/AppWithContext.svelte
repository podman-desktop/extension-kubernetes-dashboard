<script lang="ts">
import NamespacesList from './component/namespaces/NamespacesList.svelte';
import ConfigMapSecretList from './component/configmaps-secrets/ConfigMapSecretList.svelte';
import Dashboard from '/@/component/dashboard/Dashboard.svelte';
import NoContextPage from '/@/component/dashboard/NoContextPage.svelte';
import NodesList from '/@/component/nodes/NodesList.svelte';
import Navigation from '/@/Navigation.svelte';
import Route from '/@/Route.svelte';
import NodeDetails from '/@/component/nodes/NodeDetails.svelte';
import NamespaceDetails from './component/namespaces/NamespaceDetails.svelte';
import ConfigMapDetails from './component/configmaps-secrets/ConfigMapDetails.svelte';
import SecretDetails from './component/configmaps-secrets/SecretDetails.svelte';
import DeploymentList from './component/deployments/DeploymentList.svelte';
import ServicesList from './component/services/ServicesList.svelte';
import IngressesRoutesList from './component/ingresses-routes/IngressesRoutesList.svelte';
import PVCsList from './component/pvcs/PVCsList.svelte';
import JobsList from './component/jobs/JobsList.svelte';
import CronJobsList from './component/cronjobs/CronJobsList.svelte';
import PodsList from './component/pods/PodsList.svelte';
import DeploymentDetails from './component/deployments/DeploymentDetails.svelte';
import ServiceDetails from './component/services/ServiceDetails.svelte';
import IngressDetails from './component/ingresses-routes/IngressDetails.svelte';
import RouteDetails from './component/ingresses-routes/RouteDetails.svelte';
import PVCDetails from './component/pvcs/PVCDetails.svelte';
import JobDetails from './component/jobs/JobDetails.svelte';
import CronJobDetails from './component/cronjobs/CronJobDetails.svelte';
import PodDetails from './component/pods/PodDetails.svelte';
import PortForwardingList from './component/port-forward/PortForwardingList.svelte';
import KubeApplyYAML from './component/apply/KubeApplyYAML.svelte';
import DaemonSetsList from '/@/component/daemonsets/DaemonSetsList.svelte';
import DaemonSetDetails from '/@/component/daemonsets/DaemonSetDetails.svelte';
import StatefulSetsList from '/@/component/statefulsets/StatefulSetsList.svelte';
import StatefulSetDetails from '/@/component/statefulsets/StatefulSetDetails.svelte';
import ReplicaSetsList from '/@/component/replicasets/ReplicaSetsList.svelte';
import ReplicaSetDetails from '/@/component/replicasets/ReplicaSetDetails.svelte';
import PvsList from './component/pvs/PvsList.svelte';
import PvDetails from './component/pvs/PvDetails.svelte';
import StorageClassesList from './component/storage-classes/StorageClassesList.svelte';
import StorageClassDetails from './component/storage-classes/StorageClassDetails.svelte';
import EndpointSlicesList from './component/endpoint-slices/EndpointSlicesList.svelte';
import EndpointSliceDetails from './component/endpoint-slices/EndpointSliceDetails.svelte';
import EndpointsList from './component/endpoints/EndpointsList.svelte';
import EndpointDetails from './component/endpoints/EndpointDetails.svelte';
import IngressClassesList from './component/ingress-classes/IngressClassesList.svelte';
import IngressClassDetails from './component/ingress-classes/IngressClassDetails.svelte';
import NetworkPoliciesList from './component/network-policies/NetworkPoliciesList.svelte';
import NetworkPolicyDetails from './component/network-policies/NetworkPolicyDetails.svelte';
import HttpRoutesList from './component/httproutes/HttpRoutesList.svelte';
import HttpRouteDetails from './component/httproutes/HttpRouteDetails.svelte';
import GatewaysList from './component/gateways/GatewaysList.svelte';
import GatewayDetails from './component/gateways/GatewayDetails.svelte';
import GatewayClassesList from './component/gatewayclasses/GatewayClassesList.svelte';
import GatewayClassDetails from './component/gatewayclasses/GatewayClassDetails.svelte';
// import globally the monaco environment
import './monaco-environment';
import type { TinroRouteMeta } from 'tinro';

interface Props {
  meta: TinroRouteMeta;
}

const { meta }: Props = $props();
</script>

<Navigation meta={meta} />

<div class="flex flex-col w-full h-full overflow-hidden">
  <Route path="/">
    <Dashboard />
  </Route>

  <Route path="/newCluster">
    <NoContextPage title="Create Kubernetes Cluster" />
  </Route>

  <Route path="/nodes">
    <NodesList />
  </Route>

  <Route path="/nodes/:name/*" let:meta>
    <NodeDetails name={decodeURI(meta.params.name)} />
  </Route>

  <Route path="/namespaces">
    <NamespacesList />
  </Route>

  <Route path="/namespaces/:name/*" let:meta>
    <NamespaceDetails name={decodeURI(meta.params.name)} />
  </Route>

  <Route path="/deployments">
    <DeploymentList />
  </Route>

  <Route path="/deployments/:name/:namespace/*" let:meta>
    <DeploymentDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/pods">
    <PodsList />
  </Route>

  <Route path="/pods/:name/:namespace/*" let:meta>
    <PodDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/services">
    <ServicesList />
  </Route>

  <Route path="/services/:name/:namespace/*" let:meta>
    <ServiceDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/ingressesRoutes">
    <IngressesRoutesList />
  </Route>

  <Route path="/ingressesRoutes/ingress/:name/:namespace/*" let:meta>
    <IngressDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/ingressesRoutes/route/:name/:namespace/*" let:meta>
    <RouteDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/persistentvolumeclaims">
    <PVCsList />
  </Route>

  <Route path="/persistentvolumeclaims/:name/:namespace/*" let:meta>
    <PVCDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/configmapsSecrets">
    <ConfigMapSecretList />
  </Route>

  <Route path="/configmapsSecrets/configmap/:name/:namespace/*" let:meta>
    <ConfigMapDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/configmapsSecrets/secret/:name/:namespace/*" let:meta>
    <SecretDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/jobs">
    <JobsList />
  </Route>

  <Route path="/jobs/:name/:namespace/*" let:meta>
    <JobDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/cronjobs">
    <CronJobsList />
  </Route>

  <Route path="/cronjobs/:name/:namespace/*" let:meta>
    <CronJobDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/portForward">
    <PortForwardingList />
  </Route>

  <Route path="/applyYaml">
    <KubeApplyYAML />
  </Route>

  <Route path="/daemonsets">
    <DaemonSetsList />
  </Route>

  <Route path="/daemonsets/:name/:namespace/*" let:meta>
    <DaemonSetDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/statefulsets">
    <StatefulSetsList />
  </Route>

  <Route path="/statefulsets/:name/:namespace/*" let:meta>
    <StatefulSetDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/replicasets">
    <ReplicaSetsList />
  </Route>

  <Route path="/replicasets/:name/:namespace/*" let:meta>
    <ReplicaSetDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/persistentvolumes">
    <PvsList />
  </Route>

  <Route path="/persistentvolumes/:name/*" let:meta>
    <PvDetails name={decodeURI(meta.params.name)} />
  </Route>

  <Route path="/storageclasses">
    <StorageClassesList />
  </Route>

  <Route path="/storageclasses/:name/*" let:meta>
    <StorageClassDetails name={decodeURI(meta.params.name)} />
  </Route>

  <Route path="/endpointslices">
    <EndpointSlicesList />
  </Route>

  <Route path="/endpointslices/:name/:namespace/*" let:meta>
    <EndpointSliceDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/endpoints">
    <EndpointsList />
  </Route>

  <Route path="/endpoints/:name/:namespace/*" let:meta>
    <EndpointDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/ingressclasses">
    <IngressClassesList />
  </Route>

  <Route path="/ingressclasses/:name/*" let:meta>
    <IngressClassDetails name={decodeURI(meta.params.name)} />
  </Route>

  <Route path="/networkpolicies">
    <NetworkPoliciesList />
  </Route>

  <Route path="/networkpolicies/:name/:namespace/*" let:meta>
    <NetworkPolicyDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/httproutes">
    <HttpRoutesList />
  </Route>

  <Route path="/httproutes/:name/:namespace/*" let:meta>
    <HttpRouteDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/gateways">
    <GatewaysList />
  </Route>

  <Route path="/gateways/:name/:namespace/*" let:meta>
    <GatewayDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
  </Route>

  <Route path="/gatewayclasses">
    <GatewayClassesList />
  </Route>

  <Route path="/gatewayclasses/:name/*" let:meta>
    <GatewayClassDetails name={decodeURI(meta.params.name)} />
  </Route>
</div>
