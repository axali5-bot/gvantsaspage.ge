import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
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
import { useCategories, Category } from '@/hooks/useCategories';
import { toast } from 'sonner';

const CategoryManager = () => {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
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

  const resetForm = () => {
    setFormData({ name_ka: '', name_en: '', name_ru: '', slug: '', parent_id: '' });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ka.trim() || !formData.name_en.trim() || !formData.name_ru.trim() || !formData.slug.trim()) {
      toast.error('All names and Slug are required');
      return;
    }

    setSaving(true);
    try {
      await addCategory(
        { ka: formData.name_ka, en: formData.name_en, ru: formData.name_ru },
        formData.slug,
        formData.parent_id || null
      );
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
      await updateCategory(
        editingCategory.id,
        { ka: formData.name_ka, en: formData.name_en, ru: formData.name_ru },
        formData.slug,
        formData.parent_id || null
      );
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
      await deleteCategory(deletingCategory.id);
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
      </div>
    </>
  );

  return (
    <div className="bg-card border border-border rounded-sm">
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
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Name (KA)</TableHead>
              <TableHead className="font-body">Parent</TableHead>
              <TableHead className="font-body">Slug</TableHead>
              <TableHead className="font-body text-right">Actions</TableHead>
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
                  <TableRow key={category.id}>
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
