/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

export interface UpdateResourceOptions {
  // default context if not set
  contextName?: string;
  // a resource name, or `<plural>.<group>` for a custom resource
  resourceName: string;
  // pins the subscription to this namespace; when not set, the subscription follows the namespace of the context.
  // Setting the namespace of the context starts a separate watch (see ResourceUpdateOptions in the API)
  namespace?: string;
}
