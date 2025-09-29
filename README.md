# Kubernetes Dashboard Podman Desktop Extension

![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue)

Kubernetes Dashboard is an open source extension for Podman Desktop to monitor with Kubernetes clusters.

The Kubernetes Dashboard detects your Kubeconfig file, and connects to the current Kubernetes context.
Any change of Kubernetes context (either from Podman Desktop or by editing the Kubeconfig file with another tool) 
is detected by the dashboard, which disconnects from the previous current context and connects to the new one.

A Dashboard page provides a synthetic view of the main resources present in the Kubernetes context: 
- non-namespaced resources: nodes and namespaces, 
- namespaced resources: workloads (deployments, pods, jobs, cronjobs), services (services, ingresses, routes) and configuration and storage (persistent volume claims, configmaps, secrets).

You can access from the dashboard, or from the menu, the list of resources of a specific kind (for example, the list of Pods).

From this list, you have access to the details for a specifc resource, including:
- a summary of the resource (extracted from the metadata, spec and status of the resource),
- a raw JSON representation of the resource,
- a utility to patch the resource definition, using [strategic merge patch](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/update-api-object-kubectl-patch/).

For Pods, you also have access to:
- the logs of the containers running in the pod,
- a terminal on each container running in the pod. 

You can switch the namespace you want to explore from the Dashboard page or from any list of namespaced resources. The extension will disconnect from the previous namespace and connect to the new one.

# Installation

## Install latest release

Install the custom extension `ghcr.io/podman-desktop/podman-desktop-extension-kubernetes-dashboard:latest` to try the latest extension.

## Development version

Install the custom extension `ghcr.io/podman-desktop/podman-desktop-extension-kubernetes-dashboard:next` to try the extension published after each commit.

# Contributing

First clone this repository on your disk, then run `pnpm i` in the root directory of the sources, then watch the changes in the `packages/webview` directory:

```
$ git clone git@github.com:podman-desktop/extension-kubernetes-dashboard.git
$ cd extension-kubernetes-dashboard
$ pnpm i
[...]
$ cd packages/webview
$ pnpm watch
[ do not stop this command, as it waiting for changes to rebuild the webview ]
```

## Using the production version of Podman Desktop

- In Settings > Preferences, in the Extensions section, enable the Development mode
- In Extensions > Local Extensions, select `Add a local folder extension...` and select the sub-directory `packages/extension` of the sources you cloned previously.

You can now make changes to the sources. The project is composed of two parts, which are built separately: the extension code, and the webview code. The extension code is rebuilt after each change by Podman Desktop itself, and the webview part is rebuilt by the `pnpm watch` command you started previously.

> Note that when you only change code in the webview part, the webview is built, and the result is included in the extension, which triggers the rebuild of the extension.

After each change, you may have to restart the extension from the `Extensions > Local Extensions` page.
