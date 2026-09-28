import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New product</h1>
      <ProductForm />
    </div>
  );
}
