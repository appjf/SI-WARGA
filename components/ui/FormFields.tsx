"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  required,
  helperText,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#1F2933]"
      >
        {label}
        {required && (
          <span className="ml-1 text-[#B42318]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-[#667085]">{helperText}</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}

const INPUT_BASE =
  "w-full rounded-lg border border-[#E4E7EC] bg-white px-3.5 py-2.5 text-sm text-[#1F2933] placeholder:text-[#667085]/70 transition-colors focus:border-[#1F5E4A] focus:outline-none focus:ring-2 focus:ring-[#1F5E4A]/15 disabled:bg-[#F7F8F6] disabled:text-[#667085]";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(INPUT_BASE, className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(INPUT_BASE, className)} {...props}>
      {children}
    </select>
  );
}

export function TextareaInput({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(INPUT_BASE, "min-h-24", className)} {...props} />;
}
