import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useCreateProduct, useUpdateProduct, Product, ProductInput } from '@/hooks/useProducts';
import { syncProduct } from '@/lib/samkaulebiSync';
import { useInvalidateSyncMap } from '@/hooks/useSamkaulebiSync';
import { Category } from '@/hooks/useCategories';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name_ka: z.string().min(1, 'Georgian name is required'),
  name_en: z.string().optional(),
  name_ru: z.string().optional(),
  description_ka: z.string().optional(),
  description_en: z.string().optional(),
  description_ru: z.string().optional(),
  price: z.number({ invalid_type_error: "Price must be a number" }).positive('Price must be greater than 0'),
  parent_category_id: z.string().optional(),
  category_id: z.string().optional(),
  stock_quantity: z.number().int().min(0, 'Stock cannot be negative').default(0),
  gender: z.enum(['Unisex', 'Woman', 'Man']).default('Unisex'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  categories: Category[];
}

async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from('products').upload(fileName, file);
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from('products').getPublicUrl(fileName);
  return data.publicUrl;
}

export const ProductFormDialog = ({ open, onOpenChange, product, categories }: Props) => {
  const isEdit = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const invalidateSyncMap = useInvalidateSyncMap();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiFilling, setAiFilling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_ka: '',
      name_en: '',
      name_ru: '',
      description_ka: '',
      description_en: '',
      description_ru: '',
      price: 0,
      parent_category_id: '',
      category_id: '',
      stock_quantity: 0,
      gender: 'Unisex',
    }
  });

  const watchParentCat = watch('parent_category_id');
  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter((c) => c.parent_id === watchParentCat);

  useEffect(() => {
    if (open && product) {
      const current = categories.find((c) => c.id === product.category_id);
      const parentId = current?.parent_id ?? (current && !current.parent_id ? current.id : '');
      const childId = current?.parent_id ? current.id : '';
      reset({
        name_ka: product.name_ka || '',
        name_en: product.name_en || '',
        name_ru: product.name_ru || '',
        description_ka: product.description_ka || '',
        description_en: product.description_en || '',
        description_ru: product.description_ru || '',
        price: product.price || 0,
        parent_category_id: parentId,
        category_id: childId,
        stock_quantity: product.stock_quantity || 0,
        gender: (product.gender as any) || 'Unisex',
      });
      setImagePreview(product.image_url);
      setImageFile(null);
    } else if (!open) {
      reset();
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open, product, categories, reset]);

  const copyFromGeorgian = (lang: 'en' | 'ru') => () => {
    const kaName = watch('name_ka');
    const kaDesc = watch('description_ka');
    setValue(`name_${lang}`, kaName);
    setValue(`description_${lang}`, kaDesc);
  };

  const handleAiFill = async () => {
    const name_ka = watch('name_ka')?.trim();
    const image_url = isEdit ? product?.image_url : null;
    if (!name_ka) { toast.error('ჯერ შეიყვანე სახელი ქართულად'); return; }
    setAiFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-fill', {
        body: { name_ka, image_url: image_url ?? null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // fill only empty fields — don't overwrite what admin already typed
      if (data.name_en && !watch('name_en'))         setValue('name_en', data.name_en);
      if (data.name_ru && !watch('name_ru'))         setValue('name_ru', data.name_ru);
      if (data.description_ka && !watch('description_ka')) setValue('description_ka', data.description_ka);
      if (data.description_en && !watch('description_en')) setValue('description_en', data.description_en);
      if (data.description_ru && !watch('description_ru')) setValue('description_ru', data.description_ru);
      toast.success('✨ AI-მა შეავსო — შეამოწმე და ჩაასწორე');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'AI ვერ მუშაობს');
    } finally {
      setAiFilling(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (values: FormValues) => {
    if (!isEdit && !imageFile) {
      toast.error('Please select a product image');
      return;
    }

    setUploading(true);
    try {
      let imageUrl: string | null | undefined = isEdit ? undefined : null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      } else if (isEdit) {
        imageUrl = product?.image_url ?? null;
      }

      const input: ProductInput = {
        name_ka: values.name_ka.trim(),
        name_en: values.name_en?.trim() || undefined,
        name_ru: values.name_ru?.trim() || undefined,
        description_ka: values.description_ka?.trim() || undefined,
        description_en: values.description_en?.trim() || undefined,
        description_ru: values.description_ru?.trim() || undefined,
        price: values.price,
        image_url: imageUrl,
        category_id: values.category_id || values.parent_category_id || null,
        stock_quantity: values.stock_quantity,
        gender: values.gender,
      };

      if (isEdit && product) {
        const updated = await updateProduct.mutateAsync({ id: product.id, patch: input });
        toast.success('Product updated successfully');
        // fire-and-forget sync — non-blocking, result shown via badge refresh
        syncProduct({ ...updated, image_url: updated.image_url ?? null }).then((r) => {
          if (r.ok) invalidateSyncMap();
        });
      } else {
        const created = await createProduct.mutateAsync(input);
        toast.success('Product added successfully');
        syncProduct({ ...created, image_url: created.image_url ?? null }).then((r) => {
          if (r.ok) invalidateSyncMap();
        });
      }

      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const langTab = (lang: 'en' | 'ru', label: string, flag: string) => (
    <TabsContent value={lang} className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={copyFromGeorgian(lang)}>
          {flag} Copy from Georgian
        </Button>
      </div>
      <div>
        <Label>Name ({label})</Label>
        <Input {...register(`name_${lang}`)} placeholder={`Name in ${label}`} />
      </div>
      <div>
        <Label>Description ({label})</Label>
        <Textarea {...register(`description_${lang}`)} className="min-h-[80px]" />
      </div>
    </TabsContent>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-display">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiFill}
              disabled={aiFilling || !watch('name_ka')?.trim()}
              className="shrink-0 gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 disabled:opacity-40"
            >
              {aiFilling
                ? <><Loader2 size={13} className="animate-spin" /> AI ფიქრობს...</>
                : <><Sparkles size={13} /> AI-ით შევსება</>}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Language tabs */}
          <Tabs defaultValue="ka">
            <TabsList className="w-full">
              <TabsTrigger value="ka" className="flex-1">🇬🇪 Georgian</TabsTrigger>
              <TabsTrigger value="en" className="flex-1">🇬🇧 English</TabsTrigger>
              <TabsTrigger value="ru" className="flex-1">🇷🇺 Russian</TabsTrigger>
            </TabsList>

            <TabsContent value="ka" className="space-y-4 mt-4">
              <div>
                <Label>Name (Georgian) *</Label>
                <Input {...register('name_ka')} placeholder="მაგ: Avon — Far Away" />
                {errors.name_ka && <p className="text-destructive text-xs mt-1">{errors.name_ka.message}</p>}
              </div>
              <div>
                <Label>Description (Georgian)</Label>
                <Textarea {...register('description_ka')} className="min-h-[80px]" />
              </div>
            </TabsContent>

            {langTab('en', 'English', '📋')}
            {langTab('ru', 'Russian', '📋')}
          </Tabs>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (₾) *</Label>
              <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-destructive text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" {...register('stock_quantity', { valueAsNumber: true })} />
              {errors.stock_quantity && <p className="text-destructive text-xs mt-1">{errors.stock_quantity.message}</p>}
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label>Gender</Label>
            <select
              {...register('gender')}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
            >
              <option value="Unisex">Unisex</option>
              <option value="Woman">Woman</option>
              <option value="Man">Man</option>
            </select>
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                {...register('parent_category_id')}
                onChange={(e) => {
                  setValue('parent_category_id', e.target.value);
                  setValue('category_id', '');
                }}
                className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
              >
                <option value="">— None —</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_ka}</option>
                ))}
              </select>
            </div>
            {subcategories.length > 0 && (
              <div>
                <Label>Subcategory</Label>
                <select
                  {...register('category_id')}
                  className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
                >
                  <option value="">— None —</option>
                  {subcategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ka}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Image upload */}
          <div>
            <Label>Product Image {!isEdit && '*'}</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative w-full h-40 rounded border border-border overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload size={24} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
