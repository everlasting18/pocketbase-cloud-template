/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POCKETBASE_COLLECTIONS_MAPPING } from "@/constants/pocketbaseCollections";

const CollectionMapping: React.FC = () => {
  const [index, setIndex] = useState(0);
  const collection = POCKETBASE_COLLECTIONS_MAPPING[index];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection mapping</CardTitle>
        <CardDescription>
          Fields each PocketBase collection needs to back the app's TypeScript models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Collections">
          {POCKETBASE_COLLECTIONS_MAPPING.map((c, i) => (
            <Button
              key={c.collectionName}
              size="sm"
              role="tab"
              aria-selected={i === index}
              variant={i === index ? "default" : "outline"}
              className="font-mono"
              onClick={() => setIndex(i)}
            >
              {c.collectionName}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {collection.description}{" "}
          <span className="font-mono text-xs">{collection.projectModel}</span>
        </p>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>PocketBase field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collection.fields.map((f) => (
                <TableRow key={f.pbFieldName}>
                  <TableCell className="font-mono text-xs">{f.projectProperty}</TableCell>
                  <TableCell className="font-mono text-xs">{f.pbFieldName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {f.pbFieldType}
                    </Badge>
                  </TableCell>
                  <TableCell>{f.required ? "Yes" : "No"}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{f.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <dl className="grid gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-2">
          {Object.entries(collection.rules).map(([rule, value]) => (
            <div key={rule} className="flex gap-2">
              <dt className="text-muted-foreground">{rule}Rule:</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};

export default CollectionMapping;
