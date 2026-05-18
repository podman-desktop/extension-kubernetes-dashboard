/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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

import type { ListOrganizerItem, TablePersistence } from '@podman-desktop/ui-svelte';

interface SavedColumnConfig {
  id: string;
  enabled: boolean;
}

export class LocalStoragePersistence implements TablePersistence {
  readonly #prefix = 'table-columns';

  #storageKey(kind: string): string {
    return `${this.#prefix}.${kind}`;
  }

  async load(kind: string, columnNames: string[]): Promise<ListOrganizerItem[]> {
    const raw = localStorage.getItem(this.#storageKey(kind));
    if (!raw) {
      return this.#defaultItems(columnNames);
    }

    try {
      const saved: SavedColumnConfig[] = JSON.parse(raw);
      const savedMap = new Map(saved.map(s => [s.id, s.enabled]));

      return columnNames.map((name, index) => ({
        id: name,
        label: name,
        enabled: savedMap.get(name) ?? true,
        originalOrder: index,
      }));
    } catch {
      return this.#defaultItems(columnNames);
    }
  }

  async save(kind: string, items: ListOrganizerItem[]): Promise<void> {
    const toSave: SavedColumnConfig[] = items.map(item => ({
      id: item.id,
      enabled: item.enabled,
    }));
    localStorage.setItem(this.#storageKey(kind), JSON.stringify(toSave));
  }

  async reset(kind: string, columnNames: string[]): Promise<ListOrganizerItem[]> {
    localStorage.removeItem(this.#storageKey(kind));
    return this.#defaultItems(columnNames);
  }

  #defaultItems(columnNames: string[]): ListOrganizerItem[] {
    return columnNames.map((name, index) => ({
      id: name,
      label: name,
      enabled: true,
      originalOrder: index,
    }));
  }
}
