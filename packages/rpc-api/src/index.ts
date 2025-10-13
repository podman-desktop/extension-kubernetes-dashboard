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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface RpcChannel<T> {
  name: string;
}

interface IMessage {
  id: number;
  channel: string;
  method: string;
}

export interface IMessageRequest extends IMessage {
  args: unknown[];
}

export interface IMessageResponse extends IMessageRequest {
  status: 'error' | 'success';
  error?: string;
  body: unknown;
}

export function isMessageRequest(content: unknown): content is IMessageRequest {
  return !!content && typeof content === 'object' && 'id' in content && 'channel' in content;
}

export function isMessageResponse(content: unknown): content is IMessageResponse {
  return isMessageRequest(content) && 'status' in content;
}
