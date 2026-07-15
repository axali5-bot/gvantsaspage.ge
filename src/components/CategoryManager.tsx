import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { optimizeImage, formatSavings } from '@/lib/imageOptimizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';
import { toast } from 'sonner';

// Same public bucket the product images use (admin-only insert policy covers it).
async function uploadCategoryImage(file: File): Promise<string> {
  // Shrink to web size (≤1600px, WebP) before upload; original kept on failure.
  const result = await optimizeImage(file);
  const upload = result.file;
  if (!result.skipped && result.optimizedBytes < result.originalBytes * 0.8) {
    toast.info(`📸 ფოტო შეიკუმშა: ${formatSavings(result)}`);
  }
  const ext = upload.name.split('.').pop();
  const fileName = `category-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from('products').upload(fileName, upload);
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from('products').getPublicUrl(fileName);
  return data.publicUrl;
}

const CategoryManager = () => {
  const { data: categories = [], isLoading: loading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_ka: '',
    name_en: '',
    name_ru: '',
    slug: '',
    parent_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Image state: a newly picked file, and what to show in the preview box.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ name_ka: '', name_en: '', name_ru: '', slug: '', parent_id: '' });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  /** Resolve the image_url to save: new upload wins; cleared preview means null. */
  const resolveImageUrl = async (): Promise<string | null> => {
    if (imageFile) return await uploadCategoryImage(imageFile);
    return imagePreview; // untouched existing URL, or null when cleared/never set
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ka.trim() || !formData.name_en.trim() || !formData.name_ru.trim() || !formData.slug.trim()) {
      toast.error('All names and Slug are required');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await resolveImageUrl();
      await createCategory.mutateAsync({
        name_ka: formData.name_ka,
        name_en: formData.name_en,
        name_ru: formData.name_ru,
        slug: formData.slug,
        parent_id: formData.parent_id || null,
        image_url: imageUrl,
      });
      toast.success('Category added successfully');
      setAddOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_ka: category.name_ka || '',
      name_en: category.name_en || '',
      name_ru: category.name_ru || '',
      slug: category.slug || '',
      parent_id: category.parent_id || ''
    });
    setImageFile(null);
    setImagePreview(category.image_url || null);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name_ka.trim() || !formData.name_en.trim() || !formData.name_ru.trim() || !formData.slug.trim()) {
      toast.error('All names and Slug are required');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await resolveImageUrl();
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        patch: {
          name_ka: formData.name_ka,
          name_en: formData.name_en,
          name_ru: formData.name_ru,
          slug: formData.slug,
          parent_id: formData.parent_id || null,
          image_url: imageUrl,
        },
      });
      toast.success('Category updated successfully');
      setEditOpen(false);
      setEditingCategory(null);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setDeleting(true);
    try {
      await deleteCategoryMutation.mutateAsync(deletingCategory.id);
      toast.success('Category deleted successfully');
      setDeleteOpen(false);
      setDeletingCategory(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category. It may be in use by products.');
    } finally {
      setDeleting(false);
    }
  };

  const renderFormFields = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="category-name-ka">Name (Georgian)</Label>
          <Input
            id="category-name-ka"
            value={formData.name_ka}
            onChange={(e) => {
              const name_ka = e.target.value;
              setFormData({ ...formData, name_ka });
            }}
            placeholder="მაგ: ორიენტალური"
            required
          />
        </div>
        <div>
          <Label htmlFor="category-name-en">Name (English)</Label>
          <Input
            id="category-name-en"
            value={formData.name_en}
            onChange={(e) => {
              const name_en = e.target.value;
              const slug = name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              setFormData({ ...formData, name_en, slug });
            }}
            placeholder="e.g., Oriental"
            required
          />
        </div>
        <div>
          <Label htmlFor="category-name-ru">Name (Russian)</Label>
          <Input
            id="category-name-ru"
            value={formData.name_ru}
            onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
            placeholder="напр: Ориентальный"
            required
          />
        </div>
        <div>
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., oriental"
            required
          />
        </div>
        <div>
          <Label htmlFor="parent-category">Parent Category (Optional)</Label>
          <select
            id="parent-category"
            value={formData.parent_id}
            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
          >
            <option value="">None (Top Level)</option>
            {categories
              .filter(c => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
              .map(c => (
                <option key={c.id} value={c.id}>{c.name_ka}</option>
              ))
            }
          </select>
        </div>

        {/* Category photo — drives the homepage "დაათვალიერე კატეგორიები" tile */}
        <div>
          <Label>Category Photo (Optional)</Label>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative w-full h-32 rounded border border-border overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                  aria-label="Remove photo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload size={22} className="text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload photo</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              მთავარ გვერდზე კატეგორიის ფილას ფონად გამოჩნდება. თუ არ ატვირთავ — ავტომატურად პროდუქტის ფოტო აისახება.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="admin-table-wrap">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-muted-foreground" />
          <h2 className="font-body text-sm font-semibold tracking-wider uppercase text-muted-foreground">
            Categories
          </h2>
        </div>

        <Dialog open={addOpen} onOpenChange={(isOpen) => {
          setAddOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              {renderFormFields()}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Adding...' : 'Add Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => {
        setEditOpen(isOpen);
        if (!isOpen) {
          setEditingCategory(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {renderFormFields()}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name_ka}"?
              Products using this category may need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="p-8 text-center">
          <p className="font-body text-muted-foreground">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-body text-muted-foreground">No categories yet. Add your first category to organize products.</p>
        </div>
      ) : (
        <Table>
          <TableHeader className="admin-thead">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="admin-th w-14">Photo</TableHead>
              <TableHead className="admin-th">Name (KA)</TableHead>
              <TableHead className="admin-th">Parent</TableHead>
              <TableHead className="admin-th">Slug</TableHead>
              <TableHead className="admin-th text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories
              .sort((a, b) => {
                // Sort parents first, then their children
                const parentA = a.parent_id ? categories.find(p => p.id === a.parent_id) : null;
                const parentB = b.parent_id ? categories.find(p => p.id === b.parent_id) : null;

                const getSortName = (cat: Category, parent: Category | null) =>
                  parent ? `${parent.name_ka}_${cat.name_ka}` : cat.name_ka;

                return getSortName(a, parentA).localeCompare(getSortName(b, parentB));
              })
              .map((category) => {
                const parent = category.parent_id ? categories.find(c => c.id === category.parent_id) : null;
                return (
                  <TableRow key={category.id} className="border-stone-100 admin-tr-hover">
                    <TableCell>
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name_ka} className="w-9 h-9 object-cover rounded" />
                      ) : (
                        <div className="w-9 h-9 bg-muted rounded" />
                      )}
                    </TableCell>
                    <TableCell className="font-body font-medium">
                      <div className="flex items-center gap-2">
                        {category.parent_id && <span className="text-muted-foreground">↳</span>}
                        {category.name_ka}
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-muted-foreground">
                      {parent ? parent.name_ka : '-'}
                    </TableCell>
                    <TableCell className="font-body text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(category)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(category)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default CategoryManager;
