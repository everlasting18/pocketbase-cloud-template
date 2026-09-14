/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RouterProvider } from "react-router/dom";
import { router } from "@/routers";

const App: React.FC = () => <RouterProvider router={router} />;

export default App;
