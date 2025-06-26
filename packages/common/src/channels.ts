import { type DashboardApi } from './interface/dashboard-api';
import { createRpcChannel } from './rpc';

// RPC channels (used by the webview to send requests to the extension)
export const API_DASHBOARD = createRpcChannel<DashboardApi>('DashboardApi');
