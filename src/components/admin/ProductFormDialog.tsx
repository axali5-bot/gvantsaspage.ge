import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useCreateProduct, useUpdateProduct, Product, ProductInput } from '@/hooks/useProducts';
import { Category } from '@/hooks/useCategories';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  categories: Category[];
}

interface FormState {
  name_ka: string;
  name_en: string;
  name_ru: string;
  description_ka: string;
  description_en: string;
  description_ru: string;
  price: string;
  parent_category_id: string;
  category_id: string;
  stock_quantity: string;
  gender: string;
}

const EMPTY_FORM: FormState = {
  name_ka: '',
  name_en: '',
  name_ru: '',
  description_ka: '',
  description_en: '',
  description_ru: '',
  price: '',
  parent_category_id: '',
  category_id: '',
  stock_quantity: '0',
  gender: 'Unisex',
};

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

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter(
    (c) => c.parent_id === formData.parent_category_id
  );

  useEffect(() => {
    if (open && product) {
      const current = categories.find((c) => c.id === product.category_id);
      const parentId = current?.parent_id ?? (current && !current.parent_id ? current.id : '');
      const childId = current?.parent_id ? current.id : '';
      setFormData({
        name_ka: product.name_ka || '',
        name_en: product.name_en || '',
        name_ru: product.name_ru || '',
        description_ka: product.description_ka || '',
        description_en: product.description_en || '',
        description_ru: product.description_ru || '',
        price: product.price?.toString() || '',
        parent_category_id: parentId,
        category_id: childId,
        stock_quantity: product.stock_quantity?.toString() || '0',
        gender: product.gender || 'Unisex',
      });
      setImagePreview(product.image_url);
      setImageFile(null);
    } else if (!open) {
      setFormData(EMPTY_FORM);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open, product]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const copyFromGeorgian = (lang: 'en' | 'ru') => () => {
    setFormData((prev) => ({
      ...prev,
      [`name_${lang}`]: prev.name_ka,
      [`description_${lang}`]: prev.description_ka,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name_ka.trim()) {
      toast.error('Georgian name is required');
      return;
    }
    const price = parseFloat(formData.price);
    if (!price || price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (!isEdit && !imageFile) {
      toast.error('Please select a product image');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = product?.image_url ?? '';
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const input: ProductInput = {
        name_ka: formData.name_ka.trim(),
        name_en: formData.name_en.trim() || undefined,
        name_ru: formData.name_ru.trim() || undefined,
        description_ka: formData.description_ka.trim() || undefined,
        description_en: formData.description_en.trim() || undefined,
        description_ru: formData.description_ru.trim() || undefined,
        price,
        image_url: imageUrl,
        category_id: formData.category_id || formData.parent_category_id || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        gender: formData.gender || 'Unisex',
      };

      if (isEdit && product) {
        await updateProduct.mutateAsync({ id: product.id, patch: input });
        toast.success('Product updated successfully');
      } else {
        await createProduct.mutateAsync(input);
        toast.success('Product added successfully');
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
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
        <Input value={formData[`name_${lang}`]} onChange={set(`name_${lang}`)} placeholder={`Name in ${label}`} />
      </div>
      <div>
        <Label>Description ({label})</Label>
        <Textarea value={formData[`description_${lang}`]} onChange={set(`description_${lang}`)} className="min-h-[80px]" />
      </div>
    </TabsContent>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                <Input value={formData.name_ka} onChange={set('name_ka')} required placeholder="მაგ: Avon — Far Away" />
              </div>
              <div>
                <Label>Description (Georgian)</Label>
                <Textarea value={formData.description_ka} onChange={set('description_ka')} className="min-h-[80px]" />
              </div>
            </TabsContent>

            {langTab('en', 'English', '📋')}
            {langTab('ru', 'Russian', '📋')}
          </Tabs>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (₾) *</Label>
              <Input type="number" step="0.01" min="0.01" value={formData.price} onChange={set('price')} required />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" min="0" value={formData.stock_quantity} onChange={set('stock_quantity')} />
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label>Gender</Label>
            <select
              value={formData.gender}
              onChange={set('gender')}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
            >
              <option value="Unisex">Unisex</option>
              <option value="WOMAN">Woman</option>
              <option value="MAN">Man</option>
            </select>
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                value={formData.parent_category_id}
                onChange={(e) => setFormData((p) => ({ ...p, parent_category_id: e.target.value, category_id: '' }))}
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
                  value={formData.category_id}
                  onChange={set('category_id')}
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
