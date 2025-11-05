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

import { EDITOR_SETTINGS, type EditorSettings } from '@kubernetes-dashboard/channels';
import { RpcExtension } from '@kubernetes-dashboard/rpc';
import { configuration } from '@podman-desktop/api';
import { inject, injectable } from 'inversify';
import type { DispatcherObject } from '/@/dispatcher/util/dispatcher-object';
import { AbsDispatcherObjectImpl } from '/@/dispatcher/util/dispatcher-object';

@injectable()
export class EditorSettingsDispatcher
  extends AbsDispatcherObjectImpl<void, EditorSettings>
  implements DispatcherObject<void>
{
  constructor(@inject(RpcExtension) rpcExtension: RpcExtension) {
    super(rpcExtension, EDITOR_SETTINGS);
  }

  getData(): EditorSettings {
    //TODO probably would be nice to expose these keys in the podman-desktop api spec
    const fontSize = configuration.getConfiguration('editor').get<number>('integrated.fontSize') ?? 10;
    return {
      fontSize,
    };
  }
}
