/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  type?: React.HTMLInputTypeAttribute;
  /** Render a textarea with this many rows instead of an input. */
  rows?: number;
  className?: string;
}

function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  type = "text",
  rows,
  className,
}: FormTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {rows ? (
            <Textarea {...field} id={name} rows={rows} aria-invalid={fieldState.invalid} />
          ) : (
            <Input {...field} id={name} type={type} aria-invalid={fieldState.invalid} />
          )}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export default FormTextField;
