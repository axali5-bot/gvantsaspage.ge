import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { useCreateCategory, Category } from '@/hooks/useCategories';
import { toast } from 'sonner';

interface QuickAddCategoryProps {
    parentId?: string | null;
    onSuccess: (category: Category) => void;
    label?: string;
}

const QuickAddCategory = ({ parentId, onSuccess, label = "Add New" }: QuickAddCategoryProps) => {
    const createCategory = useCreateCategory();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name_ka: '',
        name_en: '',
        name_ru: '',
        slug: '',
    });

    const resetForm = () => {
        setFormData({ name_ka: '', name_en: '', name_ru: '', slug: '' });
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name_ka.trim() || !formData.name_en.trim() || !formData.name_ru.trim() || !formData.slug.trim()) {
            toast.error('All names and Slug are required');
            return;
        }

        setSaving(true);
        try {
            const newCategory = await createCategory.mutateAsync({
                name_ka: formData.name_ka,
                name_en: formData.name_en,
                name_ru: formData.name_ru,
                slug: formData.slug,
                parent_id: parentId || null,
            });
            toast.success('Category added successfully');
            setOpen(false);
            resetForm();
            onSuccess(newCategory);
        } catch (err: any) {
            toast.error(err.message || 'Failed to add category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2 rounded-full border border-primary/20 hover:bg-primary/10"
                    title={label}
                >
                    <Plus size={14} className="text-primary" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
                <DialogHeader>
                    <DialogTitle className="font-display">Add New {parentId ? 'Subcategory' : 'Category'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="quick-name-ka">Name (Georgian)</Label>
                            <Input
                                id="quick-name-ka"
                                value={formData.name_ka}
                                onChange={(e) => setFormData({ ...formData, name_ka: e.target.value })}
                                placeholder="მაგ: ორიენტალური"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="quick-name-en">Name (English)</Label>
                            <Input
                                id="quick-name-en"
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
                            <Label htmlFor="quick-name-ru">Name (Russian)</Label>
                            <Input
                                id="quick-name-ru"
                                value={formData.name_ru}
                                onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                                placeholder="напр: Ориентальный"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="quick-slug">Slug</Label>
                            <Input
                                id="quick-slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="e.g., oriental"
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? 'Adding...' : 'Add Category'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default QuickAddCategory;
