"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Terjadi kendala pada tampilan halaman.",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="mx-auto my-8 max-w-lg rounded-xl border border-[#B42318]/25 bg-white p-8 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#B42318]/10 text-[#B42318]">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#1F2933]">
            Terjadi Kesalahan Tampilan
          </h2>
          <p className="mt-2 text-sm text-[#667085]">{this.state.message}</p>
          <div className="mt-5">
            <Button
              onClick={() => this.setState({ hasError: false, message: "" })}
              iconLeft={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Muat Ulang Bagian Ini
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
