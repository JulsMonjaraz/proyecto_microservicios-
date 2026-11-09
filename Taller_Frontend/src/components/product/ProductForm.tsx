"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateProductInput } from "@/types/product";

interface ProductFormProps {
  defaultValues?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
}: ProductFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [price, setPrice] = useState(String(defaultValues?.price ?? ""));
  const [stock, setStock] = useState(String(defaultValues?.stock ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!description.trim()) newErrors.description = "La descripción es obligatoria";
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) newErrors.price = "Precio inválido";
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) newErrors.stock = "Stock inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock, 10),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Nombre del producto</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Teclado mecánico RGB"
          disabled={isLoading}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el producto..."
          rows={3}
          disabled={isLoading}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="price">Precio (MXN)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            disabled={isLoading}
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            disabled={isLoading}
          />
          {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
