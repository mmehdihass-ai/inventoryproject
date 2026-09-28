import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { getProductById } from "@/lib/queries/products";

export default async function EditProductPage(
  props: PageProps<"/inventory/[id]/edit">,
) {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Edit {product.sku}
      </h1>
      <ProductForm product={product} />
    </div>
  );
}
