"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteProduct } from "@/lib/actions/products";

export function DeleteProductDialog({
  productId,
  productLabel,
}: {
  productId: string;
  productLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await deleteProduct(productId, reason);
    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    toast.success("Product deleted");
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">Delete {productLabel}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {productLabel}?</DialogTitle>
          <DialogDescription>
            This removes it from active inventory. Transaction, sale, and
            return history is kept for audit purposes — nothing is
            permanently erased.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="delete-reason">Reason</Label>
          <Textarea
            id="delete-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Discontinued by supplier"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
