"use client";

import { useState } from "react";
import { FlaskConical, Rocket, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { switchEnvironment } from "@/lib/actions/env";
import type { SupabaseEnv } from "@/lib/env-config";
import { cn } from "@/lib/utils";

export function EnvSwitcher({ env }: { env: SupabaseEnv }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSelect(target: SupabaseEnv) {
    if (target === env) return;
    if (target === "prod") {
      setConfirmOpen(true);
      return;
    }
    await switchEnvironment(target);
  }

  async function handleConfirmProd() {
    setConfirmOpen(false);
    await switchEnvironment("prod");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-white transition-colors",
            env === "prod"
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-amber-600 hover:bg-amber-500",
          )}
        >
          {env === "prod" ? (
            <Rocket className="h-4 w-4" />
          ) : (
            <FlaskConical className="h-4 w-4" />
          )}
          {env === "prod" ? "Production" : "Test"}
          <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Environment</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSelect("test")}>
            <FlaskConical className="h-4 w-4" />
            Test
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelect("prod")}>
            <Rocket className="h-4 w-4" />
            Production
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Production?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll be working against real, live inventory data —
              anything you add, edit, or delete from here on is real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmProd}>
              Switch to Production
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
