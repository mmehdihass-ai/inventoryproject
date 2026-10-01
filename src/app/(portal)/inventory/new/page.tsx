import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New Product</h1>
      <ProductForm />
    </div>
  );
}
