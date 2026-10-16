# Copyright (C) 2026 Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

"""Expose active Kubernetes watch flows to the proxy E2E tests."""

import json
from collections import Counter

from mitmproxy import http


class WatchMetrics:
    def __init__(self):
        self.active = {}
        self.opened = Counter()

    def request(self, flow: http.HTTPFlow):
        if flow.request.method == "GET" and flow.request.path == "/__e2e_watch_metrics":
            active_by_path = dict(Counter(self.active.values()))
            snapshot = {
                "active_by_path": active_by_path,
                "opened_by_path": dict(self.opened),
            }
            flow.response = http.Response.make(
                200,
                json.dumps(snapshot).encode(),
                {"Content-Type": "application/json"},
            )

    def responseheaders(self, flow: http.HTTPFlow):
        if flow.response.status_code != 200 or flow.request.method != "GET":
            return
        if flow.request.query.get("watch", "").lower() not in ("true", "1"):
            return
        path = flow.request.path.split("?", 1)[0]
        if not path.startswith(("/api/", "/apis/")):
            return
        self.active[flow.id] = path
        self.opened[path] += 1

    def response(self, flow: http.HTTPFlow):
        self.active.pop(flow.id, None)

    def error(self, flow: http.HTTPFlow):
        self.active.pop(flow.id, None)


addons = [WatchMetrics()]
