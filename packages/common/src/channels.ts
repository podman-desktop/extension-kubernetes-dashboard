import { type DashboardApi } from './interface/dashboard-api';
import { createRpcChannel } from './rpc';

// RPC channels (used by the webview to send requests to the extension)
export const API_DASHBOARD = createRpcChannel<DashboardApi>('DashboardApi');

export interface KubernetesUpdateResourceInfo {
  resourceName: string;
}

// Broadcast events (sent by extension and received by the webview)
export const ACTIVE_RESOURCES_COUNT = createRpcChannel<undefined>('ActiveResourcesCount');
export const KUBERNETES_CONTEXTS_HEALTHS = createRpcChannel<undefined>('KubernetesContextsHealths');
export const KUBERNETES_CONTEXTS_PERMISSIONS = createRpcChannel<undefined>('KubernetesContextsPermissions');
export const KUBERNETES_RESOURCES_COUNT = createRpcChannel<undefined>('KubernetesResourcesCount');
export const KUBERNETES_UPDATE_RESOURCE = createRpcChannel<KubernetesUpdateResourceInfo>('KubernetesUpdateResource');
