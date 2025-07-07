```mermaid
graph TD;
  subgraph webview;
    component[Svelte component]-- "subscribe" -->states[States]
    states-- "reactive data" -->component
  end;

  states-- "subscribe" -->dispatcher
  dispatcher-- "on new data" -->states

  subgraph extension;
    manager[Contexts Manager]-- "onEvent" -->dispatcher[Contexts States Dispatcher];
    dispatcher-- "getData" -->manager
  end;
````

The `Contexts Manager` fetches *basic information* (health, permissions, resources counts, active resources counts) for all contexts, and Kubernetes objects details for the current context (and other contexts on request).

The `Contexts States Dispatcher` receives events from the Contexts manager for every change, and broadcast information to the webview through *RPC Channels*.

RPC Channels are defined between the extension and the webview. They define the format of the data transiting from the extension to the webview. The data transiting into these channels is determined by the subscriptions on these channels.

The `Svelte Components` subscribe to specific channels. Data begins transiting into a channel as soon as a component has subscribed to this channel. 

Some channels accept parameters, for example the `UPDATE_RESOURCE` channel, which provides the list of resources for specific contexts and resource types. A component have to subscribe for a specific context and a specific resource type. A component can subscribe several times if interested by several contexts and/or several resources types, and several components can subscribe on such channel with different parameters. 

As a result, the extension will broadcast through such a channel all the 
data related to the ongoing subscriptions only.

For channels without parameters (channels related to basic information for example), all the available data is sent.
