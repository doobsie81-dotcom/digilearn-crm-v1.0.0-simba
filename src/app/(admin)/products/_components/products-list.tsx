"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import AddProductModal from "~/components/modals/add-product-modal";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { trpc } from "~/trpc/client";
import { addProductSchema } from "~/validation/products";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import ProductTypeBadge from "~/components/product-type-badge";
import {
  Package,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { cn } from "~/lib/utils";
import PageHeader from "~/components/page-header";

export type ProductFormValues = z.infer<typeof addProductSchema>;

export default function ProductList() {
  const [isAddProductModalOpen, setAddProductModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    productType:
      typeFilter === "all" ? undefined : (typeFilter as "product" | "service"),
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });
  const utils = trpc.useUtils();
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      utils.products.list.invalidate();
      setAddProductModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      utils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct.mutateAsync({ id });
    }
  };

  // Calculate statistics
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p) => p.isActive).length || 0;
  const totalValue =
    products?.reduce((sum, p) => sum + parseFloat(p.price), 0) || 0;
  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      productType: "product",
      name: "",
      price: "0",
      discount: "0",
      tax: "0",
      unit: "piece",
      description: "",
      sku: "",
      category: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    await createProduct.mutateAsync(data);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Products"
        subtitle="Manage your product and service catalog"
        actions={
          <Button onClick={() => setAddProductModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              $
              {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Combined catalog value
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Price
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              ${avgPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per product/service
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              {new Set(products?.map((p) => p.category).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none ">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="service">Services</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-none ">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              {/* <TableHead>SKU</TableHead> */}
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : !products || products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No products found</p>

                    <Button
                      onClick={() => setAddProductModalOpen(true)}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add your first product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <ProductTypeBadge type={product.productType} />
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  {/* <TableCell className="text-sm text-muted-foreground">
                    {product.sku || "-"}
                  </TableCell> */}
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {product.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-semibold">
                        ${parseFloat(product.price).toFixed(2)}
                      </p>
                      {(parseFloat(product.discount) > 0 ||
                        parseFloat(product.tax) > 0) && (
                        <p className="text-xs text-muted-foreground">
                          {parseFloat(product.discount) > 0 &&
                            `-$${parseFloat(product.discount).toFixed(2)} `}
                          {parseFloat(product.tax) > 0 &&
                            `+$${parseFloat(product.tax).toFixed(2)}`}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={cn(
                        product.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Form {...form}>
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setAddProductModalOpen(false)}
          onSubmit={onSubmit}
          isPending={createProduct.isPending}
        />
      </Form>
    </div>
  );
}
